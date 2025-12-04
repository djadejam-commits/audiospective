// src/dto/common.dto.ts

/**
 * Standard success response wrapper
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  timestamp: string;
}

/**
 * Helper function to create success responses
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper function to create paginated responses
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Pagination parameters for requests
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 1000;

/**
 * Helper to parse and validate pagination params
 */
export function parsePaginationParams(
  page?: string | null,
  pageSize?: string | null
): { page: number; pageSize: number } {
  const parsedPage = page ? parseInt(page, 10) : DEFAULT_PAGE;
  const parsedPageSize = pageSize ? parseInt(pageSize, 10) : DEFAULT_PAGE_SIZE;

  return {
    page: Math.max(1, parsedPage),
    pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, parsedPageSize)),
  };
}
