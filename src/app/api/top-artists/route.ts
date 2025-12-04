// src/app/api/top-artists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/top-artists?limit=10
 * Returns top artists by play count for the authenticated user
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

    // Get all plays with track-artist relationships
    const plays = await prisma.playEvent.findMany({
      where: { userId },
      include: {
        track: {
          include: {
            artists: true
          }
        }
      }
    });

    // Count plays per artist
    const artistPlayCounts = new Map<string, { artist: any; count: number }>();

    plays.forEach(play => {
      play.track.artists.forEach(artist => {
        if (artistPlayCounts.has(artist.id)) {
          artistPlayCounts.get(artist.id)!.count++;
        } else {
          artistPlayCounts.set(artist.id, {
            artist: {
              id: artist.id,
              spotifyId: artist.spotifyId,
              name: artist.name
            },
            count: 1
          });
        }
      });
    });

    // Sort by play count and take top N
    const topArtists = Array.from(artistPlayCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => ({
        playCount: item.count,
        artist: item.artist
      }));

    return NextResponse.json({ topArtists });

  } catch (error: any) {
    console.error('[Top Artists API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top artists', message: error.message },
      { status: 500 }
    );
  }
}
