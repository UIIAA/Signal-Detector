import { query } from '../../../../../shared/database/db';

export default async function handler(req, res) {
  const { userId: goalId } = req.query; // Rename for clarity within the handler

  switch (req.method) {
    case 'GET':
      try {
        const { rows } = await query('SELECT * FROM framework_items WHERE goal_id = $1 ORDER BY created_at ASC', [goalId]);
        res.status(200).json(rows);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'POST':
      const { item_type, title, description, target_value } = req.body;

      if (!item_type || !title) {
        return res.status(400).json({ error: 'item_type and title are required.' });
      }

      try {
        const frameworkType = item_type === 'key_result' ? 'okr' : item_type === 'habit' ? 'atomic_habits' : 'eisenhower';
        await query('UPDATE goals SET framework_type = $1 WHERE id = $2 AND framework_type = \'none\'', [frameworkType, goalId]);

        const { rows } = await query(
          'INSERT INTO framework_items (goal_id, item_type, title, description, target_value, current_value) VALUES ($1, $2, $3, $4, $5, 0) RETURNING id',
          [goalId, item_type, title, description, target_value]
        );
        res.status(201).json({ id: rows[0].id, message: 'Framework item created.' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}