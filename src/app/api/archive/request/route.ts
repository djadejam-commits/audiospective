// src/app/api/archive/request/route.ts
/**
 * POST /api/archive/request
 *
 * Requests async archiving for the current user
 * Sets archiveRequested=true flag for cron job to prioritize
 * Returns immediately (no timeout issues)
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    logger.info({ userId }, 'User requested manual archive');

    // Check if user already has a pending archive request
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        archiveRequested: true,
        archiveRequestedAt: true,
        lastPolledAt: true,
      }
    });

    if (user?.archiveRequested) {
      const requestedAgo = user.archiveRequestedAt
        ? Math.floor((Date.now() - user.archiveRequestedAt.getTime()) / 1000)
        : 0;

      logger.info({
        userId,
        requestedAgo
      }, 'User already has pending archive request');

      return NextResponse.json({
        status: 'pending',
        message: 'Archive already in progress',
        requestedAt: user.archiveRequestedAt,
        estimatedCompletionSeconds: Math.max(90 - requestedAgo, 10)
      });
    }

    // Set archive requested flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        archiveRequested: true,
        archiveRequestedAt: new Date()
      }
    });

    logger.info({ userId }, 'Archive request flag set successfully');

    return NextResponse.json({
      status: 'requested',
      message: 'Archive requested successfully. Your listening history will be processed within the next few minutes.',
      requestedAt: new Date(),
      estimatedCompletionSeconds: 90
    }, { status: 202 }); // 202 Accepted

  } catch (error: unknown) {
    logger.error({ err: error }, 'Failed to request archive');
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to request archive', message },
      { status: 500 }
    );
  }
}
