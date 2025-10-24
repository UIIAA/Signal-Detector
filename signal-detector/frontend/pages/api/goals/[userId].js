import { query } from '../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    const { rows } = await query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

    const goals = {
      short: rows.filter(goal => goal.goal_type === 'short'),
      medium: rows.filter(goal => goal.goal_type === 'medium'),
      long: rows.filter(goal => goal.goal_type === 'long')
    };

    res.json(goals);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error fetching goals' });
  }
}