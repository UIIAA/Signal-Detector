import { query } from '../../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, habitId, completed, notes, energyLevel, difficulty } = req.body;

  if (!userId || !habitId || completed === undefined) {
    return res.status(400).json({ error: 'userId, habitId, and completed are required' });
  }

  try {
    // Inserir ou atualizar check-in de hoje
    const { rows: checkins } = await query(`
      INSERT INTO habit_checkins (
        habit_id,
        checkin_date,
        completed,
        notes,
        energy_level,
        difficulty
      )
      VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
      ON CONFLICT (habit_id, checkin_date)
      DO UPDATE SET
        completed = $2,
        notes = $3,
        energy_level = $4,
        difficulty = $5,
        updated_at = NOW()
      RETURNING *
    `, [habitId, completed, notes || null, energyLevel || null, difficulty || null]);

    // Atualizar streak do hábito
    await updateHabitStreak(habitId);

    // Buscar hábito atualizado
    const { rows: habits } = await query(`
      SELECT
        h.*,
        (SELECT COUNT(*) FROM habit_checkins hc WHERE hc.habit_id = h.id AND hc.completed = true) as total_completions,
        (SELECT COUNT(*) FROM habit_checkins hc WHERE hc.habit_id = h.id) as total_checkins
      FROM habits h
      WHERE h.id = $1 AND h.user_id = $2
    `, [habitId, userId]);

    if (habits.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    return res.json({
      checkin: checkins[0],
      habit: habits[0]
    });
  } catch (error) {
    console.error('Error in habit checkin:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Função para atualizar o streak do hábito
async function updateHabitStreak(habitId) {
  try {
    // Buscar check-ins ordenados por data
    const { rows: checkins } = await query(`
      SELECT checkin_date, completed
      FROM habit_checkins
      WHERE habit_id = $1
      ORDER BY checkin_date DESC
    `, [habitId]);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (const checkin of checkins) {
      if (checkin.completed) {
        // Verificar se é consecutivo
        if (!lastDate) {
          // Primeiro check-in
          currentStreak = 1;
          tempStreak = 1;
        } else {
          const daysDiff = Math.floor((lastDate - new Date(checkin.checkin_date)) / (1000 * 60 * 60 * 24));

          if (daysDiff === 1) {
            // Consecutivo
            if (lastDate.toDateString() === new Date().toDateString() ||
                (lastDate - new Date()) < (1000 * 60 * 60 * 24)) {
              currentStreak++;
            }
            tempStreak++;
          } else {
            // Quebrou o streak
            tempStreak = 1;
          }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
        lastDate = new Date(checkin.checkin_date);
      } else {
        tempStreak = 0;
      }
    }

    // Atualizar hábito
    await query(`
      UPDATE habits
      SET
        current_streak = $1,
        longest_streak = GREATEST(longest_streak, $2),
        updated_at = NOW()
      WHERE id = $3
    `, [currentStreak, longestStreak, habitId]);
  } catch (error) {
    console.error('Error updating habit streak:', error);
  }
}
