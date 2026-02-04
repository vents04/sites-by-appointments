/**
 * Event Validators (Zod schemas)
 */

const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

const datetimeSchema = z.string().datetime({ message: 'Invalid datetime format' });

// Event query schema
const eventQuerySchema = z.object({
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  employeeId: objectIdSchema.optional(),
  status: z.enum(['confirmed', 'pending', 'cancelled', 'completed', 'no_show']).optional(),
  type: z.enum(['booking', 'block', 'holiday', 'break', 'other']).optional()
});

// Create event schema
const createEventSchema = z.object({
  type: z.enum(['booking', 'block', 'holiday', 'break', 'other']).default('block'),
  employeeId: objectIdSchema,
  serviceId: objectIdSchema.optional(),
  locationId: objectIdSchema.optional(),
  dtstart: datetimeSchema,
  dtend: datetimeSchema.optional(),
  allDay: z.boolean().optional(),
  summary: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(500).optional(),
  rrule: z.string().optional(),
  // For admin-created bookings
  customer: z.object({
    name: z.string().min(1).max(100),
    phone: z.string().min(6).max(20),
    email: z.string().email().optional()
  }).optional()
});

// Update event schema
const updateEventSchema = z.object({
  employeeId: objectIdSchema.optional(),
  dtstart: datetimeSchema.optional(),
  dtend: datetimeSchema.optional(),
  summary: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(['confirmed', 'pending', 'cancelled', 'completed', 'no_show']).optional()
});

// Booking query schema
const bookingQuerySchema = z.object({
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  employeeId: objectIdSchema.optional(),
  status: z.enum(['confirmed', 'pending', 'cancelled', 'completed', 'no_show']).optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(val => parseInt(val, 10) || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val, 10) || 50, 100))
});

// Public booking schema
const createBookingSchema = z.object({
  businessId: objectIdSchema,
  serviceId: objectIdSchema,
  employeeId: objectIdSchema,
  locationId: objectIdSchema.optional(),
  startTime: datetimeSchema,
  customer: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().min(6).max(20),
    email: z.string().email().optional()
  }),
  notes: z.string().max(500).optional()
});

// Cancel booking schema
const cancelBookingSchema = z.object({
  phone: z.string().min(6).max(20),
  reason: z.string().max(500).optional()
});

// Update booking status schema
const updateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show'])
});

// Availability query schema
const availabilityQuerySchema = z.object({
  serviceId: objectIdSchema,
  employeeId: objectIdSchema.optional(),
  locationId: objectIdSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)').optional(),
  days: z.string().optional().transform(val => Math.min(Math.max(parseInt(val, 10) || 7, 1), 30))
});

module.exports = {
  eventQuerySchema,
  createEventSchema,
  updateEventSchema,
  bookingQuerySchema,
  createBookingSchema,
  cancelBookingSchema,
  updateBookingStatusSchema,
  availabilityQuerySchema
};
