import { query } from '../../../shared/database/db';
import { generateToken } from '../../../src/lib/auth';
import { UserRegistrationSchema, validateWithSchema } from '../../../src/lib/validation';
import { sanitizeFields } from '../../../src/lib/sanitize';
import { authLimiter } from '../../../src/lib/rateLimit';

export default async function handler(req, res) {
  // Apply rate limiting for auth endpoints
  await authLimiter(req, res, () => {});

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sanitize input
    const sanitizedBody = sanitizeFields(req.body, ['name', 'email']);

    // Validate input
    const validation = validateWithSchema(UserRegistrationSchema, sanitizedBody);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    const { userId, name, email } = validation.data;

    // Check if user already exists
    const { rows: existingUsers } = await query('SELECT id, name, email FROM users WHERE id = $1 OR email = $2', [userId, email]);

    let user;
    if (existingUsers.length > 0) {
      user = existingUsers[0];
    } else {
      // Create new user
      const { rows: newUsers } = await query(
        'INSERT INTO users (id, name, email, created_at) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
        [userId, name, email, new Date()]
      );
      user = newUsers[0];
    }

    // Generate JWT
    const token = generateToken({ id: user.id, name: user.name, email: user.email });

    res.json({ message: 'Authentication successful', token, user });

  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: 'Error during authentication' });
  }
}