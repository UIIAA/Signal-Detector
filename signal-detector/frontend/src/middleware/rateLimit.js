import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 * Provides different rate limiters for different API endpoints
 */

// General API Limiter
// 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_API_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_API_WINDOW_MS)
    : 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_API_MAX_REQUESTS
    ? parseInt(process.env.RATE_LIMIT_API_MAX_REQUESTS)
    : 100,
  message: {
    error: 'Too many API requests from this IP, please try again later.',
    retryAfter: undefined
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  keyGenerator: (req) => {
    // Use user ID if available, otherwise use IP
    return req.headers['x-user-id'] || req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Authentication Limiter
// 5 attempts per hour
export const authLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_AUTH_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS)
    : 60 * 60 * 1000, // 1 hour
  max: process.env.RATE_LIMIT_AUTH_MAX_ATTEMPTS
    ? parseInt(process.env.RATE_LIMIT_AUTH_MAX_ATTEMPTS)
    : 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: undefined
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email or IP for auth attempts
    return req.body?.email || req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Your account has been temporarily locked. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  skip: (req) => {
    // Don't rate limit GET requests
    return req.method === 'GET';
  }
});

// Classification API Limiter
// 20 requests per minute for AI classification
export const classifyLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_CLASSIFY_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_CLASSIFY_WINDOW_MS)
    : 60 * 1000, // 1 minute
  max: process.env.RATE_LIMIT_CLASSIFY_MAX_REQUESTS
    ? parseInt(process.env.RATE_LIMIT_CLASSIFY_MAX_REQUESTS)
    : 20,
  message: {
    error: 'Too many classification requests',
    retryAfter: undefined
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for classification rate limiting
    return req.headers['x-user-id'] || req.query.userId || req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Classification rate limit exceeded',
      message: 'Too many classification requests. Please wait before trying again.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Helper function to apply rate limiting to Next.js API routes
 * Usage: Apply as middleware in pages/api routes
 */
export const withRateLimit = (limiter) => {
  return (handler) => {
    return (req, res) => {
      return new Promise((resolve, reject) => {
        limiter(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(handler(req, res));
          }
        });
      });
    };
  };
};
