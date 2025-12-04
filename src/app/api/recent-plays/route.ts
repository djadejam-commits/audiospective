// src/app/api/recent-plays/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/recent-plays?limit=20&offset=0
 * Returns recent play events for the authenticated user
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const plays = await prisma.playEvent.findMany({
      where: { userId },
      include: {
        track: {
          include: {
            album: true,
            artists: true
          }
        }
      },
      orderBy: { playedAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.playEvent.count({
      where: { userId }
    });

    return NextResponse.json({
      plays: plays.map(play => ({
        id: play.id,
        playedAt: play.playedAt,
        track: {
          id: play.track.id,
          spotifyId: play.track.spotifyId,
          name: play.track.name,
          durationMs: play.track.durationMs,
          album: play.track.album ? {
            id: play.track.album.id,
            name: play.track.album.name,
            imageUrl: play.track.album.imageUrl
          } : null,
          artists: play.track.artists.map(artist => ({
            id: artist.id,
            name: artist.name
          }))
        }
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('[Recent Plays API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent plays', message: error.message },
      { status: 500 }
    );
  }
}
