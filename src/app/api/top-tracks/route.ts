// src/app/api/top-tracks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/top-tracks?limit=10
 * Returns top tracks by play count for the authenticated user
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
    const result = topTracks.map(topTrack => {
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

    return NextResponse.json({ topTracks: result });

  } catch (error: any) {
    console.error('[Top Tracks API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top tracks', message: error.message },
      { status: 500 }
    );
  }
}
