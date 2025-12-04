// src/lib/error-handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import * as Sentry from '@sentry/nextjs';

/**
 * Standard error codes for the application
 */
export enum ErrorCode {
  // Authentication errors (4xx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',

  // Business logic errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
}

/**
 * HTTP status codes mapping
 */
const STATUS_CODE_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  code: ErrorCode;
  message: string;
  details?: unknown;
  timestamp: string;
}

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): ErrorResponse {
  // @ts-expect-error - ZodError has errors property
  const details = (error.errors || []).map((e: { path: Array<string | number>; message: string }) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  return {
    error: 'Validation failed',
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Input validation failed',
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle application errors
 */
function handleAppError(error: AppError): ErrorResponse {
  return {
    error: error.code,
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle unknown errors
 */
function handleUnknownError(error: unknown): ErrorResponse {
  const message = error instanceof Error ? error.message : 'An unknown error occurred';

  return {
    error: ErrorCode.INTERNAL_ERROR,
    code: ErrorCode.INTERNAL_ERROR,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Centralized error handler
 * - Determines error type and creates appropriate response
 * - Logs errors to console
 * - Reports errors to Sentry (for production errors)
 * - Returns standardized NextResponse
 *
 * @param error - The error to handle
 * @param context - Optional context for logging (e.g., endpoint name)
 * @returns NextResponse with error details
 */
export function handleError(error: unknown, context?: string): NextResponse {
  let errorResponse: ErrorResponse;
  let statusCode: number;

  // Determine error type and create response
  if (error instanceof ZodError) {
    errorResponse = handleZodError(error);
    statusCode = STATUS_CODE_MAP[ErrorCode.VALIDATION_ERROR];
  } else if (error instanceof AppError) {
    errorResponse = handleAppError(error);
    statusCode = STATUS_CODE_MAP[error.code];
  } else {
    errorResponse = handleUnknownError(error);
    statusCode = STATUS_CODE_MAP[ErrorCode.INTERNAL_ERROR];
  }

  // Log error to console
  const logPrefix = context ? `[${context}]` : '[Error Handler]';
  console.error(logPrefix, 'Error:', {
    code: errorResponse.code,
    message: errorResponse.message,
    details: errorResponse.details,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Report to Sentry for 5xx errors
  if (statusCode >= 500) {
    Sentry.captureException(error, {
      tags: {
        errorCode: errorResponse.code,
        context: context || 'unknown',
      },
      extra: {
        errorResponse,
      },
    });
  }

  // Return standardized error response
  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Helper function to throw application errors
 *
 * @example
 * throwError(ErrorCode.NOT_FOUND, 'User not found', { userId: 'abc123' })
 */
export function throwError(
  code: ErrorCode,
  message: string,
  details?: unknown
): never {
  throw new AppError(code, message, details);
}

/**
 * Async error wrapper for API routes
 * Catches errors and automatically handles them with handleError
 *
 * @example
 * export const GET = withErrorHandling(async (req) => {
 *   // Your route logic here
 *   return NextResponse.json({ data });
 * }, 'GET /api/users');
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error, context);
    }
  };
}
