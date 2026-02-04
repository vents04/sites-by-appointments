/**
 * JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const redis = require('../config/redis');
const { UnauthorizedError } = require('../utils/errors');
const Business = require('../models/Business');

/**
 * Authenticate JWT token for business admin endpoints
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('UNAUTHORIZED', 'No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted (if Redis is available)
    try {
      const isBlacklisted = await redis.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedError('TOKEN_EXPIRED', 'Token has been revoked');
      }
    } catch (redisError) {
      // If Redis is not available, skip blacklist check
      if (!redisError.message.includes('not initialized')) {
        throw redisError;
      }
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Verify business still exists and is active
    const business = await Business.findById(decoded.businessId);
    if (!business) {
      throw new UnauthorizedError('UNAUTHORIZED', 'Business not found');
    }
    
    if (business.status === 'deleted') {
      throw new UnauthorizedError('UNAUTHORIZED', 'Business has been deleted');
    }
    
    if (business.status === 'suspended') {
      throw new UnauthorizedError('BUSINESS_SUSPENDED', 'Business is suspended');
    }
    
    // Attach to request
    req.businessId = decoded.businessId;
    req.tokenType = decoded.type;
    req.token = token;
    req.business = business;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('TOKEN_INVALID', 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('TOKEN_EXPIRED', 'Token has expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token, just sets req.businessId if valid
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.businessId = decoded.businessId;
      req.tokenType = decoded.type;
      req.token = token;
    } catch (err) {
      // Invalid token, just continue without auth
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  optionalAuth
};
