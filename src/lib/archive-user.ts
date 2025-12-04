// src/lib/archive-user.ts
import { prisma } from './prisma';
import { ensureFreshToken } from './ensure-fresh-token';
import { getRecentlyPlayed, getArtists } from './spotify-api';
import { upsertTrack, createPlayEvent, upsertArtist } from './metadata-upsert';
import { generateIdempotencyKey, isJobComplete, markJobComplete } from './idempotency';
import { recordSuccess, recordFailure } from './circuit-breaker';
import { SpotifyAPIError } from './spotify-api';
import { logger } from './logger';

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
        logger.info({ userId, idempotencyKey }, 'Job already completed, skipping');
        return { status: 'skipped', reason: 'already_completed' };
      }
    } else {
      logger.warn('Redis not configured - skipping idempotency check');
    }

    // Ensure token is fresh (JIT refresh)
    const { accessToken } = await ensureFreshToken(userId);

    // Fetch recently played tracks (up to 50)
    const recentlyPlayed = await getRecentlyPlayed(accessToken, 50);

    if (!recentlyPlayed.items || recentlyPlayed.items.length === 0) {
      logger.info({ userId }, 'No tracks found for user');
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
    logger.debug({ userId, artistCount: uniqueArtistIds.length }, 'Fetching artist details');
    const artistsWithGenres = await getArtists(accessToken, uniqueArtistIds);

    // Upsert artists with their genres BEFORE processing tracks (parallelized for performance)
    logger.debug({ userId, artistCount: artistsWithGenres.length }, 'Upserting artists in parallel');
    const artistUpsertResults = await Promise.allSettled(
      artistsWithGenres.map(artistDetails =>
        upsertArtist({
          id: artistDetails.id,
          name: artistDetails.name,
          genres: artistDetails.genres
        })
      )
    );

    // Log any failures
    const failedArtists = artistUpsertResults.filter(result => result.status === 'rejected');
    if (failedArtists.length > 0) {
      logger.error({
        userId,
        failedCount: failedArtists.length,
        totalCount: artistsWithGenres.length
      }, 'Failed to upsert some artists');
      failedArtists.forEach((result) => {
        if (result.status === 'rejected') {
          logger.error({ userId, err: result.reason }, 'Artist upsert error');
        }
      });
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
        logger.error({ userId, trackId: item.track.id, err: error }, 'Failed to process track');
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

    logger.info({ userId, archivedCount: archived }, 'Successfully archived tracks');

    return {
      status: 'success',
      songsArchived: archived
    };

  } catch (error: unknown) {
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

    logger.error({ userId, failureType, err: error }, 'Failed to archive user');

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'failed',
      reason: failureType,
      error: errorMessage
    };
  }
}
