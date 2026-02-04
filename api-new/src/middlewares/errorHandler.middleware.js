/**
 * Global Error Handler Middleware
 */

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error({
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    businessId: req.businessId,
    ip: req.ip
  });

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message
    }));
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details
      }
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid ID format'
      }
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `Duplicate value for field: ${field}`
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      }
    });
  }

  // Operational errors (expected, handled errors)
  if (err.isOperational) {
    const message = req.t ? req.t(`errors:${err.code}`, err.message) : err.message;
    
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message,
        details: err.details
      }
    });
  }

  // Programming errors (unexpected, unhandled errors)
  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
      ...(isProduction ? {} : { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
