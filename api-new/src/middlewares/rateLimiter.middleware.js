/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
// const RedisStore = require('rate-limit-redis');
// const redis = require('../config/redis');

/**
 * Create a rate limiter with custom options
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip
  } = options;
  
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    // Uncomment to use Redis store for distributed rate limiting
    // store: new RedisStore({
    //   sendCommand: (...args) => redis.getClient().call(...args)
    // })
  });
};

/**
 * Rate limiter for authentication endpoints (stricter)
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many login attempts, please try again later'
});

/**
 * Rate limiter for business admin endpoints
 */
const businessLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  keyGenerator: (req) => req.businessId || req.ip
});

/**
 * Rate limiter for public booking endpoints
 */
const bookingLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many booking requests, please slow down'
});

/**
 * Rate limiter for super admin endpoints
 */
const adminLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => req.headers['x-super-admin-key'] || req.ip
});

module.exports = {
  createRateLimiter,
  authLimiter,
  businessLimiter,
  bookingLimiter,
  adminLimiter
};
