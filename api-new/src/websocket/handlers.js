/**
 * WebSocket Event Handlers
 */

const logger = require('../utils/logger');

/**
 * Join a business room (authenticated admins only)
 * @param {Object} socket - Socket instance
 * @param {Object} data - { businessId }
 */
const joinBusinessRoom = (socket, data) => {
  const { businessId } = data || {};
  
  if (!socket.isAuthenticated) {
    socket.emit('error', { 
      code: 'UNAUTHORIZED', 
      message: 'Authentication required to join business room' 
    });
    return;
  }
  
  // Verify the socket's authenticated business matches the requested room
  if (socket.businessId !== businessId) {
    socket.emit('error', { 
      code: 'FORBIDDEN', 
      message: 'Cannot join another business room' 
    });
    return;
  }
  
  const roomName = `business:${businessId}`;
  socket.join(roomName);
  
  logger.info(`Socket ${socket.id} joined room ${roomName}`);
  
  socket.emit('room_joined', { 
    room: roomName, 
    businessId 
  });
};

/**
 * Leave a business room
 * @param {Object} socket - Socket instance
 * @param {Object} data - { businessId }
 */
const leaveBusinessRoom = (socket, data) => {
  const { businessId } = data || {};
  
  if (!businessId) return;
  
  const roomName = `business:${businessId}`;
  socket.leave(roomName);
  
  logger.info(`Socket ${socket.id} left room ${roomName}`);
  
  socket.emit('room_left', { 
    room: roomName, 
    businessId 
  });
};

/**
 * Subscribe to public business updates (for customers)
 * @param {Object} socket - Socket instance
 * @param {Object} data - { businessId }
 */
const subscribeToBusinessPublic = (socket, data) => {
  const { businessId } = data || {};
  
  if (!businessId) {
    socket.emit('error', { 
      code: 'VALIDATION_ERROR', 
      message: 'Business ID is required' 
    });
    return;
  }
  
  const roomName = `business:${businessId}:public`;
  socket.join(roomName);
  
  logger.info(`Socket ${socket.id} subscribed to public room ${roomName}`);
  
  socket.emit('subscribed', { 
    room: roomName, 
    businessId 
  });
};

/**
 * Unsubscribe from public business updates
 * @param {Object} socket - Socket instance
 * @param {Object} data - { businessId }
 */
const unsubscribeFromBusinessPublic = (socket, data) => {
  const { businessId } = data || {};
  
  if (!businessId) return;
  
  const roomName = `business:${businessId}:public`;
  socket.leave(roomName);
  
  logger.info(`Socket ${socket.id} unsubscribed from public room ${roomName}`);
  
  socket.emit('unsubscribed', { 
    room: roomName, 
    businessId 
  });
};

/**
 * Broadcast event created
 * @param {Object} io - Socket.io instance
 * @param {string} businessId - Business ID
 * @param {Object} event - Event data
 */
const emitEventCreated = (io, businessId, event) => {
  // Emit to admin room
  io.to(`business:${businessId}`).emit('event_created', { event });
  
  // If it's a booking, also emit to public room (limited data)
  if (event.type === 'booking') {
    io.to(`business:${businessId}:public`).emit('availability_changed', {
      employeeId: event.employeeId,
      date: event.dtstart
    });
  }
};

/**
 * Broadcast event updated
 * @param {Object} io - Socket.io instance
 * @param {string} businessId - Business ID
 * @param {Object} event - Event data
 */
const emitEventUpdated = (io, businessId, event) => {
  io.to(`business:${businessId}`).emit('event_updated', { event });
  
  if (event.type === 'booking') {
    io.to(`business:${businessId}:public`).emit('availability_changed', {
      employeeId: event.employeeId,
      date: event.dtstart
    });
  }
};

/**
 * Broadcast event deleted
 * @param {Object} io - Socket.io instance
 * @param {string} businessId - Business ID
 * @param {string} eventId - Event ID
 */
const emitEventDeleted = (io, businessId, eventId) => {
  io.to(`business:${businessId}`).emit('event_deleted', { eventId });
  io.to(`business:${businessId}:public`).emit('availability_changed', {});
};

/**
 * Broadcast booking status changed
 * @param {Object} io - Socket.io instance
 * @param {string} businessId - Business ID
 * @param {Object} booking - Booking data
 * @param {string} status - New status
 */
const emitBookingStatusChanged = (io, businessId, booking, status) => {
  io.to(`business:${businessId}`).emit('booking_status_changed', { 
    booking, 
    status 
  });
  
  if (status === 'cancelled') {
    io.to(`business:${businessId}:public`).emit('availability_changed', {
      employeeId: booking.employeeId,
      date: booking.dtstart
    });
  }
};

module.exports = {
  joinBusinessRoom,
  leaveBusinessRoom,
  subscribeToBusinessPublic,
  unsubscribeFromBusinessPublic,
  emitEventCreated,
  emitEventUpdated,
  emitEventDeleted,
  emitBookingStatusChanged
};
