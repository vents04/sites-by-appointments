/**
 * Authentication Service
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const redis = require('../config/redis');
const Business = require('../models/Business');
const AdminSession = require('../models/AdminSession');
const { hashPassword, verifyPassword } = require('../utils/crypto.utils');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Login with business code and password
 * @param {string} code - Business code
 * @param {string} password - Admin password
 * @param {Object} metadata - Request metadata (userAgent, ip, etc.)
 * @returns {Object} { token, expiresAt, business }
 */
const login = async (code, password, metadata = {}) => {
  // Find business by code (include password hash)
  const business = await Business.findOne({ 
    code: code.toUpperCase(), 
    status: { $in: ['active', 'inactive'] }
  }).select('+adminPasswordHash');
  
  if (!business) {
    logger.warn(`Login attempt with invalid code: ${code}`);
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid code or password');
  }
  
  if (business.status === 'suspended') {
    logger.warn(`Login attempt for suspended business: ${business.code}`);
    throw new ForbiddenError('BUSINESS_SUSPENDED', 'Business is suspended');
  }
  
  // Verify password
  const isValid = await verifyPassword(password, business.adminPasswordHash);
  if (!isValid) {
    logger.warn(`Login attempt with invalid password for business: ${business.code}`);
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid code or password');
  }
  
  // Generate JWT token
  const tokenId = uuidv4();
  const expiresAt = new Date(Date.now() + parseExpiresIn(config.jwt.expiresIn));
  
  const token = jwt.sign(
    { 
      businessId: business._id.toString(),
      type: 'business_admin',
      jti: tokenId
    },
    config.jwt.secret,
    { 
      expiresIn: config.jwt.expiresIn,
      issuer: 'sites-by-appointments'
    }
  );
  
  // Create session record
  try {
    await AdminSession.createSession({
      businessId: business._id,
      tokenId,
      expiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      deviceId: metadata.deviceId,
      platform: metadata.platform
    });
  } catch (error) {
    logger.error('Failed to create admin session:', error);
    // Continue even if session creation fails
  }
  
  logger.info(`Business ${business.code} logged in successfully`);
  
  return {
    token,
    expiresAt,
    business: {
      id: business._id,
      code: business.code,
      name: business.name,
      logo: business.logo,
      defaultLanguage: business.defaultLanguage,
      timezone: business.timezone,
      currency: business.currency
    }
  };
};

/**
 * Refresh an existing token
 * @param {string} token - Current JWT token
 * @returns {Object} { token, expiresAt }
 */
const refreshToken = async (token) => {
  try {
    // Verify current token
    const decoded = jwt.verify(token, config.jwt.secret, {
      ignoreExpiration: false
    });
    
    // Check if token is blacklisted
    try {
      const isBlacklisted = await redis.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedError('TOKEN_EXPIRED', 'Token has been revoked');
      }
    } catch (error) {
      if (!error.message.includes('not initialized')) {
        throw error;
      }
    }
    
    // Verify business still exists and is active
    const business = await Business.findById(decoded.businessId);
    if (!business || business.status === 'deleted') {
      throw new UnauthorizedError('UNAUTHORIZED', 'Business not found');
    }
    
    if (business.status === 'suspended') {
      throw new ForbiddenError('BUSINESS_SUSPENDED', 'Business is suspended');
    }
    
    // Blacklist old token
    try {
      const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
      if (ttl > 0) {
        await redis.blacklistToken(token, ttl);
      }
    } catch (error) {
      logger.warn('Failed to blacklist old token:', error.message);
    }
    
    // Deactivate old session
    if (decoded.jti) {
      await AdminSession.deactivateByTokenId(decoded.jti);
    }
    
    // Generate new token
    const tokenId = uuidv4();
    const expiresAt = new Date(Date.now() + parseExpiresIn(config.jwt.expiresIn));
    
    const newToken = jwt.sign(
      { 
        businessId: decoded.businessId,
        type: 'business_admin',
        jti: tokenId
      },
      config.jwt.secret,
      { 
        expiresIn: config.jwt.expiresIn,
        issuer: 'sites-by-appointments'
      }
    );
    
    // Create new session
    try {
      await AdminSession.createSession({
        businessId: decoded.businessId,
        tokenId,
        expiresAt
      });
    } catch (error) {
      logger.error('Failed to create admin session:', error);
    }
    
    return {
      token: newToken,
      expiresAt
    };
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('TOKEN_EXPIRED', 'Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('TOKEN_INVALID', 'Invalid token');
    }
    throw error;
  }
};

/**
 * Logout - invalidate token
 * @param {string} token - JWT token to invalidate
 */
const logout = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      ignoreExpiration: true
    });
    
    // Add token to blacklist
    const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
    if (ttl > 0) {
      try {
        await redis.blacklistToken(token, ttl);
      } catch (error) {
        logger.warn('Failed to blacklist token:', error.message);
      }
    }
    
    // Deactivate session
    if (decoded.jti) {
      await AdminSession.deactivateByTokenId(decoded.jti);
    }
    
    logger.info(`Business ${decoded.businessId} logged out`);
    
  } catch (error) {
    logger.warn('Logout with invalid token:', error.message);
    // Don't throw - logout should always succeed
  }
};

/**
 * Change password for a business
 * @param {string} businessId - Business ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
const changePassword = async (businessId, currentPassword, newPassword) => {
  const business = await Business.findById(businessId).select('+adminPasswordHash');
  
  if (!business) {
    throw new UnauthorizedError('UNAUTHORIZED', 'Business not found');
  }
  
  // Verify current password
  const isValid = await verifyPassword(currentPassword, business.adminPasswordHash);
  if (!isValid) {
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'Current password is incorrect');
  }
  
  // Hash new password
  business.adminPasswordHash = await hashPassword(newPassword);
  await business.save();
  
  // Invalidate all existing sessions
  await AdminSession.deactivateAllForBusiness(businessId);
  
  logger.info(`Password changed for business ${business.code}`);
};

/**
 * Reset password (super admin only)
 * @param {string} businessId - Business ID
 * @param {string} newPassword - New password
 */
const resetPassword = async (businessId, newPassword) => {
  const business = await Business.findById(businessId);
  
  if (!business) {
    throw new UnauthorizedError('UNAUTHORIZED', 'Business not found');
  }
  
  // Hash new password
  business.adminPasswordHash = await hashPassword(newPassword);
  await business.save();
  
  // Invalidate all existing sessions
  await AdminSession.deactivateAllForBusiness(businessId);
  
  logger.info(`Password reset for business ${business.code}`);
};

/**
 * Verify a token without throwing
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token or null
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

/**
 * Get active sessions for a business
 * @param {string} businessId - Business ID
 * @returns {Array} Active sessions
 */
const getActiveSessions = async (businessId) => {
  return AdminSession.findActiveByBusiness(businessId);
};

/**
 * Parse expiresIn string to milliseconds
 * @param {string} expiresIn - e.g., '30d', '24h', '60m'
 * @returns {number} Milliseconds
 */
const parseExpiresIn = (expiresIn) => {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // Default 30 days
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 's': return value * 1000;
    default: return 30 * 24 * 60 * 60 * 1000;
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  changePassword,
  resetPassword,
  verifyToken,
  getActiveSessions,
  hashPassword,
  verifyPassword
};
