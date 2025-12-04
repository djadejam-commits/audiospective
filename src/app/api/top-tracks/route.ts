// src/app/api/top-tracks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrSet, CACHE_PREFIX, CACHE_TTL } from '@/lib/cache';

/**
 * GET /api/top-tracks?limit=10
 * Returns top tracks by play count for the authenticated user
 *
 * Performance optimizations:
 * - Redis caching (1 hour TTL)
 * - Efficient groupBy query
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
    const result = await getOrSet(
      `${CACHE_PREFIX.TOP_TRACKS}${userId}:${limit}`,
      async () => {
        // Get play counts grouped by track
        const topTracks = await prisma.playEvent.groupBy({
          by: ['trackId'],
          where: { userId },
          _count: {
            trackId: true
          },
          orderBy: {
            _count: {
              trackId: 'desc'
            }
          },
          take: limit
        });

        // Fetch track details
        const trackIds = topTracks.map(t => t.trackId);
        const tracks = await prisma.track.findMany({
          where: {
            id: { in: trackIds }
          },
          include: {
            album: true,
            artists: true
          }
        });

        // Map track details with play counts
        const tracksMap = new Map(tracks.map(t => [t.id, t]));
        return topTracks.map(topTrack => {
          const track = tracksMap.get(topTrack.trackId);
          if (!track) return null;

          return {
            playCount: topTrack._count.trackId,
            track: {
              id: track.id,
              spotifyId: track.spotifyId,
              name: track.name,
              durationMs: track.durationMs,
              album: track.album ? {
                id: track.album.id,
                name: track.album.name,
                imageUrl: track.album.imageUrl
              } : null,
              artists: track.artists.map(artist => ({
                id: artist.id,
                name: artist.name
              }))
            }
          };
        }).filter(Boolean);
      },
      CACHE_TTL.TOP_TRACKS
    );

    return NextResponse.json({ topTracks: result });

  } catch (error: unknown) {
    console.error('[Top Tracks API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch top tracks', message },
      { status: 500 }
    );
  }
}
