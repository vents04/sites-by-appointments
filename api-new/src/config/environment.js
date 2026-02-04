/**
 * Environment Configuration
 * Validates and exports environment variables
 */

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'SUPER_ADMIN_KEY'
];

const optionalEnvVars = {
  REDIS_URL: 'redis://localhost:6379',
  JWT_EXPIRES_IN: '30d',
  LOG_LEVEL: 'info',
  ALLOWED_ORIGINS: 'http://localhost:3000',
  SMTP_HOST: '',
  SMTP_PORT: '465',
  SMTP_SECURE: 'true',
  SMTP_USER: '',
  SMTP_PASS: ''
};

// Validate required environment variables
const validateEnv = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Get config object
const getConfig = () => {
  validateEnv();
  
  return {
    nodeEnv: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10),
    
    // MongoDB
    mongodbUri: process.env.MONGODB_URI,
    
    // Redis
    redisUrl: process.env.REDIS_URL || optionalEnvVars.REDIS_URL,
    
    // JWT
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || optionalEnvVars.JWT_EXPIRES_IN
    },
    
    // Super Admin
    superAdminKey: process.env.SUPER_ADMIN_KEY,
    
    // CORS
    allowedOrigins: (process.env.ALLOWED_ORIGINS || optionalEnvVars.ALLOWED_ORIGINS).split(','),
    
    // Logging
    logLevel: process.env.LOG_LEVEL || optionalEnvVars.LOG_LEVEL,
    
    // SMTP
    smtp: {
      host: process.env.SMTP_HOST || optionalEnvVars.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || optionalEnvVars.SMTP_PORT, 10),
      secure: (process.env.SMTP_SECURE || optionalEnvVars.SMTP_SECURE) === 'true',
      user: process.env.SMTP_USER || optionalEnvVars.SMTP_USER,
      pass: process.env.SMTP_PASS || optionalEnvVars.SMTP_PASS
    },
    
    // Helpers
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test'
  };
};

module.exports = getConfig();
