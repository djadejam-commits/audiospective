// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrSet, CACHE_PREFIX, CACHE_TTL } from '@/lib/cache';

/**
 * GET /api/stats
 * Returns overall statistics for the authenticated user
 *
 * Performance optimizations:
 * - Redis caching (1 hour TTL)
 * - Optimized queries using Prisma aggregation
 * - Reduced data transfer with select
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Use cache-aside pattern (1 hour TTL)
    const stats = await getOrSet(
      `${CACHE_PREFIX.STATS}${userId}`,
      async () => {
        // Get overall stats in parallel (optimized queries)
        const [
          totalPlays,
          uniqueTracks,
          uniqueArtists,
          uniqueAlbums,
          firstPlay,
          lastPlay
        ] = await Promise.all([
          // Total play events
          prisma.playEvent.count({
            where: { userId }
          }),

          // Unique tracks - use Prisma's distinct
          prisma.playEvent.findMany({
            where: { userId },
            select: { trackId: true },
            distinct: ['trackId']
          }).then(plays => plays.length),

          // Unique artists - optimized with direct database query
          // Avoid N+1 by using SQL aggregation
          prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(DISTINCT "artists"."id") as count
            FROM "play_events"
            INNER JOIN "tracks" ON "play_events"."track_id" = "tracks"."id"
            INNER JOIN "_TrackArtists" ON "tracks"."id" = "_TrackArtists"."B"
            INNER JOIN "artists" ON "_TrackArtists"."A" = "artists"."id"
            WHERE "play_events"."user_id" = ${userId}
          `.then(result => Number(result[0]?.count || 0)),

          // Unique albums - optimized with direct database query
          prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(DISTINCT "tracks"."album_id") as count
            FROM "play_events"
            INNER JOIN "tracks" ON "play_events"."track_id" = "tracks"."id"
            WHERE "play_events"."user_id" = ${userId}
            AND "tracks"."album_id" IS NOT NULL
          `.then(result => Number(result[0]?.count || 0)),

          // First play
          prisma.playEvent.findFirst({
            where: { userId },
            orderBy: { playedAt: 'asc' },
            select: { playedAt: true }
          }),

          // Last play
          prisma.playEvent.findFirst({
            where: { userId },
            orderBy: { playedAt: 'desc' },
            select: { playedAt: true }
          })
        ]);

        // Calculate listening time (approximate: total tracks * avg 3 minutes)
        const estimatedMinutes = totalPlays * 3;
        const estimatedHours = Math.floor(estimatedMinutes / 60);

        return {
          totalPlays,
          uniqueTracks,
          uniqueArtists,
          uniqueAlbums,
          estimatedListeningHours: estimatedHours,
          firstPlayAt: firstPlay?.playedAt,
          lastPlayAt: lastPlay?.playedAt
        };
      },
      CACHE_TTL.STATS
    );

    return NextResponse.json(stats);

  } catch (error: unknown) {
    console.error('[Stats API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch stats', message },
      { status: 500 }
    );
  }
}
