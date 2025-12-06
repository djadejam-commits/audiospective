// src/app/api/cron/simple-archive/route.ts
/**
 * Simplified Vercel Cron Job for Archiving Users
 *
 * Runs every hour via Vercel Cron (free on Hobby plan)
 * No QStash/Upstash required - perfect for Hobby plan
 *
 * Configuration: vercel.json
 * Schedule: Every hour (0 * * * *)
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes (max on Pro plan, but cron jobs have no timeout on Hobby)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { archiveUser } from '@/lib/archive-user';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  // Verify this is actually a cron request from Vercel
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('Unauthorized cron request attempt');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  logger.info('Starting simplified hourly archival job');

  try {
    // Fetch active users with valid tokens
    const activeUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        accessToken: { not: null },
        refreshToken: { not: null },
        // Skip users with too many consecutive failures (circuit breaker)
        consecutiveFailures: { lt: 5 }
      },
      select: {
        id: true,
        name: true,
        consecutiveFailures: true,
      },
      orderBy: [
        { consecutiveFailures: 'asc' }, // Process healthy users first
        { lastPolledAt: 'asc' } // Process users who haven't been polled recently
      ],
      take: 50 // Process up to 50 users per cron run (adjust based on performance)
    });

    logger.info({
      activeUserCount: activeUsers.length
    }, 'Found active users to archive');

    if (activeUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active users to process',
        processedCount: 0,
        duration: Date.now() - startTime
      });
    }

    // Process users sequentially
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; error: string }>
    };

    for (const user of activeUsers) {
      try {
        logger.debug({ userId: user.id }, 'Archiving user');

        const result = await archiveUser(user.id);

        if (result.success) {
          results.successful++;
          logger.info({
            userId: user.id,
            tracksArchived: result.tracksArchived
          }, 'User archived successfully');
        } else {
          results.failed++;
          results.errors.push({
            userId: user.id,
            error: result.error || 'Unknown error'
          });
          logger.warn({
            userId: user.id,
            error: result.error
          }, 'User archival failed');
        }
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          userId: user.id,
          error: errorMessage
        });
        logger.error({
          err: error,
          userId: user.id
        }, 'Error archiving user');
      }
    }

    const duration = Date.now() - startTime;

    logger.info({
      totalUsers: activeUsers.length,
      successful: results.successful,
      failed: results.failed,
      durationMs: duration
    }, 'Archival job completed');

    return NextResponse.json({
      success: true,
      processedCount: activeUsers.length,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
      duration
    });

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.error({ err: error, duration }, 'Critical error in archival cron job');

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        message,
        duration
      },
      { status: 500 }
    );
  }
}
