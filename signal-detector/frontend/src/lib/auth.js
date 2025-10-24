
import jwt from 'jsonwebtoken';
import { apiLimiter } from './rateLimit';

// JWT Secret - MUST be set in environment variables for security
// Never use hardcoded fallbacks in production
if (!process.env.JWT_SECRET) {
  throw new Error(
    'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required. ' +
    'Please set JWT_SECRET in your .env.local file. ' +
    'Generate a secure secret with: openssl rand -base64 32'
  );
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware para proteger rotas de API.
 * Verifica o token JWT do cabeçalho Authorization e anexa o usuário decodificado ao request.
 */
export const withAuth = (handler) => {
  return async (req, res) => {
    // Apply rate limiting for protected endpoints
    await apiLimiter(req, res, () => {});

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Anexa o payload decodificado (que deve conter o ID do usuário) ao objeto req
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      console.error('JWT Verification Error:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

/**
 * Gera um token JWT para um usuário.
 * Usado na API de login.
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }); // Token expira em 1 dia
};
