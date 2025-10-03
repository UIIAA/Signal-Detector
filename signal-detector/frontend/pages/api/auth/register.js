import { query } from '../../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, name, email } = req.body;

  if (!userId || !name || !email) {
    return res.status(400).json({ error: 'userId, name and email are required' });
  }

  try {
    // Check if user already exists
    const { rows: existingUsers } = await query('SELECT id FROM users WHERE id = $1 OR email = $2', [userId, email]);

    if (existingUsers.length > 0) {
      // User exists, just return success
      return res.json({ message: 'User already exists', userId });
    }

    // Create new user
    await query(
      'INSERT INTO users (id, name, email, created_at) VALUES ($1, $2, $3, $4)',
      [userId, name, email, new Date()]
    );

    res.json({ message: 'User created successfully', userId });
  } catch (error) {
    console.error('User registration error:', error.message);
    res.status(500).json({ error: 'Error creating user' });
  }
}