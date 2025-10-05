import { query } from '../../../../shared/database/db';

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, userId);
      case 'POST':
        return await handlePost(req, res, userId);
      case 'PUT':
        return await handlePut(req, res, userId);
      case 'DELETE':
        return await handleDelete(req, res, userId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in habits API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET - Buscar todos os hábitos do usuário
async function handleGet(req, res, userId) {
  const { rows: habits } = await query(`
    SELECT
      h.*,
      (SELECT COUNT(*) FROM habit_checkins hc WHERE hc.habit_id = h.id AND hc.completed = true) as total_completions,
      (SELECT COUNT(*) FROM habit_checkins hc WHERE hc.habit_id = h.id) as total_checkins,
      COALESCE(
        (SELECT COUNT(*) FROM habit_checkins hc WHERE hc.habit_id = h.id AND hc.completed = true)::float /
        NULLIF((SELECT COUNT(*) FROM habit_checkins hc WHERE hc.habit_id = h.id), 0) * 100,
        0
      ) as success_rate
    FROM habits h
    WHERE h.user_id = $1
    AND h.is_active = true
    ORDER BY h.created_at DESC
  `, [userId]);

  return res.json({ habits });
}

// POST - Criar novo hábito
async function handlePost(req, res, userId) {
  const {
    title,
    description,
    habit_type,
    frequency,
    target_days_per_week,
    preferred_time_of_day,
    cue,
    reward,
    goal_id
  } = req.body;

  if (!title || !habit_type || !frequency) {
    return res.status(400).json({ error: 'title, habit_type, and frequency are required' });
  }

  const { rows } = await query(`
    INSERT INTO habits (
      user_id,
      goal_id,
      title,
      description,
      habit_type,
      frequency,
      target_days_per_week,
      preferred_time_of_day,
      cue,
      reward,
      current_streak,
      longest_streak,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0, true)
    RETURNING *
  `, [
    userId,
    goal_id || null,
    title,
    description || null,
    habit_type,
    frequency,
    target_days_per_week || 7,
    preferred_time_of_day || null,
    cue || null,
    reward || null
  ]);

  return res.status(201).json({ habit: rows[0] });
}

// PUT - Atualizar hábito
async function handlePut(req, res, userId) {
  const { habitId, ...updates } = req.body;

  if (!habitId) {
    return res.status(400).json({ error: 'habitId is required' });
  }

  // Construir query dinâmica baseada nos campos fornecidos
  const allowedFields = [
    'title',
    'description',
    'habit_type',
    'frequency',
    'target_days_per_week',
    'preferred_time_of_day',
    'cue',
    'reward',
    'is_active'
  ];

  const updateFields = [];
  const values = [userId, habitId];
  let paramIndex = 3;

  Object.keys(updates).forEach(field => {
    if (allowedFields.includes(field)) {
      updateFields.push(`${field} = $${paramIndex}`);
      values.push(updates[field]);
      paramIndex++;
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { rows } = await query(`
    UPDATE habits
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE user_id = $1 AND id = $2
    RETURNING *
  `, values);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  return res.json({ habit: rows[0] });
}

// DELETE - Desativar hábito (soft delete)
async function handleDelete(req, res, userId) {
  const { habitId } = req.body;

  if (!habitId) {
    return res.status(400).json({ error: 'habitId is required' });
  }

  const { rows } = await query(`
    UPDATE habits
    SET is_active = false, updated_at = NOW()
    WHERE user_id = $1 AND id = $2
    RETURNING *
  `, [userId, habitId]);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  return res.json({ success: true, habit: rows[0] });
}
