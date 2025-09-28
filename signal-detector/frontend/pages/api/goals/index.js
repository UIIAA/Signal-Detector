import { query } from '../../../../shared/database/db';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, title, description, goalType, aiSuggested } = req.body;

    if (!userId || !title || !goalType) {
      return res.status(400).json({ error: 'userId, title and goalType are required' });
    }

    const goalId = crypto.randomBytes(16).toString('hex');

    try {
      await query(
        'INSERT INTO goals (id, user_id, title, description, goal_type, ai_suggested) VALUES ($1, $2, $3, $4, $5, $6)',
        [goalId, userId, title, description || '', goalType, aiSuggested || false]
      );

      const { rows } = await query('SELECT * FROM goals WHERE id = $1', [goalId]);
      res.json(rows[0]);
    } catch (error) {
      console.error('Goal creation error:', error.message);
      console.error('Full error:', error);
      res.status(500).json({ error: 'Error creating goal' });
    }
  } else if (req.method === 'PUT') {
    const { goalId, title, description, goalType } = req.body;

    if (!goalId || !title || !goalType) {
      return res.status(400).json({ error: 'goalId, title and goalType are required' });
    }

    try {
      const { rowCount } = await query(
        'UPDATE goals SET title = $1, description = $2, goal_type = $3 WHERE id = $4',
        [title, description || '', goalType, goalId]
      );

      if (rowCount === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({ message: 'Goal updated successfully' });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Error updating goal' });
    }
  } else if (req.method === 'DELETE') {
    const { goalId } = req.body;

    if (!goalId) {
      return res.status(400).json({ error: 'goalId is required' });
    }

    try {
      const { rowCount } = await query('DELETE FROM goals WHERE id = $1', [goalId]);

      if (rowCount === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Error deleting goal' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}