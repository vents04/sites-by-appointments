/**
 * ICS (iCalendar) Utility Functions
 * RFC 5545 compliant calendar generation
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique UID for iCalendar events
 * @returns {string} UID in format uuid@sitezup.com
 */
const generateUID = () => `${uuidv4()}@sitezup.com`;

/**
 * Format a Date object to iCalendar DATETIME format
 * @param {Date} date - Date object
 * @returns {string} Date in YYYYMMDDTHHmmssZ format
 */
const formatICSDate = (date) => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Format a Date object to iCalendar DATE format (for all-day events)
 * @param {Date} date - Date object
 * @returns {string} Date in YYYYMMDD format
 */
const formatICSDateOnly = (date) => {
  return date.toISOString().split('T')[0].replace(/-/g, '');
};

/**
 * Escape special characters for iCalendar text
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
const escapeICS = (str) => {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
};

/**
 * Fold long lines according to RFC 5545 (max 75 octets per line)
 * @param {string} line - Input line
 * @returns {string} Folded line
 */
const foldLine = (line) => {
  const maxLength = 75;
  if (line.length <= maxLength) return line;
  
  const parts = [];
  let remaining = line;
  
  while (remaining.length > maxLength) {
    parts.push(remaining.substring(0, maxLength));
    remaining = ' ' + remaining.substring(maxLength);
  }
  
  if (remaining) {
    parts.push(remaining);
  }
  
  return parts.join('\r\n');
};

/**
 * Generate a single VEVENT component
 * @param {Object} event - Event data
 * @returns {string} VEVENT component
 */
const generateVEvent = (event) => {
  const lines = ['BEGIN:VEVENT'];
  
  // Required fields
  lines.push(`UID:${event.uid}`);
  lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
  
  // Date/time
  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatICSDateOnly(new Date(event.dtstart))}`);
    lines.push(`DTEND;VALUE=DATE:${formatICSDateOnly(new Date(event.dtend))}`);
  } else {
    lines.push(`DTSTART:${formatICSDate(new Date(event.dtstart))}`);
    lines.push(`DTEND:${formatICSDate(new Date(event.dtend))}`);
  }
  
  // Summary (title)
  if (event.summary) {
    lines.push(foldLine(`SUMMARY:${escapeICS(event.summary)}`));
  }
  
  // Description
  if (event.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeICS(event.description)}`));
  }
  
  // Location
  if (event.location) {
    lines.push(foldLine(`LOCATION:${escapeICS(event.location)}`));
  }
  
  // Recurrence rule
  if (event.rrule) {
    lines.push(`RRULE:${event.rrule}`);
  }
  
  // Sequence (modification counter)
  lines.push(`SEQUENCE:${event.sequence || 0}`);
  
  // Status
  const statusMap = {
    'confirmed': 'CONFIRMED',
    'pending': 'TENTATIVE',
    'cancelled': 'CANCELLED',
    'completed': 'CONFIRMED'
  };
  lines.push(`STATUS:${statusMap[event.status] || 'CONFIRMED'}`);
  
  // Categories
  if (event.type) {
    lines.push(`CATEGORIES:${event.type.toUpperCase()}`);
  }
  
  // Created/Last Modified
  if (event.createdAt) {
    lines.push(`CREATED:${formatICSDate(new Date(event.createdAt))}`);
  }
  if (event.updatedAt) {
    lines.push(`LAST-MODIFIED:${formatICSDate(new Date(event.updatedAt))}`);
  }
  
  lines.push('END:VEVENT');
  
  return lines.join('\r\n');
};

/**
 * Generate a complete iCalendar file
 * @param {Array} events - Array of event objects
 * @param {Object} options - Calendar options
 * @returns {string} Complete iCalendar content
 */
const generateICS = (events, options = {}) => {
  const {
    calendarName = 'Appointments',
    prodId = '-//Sites By Appointments//EN',
    timezone = 'UTC'
  } = options;
  
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    `X-WR-TIMEZONE:${timezone}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];
  
  // Add timezone definition (simplified UTC)
  lines.push('BEGIN:VTIMEZONE');
  lines.push('TZID:UTC');
  lines.push('BEGIN:STANDARD');
  lines.push('DTSTART:19700101T000000');
  lines.push('TZOFFSETFROM:+0000');
  lines.push('TZOFFSETTO:+0000');
  lines.push('END:STANDARD');
  lines.push('END:VTIMEZONE');
  
  // Add events
  for (const event of events) {
    lines.push(generateVEvent(event));
  }
  
  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n');
};

/**
 * Generate event description from booking data
 * @param {Object} booking - Booking data
 * @returns {string} Formatted description
 */
const generateBookingDescription = (booking) => {
  const parts = [];
  
  if (booking.service?.name) {
    parts.push(`Service: ${booking.service.name}`);
  }
  
  if (booking.customer?.name) {
    parts.push(`Customer: ${booking.customer.name}`);
  }
  
  if (booking.customer?.phone) {
    parts.push(`Phone: ${booking.customer.phone}`);
  }
  
  if (booking.customer?.email) {
    parts.push(`Email: ${booking.customer.email}`);
  }
  
  if (booking.notes) {
    parts.push(`Notes: ${booking.notes}`);
  }
  
  return parts.join('\n');
};

/**
 * Generate event summary from booking data
 * @param {Object} booking - Booking data
 * @returns {string} Formatted summary
 */
const generateBookingSummary = (booking) => {
  const parts = [];
  
  if (booking.service?.name) {
    parts.push(booking.service.name);
  }
  
  if (booking.customer?.name) {
    parts.push(booking.customer.name);
  }
  
  return parts.join(' - ') || 'Appointment';
};

module.exports = {
  generateUID,
  formatICSDate,
  formatICSDateOnly,
  escapeICS,
  foldLine,
  generateVEvent,
  generateICS,
  generateBookingDescription,
  generateBookingSummary
};
