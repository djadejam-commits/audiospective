// src/lib/logger.ts
import pino from 'pino';

/**
 * Structured Logger using Pino
 *
 * Features:
 * - Structured JSON logs in production
 * - Pretty-printed logs in development
 * - Request ID tracking for distributed tracing
 * - Multiple log levels (trace, debug, info, warn, error, fatal)
 * - Automatic error serialization
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User signed in', { userId: '123' });
 * logger.error({ err: error }, 'Failed to archive user');
 * logger.child({ requestId: '456' }).info('Processing request');
 * ```
 */

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Base logger configuration
const baseConfig: pino.LoggerOptions = {
  level: logLevel,

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Add timestamp to all logs
  timestamp: pino.stdTimeFunctions.isoTime,

  // Base fields for all logs
  base: {
    env: process.env.NODE_ENV,
    service: 'audiospective',
  },
};

// Create logger with environment-specific configuration
// Note: In development, we use simple console output to avoid worker thread issues with HMR
export const logger = process.env.NODE_ENV === 'development'
  ? pino({
      ...baseConfig,
      transport: {
        target: 'pino/file',
        options: { destination: 1 }, // stdout
      },
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
    })
  : pino(baseConfig);

/**
 * Create a child logger with additional context
 *
 * @example
 * ```typescript
 * const requestLogger = createLogger({ requestId: req.headers['x-request-id'] });
 * requestLogger.info('Processing request');
 * ```
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Create a logger with request context
 *
 * @example
 * ```typescript
 * const requestLogger = withRequestId(req);
 * requestLogger.info('User authenticated');
 * ```
 */
export function withRequestId(requestId?: string) {
  return logger.child({
    requestId: requestId || generateRequestId(),
  });
}

/**
 * Generate a simple request ID (for development)
 * In production, use request IDs from load balancer or middleware
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log levels (from least to most severe):
 * - trace: Very detailed debugging info
 * - debug: Debugging info
 * - info: General informational messages
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Fatal errors (application crash)
 */

// Re-export for convenience
export default logger;
