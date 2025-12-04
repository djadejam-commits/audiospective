// src/app/api/analytics/trends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/analytics/trends?range=30d
 * Returns listening trends: morning/afternoon/evening/night preferences, weekday vs weekend
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

    // Get all plays in range
    const plays = await prisma.playEvent.findMany({
      where: {
        userId,
        playedAt: { gte: startDate }
      },
      select: {
        playedAt: true
      }
    });

    if (plays.length === 0) {
      return NextResponse.json({
        totalPlays: 0,
        timeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
        dayOfWeek: { weekday: 0, weekend: 0 },
        peakHour: null,
        peakDay: null,
        dateRange: { start: startDate.toISOString(), end: now.toISOString() }
      });
    }

    // Time of day buckets
    const timeOfDay = {
      morning: 0,   // 6am - 12pm
      afternoon: 0, // 12pm - 6pm
      evening: 0,   // 6pm - 10pm
      night: 0      // 10pm - 6am
    };

    // Day of week
    const dayOfWeek = {
      weekday: 0,
      weekend: 0
    };

    // Hour distribution
    const hourCounts = new Array(24).fill(0);

    // Day distribution (0 = Sunday, 6 = Saturday)
    const dayCounts = new Array(7).fill(0);

    plays.forEach(play => {
      const date = new Date(play.playedAt);
      const hour = date.getHours();
      const day = date.getDay();

      // Time of day
      if (hour >= 6 && hour < 12) {
        timeOfDay.morning++;
      } else if (hour >= 12 && hour < 18) {
        timeOfDay.afternoon++;
      } else if (hour >= 18 && hour < 22) {
        timeOfDay.evening++;
      } else {
        timeOfDay.night++;
      }

      // Weekday vs weekend
      if (day === 0 || day === 6) {
        dayOfWeek.weekend++;
      } else {
        dayOfWeek.weekday++;
      }

      // Hour counts
      hourCounts[hour]++;

      // Day counts
      dayCounts[day]++;
    });

    // Calculate percentages
    const totalPlays = plays.length;
    const timeOfDayPercentages = {
      morning: parseFloat(((timeOfDay.morning / totalPlays) * 100).toFixed(1)),
      afternoon: parseFloat(((timeOfDay.afternoon / totalPlays) * 100).toFixed(1)),
      evening: parseFloat(((timeOfDay.evening / totalPlays) * 100).toFixed(1)),
      night: parseFloat(((timeOfDay.night / totalPlays) * 100).toFixed(1))
    };

    const dayOfWeekPercentages = {
      weekday: parseFloat(((dayOfWeek.weekday / totalPlays) * 100).toFixed(1)),
      weekend: parseFloat(((dayOfWeek.weekend / totalPlays) * 100).toFixed(1))
    };

    // Find peak hour
    const peakHourIndex = hourCounts.indexOf(Math.max(...hourCounts));
    const peakHour = {
      hour: peakHourIndex,
      count: hourCounts[peakHourIndex],
      label: `${peakHourIndex}:00 - ${peakHourIndex + 1}:00`
    };

    // Find peak day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const peakDay = {
      day: dayNames[peakDayIndex],
      count: dayCounts[peakDayIndex]
    };

    // Identify listening personality
    let personality = '';
    const maxTimeOfDay = Math.max(timeOfDay.morning, timeOfDay.afternoon, timeOfDay.evening, timeOfDay.night);

    if (timeOfDay.morning === maxTimeOfDay) {
      personality = 'Morning Bird';
    } else if (timeOfDay.afternoon === maxTimeOfDay) {
      personality = 'Afternoon Listener';
    } else if (timeOfDay.evening === maxTimeOfDay) {
      personality = 'Evening Enthusiast';
    } else {
      personality = 'Night Owl';
    }

    if (dayOfWeek.weekend > dayOfWeek.weekday) {
      personality += ' (Weekend Warrior)';
    } else {
      personality += ' (Weekday Regular)';
    }

    return NextResponse.json({
      totalPlays,
      timeOfDay: timeOfDayPercentages,
      dayOfWeek: dayOfWeekPercentages,
      peakHour,
      peakDay,
      personality,
      hourlyDistribution: hourCounts,
      dailyDistribution: dayCounts.map((count, index) => ({
        day: dayNames[index],
        count
      })),
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Trends API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate trends', message: error.message },
      { status: 500 }
    );
  }
}
