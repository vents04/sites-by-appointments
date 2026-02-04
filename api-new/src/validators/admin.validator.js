/**
 * Admin Validators (Zod schemas)
 */

const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

// Create business schema
const createBusinessSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, underscores, and hyphens')
    .optional(), // Optional - will be generated if not provided
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  adminPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
  defaultLanguage: z.enum(['bg', 'en']).optional(),
  currency: z.enum(['EUR', 'BGN', 'USD']).optional()
});

// Update business schema
const updateBusinessSchema = z.object({
  code: z.string()
    .min(3)
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/)
    .optional(),
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
  minHoursBeforeCancellation: z.number().min(0).max(168).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional()
});

// Reset password schema
const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters')
});

// Query schemas
const listBusinessesQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended', 'deleted']).optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(val => parseInt(val, 10) || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val, 10) || 50, 100))
});

const idParamsSchema = z.object({
  id: objectIdSchema
});

module.exports = {
  createBusinessSchema,
  updateBusinessSchema,
  resetPasswordSchema,
  listBusinessesQuerySchema,
  idParamsSchema
};
