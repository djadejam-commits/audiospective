// src/app/api/analytics/diversity/route.ts

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/analytics/diversity?range=30d
 * Calculates listening diversity: how varied are the user's listening habits
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
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    // Get all plays with artist info
    const plays = await prisma.playEvent.findMany({
      where: {
        userId,
        playedAt: { gte: startDate }
      },
      include: {
        track: {
          include: {
            artists: true
          }
        }
      }
    });

    if (plays.length === 0) {
      return NextResponse.json({
        totalPlays: 0,
        diversityScore: 0,
        uniqueArtists: 0,
        uniqueTracks: 0,
        averagePlaysPerArtist: 0,
        averagePlaysPerTrack: 0,
        topHeaviness: 0,
        interpretation: 'No data available'
      });
    }

    // Count plays per artist and track
    const artistPlayCounts = new Map<string, { name: string; count: number }>();
    const trackPlayCounts = new Map<string, number>();

    plays.forEach(play => {
      // Track counts
      const currentTrackCount = trackPlayCounts.get(play.trackId) || 0;
      trackPlayCounts.set(play.trackId, currentTrackCount + 1);

      // Artist counts
      play.track.artists.forEach(artist => {
        const existing = artistPlayCounts.get(artist.id);
        if (existing) {
          existing.count++;
        } else {
          artistPlayCounts.set(artist.id, { name: artist.name, count: 1 });
        }
      });
    });

    const totalPlays = plays.length;
    const uniqueArtists = artistPlayCounts.size;
    const uniqueTracks = trackPlayCounts.size;

    // Calculate averages
    const averagePlaysPerArtist = totalPlays / uniqueArtists;
    const averagePlaysPerTrack = totalPlays / uniqueTracks;

    // Calculate top-heaviness (what % of plays are from top 10% of artists)
    const artistCounts = Array.from(artistPlayCounts.values())
      .map(a => a.count)
      .sort((a, b) => b - a);

    const top10PercentCount = Math.max(1, Math.ceil(uniqueArtists * 0.1));
    const playsFromTop10Percent = artistCounts.slice(0, top10PercentCount).reduce((sum, count) => sum + count, 0);
    const topHeaviness = (playsFromTop10Percent / totalPlays) * 100;

    // Calculate diversity score (0-100)
    // Higher score = more diverse listening
    // Factors:
    // 1. Unique artists relative to total plays (more unique = better)
    // 2. Low top-heaviness (more evenly distributed = better)
    // 3. Unique tracks relative to total plays

    const artistDiversityFactor = Math.min(100, (uniqueArtists / totalPlays) * 100 * 5); // Max out at 20% unique
    const topHeavinessFactor = Math.max(0, 100 - topHeaviness); // Lower top-heaviness = higher score
    const trackDiversityFactor = Math.min(100, (uniqueTracks / totalPlays) * 100 * 2); // Max out at 50% unique

    const diversityScore = (
      (artistDiversityFactor * 0.4) +
      (topHeavinessFactor * 0.4) +
      (trackDiversityFactor * 0.2)
    );

    // Interpretation
    let interpretation = '';
    let badge = '';

    if (diversityScore >= 80) {
      interpretation = 'Extremely diverse! You explore a wide variety of artists and rarely stick to the same songs.';
      badge = 'Music Explorer';
    } else if (diversityScore >= 60) {
      interpretation = 'Pretty diverse. You enjoy variety but have some favorite artists you return to regularly.';
      badge = 'Balanced Listener';
    } else if (diversityScore >= 40) {
      interpretation = 'Moderately focused. You have clear preferences and stick to artists you know and love.';
      badge = 'Loyal Fan';
    } else if (diversityScore >= 20) {
      interpretation = 'Highly focused. You know what you like and play it on repeat!';
      badge = 'Super Fan';
    } else {
      interpretation = 'Extremely focused. You have a few absolute favorites that dominate your listening.';
      badge = 'True Devotee';
    }

    // Get top artists
    const topArtists = Array.from(artistPlayCounts.entries())
      .map(([id, data]) => ({
        name: data.name,
        playCount: data.count,
        percentage: parseFloat(((data.count / totalPlays) * 100).toFixed(1))
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5);

    return NextResponse.json({
      totalPlays,
      diversityScore: parseFloat(diversityScore.toFixed(1)),
      uniqueArtists,
      uniqueTracks,
      averagePlaysPerArtist: parseFloat(averagePlaysPerArtist.toFixed(1)),
      averagePlaysPerTrack: parseFloat(averagePlaysPerTrack.toFixed(1)),
      topHeaviness: parseFloat(topHeaviness.toFixed(1)),
      interpretation,
      badge,
      topArtists,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Diversity API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate diversity', message: error.message },
      { status: 500 }
    );
  }
}
