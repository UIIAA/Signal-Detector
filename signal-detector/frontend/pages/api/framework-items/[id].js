
import { query } from '../../../../shared/database/db';

export default async function handler(req, res) {
  const { id } = req.query;

  switch (req.method) {
    case 'PUT':
      const { title, description, status, current_value } = req.body;

      const fields = [];
      const params = [];
      let paramIndex = 1;

      if (title) { fields.push(`title = $${paramIndex++}`); params.push(title); }
      if (description) { fields.push(`description = $${paramIndex++}`); params.push(description); }
      if (status) { fields.push(`status = $${paramIndex++}`); params.push(status); }
      if (current_value) { fields.push(`current_value = $${paramIndex++}`); params.push(current_value); }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update.' });
      }

      params.push(id);
      const sql = `UPDATE framework_items SET ${fields.join(', ')} WHERE id = $${paramIndex}`;

      try {
        const { rowCount } = await query(sql, params);
        if (rowCount === 0) {
          return res.status(404).json({ error: 'Framework item not found.' });
        }
        res.status(200).json({ message: 'Framework item updated.' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const { rowCount } = await query('DELETE FROM framework_items WHERE id = $1', [id]);
        if (rowCount === 0) {
          return res.status(404).json({ error: 'Framework item not found.' });
        }
        res.status(200).json({ message: 'Framework item deleted.' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
