// instrumentation-client.ts
// This file configures Sentry for the browser (client-side)
// Next.js automatically loads this file for client-side code
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

/**
 * Initialize Sentry for client-side error tracking
 *
 * Tracks:
 * - Unhandled exceptions
 * - Promise rejections
 * - Console errors
 * - User interactions (breadcrumbs)
 */
Sentry.init({
  dsn: SENTRY_DSN,

  // Environment (development, staging, production)
  environment: SENTRY_ENVIRONMENT,

  // Sample rate for performance monitoring
  // 1.0 = 100% of transactions sent to Sentry
  // Reduce in production to save quota: 0.1 = 10%
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Only send errors in production and staging
  enabled: SENTRY_ENVIRONMENT !== 'development',

  // Automatically capture console.error() calls
  integrations: [
    Sentry.browserTracingIntegration({
      // Track navigation and page loads
      traceFetch: true,
      traceXHR: true,
    }),
    Sentry.replayIntegration({
      // Session Replay: Record user sessions when errors occur
      // Helps debug by showing what user did before error
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Session Replay sampling rates
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Filter out sensitive data
  beforeSend(event, _hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Remove sensitive query params
    if (event.request?.query_string && typeof event.request.query_string === 'string') {
      event.request.query_string = event.request.query_string
        .replace(/token=[^&]+/gi, 'token=[REDACTED]')
        .replace(/secret=[^&]+/gi, 'secret=[REDACTED]');
    }

    return event;
  },

  // Ignore common browser errors
  ignoreErrors: [
    // Network errors (user's internet, not our problem)
    'NetworkError',
    'Network request failed',
    'Failed to fetch',

    // Browser extension errors
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',

    // Canceled requests (user navigated away)
    'AbortError',
    'Request aborted',
  ],
});

/**
 * Router transition tracking
 *
 * Captures navigation events for better performance monitoring
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
