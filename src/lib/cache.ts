// src/lib/cache.ts
import { redis } from './redis';
import { hasRedis } from '@/config/env';

/**
 * Cache Service
 *
 * Provides caching utilities with automatic fallback when Redis is not configured.
 * All cache operations are fail-safe - if Redis is unavailable, operations continue
 * without caching rather than crashing.
 *
 * Features:
 * - Automatic JSON serialization
 * - TTL support
 * - Graceful degradation
 * - Type-safe get/set
 */

/**
 * Cache key prefixes for organization and easy invalidation
 */
export const CACHE_PREFIX = {
  STATS: 'stats:',
  TOP_TRACKS: 'top_tracks:',
  TOP_ARTISTS: 'top_artists:',
  USER_ACTIVITY: 'user_activity:',
  GENRES: 'genres:',
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 * Based on 14-DAY-PRODUCTION-PLAN Day 9 requirements
 */
export const CACHE_TTL = {
  STATS: 60 * 60, // 1 hour - user stats
  TOP_TRACKS: 60 * 60, // 1 hour - top tracks
  TOP_ARTISTS: 60 * 60, // 1 hour - top artists
  GENRES: 6 * 60 * 60, // 6 hours - genre breakdown (changes infrequently)
  USER_ACTIVITY: 60 * 60, // 1 hour - activity data
  HEALTH: 30, // 30 seconds - health check
} as const;

/**
 * Get a cached value
 * Returns null if not found or if Redis is not configured
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!hasRedis) {
    return null; // Graceful degradation
  }

  try {
    const cached = await redis.get<string>(key);

    if (!cached) {
      return null;
    }

    // Parse JSON
    return JSON.parse(cached) as T;
  } catch (error) {
    // Log but don't crash
    console.error(`[Cache] Failed to get key "${key}":`, error);
    return null;
  }
}

/**
 * Set a cached value with TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  if (!hasRedis) {
    return; // Graceful degradation
  }

  try {
    // Serialize to JSON
    const serialized = JSON.stringify(value);

    // Set with TTL
    await redis.set(key, serialized, { ex: ttlSeconds });
  } catch (error) {
    // Log but don't crash
    console.error(`[Cache] Failed to set key "${key}":`, error);
  }
}

/**
 * Delete a cached value or pattern
 */
export async function deleteCached(keyOrPattern: string): Promise<void> {
  if (!hasRedis) {
    return;
  }

  try {
    // If pattern contains wildcard, scan and delete
    if (keyOrPattern.includes('*')) {
      const keys = await redis.keys(keyOrPattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      // Single key delete
      await redis.del(keyOrPattern);
    }
  } catch (error) {
    console.error(`[Cache] Failed to delete key "${keyOrPattern}":`, error);
  }
}

/**
 * Invalidate all cache for a user
 * Useful when user triggers a manual refresh or deletes data
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  if (!hasRedis) {
    return;
  }

  try {
    // Delete all cache keys for this user
    await Promise.all([
      deleteCached(`${CACHE_PREFIX.STATS}${userId}:*`),
      deleteCached(`${CACHE_PREFIX.TOP_TRACKS}${userId}:*`),
      deleteCached(`${CACHE_PREFIX.TOP_ARTISTS}${userId}:*`),
      deleteCached(`${CACHE_PREFIX.USER_ACTIVITY}${userId}:*`),
      deleteCached(`${CACHE_PREFIX.GENRES}${userId}:*`),
    ]);

    console.log(`[Cache] Invalidated all cache for user ${userId}`);
  } catch (error) {
    console.error(`[Cache] Failed to invalidate cache for user ${userId}:`, error);
  }
}

/**
 * Cache-aside pattern: Get from cache, or fetch and cache
 *
 * Usage:
 * ```ts
 * const stats = await getOrSet(
 *   'stats:user123',
 *   () => fetchStatsFromDB(user123),
 *   CACHE_TTL.STATS
 * );
 * ```
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try to get from cache
  const cached = await getCached<T>(key);

  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  const data = await fetcher();

  // Store in cache for next time (fire-and-forget to not slow down response)
  setCached(key, data, ttlSeconds).catch((error) => {
    console.error(`[Cache] Failed to cache key "${key}":`, error);
  });

  return data;
}

/**
 * Check if Redis is healthy
 */
export async function checkCacheHealth(): Promise<boolean> {
  if (!hasRedis) {
    return false;
  }

  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('[Cache] Health check failed:', error);
    return false;
  }
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  keyCount?: number;
} | null> {
  if (!hasRedis) {
    return { connected: false };
  }

  try {
    // Get all keys matching our prefixes
    const allKeys = await redis.keys('*');

    return {
      connected: true,
      keyCount: allKeys.length,
    };
  } catch (error) {
    console.error('[Cache] Failed to get cache stats:', error);
    return { connected: false };
  }
}
