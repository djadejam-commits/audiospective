// src/app/api/archive/status/route.ts
/**
 * GET /api/archive/status
 *
 * Checks the status of user's archive request
 * Returns whether archive is pending, in progress, or completed
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch user status and play event count
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        archiveRequested: true,
        archiveRequestedAt: true,
        lastPolledAt: true,
        _count: {
          select: {
            playEvents: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine status
    let status: 'idle' | 'pending' | 'completed';
    let message: string;
    let estimatedCompletionSeconds: number | null = null;

    if (user.archiveRequested) {
      status = 'pending';
      message = 'Archive in progress. Please wait...';

      // Calculate estimated completion time
      if (user.archiveRequestedAt) {
        const requestedAgo = Math.floor((Date.now() - user.archiveRequestedAt.getTime()) / 1000);
        estimatedCompletionSeconds = Math.max(90 - requestedAgo, 10);
      } else {
        estimatedCompletionSeconds = 90;
      }
    } else if (user.lastPolledAt) {
      status = 'completed';
      message = 'Archive completed successfully';
    } else {
      status = 'idle';
      message = 'No archive has been requested yet';
    }

    logger.debug({
      userId,
      status,
      totalPlayEvents: user._count.playEvents
    }, 'Archive status checked');

    return NextResponse.json({
      status,
      message,
      archiveRequested: user.archiveRequested,
      archiveRequestedAt: user.archiveRequestedAt,
      lastPolledAt: user.lastPolledAt,
      totalPlayEvents: user._count.playEvents,
      estimatedCompletionSeconds
    });

  } catch (error: unknown) {
    logger.error({ err: error }, 'Failed to check archive status');
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to check archive status', message },
      { status: 500 }
    );
  }
}
