// src/app/api/analytics/discovery/route.ts

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/analytics/discovery?range=7d
 * Calculates discovery rate: new tracks vs repeated plays
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
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    // Get all plays in range
    const playsInRange = await prisma.playEvent.findMany({
      where: {
        userId,
        playedAt: { gte: startDate }
      },
      include: {
        track: {
          include: {
            artists: true,
            album: true
          }
        }
      },
      orderBy: {
        playedAt: 'asc'
      }
    });

    // Get all plays before range (to identify truly new tracks)
    const playsBeforeRange = await prisma.playEvent.findMany({
      where: {
        userId,
        playedAt: { lt: startDate }
      },
      select: {
        trackId: true
      }
    });

    const tracksBeforeRange = new Set(playsBeforeRange.map(p => p.trackId));
    const artistsBeforeRange = new Set<string>();

    // Get artists from before range
    const artistIdsBeforeRange = await prisma.playEvent.findMany({
      where: {
        userId,
        playedAt: { lt: startDate }
      },
      include: {
        track: {
          include: {
            artists: true
          }
        }
      }
    });

    artistIdsBeforeRange.forEach(play => {
      play.track.artists.forEach(artist => {
        artistsBeforeRange.add(artist.id);
      });
    });

    // Analyze plays in range
    const trackFirstPlayMap = new Map<string, Date>();
    const artistFirstPlayMap = new Map<string, Date>();
    let newTracks = 0;
    let newArtists = 0;
    let repeatedPlays = 0;

    const newTracksDetails: any[] = [];
    const newArtistsDetails: any[] = [];

    playsInRange.forEach(play => {
      const isNewTrack = !tracksBeforeRange.has(play.trackId) && !trackFirstPlayMap.has(play.trackId);
      const hasNewArtists = play.track.artists.some(artist =>
        !artistsBeforeRange.has(artist.id) && !artistFirstPlayMap.has(artist.id)
      );

      if (isNewTrack) {
        newTracks++;
        trackFirstPlayMap.set(play.trackId, play.playedAt);
        newTracksDetails.push({
          name: play.track.name,
          artists: play.track.artists.map(a => a.name).join(', '),
          firstPlayedAt: play.playedAt,
          imageUrl: play.track.album?.imageUrl
        });
      } else {
        repeatedPlays++;
      }

      if (hasNewArtists) {
        play.track.artists.forEach(artist => {
          if (!artistsBeforeRange.has(artist.id) && !artistFirstPlayMap.has(artist.id)) {
            newArtists++;
            artistFirstPlayMap.set(artist.id, play.playedAt);
            newArtistsDetails.push({
              name: artist.name,
              firstPlayedAt: play.playedAt
            });
          }
          artistsBeforeRange.add(artist.id);
        });
      }
    });

    const totalPlays = playsInRange.length;
    const discoveryRate = totalPlays > 0 ? (newTracks / totalPlays) * 100 : 0;
    const artistDiscoveryRate = totalPlays > 0 ? (newArtists / totalPlays) * 100 : 0;

    return NextResponse.json({
      totalPlays,
      newTracks,
      repeatedPlays,
      newArtists,
      discoveryRate: parseFloat(discoveryRate.toFixed(2)),
      artistDiscoveryRate: parseFloat(artistDiscoveryRate.toFixed(2)),
      newTracksDetails: newTracksDetails.slice(0, 10),
      newArtistsDetails: newArtistsDetails.slice(0, 10),
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Discovery API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate discovery rate', message: error.message },
      { status: 500 }
    );
  }
}
