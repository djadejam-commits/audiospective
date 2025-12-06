// src/app/api/analytics/streaks/route.ts

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/analytics/streaks
 * Calculates listening streaks (consecutive days with plays)
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

    // Get all plays ordered by date
    const plays = await prisma.playEvent.findMany({
      where: { userId },
      select: { playedAt: true },
      orderBy: { playedAt: 'asc' }
    });

    if (plays.length === 0) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        totalDaysActive: 0,
        streakHistory: []
      });
    }

    // Group plays by date (YYYY-MM-DD)
    const dateSet = new Set<string>();
    plays.forEach(play => {
      const date = play.playedAt.toISOString().split('T')[0];
      dateSet.add(date);
    });

    const uniqueDates = Array.from(dateSet).sort();
    const totalDaysActive = uniqueDates.length;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    const streakHistory: { start: string; end: string; days: number }[] = [];
    let streakStart = uniqueDates[0];

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays === 1) {
        // Consecutive day
        tempStreak++;
      } else {
        // Streak broken
        if (tempStreak >= 3) {
          streakHistory.push({
            start: streakStart,
            end: uniqueDates[i - 1],
            days: tempStreak
          });
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        streakStart = uniqueDates[i];
      }
    }

    // Handle last streak
    if (tempStreak >= 3) {
      streakHistory.push({
        start: streakStart,
        end: uniqueDates[uniqueDates.length - 1],
        days: tempStreak
      });
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak
    const lastActiveDate = uniqueDates[uniqueDates.length - 1];
    if (lastActiveDate === today || lastActiveDate === yesterday) {
      // Active today or yesterday, count backwards
      currentStreak = 1;
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const prevDate = new Date(uniqueDates[i]);
        const nextDate = new Date(uniqueDates[i + 1]);
        const diffDays = Math.floor((nextDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0; // Streak broken
    }

    // Sort streak history by days (longest first)
    streakHistory.sort((a, b) => b.days - a.days);

    return NextResponse.json({
      currentStreak,
      longestStreak,
      totalDaysActive,
      streakHistory: streakHistory.slice(0, 5), // Top 5 streaks
      firstActiveDate: uniqueDates[0],
      lastActiveDate: uniqueDates[uniqueDates.length - 1],
      isActiveToday: lastActiveDate === today
    });

  } catch (error: any) {
    console.error('[Streaks API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate streaks', message: error.message },
      { status: 500 }
    );
  }
}
