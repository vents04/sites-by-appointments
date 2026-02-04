/**
 * ICS Service
 * Handles .ics file generation and calendar exports
 */

const Event = require('../models/Event');
const Business = require('../models/Business');
const { generateICS, generateUID } = require('../utils/ics.utils');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Export events as .ics file content
 * @param {string} businessId - Business ID
 * @param {Object} options - Export options
 * @returns {string} ICS file content
 */
const exportEvents = async (businessId, options = {}) => {
  const { startDate, endDate, employeeId, includeBlocks = true } = options;
  
  // Get business
  const business = await Business.findById(businessId);
  if (!business) {
    throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
  }
  
  // Build query
  const filter = {
    businessId,
    status: { $nin: ['cancelled'] }
  };
  
  if (startDate) {
    filter.dtstart = { $gte: new Date(startDate) };
  }
  
  if (endDate) {
    filter.dtend = { ...filter.dtend, $lte: new Date(endDate) };
  }
  
  if (employeeId) {
    filter.employeeId = employeeId;
  }
  
  if (!includeBlocks) {
    filter.type = 'booking';
  }
  
  // Get events
  const events = await Event.find(filter)
    .populate('employeeId', 'name')
    .populate('serviceId', 'name')
    .sort({ dtstart: 1 });
  
  // Format events for ICS
  const icsEvents = events.map(event => ({
    uid: event.uid,
    dtstart: event.dtstart,
    dtend: event.dtend,
    allDay: event.allDay,
    summary: event.summary || formatEventSummary(event),
    description: event.description || formatEventDescription(event),
    location: event.locationId?.formattedAddress,
    status: event.status,
    type: event.type,
    sequence: event.sequence,
    rrule: event.rrule,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
  }));
  
  // Generate ICS content
  const icsContent = generateICS(icsEvents, {
    calendarName: business.name,
    timezone: business.timezone
  });
  
  logger.info(`Exported ${events.length} events for business ${business.code}`);
  
  return icsContent;
};

/**
 * Export single event as .ics
 * @param {string} eventId - Event ID
 * @returns {string} ICS file content
 */
const exportSingleEvent = async (eventId) => {
  const event = await Event.findById(eventId)
    .populate('businessId', 'name timezone')
    .populate('employeeId', 'name')
    .populate('serviceId', 'name')
    .populate('locationId', 'name address');
  
  if (!event) {
    throw new NotFoundError('EVENT_NOT_FOUND', 'Event not found');
  }
  
  const icsEvents = [{
    uid: event.uid,
    dtstart: event.dtstart,
    dtend: event.dtend,
    allDay: event.allDay,
    summary: event.summary || formatEventSummary(event),
    description: event.description || formatEventDescription(event),
    location: event.locationId?.formattedAddress,
    status: event.status,
    type: event.type,
    sequence: event.sequence,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
  }];
  
  return generateICS(icsEvents, {
    calendarName: event.businessId?.name || 'Appointment',
    timezone: event.businessId?.timezone || 'UTC'
  });
};

/**
 * Export events for a specific employee
 * @param {string} businessId - Business ID
 * @param {string} employeeId - Employee ID
 * @param {Object} options - Date range options
 * @returns {string} ICS file content
 */
const exportEmployeeCalendar = async (businessId, employeeId, options = {}) => {
  return exportEvents(businessId, { ...options, employeeId });
};

/**
 * Format event summary for ICS
 * @param {Object} event - Event document
 * @returns {string} Summary string
 */
const formatEventSummary = (event) => {
  if (event.type === 'booking') {
    const parts = [];
    if (event.serviceSnapshot?.name || event.serviceId?.name) {
      parts.push(event.serviceSnapshot?.name || event.serviceId?.name);
    }
    if (event.customerSnapshot?.name) {
      parts.push(event.customerSnapshot.name);
    }
    return parts.join(' - ') || 'Booking';
  }
  
  if (event.type === 'block') return 'Blocked';
  if (event.type === 'break') return 'Break';
  if (event.type === 'holiday') return 'Holiday';
  
  return event.summary || 'Event';
};

/**
 * Format event description for ICS
 * @param {Object} event - Event document
 * @returns {string} Description string
 */
const formatEventDescription = (event) => {
  if (event.type !== 'booking') {
    return event.description || '';
  }
  
  const lines = [];
  
  if (event.serviceSnapshot?.name || event.serviceId?.name) {
    lines.push(`Service: ${event.serviceSnapshot?.name || event.serviceId?.name}`);
  }
  
  if (event.customerSnapshot?.name) {
    lines.push(`Customer: ${event.customerSnapshot.name}`);
  }
  
  if (event.customerSnapshot?.phone) {
    lines.push(`Phone: ${event.customerSnapshot.phone}`);
  }
  
  if (event.customerSnapshot?.email) {
    lines.push(`Email: ${event.customerSnapshot.email}`);
  }
  
  if (event.employeeId?.name) {
    lines.push(`Employee: ${event.employeeId.name}`);
  }
  
  if (event.notes) {
    lines.push(`Notes: ${event.notes}`);
  }
  
  return lines.join('\n');
};

/**
 * Generate a booking confirmation .ics attachment
 * @param {Object} booking - Booking event
 * @param {Object} business - Business document
 * @returns {Object} Attachment object { filename, content, contentType }
 */
const generateBookingAttachment = (booking, business) => {
  const icsEvents = [{
    uid: booking.uid,
    dtstart: booking.dtstart,
    dtend: booking.dtend,
    summary: formatEventSummary(booking),
    description: formatEventDescription(booking),
    location: booking.locationId?.formattedAddress,
    status: 'confirmed',
    type: 'booking',
    sequence: 0
  }];
  
  const content = generateICS(icsEvents, {
    calendarName: business.name,
    timezone: business.timezone
  });
  
  return {
    filename: 'appointment.ics',
    content: Buffer.from(content, 'utf-8'),
    contentType: 'text/calendar; charset=utf-8'
  };
};

module.exports = {
  exportEvents,
  exportSingleEvent,
  exportEmployeeCalendar,
  formatEventSummary,
  formatEventDescription,
  generateBookingAttachment
};
