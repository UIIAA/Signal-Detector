import { query } from '../../../shared/database/db';
import { withAuth } from '../../../src/lib/auth';
import { HabitSchema, validateWithSchema } from '../../../src/lib/validation';
import { apiLimiter } from '../../../src/lib/rateLimit';
import { sanitizeFields } from '../../../src/lib/sanitize';

// Rate limiting function for this API
const applyRateLimit = async (req, res) => {
  await apiLimiter(req, res, () => {});
};

async function handler(req, res) {
  // Apply rate limiting for all requests to this API
  await applyRateLimit(req, res);

  // O ID do usuário agora vem do token JWT decodificado, não da query string.
  const { id: userId } = req.user;

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

export default withAuth(handler);

// GET - Buscar todos os hábitos do usuário
async function handleGet(req, res, userId) {
  // Apply rate limiting for API endpoints
  await applyRateLimit(req, res);

  const { rows: habits } = await query(`
    SELECT
      h.*,
      (SELECT COUNT(*) FROM habit_checkins hc WHERE hc.habit_id = h.id AND hc.completed = true) as total_completions,
      (SELECT COUNT(*) FROM habit_checkins hc WHERE hc.habit_id = h.id) as total_checkins,
      COALESCE(
        (SELECT COUNT(*) FROM habit_checkins hc WHERE hc.habit_id = h.id AND hc.completed = true)::float /
        NULLIF((SELECT COUNT(*) FROM habit_checkins hc WHERE hc.habit_id = h.id), 0) * 100,
        0
      ) as success_rate,
      (SELECT json_agg(json_build_object('checkin_date', TO_CHAR(hc.checkin_date, 'YYYY-MM-DD'), 'completed', hc.completed))
       FROM habit_checkins hc
       WHERE hc.habit_id = h.id AND hc.checkin_date >= NOW() - INTERVAL '7 days'
      ) as checkins
    FROM habits h
    WHERE h.user_id = $1
    AND h.is_active = true
    ORDER BY h.created_at DESC
  `, [userId]);

  return res.json({ habits });
}

// POST - Criar novo hábito
async function handlePost(req, res, userId) {
  // Apply rate limiting for API endpoints
  await apiLimiter(req, res, () => {});

  // Sanitize input fields
  const sanitizedBody = sanitizeFields(req.body, ['title', 'description', 'cue', 'reward']);

  // Validate with Zod
  const validation = validateWithSchema(HabitSchema, { ...sanitizedBody, userId });

  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: validation.errors 
    });
  }

  const {
    title,
    description,
    habit_type,
    frequency_type,
    target_days_per_week,
    preferred_time_of_day,
    cue,
    reward,
    goal_id,
    estimated_duration,
    is_active,
    paused_until
  } = validation.data;

  const { rows } = await query(`
    INSERT INTO habits (
      user_id,
      goal_id,
      title,
      description,
      habit_type,
      frequency_type,
      target_days_per_week,
      preferred_time_of_day,
      cue,
      reward,
      estimated_duration,
      is_active,
      paused_until,
      current_streak,
      longest_streak,
      total_completions,
      success_rate
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, 0, 0, 0)
    RETURNING *
  `, [
    userId,
    goal_id || null,
    title,
    description || null,
    habit_type,
    frequency_type,
    target_days_per_week,
    preferred_time_of_day || null,
    cue || null,
    reward || null,
    estimated_duration || null,
    is_active !== undefined ? is_active : true,
    paused_until || null
  ]);

  return res.status(201).json({ habit: rows[0] });
}

// PUT - Atualizar hábito
async function handlePut(req, res, userId) {
  // Apply rate limiting for API endpoints
  await apiLimiter(req, res, () => {});

  const { habitId, ...updates } = req.body;

  if (!habitId) {
    return res.status(400).json({ error: 'habitId is required' });
  }

  // Validate the updates using a partial schema
  const updateData = { ...updates, userId, id: habitId };
  const validation = validateWithSchema(HabitSchema.partial().extend({ 
    id: HabitSchema.shape.id, 
    userId: HabitSchema.shape.userId 
  }), updateData);

  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: validation.errors 
    });
  }

  const validatedUpdates = validation.data;

  // Sanitize the update fields
  const sanitizedUpdates = sanitizeFields(validatedUpdates, ['title', 'description', 'cue', 'reward']);

  // Construir query dinâmica baseada nos campos fornecidos
  const allowedFields = [
    'title',
    'description',
    'habit_type',
    'frequency_type',
    'target_days_per_week',
    'preferred_time_of_day',
    'cue',
    'reward',
    'estimated_duration',
    'is_active',
    'paused_until'
  ];

  const updateFields = [];
  const values = [userId, habitId];
  let paramIndex = 3;

  Object.keys(sanitizedUpdates).forEach(field => {
    if (allowedFields.includes(field) && sanitizedUpdates[field] !== undefined) {
      updateFields.push(`${field} = ${paramIndex}`);
      values.push(sanitizedUpdates[field]);
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
  // Apply rate limiting for API endpoints
  await applyRateLimit(req, res);

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
