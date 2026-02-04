/**
 * Auth Validators (Zod schemas)
 */

const { z } = require('zod');

const loginSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters')
});

const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .max(100, 'New password cannot exceed 100 characters')
});

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .max(100, 'New password cannot exceed 100 characters')
});

module.exports = {
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema
};
