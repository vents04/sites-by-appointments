/**
 * Business Validators (Zod schemas)
 */

const { z } = require('zod');

// Common schemas
const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

const timeSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)');

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional();

// Business profile update
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional().nullable(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional().nullable(),
  socialMedia: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional()
  }).optional(),
  defaultLanguage: z.enum(['bg', 'en']).optional(),
  currency: z.enum(['EUR', 'BGN', 'USD']).optional(),
  timezone: z.string().optional(),
  slotDuration: z.number().min(5).max(480).optional(),
  maxDaysInAdvance: z.number().min(1).max(365).optional(),
  minHoursBeforeBooking: z.number().min(0).max(168).optional(),
  minHoursBeforeCancellation: z.number().min(0).max(168).optional()
});

// Employee schemas
const createEmployeeSchema = z.object({
  name: z.string().min(1).max(100),
  color: colorSchema,
  avatar: z.string().url().optional().nullable(),
  services: z.array(objectIdSchema).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  sortOrder: z.number().optional()
});

const updateEmployeeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: colorSchema,
  avatar: z.string().url().optional().nullable(),
  services: z.array(objectIdSchema).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  sortOrder: z.number().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

// Service schemas
const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  currency: z.enum(['EUR', 'BGN', 'USD']).optional(),
  duration: z.number().min(5).max(480),
  bufferAfter: z.number().min(0).max(60).optional(),
  category: z.string().max(50).optional(),
  image: z.string().url().optional().nullable(),
  sortOrder: z.number().optional()
});

const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0).optional(),
  currency: z.enum(['EUR', 'BGN', 'USD']).optional(),
  duration: z.number().min(5).max(480).optional(),
  bufferAfter: z.number().min(0).max(60).optional(),
  category: z.string().max(50).optional(),
  image: z.string().url().optional().nullable(),
  sortOrder: z.number().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

// Location schemas
const timeRangeSchema = z.object({
  open: timeSchema,
  close: timeSchema
});

const workingHoursSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  ranges: z.array(timeRangeSchema),
  isClosed: z.boolean().optional()
});

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional()
});

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: addressSchema.optional(),
  coordinates: coordinatesSchema.optional(),
  phone: z.string().max(20).optional(),
  employees: z.array(objectIdSchema).optional(),
  workingHours: z.array(workingHoursSchema).optional(),
  timezone: z.string().optional(),
  isPrimary: z.boolean().optional()
});

const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: addressSchema.optional(),
  coordinates: coordinatesSchema.optional(),
  phone: z.string().max(20).optional(),
  employees: z.array(objectIdSchema).optional(),
  workingHours: z.array(workingHoursSchema).optional(),
  timezone: z.string().optional(),
  isPrimary: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

// Customer schemas
const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  preferredLanguage: z.enum(['bg', 'en']).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['active', 'blocked']).optional()
});

// Query schemas
const paginationQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val, 10) || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val, 10) || 50, 100)),
  search: z.string().optional()
});

const idParamsSchema = z.object({
  id: objectIdSchema
});

module.exports = {
  updateProfileSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  createServiceSchema,
  updateServiceSchema,
  createLocationSchema,
  updateLocationSchema,
  updateCustomerSchema,
  paginationQuerySchema,
  idParamsSchema,
  objectIdSchema
};
