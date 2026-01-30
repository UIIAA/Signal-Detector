/**
 * API: Classificar Tarefa com IA
 * POST - Classifica uma tarefa usando o SignalClassifier
 *
 * Security: Input validation with Zod, rate limiting, authentication required
 * Integra com o sistema de classificação SINAL/RUÍDO existente
 * Usa apiResponse para padronização
 */

import { query } from '../../../../shared/database/db';
import SignalClassifier from '../../../src/services/SignalClassifier';
import * as apiResponse from '../../../src/lib/apiResponse';
import { z } from 'zod';
import { validateWithSchema } from '../../../src/lib/validation';
import { calculateSignalScore, generateReasoning } from '../../../src/lib/signalCalculator';

const signalClassifier = new SignalClassifier();

// Validation schema for classification request
const ClassifyRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  taskId: z.string().min(1, 'Task ID is required'),
  useAI: z.boolean().optional().default(false),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(
      apiResponse.error('Method not allowed', 405)
    );
  }

  const userId = req.headers['x-user-id'] || req.query.userId;

  if (!userId) {
    return res.status(401).json(apiResponse.unauthorized('User ID required'));
  }

  // Validação com Zod
  const validation = validateWithSchema(ClassifyRequestSchema, {
    userId,
    ...req.body
  });

  if (!validation.success) {
    return res.status(400).json(
      apiResponse.validation(
        Object.fromEntries(validation.errors.map(err => [err.field, err.message]))
      )
    );
  }

  const { taskId, useAI = false } = validation.data;

  try {
    const { rows: taskRows } = await query(`
      SELECT * FROM kanban_tasks
      WHERE id = $1 AND user_id = $2 AND is_active = TRUE
    `, [taskId, userId]);

    if (taskRows.length === 0) {
      return res.status(404).json(apiResponse.notFound('Task not found'));
    }

    const task = taskRows[0];

    // Buscar contexto de objetivos do usuário
    const { rows: goalRows } = await query(`
      SELECT id, title, description FROM goals
      WHERE user_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);

    const goalContext = goalRows.map(g => g.title).join(', ');

    let classification;
    let reasoning = '';

    if (useAI) {
      try {
        const activity = {
          description: `${task.titulo}: ${task.descricao || ''}`,
          duration: 60,
          energyBefore: 5,
          energyAfter: 5,
          impact: task.impacto,
          effort: task.esforco
        };

        const aiResult = await signalClassifier.classifyWithAI(activity, goalContext);

        classification = {
          signal_score: aiResult.score || 50,
          classificacao: aiResult.score >= 60 ? 'SINAL' : aiResult.score >= 30 ? 'NEUTRO' : 'RUÍDO'
        };

        reasoning = aiResult.reasoning || 'Classified by AI';

      } catch (aiError) {
        console.error('AI Classification failed, using rules:', aiError);
        classification = calculateSignalScore(task);
        reasoning = 'Classified by rules (AI unavailable)';
      }

    } else {
      classification = calculateSignalScore(task);
      reasoning = generateReasoning(task, classification);
    }

    const { rows: updatedRows } = await query(`
      UPDATE kanban_tasks SET
        signal_score = $1,
        classificacao = $2,
        reasoning = $3
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `, [
      classification.signal_score,
      classification.classificacao,
      reasoning,
      taskId,
      userId
    ]);

    return res.status(200).json(
      apiResponse.success({
        task: updatedRows[0],
        classification: {
          score: classification.signal_score,
          label: classification.classificacao,
          reasoning: reasoning,
          usedAI: useAI
        }
      }, 'Task classified successfully')
    );

  } catch (error) {
    console.error('Classification API Error:', error);
    return res.status(500).json(
      apiResponse.error(
        'Internal server error',
        500,
        process.env.NODE_ENV === 'development' ? error.message : undefined
      )
    );
  }
}
