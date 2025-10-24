// API proxy for Vercel deployment
import { createProxyMiddleware } from 'http-proxy-middleware';
import { limiter } from '../../src/lib/rateLimit';

const isDevelopment = process.env.NODE_ENV === 'development';

const proxy = createProxyMiddleware({
  target: isDevelopment ? 'http://localhost:4000' : process.env.API_URL || 'http://localhost:4000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix when forwarding to backend
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  },
});

export default async function handler(req, res) {
  // Apply rate limiting
  await new Promise((resolve, reject) => {
    limiter(req, res, (result) => {
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    });
  });

  const { slug } = req.query;
  const path = Array.isArray(slug) ? slug.join('/') : slug;

  // Routes that should be handled by Next.js API routes, not proxied
  const nextjsRoutes = ['goals', 'classify', 'insights', 'transcribe', 'analyze-goals', 'auth', 'activities', 'coach', 'habits', 'schedule', 'recommendations'];

  // Check if this request should be handled by Next.js
  if (nextjsRoutes.some(route => path && path.startsWith(route))) {
    return res.status(404).json({ error: 'Route not found' });
  }

  // In production on Vercel, we'll include the backend logic directly
  if (!isDevelopment) {
    // Import and setup backend directly in production
    try {
      return require('../../services/signal-processor/src/app.js')(req, res);
    } catch (error) {
      console.error('Backend app import error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return proxy(req, res);
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};