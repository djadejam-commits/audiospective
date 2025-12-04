// src/validators/share.validator.ts
import { z } from 'zod';

/**
 * Validation schemas for Share API
 *
 * Protects against:
 * - XSS attacks (via string length limits)
 * - Invalid date ranges
 * - Malformed input
 */

export const createShareSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),

  dateRange: z
    .enum(['today', '7d', '30d', 'all'], {
      errorMap: () => ({ message: 'Invalid date range. Must be: today, 7d, 30d, or all' })
    })
    .default('all')
});

export const getShareSchema = z.object({
  id: z
    .string()
    .min(1, 'Share ID is required')
    .max(100, 'Invalid share ID')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid share ID format')
});

// Type exports for TypeScript
export type CreateShareInput = z.infer<typeof createShareSchema>;
export type GetShareInput = z.infer<typeof getShareSchema>;
