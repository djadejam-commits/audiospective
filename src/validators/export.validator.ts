// src/validators/export.validator.ts
import { z } from 'zod';

/**
 * Validation schemas for Export API
 *
 * Protects against:
 * - Invalid format requests
 * - Invalid date ranges
 * - Malformed query parameters
 */

export const exportQuerySchema = z.object({
  format: z.enum(['csv', 'json']),

  range: z.enum(['today', '7d', '30d', 'all']).default('all'),

  limit: z
    .number()
    .int()
    .min(1)
    .max(10000, 'Export limit is 10,000 records')
    .optional()
    .default(10000),
});

// Type exports for TypeScript
export type ExportQueryInput = z.infer<typeof exportQuerySchema>;
