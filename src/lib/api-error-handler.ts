// src/lib/api-error-handler.ts
/**
 * Centralized API Error Handler
 *
 * Provides consistent error handling across all API routes
 * Implements best practices from deferred optimizations
 *
 * Benefits:
 * - Consistent error response format
 * - Automatic error logging to Sentry
 * - Type-safe error responses
 * - HTTP status code standardization
 */

import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
  details?: unknown;
}

/**
 * Error types with corresponding HTTP status codes
 */
export enum ErrorType {
  // Client Errors (4xx)
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE = 422,
  TOO_MANY_REQUESTS = 429,

  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Custom API Error class with built-in status codes
 */
export class APIError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = ErrorType.INTERNAL_SERVER_ERROR,
    code?: string,
    details?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error factory functions
 */
export const Errors = {
  unauthorized(message: string = 'Not authenticated', code?: string) {
    return new APIError(message, ErrorType.UNAUTHORIZED, code || 'UNAUTHORIZED');
  },

  forbidden(message: string = 'Access denied', code?: string) {
    return new APIError(message, ErrorType.FORBIDDEN, code || 'FORBIDDEN');
  },

  notFound(resource: string = 'Resource', code?: string) {
    return new APIError(`${resource} not found`, ErrorType.NOT_FOUND, code || 'NOT_FOUND');
  },

  badRequest(message: string, code?: string, details?: unknown) {
    return new APIError(message, ErrorType.BAD_REQUEST, code || 'BAD_REQUEST', details);
  },

  conflict(message: string, code?: string) {
    return new APIError(message, ErrorType.CONFLICT, code || 'CONFLICT');
  },

  rateLimit(message: string = 'Rate limit exceeded') {
    return new APIError(message, ErrorType.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
  },

  internal(message: string = 'Internal server error', details?: unknown) {
    return new APIError(
      message,
      ErrorType.INTERNAL_SERVER_ERROR,
      'INTERNAL_SERVER_ERROR',
      details,
      false // Non-operational errors should be logged
    );
  },

  notImplemented(message: string = 'Feature not implemented') {
    return new APIError(message, ErrorType.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED');
  },

  serviceUnavailable(message: string = 'Service temporarily unavailable') {
    return new APIError(message, ErrorType.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  },
};

/**
 * Handle errors in API routes
 *
 * Usage:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   try {
 *     // ... your code
 *   } catch (error) {
 *     return handleAPIError(error, 'Stats API');
 *   }
 * }
 * ```
 */
export function handleAPIError(
  error: unknown,
  context?: string
): NextResponse<ErrorResponse> {
  // If it's already an APIError, use it
  if (error instanceof APIError) {
    // Log non-operational errors to Sentry
    if (!error.isOperational) {
      Sentry.captureException(error, {
        tags: {
          error_type: 'api_error',
          operational: 'false',
          context: context || 'unknown'
        },
        extra: {
          code: error.code,
          details: error.details
        }
      });
    }

    const response: ErrorResponse = {
      error: error.message,
      code: error.code
    };

    // Only include details in development
    if (process.env.NODE_ENV === 'development' && error.details) {
      response.details = error.details;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Log unknown errors to Sentry
    Sentry.captureException(error, {
      tags: {
        error_type: 'unhandled_error',
        context: context || 'unknown'
      }
    });

    console.error(`[${context || 'API'}] Error:`, error);

    const response: ErrorResponse = {
      error: 'Internal server error',
      message: error.message
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.details = {
        stack: error.stack
      };
    }

    return NextResponse.json(response, { status: ErrorType.INTERNAL_SERVER_ERROR });
  }

  // Handle unknown error types
  Sentry.captureMessage(`Unknown error type in ${context || 'API'}`, {
    level: 'error',
    extra: { error }
  });

  console.error(`[${context || 'API'}] Unknown error:`, error);

  return NextResponse.json(
    {
      error: 'Unknown error occurred',
      message: String(error)
    },
    { status: ErrorType.INTERNAL_SERVER_ERROR }
  );
}

/**
 * Wrap async API route handlers with error handling
 *
 * Usage:
 * ```typescript
 * export const GET = withErrorHandler(async (req: NextRequest) => {
 *   const session = await getServerSession(authOptions);
 *   if (!session) throw Errors.unauthorized();
 *
 *   const data = await fetchData();
 *   return NextResponse.json(data);
 * }, 'Stats API');
 * ```
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleAPIError(error, context);
    }
  };
}

/**
 * Validate request body against a schema
 *
 * Usage:
 * ```typescript
 * const body = await validateRequestBody(req, z.object({
 *   title: z.string(),
 *   dateRange: z.enum(['1d', '7d', '30d', 'all'])
 * }));
 * ```
 */
export async function validateRequestBody<T>(
  req: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      throw Errors.badRequest('Invalid request body', 'VALIDATION_ERROR', error);
    }
    throw Errors.badRequest('Malformed JSON in request body');
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQueryParams<T>(
  url: URL,
  schema: { parse: (data: unknown) => T }
): T {
  try {
    const params = Object.fromEntries(url.searchParams);
    return schema.parse(params);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      throw Errors.badRequest('Invalid query parameters', 'VALIDATION_ERROR', error);
    }
    throw Errors.badRequest('Invalid query parameters');
  }
}

/**
 * Check authentication and return user session
 *
 * Usage:
 * ```typescript
 * const session = await requireAuth();
 * const userId = session.user.id; // TypeScript knows this exists
 * ```
 */
export async function requireAuth() {
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw Errors.unauthorized();
  }

  return session as {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  };
}
