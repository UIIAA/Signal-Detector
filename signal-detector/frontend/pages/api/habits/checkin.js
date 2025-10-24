import { query } from '../../../shared/database/db';
import { withAuth } from '../../../src/lib/auth';
import { HabitCheckinSchema, validateWithSchema } from '../../../src/lib/validation';
import { sanitizeInput } from '../../../src/lib/sanitize';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: userId } = req.user;

  // Sanitize the input
  const sanitizedBody = sanitizeInput(req.body);

  // Validate with Zod
  const validation = validateWithSchema(HabitCheckinSchema, { ...sanitizedBody, userId });

  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: validation.errors 
    });
  }

  const { habitId, checkin_date, completed } = validation.data;

  try {
    // Verificar se o hábito pertence ao usuário (segurança extra)
    const { rows: habitRows } = await query('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
    if (habitRows.length === 0) {
      return res.status(404).json({ error: 'Habit not found or does not belong to user' });
    }

    // Usar INSERT ... ON CONFLICT (UPSERT) para criar ou atualizar o check-in
    const { rows } = await query(`
      INSERT INTO habit_checkins (habit_id, user_id, checkin_date, completed)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (habit_id, checkin_date)
      DO UPDATE SET completed = $4, updated_at = NOW()
      RETURNING *
    `, [habitId, userId, checkin_date, completed]);

    // Após o check-in, recalcular os streaks para o hábito
    await recalculateStreaks(habitId);

    return res.status(200).json({ success: true, checkin: rows[0] });

  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function recalculateStreaks(habitId) {
  // Query para recalcular e atualizar o current_streak e o longest_streak
  await query(`
    WITH checkin_streaks AS (
      SELECT
        completed,
        checkin_date,
        -- Define um grupo de streak. A cada dia que o hábito não foi completado, um novo grupo começa.
        SUM(CASE WHEN completed THEN 0 ELSE 1 END) OVER (ORDER BY checkin_date) as streak_group
      FROM habit_checkins
      WHERE habit_id = $1
    ),
    streaks AS (
      SELECT
        COUNT(*) as streak_length
      FROM checkin_streaks
      WHERE completed = true
      GROUP BY streak_group
    ),
    last_checkin AS (
      SELECT checkin_date, completed
      FROM habit_checkins
      WHERE habit_id = $1
      ORDER BY checkin_date DESC
      LIMIT 1
    )
    UPDATE habits
    SET
      current_streak = (
        -- Se o último check-in foi ontem ou hoje e foi completo, o streak continua.
        -- Caso contrário, o streak é 0.
        SELECT
          CASE
            WHEN (lc.completed = true AND lc.checkin_date >= (NOW()::date - INTERVAL '1 day'))
            THEN (SELECT s.streak_length FROM streaks s ORDER BY (SELECT MAX(cs.checkin_date) FROM checkin_streaks cs WHERE cs.streak_group = s.streak_group) DESC LIMIT 1)
            ELSE 0
          END
        FROM last_checkin lc
      ),
      longest_streak = (SELECT COALESCE(MAX(streak_length), 0) FROM streaks)
    WHERE id = $1;
  `, [habitId]);
}

export default withAuth(handler);