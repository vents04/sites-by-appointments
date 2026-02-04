/**
 * WebSocket Setup
 * Socket.io configuration for real-time updates
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const handlers = require('./handlers');

let io = null;

/**
 * Setup WebSocket server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.io server instance
 */
const setupWebSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.allowedOrigins,
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token?.replace('Bearer ', '');
      
      if (!token) {
        // Allow connection without auth for public features
        socket.businessId = null;
        socket.isAuthenticated = false;
        return next();
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.businessId = decoded.businessId;
      socket.isAuthenticated = true;
      
      next();
    } catch (error) {
      // Allow connection but mark as unauthenticated
      socket.businessId = null;
      socket.isAuthenticated = false;
      next();
    }
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`WebSocket connected: ${socket.id}, authenticated: ${socket.isAuthenticated}`);
    
    // Join business room (for authenticated admins)
    socket.on('join_business_room', (data) => {
      handlers.joinBusinessRoom(socket, data);
    });
    
    // Leave business room
    socket.on('leave_business_room', (data) => {
      handlers.leaveBusinessRoom(socket, data);
    });
    
    // Subscribe to public business updates (for customers)
    socket.on('subscribe_business', (data) => {
      handlers.subscribeToBusinessPublic(socket, data);
    });
    
    // Unsubscribe from public business updates
    socket.on('unsubscribe_business', (data) => {
      handlers.unsubscribeFromBusinessPublic(socket, data);
    });
    
    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
    
    // Disconnect handler
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket disconnected: ${socket.id}, reason: ${reason}`);
    });
    
    // Error handler
    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${socket.id}:`, error);
    });
  });
  
  logger.info('WebSocket server initialized');
  
  return io;
};

/**
 * Get Socket.io instance
 * @returns {Object} Socket.io server instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Broadcast event to a business room
 * @param {string} businessId - Business ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const broadcastToBusiness = (businessId, event, data) => {
  if (!io) return;
  io.to(`business:${businessId}`).emit(event, data);
};

/**
 * Broadcast to public business subscribers
 * @param {string} businessId - Business ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const broadcastToBusinessPublic = (businessId, event, data) => {
  if (!io) return;
  io.to(`business:${businessId}:public`).emit(event, data);
};

module.exports = {
  setupWebSocket,
  getIO,
  broadcastToBusiness,
  broadcastToBusinessPublic
};
