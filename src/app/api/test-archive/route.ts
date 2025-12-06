// src/app/api/test-archive/route.ts

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { archiveUser } from '@/lib/archive-user';
import { prisma } from '@/lib/prisma';

/**
 * Manual test endpoint for archival system
 * Allows testing without QStash/Redis setup
 *
 * Usage: GET /api/test-archive (while signed in)
 */
export async function GET(req: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    console.log(`[Test Archive] Starting manual archive for user ${userId}`);

    // Run archive worker
    const result = await archiveUser(userId);

    // Fetch some stats to show the user
    const stats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastPolledAt: true,
        lastSuccessfulScrobble: true,
        consecutiveFailures: true,
        _count: {
          select: {
            playEvents: true
          }
        }
      }
    });

    // Fetch recent play events
    const recentPlays = await prisma.playEvent.findMany({
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
      take: 10
    });

    return NextResponse.json({
      success: true,
      archiveResult: result,
      stats: {
        totalPlayEvents: stats?._count.playEvents || 0,
        lastPolledAt: stats?.lastPolledAt,
        lastSuccessfulScrobble: stats?.lastSuccessfulScrobble,
        consecutiveFailures: stats?.consecutiveFailures
      },
      recentPlays: recentPlays.map(play => ({
        playedAt: play.playedAt,
        track: {
          name: play.track.name,
          artists: play.track.artists.map(a => a.name).join(', '),
          album: play.track.album?.name
        }
      }))
    });

  } catch (error: any) {
    console.error('[Test Archive] Error:', error);
    return NextResponse.json(
      {
        error: 'Archive test failed',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
