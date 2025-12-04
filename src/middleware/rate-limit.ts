// src/middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate Limiting Configuration
 *
 * Uses Upstash Redis for distributed rate limiting.
 * Sliding window algorithm ensures fair distribution.
 *
 * Default: 10 requests per 10 seconds per IP address
 *
 * Security Note: This prevents:
 * - API abuse
 * - DoS attacks
 * - Spotify API quota exhaustion
 */

// Initialize rate limiter (only if Redis is configured)
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
    analytics: true, // Track usage for monitoring
    prefix: 'ratelimit' // Redis key prefix
  });
} else {
  console.warn('[Rate Limit] Redis not configured - rate limiting disabled in development');
}

/**
 * Rate Limiting Middleware
 *
 * Applies to all /api/* routes.
 * Returns 429 Too Many Requests if limit exceeded.
 *
 * @param req - Next.js request object
 * @returns null if allowed, NextResponse with 429 if rate limited
 */
export async function applyRateLimit(req: NextRequest): Promise<NextResponse | null> {
  // Skip rate limiting if Redis not configured (development mode)
  if (!ratelimit) {
    return null;
  }

  try {
    // Get identifier (prefer IP, fallback to anonymous)
    const identifier = req.ip
      ?? req.headers.get('x-forwarded-for')
      ?? req.headers.get('x-real-ip')
      ?? 'anonymous';

    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

    // Add rate limit headers to response (for client debugging)
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', limit.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

    if (!success) {
      // Rate limit exceeded
      console.warn(`[Rate Limit] Blocked request from ${identifier}`);

      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            ...Object.fromEntries(headers.entries())
          }
        }
      );
    }

    // Rate limit not exceeded, allow request
    return null;

  } catch (error) {
    // Don't fail requests if rate limiting breaks
    console.error('[Rate Limit] Error checking rate limit:', error);
    return null; // Allow request through on error
  }
}

/**
 * Custom rate limits for specific endpoints
 */

// Stricter limit for expensive operations
export async function applyStrictRateLimit(req: NextRequest): Promise<NextResponse | null> {
  if (!ratelimit) return null;

  const strictLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '10 s'), // 3 requests per 10 seconds
    analytics: true,
    prefix: 'ratelimit:strict'
  });

  const identifier = req.ip ?? 'anonymous';
  const { success } = await strictLimiter.limit(identifier);

  if (!success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'This endpoint has strict rate limits. Please wait before trying again.'
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}

// More lenient limit for read operations
export async function applyLenientRateLimit(req: NextRequest): Promise<NextResponse | null> {
  if (!ratelimit) return null;

  const lenientLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '10 s'), // 30 requests per 10 seconds
    analytics: true,
    prefix: 'ratelimit:lenient'
  });

  const identifier = req.ip ?? 'anonymous';
  const { success } = await lenientLimiter.limit(identifier);

  if (!success) {
    return new NextResponse(
      JSON.stringify({ error: 'Too Many Requests' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}
