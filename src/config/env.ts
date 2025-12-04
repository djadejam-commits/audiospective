// src/config/env.ts
import { z } from 'zod';

/**
 * Environment Variable Validation
 *
 * This file validates all required environment variables at startup.
 * If any required variable is missing or invalid, the app crashes immediately
 * with a clear error message rather than failing mysteriously later.
 *
 * Benefits:
 * - Fail fast: Catch config errors before deployment
 * - Type safety: Get TypeScript types for env vars
 * - Clear errors: Know exactly what's wrong
 * - Documentation: Self-documenting config requirements
 */

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('file:'),
      'DATABASE_URL must be a valid PostgreSQL or SQLite connection string'
    ),

  // Spotify OAuth
  SPOTIFY_CLIENT_ID: z
    .string()
    .min(1, 'SPOTIFY_CLIENT_ID is required - Get from https://developer.spotify.com/dashboard'),

  SPOTIFY_CLIENT_SECRET: z
    .string()
    .min(1, 'SPOTIFY_CLIENT_SECRET is required - Get from https://developer.spotify.com/dashboard'),

  // NextAuth
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters - Generate with: openssl rand -base64 32'),

  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL must be a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'NEXTAUTH_URL must start with http:// or https://'
    ),

  // Upstash Redis (Optional - for rate limiting and idempotency)
  UPSTASH_REDIS_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),

  UPSTASH_REDIS_TOKEN: z
    .string()
    .optional()
    .or(z.literal('')),

  // Upstash QStash (Optional - for background jobs)
  QSTASH_TOKEN: z
    .string()
    .optional()
    .or(z.literal('')),

  QSTASH_URL: z
    .string()
    .url()
    .optional()
    .default('https://qstash.upstash.io'),

  QSTASH_CURRENT_SIGNING_KEY: z
    .string()
    .optional()
    .or(z.literal('')),

  QSTASH_NEXT_SIGNING_KEY: z
    .string()
    .optional()
    .or(z.literal('')),

  // Vercel (Optional - for QStash callbacks)
  VERCEL_URL: z
    .string()
    .optional()
    .or(z.literal('')),

  // Cron Secret (Optional - for manual cron triggers)
  CRON_SECRET: z
    .string()
    .optional()
    .or(z.literal('')),

  // Sentry (Optional - for error monitoring)
  NEXT_PUBLIC_SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),

  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z
    .enum(['development', 'staging', 'production'])
    .optional()
    .or(z.literal('')),

  SENTRY_AUTH_TOKEN: z
    .string()
    .optional()
    .or(z.literal('')),

  SENTRY_ORG: z
    .string()
    .optional()
    .or(z.literal('')),

  SENTRY_PROJECT: z
    .string()
    .optional()
    .or(z.literal(''))
});

/**
 * Validate and parse environment variables
 *
 * This runs at import time, so config errors are caught immediately
 * when the app starts.
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      console.error('');

      error.issues.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });

      console.error('');
      console.error('💡 Fix these errors in your .env file, then restart the server.');
      console.error('📖 See .env.example for required variables.');
      console.error('');

      // Crash the app
      process.exit(1);
    }

    throw error;
  }
}

/**
 * Validated environment variables with TypeScript types
 *
 * Usage:
 * ```ts
 * import { env } from '@/config/env';
 *
 * const dbUrl = env.DATABASE_URL; // Type-safe!
 * ```
 */
export const env = validateEnv();

/**
 * Check if optional services are configured
 */
export const hasRedis = !!(env.UPSTASH_REDIS_URL && env.UPSTASH_REDIS_TOKEN);
export const hasQStash = !!(env.QSTASH_TOKEN && env.QSTASH_CURRENT_SIGNING_KEY);
export const hasSentry = !!env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Utility: Get connection info for logging (without exposing secrets)
 */
export function getConnectionInfo() {
  return {
    database: env.DATABASE_URL.includes('postgresql') ? 'PostgreSQL' : 'SQLite',
    redis: hasRedis ? 'Connected' : 'Not configured',
    qstash: hasQStash ? 'Connected' : 'Not configured',
    sentry: hasSentry ? 'Connected' : 'Not configured',
    environment: env.NODE_ENV
  };
}

// Log configuration on startup (development only)
if (env.NODE_ENV === 'development') {
  console.log('');
  console.log('✅ Environment variables validated');
  console.log('📊 Configuration:', getConnectionInfo());
  console.log('');
}
