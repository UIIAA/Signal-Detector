/**
 * API: Kanban Task por ID
 * GET - Busca uma tarefa específica
 * PUT - Atualiza uma tarefa
 * DELETE - Remove uma tarefa (soft delete)
 *
 * Security: Input validation with Zod, authentication required
 * Usa apiResponse para padronização de respostas
 */

import { query } from '../../../../shared/database/db';
import * as apiResponse from '../../../src/lib/apiResponse';
import { UpdateTaskSchema, validateWithSchema } from '../../../src/lib/validation';
import { calculateSignalScore } from '../../../src/lib/signalCalculator';

export default async function handler(req, res) {
  const { id } = req.query;
  const userId = req.headers['x-user-id'] || req.query.userId;

  if (!userId) {
    return res.status(401).json(apiResponse.unauthorized('User ID required'));
  }

  if (!id) {
    return res.status(400).json(
      apiResponse.validation({ id: 'Task ID is required' })
    );
  }

  try {
    if (req.method === 'GET') {
      const { rows } = await query(`
        SELECT * FROM kanban_tasks
        WHERE id = $1 AND user_id = $2 AND is_active = TRUE
      `, [id, userId]);

      if (rows.length === 0) {
        return res.status(404).json(
          apiResponse.notFound('Task not found')
        );
      }

      return res.status(200).json(
        apiResponse.success(rows[0], 'Task retrieved successfully')
      );

    } else if (req.method === 'PUT') {
      // Validação com Zod
      const validation = validateWithSchema(UpdateTaskSchema, {
        id,
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
        projeto,
        categoria,
        status,
        prioridade,
        gera_receita,
        urgente,
        importante,
        impacto,
        esforco,
        data_prevista,
        ordem
      } = validation.data;

      const { rows: currentRows } = await query(`
        SELECT * FROM kanban_tasks
        WHERE id = $1 AND user_id = $2 AND is_active = TRUE
      `, [id, userId]);

      if (currentRows.length === 0) {
        return res.status(404).json(
          apiResponse.notFound('Task not found')
        );
      }

      const current = currentRows[0];

      const updated = {
        titulo: titulo ?? current.titulo,
        descricao: descricao ?? current.descricao,
        projeto: projeto ?? current.projeto,
        categoria: categoria ?? current.categoria,
        status: status ?? current.status,
        prioridade: prioridade ?? current.prioridade,
        gera_receita: gera_receita ?? current.gera_receita,
        urgente: urgente ?? current.urgente,
        importante: importante ?? current.importante,
        impacto: impacto ?? current.impacto,
        esforco: esforco ?? current.esforco,
        data_prevista: data_prevista ?? current.data_prevista,
        ordem: ordem ?? current.ordem
      };

      const classification = calculateSignalScore(updated);

      const dataConclusao = status === 'done' && current.status !== 'done'
        ? new Date().toISOString()
        : current.data_conclusao;

      const { rows } = await query(`
        UPDATE kanban_tasks SET
          titulo = $1,
          descricao = $2,
          projeto = $3,
          categoria = $4,
          status = $5,
          prioridade = $6,
          gera_receita = $7,
          urgente = $8,
          importante = $9,
          impacto = $10,
          esforco = $11,
          signal_score = $12,
          classificacao = $13,
          data_prevista = $14,
          data_conclusao = $15,
          ordem = $16
        WHERE id = $17 AND user_id = $18
        RETURNING *
      `, [
        updated.titulo,
        updated.descricao,
        updated.projeto,
        updated.categoria,
        updated.status,
        updated.prioridade,
        updated.gera_receita,
        updated.urgente,
        updated.importante,
        updated.impacto,
        updated.esforco,
        classification.signal_score,
        classification.classificacao,
        updated.data_prevista,
        dataConclusao,
        updated.ordem,
        id,
        userId
      ]);

      return res.status(200).json(
        apiResponse.success(rows[0], 'Task updated successfully')
      );

    } else if (req.method === 'DELETE') {
      const { rows } = await query(`
        UPDATE kanban_tasks
        SET is_active = FALSE
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [id, userId]);

      if (rows.length === 0) {
        return res.status(404).json(
          apiResponse.notFound('Task not found')
        );
      }

      return res.status(200).json(
        apiResponse.success(
          { deleted: true, id: rows[0].id },
          'Task deleted successfully'
        )
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
