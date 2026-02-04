/**
 * Custom Error Classes
 */

class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(code = 'UNAUTHORIZED', message = 'Unauthorized') {
    super(code, message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(code = 'FORBIDDEN', message = 'Forbidden') {
    super(code, message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(code = 'NOT_FOUND', message = 'Resource not found') {
    super(code, message, 404);
  }
}

class ConflictError extends AppError {
  constructor(code = 'CONFLICT', message = 'Conflict') {
    super(code, message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super('RATE_LIMITED', message, 429);
  }
}

class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super('INTERNAL_ERROR', message, 500);
    this.isOperational = false;
  }
}

// Error code constants
const ErrorCodes = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  
  // Authorization
  FORBIDDEN: 'FORBIDDEN',
  BUSINESS_SUSPENDED: 'BUSINESS_SUSPENDED',
  
  // Not Found
  NOT_FOUND: 'NOT_FOUND',
  BUSINESS_NOT_FOUND: 'BUSINESS_NOT_FOUND',
  EMPLOYEE_NOT_FOUND: 'EMPLOYEE_NOT_FOUND',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  
  // Conflict
  CONFLICT: 'CONFLICT',
  SLOT_NOT_AVAILABLE: 'SLOT_NOT_AVAILABLE',
  TOO_CLOSE_TO_START: 'TOO_CLOSE_TO_START',
  CANCELLATION_TOO_LATE: 'CANCELLATION_TOO_LATE',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Rate Limiting
  RATE_LIMITED: 'RATE_LIMITED',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  
  // Internal
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalError,
  ErrorCodes
};
