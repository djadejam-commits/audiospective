// src/app/api/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/activity?range=7d
 * Returns daily play counts for activity visualization
 * Supports: 1d, 7d, 30d, all
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
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get all plays in range
    const plays = await prisma.playEvent.findMany({
      where: {
        userId,
        playedAt: {
          gte: startDate
        }
      },
      select: {
        playedAt: true
      },
      orderBy: {
        playedAt: 'asc'
      }
    });

    // Group by date
    const dailyCounts = new Map<string, number>();
    plays.forEach(play => {
      const date = new Date(play.playedAt).toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    // Convert to array and sort
    const activity = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Also calculate hourly distribution (for all data)
    const hourlyDistribution = new Array(24).fill(0);
    plays.forEach(play => {
      const hour = new Date(play.playedAt).getHours();
      hourlyDistribution[hour]++;
    });

    return NextResponse.json({
      activity,
      hourlyDistribution,
      totalPlays: plays.length,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Activity API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity', message: error.message },
      { status: 500 }
    );
  }
}
