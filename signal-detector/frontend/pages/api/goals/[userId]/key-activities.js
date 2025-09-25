
import { query } from '../../../../../shared/database/db';

export default async function handler(req, res) {
  const { userId: goalId } = req.query; // Rename for clarity within the handler

  switch (req.method) {
    case 'GET':
      try {
        const { rows } = await query('SELECT * FROM key_activities WHERE goal_id = $1 ORDER BY created_at DESC', [goalId]);
        res.status(200).json(rows);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'POST':
      const { title, description, impact, effort } = req.body;

      if (!title || !impact || !effort) {
        return res.status(400).json({ error: 'Title, impact, and effort are required.' });
      }

      try {
        const { rows } = await query(
          'INSERT INTO key_activities (goal_id, title, description, impact, effort) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [goalId, title, description, impact, effort]
        );
        res.status(201).json({ id: rows[0].id, message: 'Key activity created successfully.' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
