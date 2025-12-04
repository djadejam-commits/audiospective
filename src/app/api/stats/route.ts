// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stats
 * Returns overall statistics for the authenticated user
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

    // Get overall stats in parallel
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

      // Unique tracks
      prisma.playEvent.findMany({
        where: { userId },
        select: { trackId: true },
        distinct: ['trackId']
      }).then(plays => plays.length),

      // Unique artists
      prisma.playEvent.findMany({
        where: { userId },
        include: {
          track: {
            include: { artists: true }
          }
        }
      }).then(plays => {
        const artistIds = new Set();
        plays.forEach(play => {
          play.track.artists.forEach(artist => artistIds.add(artist.id));
        });
        return artistIds.size;
      }),

      // Unique albums
      prisma.playEvent.findMany({
        where: { userId },
        include: {
          track: {
            select: { albumId: true }
          }
        }
      }).then(plays => {
        const albumIds = new Set();
        plays.forEach(play => {
          if (play.track.albumId) albumIds.add(play.track.albumId);
        });
        return albumIds.size;
      }),

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

    return NextResponse.json({
      totalPlays,
      uniqueTracks,
      uniqueArtists,
      uniqueAlbums,
      estimatedListeningHours: estimatedHours,
      firstPlayAt: firstPlay?.playedAt,
      lastPlayAt: lastPlay?.playedAt
    });

  } catch (error: any) {
    console.error('[Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', message: error.message },
      { status: 500 }
    );
  }
}
