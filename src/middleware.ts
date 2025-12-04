// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, applyStrictRateLimit } from './middleware/rate-limit';

/**
 * Next.js Edge Middleware
 *
 * Runs before every request. Perfect for:
 * - Rate limiting
 * - Authentication checks
 * - Request logging
 * - Header manipulation
 *
 * This middleware applies rate limiting to all /api/* routes.
 */

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Skip rate limiting for health check (monitoring tools need unrestricted access)
    if (pathname === '/api/health') {
      return NextResponse.next();
    }

    // Strict rate limits for expensive operations
    if (
      pathname.startsWith('/api/test-archive') || // Manual archival
      pathname.startsWith('/api/export') || // Large data exports
      pathname.startsWith('/api/share') // Share report creation
    ) {
      const rateLimitResponse = await applyStrictRateLimit(req);
      if (rateLimitResponse) return rateLimitResponse;
    } else {
      // Normal rate limits for other API routes
      const rateLimitResponse = await applyRateLimit(req);
      if (rateLimitResponse) return rateLimitResponse;
    }
  }

  // Continue with the request
  return NextResponse.next();
}

/**
 * Matcher configuration
 *
 * Specifies which paths this middleware should run on.
 * Using a matcher improves performance by avoiding unnecessary middleware execution.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
