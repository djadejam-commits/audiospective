// instrumentation.ts
// Next.js instrumentation file for Sentry
// This file runs once when the server starts
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

/**
 * Register function - called once when server starts
 *
 * This is the recommended way to initialize Sentry in Next.js 14+
 * Replaces the old sentry.server.config.ts and sentry.edge.config.ts files
 */
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side initialization
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
      enabled: SENTRY_ENVIRONMENT !== 'development',

      integrations: [
        Sentry.prismaIntegration(),
      ],

      beforeSend(event, hint) {
        // Remove sensitive environment variables
        if (event.contexts?.runtime?.env) {
          const env = event.contexts.runtime.env as Record<string, any>;
          delete env.DATABASE_URL;
          delete env.NEXTAUTH_SECRET;
          delete env.SPOTIFY_CLIENT_SECRET;
          delete env.UPSTASH_REDIS_TOKEN;
          delete env.QSTASH_TOKEN;
        }

        // Remove sensitive request data
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }

        return event;
      },

      ignoreErrors: [
        'PrismaClientInitializationError',
        'Too Many Requests',
        'Unauthorized',
        'Invalid credentials',
      ],
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime initialization (middleware)
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
      enabled: SENTRY_ENVIRONMENT !== 'development',

      beforeSend(event, hint) {
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        return event;
      },
    });
  }
}
