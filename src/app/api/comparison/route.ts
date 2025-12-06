// src/app/api/comparison/route.ts

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/comparison
 * Compares this week vs last week listening stats
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
    const now = new Date();

    // This week: last 7 days
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Last week: 7-14 days ago
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = thisWeekStart;

    // Get plays for both periods
    const [thisWeekPlays, lastWeekPlays] = await Promise.all([
      prisma.playEvent.findMany({
        where: {
          userId,
          playedAt: { gte: thisWeekStart }
        },
        include: {
          track: {
            include: {
              artists: true
            }
          }
        }
      }),
      prisma.playEvent.findMany({
        where: {
          userId,
          playedAt: {
            gte: lastWeekStart,
            lt: lastWeekEnd
          }
        },
        include: {
          track: {
            include: {
              artists: true
            }
          }
        }
      })
    ]);

    // Calculate stats for this week
    const thisWeekStats = {
      totalPlays: thisWeekPlays.length,
      uniqueTracks: new Set(thisWeekPlays.map(p => p.trackId)).size,
      uniqueArtists: new Set(
        thisWeekPlays.flatMap(p => p.track.artists.map(a => a.id))
      ).size,
      avgPlaysPerDay: thisWeekPlays.length / 7
    };

    // Calculate stats for last week
    const lastWeekStats = {
      totalPlays: lastWeekPlays.length,
      uniqueTracks: new Set(lastWeekPlays.map(p => p.trackId)).size,
      uniqueArtists: new Set(
        lastWeekPlays.flatMap(p => p.track.artists.map(a => a.id))
      ).size,
      avgPlaysPerDay: lastWeekPlays.length / 7
    };

    // Calculate changes
    const changes = {
      totalPlays: {
        value: thisWeekStats.totalPlays - lastWeekStats.totalPlays,
        percentage: lastWeekStats.totalPlays > 0
          ? ((thisWeekStats.totalPlays - lastWeekStats.totalPlays) / lastWeekStats.totalPlays) * 100
          : 0
      },
      uniqueTracks: {
        value: thisWeekStats.uniqueTracks - lastWeekStats.uniqueTracks,
        percentage: lastWeekStats.uniqueTracks > 0
          ? ((thisWeekStats.uniqueTracks - lastWeekStats.uniqueTracks) / lastWeekStats.uniqueTracks) * 100
          : 0
      },
      uniqueArtists: {
        value: thisWeekStats.uniqueArtists - lastWeekStats.uniqueArtists,
        percentage: lastWeekStats.uniqueArtists > 0
          ? ((thisWeekStats.uniqueArtists - lastWeekStats.uniqueArtists) / lastWeekStats.uniqueArtists) * 100
          : 0
      },
      avgPlaysPerDay: {
        value: thisWeekStats.avgPlaysPerDay - lastWeekStats.avgPlaysPerDay,
        percentage: lastWeekStats.avgPlaysPerDay > 0
          ? ((thisWeekStats.avgPlaysPerDay - lastWeekStats.avgPlaysPerDay) / lastWeekStats.avgPlaysPerDay) * 100
          : 0
      }
    };

    // Top tracks this week
    const thisWeekTrackCounts = new Map<string, { track: any; count: number }>();
    thisWeekPlays.forEach(play => {
      const existing = thisWeekTrackCounts.get(play.trackId);
      if (existing) {
        existing.count++;
      } else {
        thisWeekTrackCounts.set(play.trackId, {
          track: play.track,
          count: 1
        });
      }
    });

    const topTracksThisWeek = Array.from(thisWeekTrackCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        name: item.track.name,
        artists: item.track.artists.map((a: any) => a.name).join(', '),
        playCount: item.count
      }));

    return NextResponse.json({
      thisWeek: thisWeekStats,
      lastWeek: lastWeekStats,
      changes,
      topTracksThisWeek,
      dateRanges: {
        thisWeek: {
          start: thisWeekStart.toISOString(),
          end: now.toISOString()
        },
        lastWeek: {
          start: lastWeekStart.toISOString(),
          end: lastWeekEnd.toISOString()
        }
      }
    });

  } catch (error: any) {
    console.error('[Comparison API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparison', message: error.message },
      { status: 500 }
    );
  }
}
