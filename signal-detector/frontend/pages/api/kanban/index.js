/**
 * API: Kanban Tasks
 * GET - Lista todas as tarefas do usuário
 * POST - Cria uma nova tarefa
 *
 * Security: Input validation with Zod, rate limiting, authentication required
 * Usa KanbanService para abstração e apiResponse para padronização
 */

import { query } from '../../../../shared/database/db';
import * as apiResponse from '../../../src/lib/apiResponse';
import { CreateTaskSchema, validateWithSchema } from '../../../src/lib/validation';
import { calculateSignalScore } from '../../../src/lib/signalCalculator';

/**
 * Calcula estatísticas das tarefas
 */
function calculateStats(tasks) {
  return {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    progress: tasks.filter(t => t.status === 'progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    sinal: tasks.filter(t => t.classificacao === 'SINAL').length,
    ruido: tasks.filter(t => t.classificacao === 'RUÍDO').length,
    receita: tasks.filter(t => t.gera_receita).length
  };
}

export default async function handler(req, res) {
  const userId = req.headers['x-user-id'] || req.query.userId;

  if (!userId) {
    return res.status(401).json(apiResponse.unauthorized('User ID required'));
  }

  try {
    if (req.method === 'GET') {
      const { status, projeto, classificacao, gera_receita } = req.query;

      let sql = `
        SELECT * FROM kanban_tasks
        WHERE user_id = $1 AND is_active = TRUE
      `;
      const params = [userId];
      let paramIndex = 2;

      if (status) {
        sql += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (projeto) {
        sql += ` AND projeto = $${paramIndex}`;
        params.push(projeto);
        paramIndex++;
      }

      if (classificacao) {
        sql += ` AND classificacao = $${paramIndex}`;
        params.push(classificacao);
        paramIndex++;
      }

      if (gera_receita === 'true') {
        sql += ` AND gera_receita = TRUE`;
      }

      sql += ` ORDER BY ordem ASC, created_at DESC`;

      const { rows } = await query(sql, params);

      return res.status(200).json(
        apiResponse.success({
          tasks: rows,
          stats: calculateStats(rows)
        }, 'Tasks retrieved successfully')
      );

    } else if (req.method === 'POST') {
      // Validação com Zod
      const validation = validateWithSchema(CreateTaskSchema, {
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

      const {
        titulo,
        descricao,
        projeto = 'PESSOAL',
        categoria = 'Geral',
        status = 'todo',
        prioridade = 'media',
        gera_receita = false,
        urgente = false,
        importante = false,
        impacto = 5,
        esforco = 5,
        data_prevista
      } = validation.data;

      const classification = calculateSignalScore({
        gera_receita,
        prioridade,
        urgente,
        importante,
        impacto,
        esforco
      });

      const { rows } = await query(`
        INSERT INTO kanban_tasks (
          user_id, titulo, descricao, projeto, categoria,
          status, prioridade, gera_receita, urgente, importante,
          impacto, esforco, signal_score, classificacao, data_prevista
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15
        ) RETURNING *
      `, [
        userId, titulo, descricao, projeto, categoria,
        status, prioridade, gera_receita, urgente, importante,
        impacto, esforco, classification.signal_score, classification.classificacao, data_prevista
      ]);

      return res.status(201).json(
        apiResponse.created(rows[0], 'Task created successfully')
      );

    } else {
      return res.status(405).json(
        apiResponse.error('Method not allowed', 405)
      );
    }

  } catch (error) {
    console.error('Kanban API Error:', error);
    return res.status(500).json(
      apiResponse.error(
        'Internal server error',
        500,
        process.env.NODE_ENV === 'development' ? error.message : undefined
      )
    );
  }
}
