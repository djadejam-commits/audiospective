// src/lib/idempotency.ts
import { redis } from './redis';

/**
 * Generates an idempotency key for archival jobs
 * Format: archive_{userId}_{YYYY_MM_DD_HH}
 *
 * This ensures each user is processed at most once per hour
 */
export function generateIdempotencyKey(
  userId: string,
  date: Date = new Date()
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');

  const dateStr = `${year}_${month}_${day}_${hour}`;
  return `archive_${userId}_${dateStr}`;
}

/**
 * Checks if a job has already been completed
 */
export async function isJobComplete(key: string): Promise<boolean> {
  const completed = await redis.get(key);
  return completed === 'true';
}

/**
 * Marks a job as complete with 24-hour TTL
 * Jobs older than 24 hours can be re-run if needed
 */
export async function markJobComplete(key: string): Promise<void> {
  // 24-hour TTL (86400 seconds)
  await redis.set(key, 'true', { ex: 86400 });
}

/**
 * Tracks rate limit information for a user
 */
export async function trackRateLimit(
  userId: string,
  retryAfter: number
): Promise<void> {
  await redis.set(
    `rate_limit:${userId}`,
    Date.now() + (retryAfter * 1000),
    { ex: retryAfter }
  );

  // Increment daily counter for monitoring
  await redis.incr('rate_limit:daily_count');
}

/**
 * Checks if a user is currently rate limited
 */
export async function isRateLimited(userId: string): Promise<boolean> {
  const limitUntil = await redis.get(`rate_limit:${userId}`);
  if (!limitUntil) return false;

  return Date.now() < parseInt(limitUntil as string);
}
