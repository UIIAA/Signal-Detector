import { query } from '../../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getSchedule(req, res);
  } else if (req.method === 'POST') {
    return createTimeBlock(req, res);
  } else if (req.method === 'PUT') {
    return updateTimeBlock(req, res);
  } else if (req.method === 'DELETE') {
    return deleteTimeBlock(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET: Buscar blocos agendados
async function getSchedule(req, res) {
  const { userId, startDate, endDate, status } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    let scheduleQuery = `
      SELECT
        id,
        title,
        description,
        block_type,
        scheduled_date,
        start_time,
        end_time,
        duration_minutes,
        activity_id,
        goal_id,
        template_id,
        planned_impact,
        planned_effort,
        status,
        actual_duration_minutes,
        actual_impact,
        actual_effort,
        is_recurring,
        recurrence_pattern,
        created_at
      FROM time_blocks
      WHERE user_id = $1
    `;

    const queryParams = [userId];
    let paramIndex = 2;

    if (startDate) {
      scheduleQuery += ` AND scheduled_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      scheduleQuery += ` AND scheduled_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    if (status) {
      scheduleQuery += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    scheduleQuery += ` ORDER BY scheduled_date, start_time`;

    const { rows: blocks } = await query(scheduleQuery, queryParams);

    // Agrupar por data
    const blocksByDate = blocks.reduce((acc, block) => {
      const date = block.scheduled_date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(block);
      return acc;
    }, {});

    // Calcular estatísticas
    const stats = {
      totalBlocks: blocks.length,
      completedBlocks: blocks.filter(b => b.status === 'completed').length,
      missedBlocks: blocks.filter(b => b.status === 'missed').length,
      totalPlannedMinutes: blocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0),
      focusBlocks: blocks.filter(b => ['focus', 'deep-work'].includes(b.block_type)).length
    };

    res.json({
      blocks,
      blocksByDate,
      stats
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Error fetching schedule' });
  }
}

// POST: Criar novo bloco de tempo
async function createTimeBlock(req, res) {
  const {
    userId,
    title,
    description,
    blockType = 'focus',
    scheduledDate,
    startTime,
    endTime,
    activityId,
    goalId,
    templateId,
    plannedImpact,
    plannedEffort,
    isRecurring = false,
    recurrencePattern
  } = req.body;

  if (!userId || !title || !scheduledDate || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verificar conflitos
    const conflicts = await detectConflicts(userId, scheduledDate, startTime, endTime);

    if (conflicts.length > 0) {
      return res.status(409).json({
        error: 'Schedule conflict detected',
        conflicts
      });
    }

    // Inserir bloco
    const { rows } = await query(`
      INSERT INTO time_blocks (
        user_id,
        title,
        description,
        block_type,
        scheduled_date,
        start_time,
        end_time,
        activity_id,
        goal_id,
        template_id,
        planned_impact,
        planned_effort,
        is_recurring,
        recurrence_pattern
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      userId, title, description, blockType, scheduledDate, startTime, endTime,
      activityId || null, goalId || null, templateId || null,
      plannedImpact || null, plannedEffort || null,
      isRecurring, recurrencePattern || null
    ]);

    res.status(201).json({ block: rows[0] });
  } catch (error) {
    console.error('Error creating time block:', error);
    res.status(500).json({ error: 'Error creating time block' });
  }
}

// PUT: Atualizar bloco
async function updateTimeBlock(req, res) {
  const { blockId, userId, status, actualDurationMinutes, actualImpact, actualEffort, completionNotes } = req.body;

  if (!blockId || !userId) {
    return res.status(400).json({ error: 'blockId and userId are required' });
  }

  try {
    const updateFields = [];
    const queryParams = [blockId, userId];
    let paramIndex = 3;

    if (status) {
      updateFields.push(`status = $${paramIndex}, updated_at = CURRENT_TIMESTAMP`);
      queryParams.push(status);
      paramIndex++;

      if (status === 'in-progress') {
        updateFields.push(`actual_start_time = CURRENT_TIMESTAMP`);
      } else if (status === 'completed') {
        updateFields.push(`actual_end_time = CURRENT_TIMESTAMP`);
      }
    }

    if (actualDurationMinutes !== undefined) {
      updateFields.push(`actual_duration_minutes = $${paramIndex}`);
      queryParams.push(actualDurationMinutes);
      paramIndex++;
    }

    if (actualImpact !== undefined) {
      updateFields.push(`actual_impact = $${paramIndex}`);
      queryParams.push(actualImpact);
      paramIndex++;
    }

    if (actualEffort !== undefined) {
      updateFields.push(`actual_effort = $${paramIndex}`);
      queryParams.push(actualEffort);
      paramIndex++;
    }

    if (completionNotes) {
      updateFields.push(`completion_notes = $${paramIndex}`);
      queryParams.push(completionNotes);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { rows } = await query(`
      UPDATE time_blocks
      SET ${updateFields.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Time block not found' });
    }

    res.json({ block: rows[0] });
  } catch (error) {
    console.error('Error updating time block:', error);
    res.status(500).json({ error: 'Error updating time block' });
  }
}

// DELETE: Remover bloco
async function deleteTimeBlock(req, res) {
  const { blockId, userId } = req.query;

  if (!blockId || !userId) {
    return res.status(400).json({ error: 'blockId and userId are required' });
  }

  try {
    const { rowCount } = await query(`
      DELETE FROM time_blocks
      WHERE id = $1 AND user_id = $2
    `, [blockId, userId]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Time block not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting time block:', error);
    res.status(500).json({ error: 'Error deleting time block' });
  }
}

// Função auxiliar: detectar conflitos
async function detectConflicts(userId, scheduledDate, startTime, endTime) {
  try {
    const { rows: conflicts } = await query(`
      SELECT id, title, start_time, end_time
      FROM time_blocks
      WHERE user_id = $1
      AND scheduled_date = $2
      AND status NOT IN ('cancelled', 'completed')
      AND (
        (start_time < $4 AND end_time > $3) OR  -- Sobreposição
        (start_time >= $3 AND start_time < $4)  -- Inicia durante bloco
      )
    `, [userId, scheduledDate, startTime, endTime]);

    return conflicts;
  } catch (error) {
    console.error('Error detecting conflicts:', error);
    return [];
  }
}