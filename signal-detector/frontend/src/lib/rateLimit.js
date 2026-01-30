import rateLimit from 'express-rate-limit';

/**
 * General rate limiter - 100 requests per 15 minutes
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-user-id'] || req.ip || req.connection.remoteAddress;
  },
});

/**
 * Authentication limiter - 5 attempts per hour
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    return req.method === 'GET';
  },
});

/**
 * API limiter - 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many API requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-user-id'] || req.ip || req.connection.remoteAddress;
  },
});

/**
 * Classification API limiter - 20 requests per minute for AI services
 */
const classifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    error: 'Too many classification requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-user-id'] || req.query.userId || req.ip || req.connection.remoteAddress;
  },
});

export { limiter, authLimiter, apiLimiter, classifyLimiter };