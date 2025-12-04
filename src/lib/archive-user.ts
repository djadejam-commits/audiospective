// src/lib/archive-user.ts
import { prisma } from './prisma';
import { ensureFreshToken } from './ensure-fresh-token';
import { getRecentlyPlayed, getArtists } from './spotify-api';
import { upsertTrack, createPlayEvent, upsertArtist } from './metadata-upsert';
import { generateIdempotencyKey, isJobComplete, markJobComplete } from './idempotency';
import { recordSuccess, recordFailure } from './circuit-breaker';
import { SpotifyAPIError } from './spotify-api';

export interface ArchiveResult {
  status: 'success' | 'skipped' | 'failed';
  songsArchived?: number;
  reason?: string;
  error?: string;
}

/**
 * Archives a user's recently played tracks
 * - Checks idempotency to prevent duplicate work
 * - Ensures token is fresh via JIT refresh
 * - Fetches recently played tracks from Spotify
 * - Upserts metadata and creates play events
 * - Handles failures with circuit breaker tracking
 */
export async function archiveUser(userId: string): Promise<ArchiveResult> {
  try {
    // Check idempotency - skip if already processed this hour
    // (Skip idempotency check if Redis is not configured - for testing)
    if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
      const idempotencyKey = generateIdempotencyKey(userId);
      if (await isJobComplete(idempotencyKey)) {
        console.log(`[Archive] Job ${idempotencyKey} already completed, skipping`);
        return { status: 'skipped', reason: 'already_completed' };
      }
    } else {
      console.warn('[Archive] Redis not configured - skipping idempotency check');
    }

    // Ensure token is fresh (JIT refresh)
    const { accessToken } = await ensureFreshToken(userId);

    // Fetch recently played tracks (up to 50)
    const recentlyPlayed = await getRecentlyPlayed(accessToken, 50);

    if (!recentlyPlayed.items || recentlyPlayed.items.length === 0) {
      console.log(`[Archive] No tracks found for user ${userId}`);
      if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
        const idempotencyKey = generateIdempotencyKey(userId);
        await markJobComplete(idempotencyKey);
      }
      await recordSuccess(prisma, userId);
      return { status: 'success', songsArchived: 0 };
    }

    // Collect unique artist IDs from all tracks
    const uniqueArtistIds = Array.from(
      new Set(
        recentlyPlayed.items.flatMap(item =>
          item.track.artists.map(artist => artist.id)
        )
      )
    );

    // Fetch full artist details with genres (in batches of 50)
    console.log(`[Archive] Fetching details for ${uniqueArtistIds.length} unique artists`);
    const artistsWithGenres = await getArtists(accessToken, uniqueArtistIds);

    // Create a map for quick lookup
    const artistDetailsMap = new Map(
      artistsWithGenres.map(artist => [artist.id, artist])
    );

    // Upsert artists with their genres BEFORE processing tracks
    for (const artistDetails of artistsWithGenres) {
      try {
        await upsertArtist({
          id: artistDetails.id,
          name: artistDetails.name,
          genres: artistDetails.genres
        });
      } catch (error) {
        console.error(`[Archive] Failed to upsert artist ${artistDetails.id}:`, error);
      }
    }

    // Process each track
    let archived = 0;
    for (const item of recentlyPlayed.items) {
      try {
        // Upsert track metadata (album, artists, track)
        // Artists already have genres from above
        await upsertTrack(item.track);

        // Create play event (will skip if duplicate)
        const playEvent = await createPlayEvent(
          userId,
          item.track.id,
          item.played_at
        );

        if (playEvent) {
          archived++;
        }
      } catch (error) {
        // Log but don't fail the entire job for individual track errors
        console.error(`[Archive] Failed to process track ${item.track.id}:`, error);
      }
    }

    // Mark job complete (if Redis is configured)
    if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
      const idempotencyKey = generateIdempotencyKey(userId);
      await markJobComplete(idempotencyKey);
    }

    // Update user's last polled timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { lastPolledAt: new Date() }
    });

    // Record success (resets failure tracking)
    await recordSuccess(prisma, userId);

    console.log(`[Archive] Successfully archived ${archived} tracks for user ${userId}`);

    return {
      status: 'success',
      songsArchived: archived
    };

  } catch (error: any) {
    // Determine failure type
    let failureType: 'AUTH' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN';

    if (error instanceof SpotifyAPIError) {
      if (error.statusCode === 401) {
        failureType = 'AUTH';
      } else if (error.statusCode === 429 || error.statusCode >= 500) {
        failureType = 'NETWORK';
      }
    }

    // Record failure for circuit breaker
    await recordFailure(prisma, userId, failureType);

    console.error(`[Archive] Failed to archive user ${userId} (${failureType}):`, error);

    return {
      status: 'failed',
      reason: failureType,
      error: error.message || 'Unknown error'
    };
  }
}
