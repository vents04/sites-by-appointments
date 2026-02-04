/**
 * Server Entry Point
 */

require('dotenv').config();

const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { setupWebSocket } = require('./websocket');

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket
const io = setupWebSocket(server);

// Make io available to routes
app.set('io', io);

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      await config.database.disconnect();
      await config.redis.disconnect();
      
      logger.info('All connections closed. Exiting...');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    logger.info('Connecting to databases...');
    await config.database.connect(config.mongodbUri);
    
    // Redis connection (optional - will work without it but with reduced features)
    try {
      config.redis.createClient(config.redisUrl);
      logger.info('Redis client created');
    } catch (redisError) {
      logger.warn('Redis connection failed. Running without Redis:', redisError.message);
    }
    
    // Start HTTP server
    server.listen(config.port, () => {
      logger.info('═══════════════════════════════════════════════════════');
      logger.info('Sites By Appointments API');
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Port: ${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`API base: http://localhost:${config.port}/v1`);
      logger.info('═══════════════════════════════════════════════════════');
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { server, io };
