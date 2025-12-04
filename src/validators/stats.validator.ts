// src/validators/stats.validator.ts
import { z } from 'zod';

/**
 * Validation schemas for Stats/Analytics APIs
 *
 * Protects against:
 * - Invalid date ranges
 * - SQL injection via malformed input
 */

export const statsQuerySchema = z.object({
  range: z
    .enum(['today', '7d', '30d', 'all'], {
      errorMap: () => ({ message: 'Invalid date range. Must be: today, 7d, 30d, or all' })
    })
    .default('7d'),

  userId: z
    .string()
    .uuid('Invalid user ID format')
    .optional() // Only used internally, not from user input
});

export const dateRangeSchema = z.object({
  startDate: z
    .string()
    .datetime('Invalid start date format. Must be ISO 8601')
    .optional(),

  endDate: z
    .string()
    .datetime('Invalid end date format. Must be ISO 8601')
    .optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  { message: 'Start date must be before end date' }
);

// Type exports for TypeScript
export type StatsQueryInput = z.infer<typeof statsQuerySchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
