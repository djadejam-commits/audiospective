// src/app/api/top-artists/route.ts

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrSet, CACHE_PREFIX, CACHE_TTL } from '@/lib/cache';

/**
 * GET /api/top-artists?limit=10
 * Returns top artists by play count for the authenticated user
 *
 * Performance optimizations:
 * - Redis caching (1 hour TTL)
 * - Optimized SQL query (replaced N+1 with direct SQL aggregation)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Use cache-aside pattern (1 hour TTL)
    const topArtists = await getOrSet(
      `${CACHE_PREFIX.TOP_ARTISTS}${userId}:${limit}`,
      async () => {
        // Optimized query using direct SQL aggregation
        // This avoids fetching all play events (N+1 issue)
        const result = await prisma.$queryRaw<
          Array<{
            artistId: string;
            spotifyId: string;
            name: string;
            playCount: bigint;
          }>
        >`
          SELECT
            "artists"."id" as "artistId",
            "artists"."spotify_id" as "spotifyId",
            "artists"."name",
            COUNT(*) as "playCount"
          FROM "play_events"
          INNER JOIN "tracks" ON "play_events"."track_id" = "tracks"."id"
          INNER JOIN "_TrackArtists" ON "tracks"."id" = "_TrackArtists"."B"
          INNER JOIN "artists" ON "_TrackArtists"."A" = "artists"."id"
          WHERE "play_events"."user_id" = ${userId}
          GROUP BY "artists"."id", "artists"."spotify_id", "artists"."name"
          ORDER BY "playCount" DESC
          LIMIT ${limit}
        `;

        return result.map(row => ({
          playCount: Number(row.playCount),
          artist: {
            id: row.artistId,
            spotifyId: row.spotifyId,
            name: row.name
          }
        }));
      },
      CACHE_TTL.TOP_ARTISTS
    );

    return NextResponse.json({ topArtists });

  } catch (error: unknown) {
    console.error('[Top Artists API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch top artists', message },
      { status: 500 }
    );
  }
}
