// src/app/api/cron/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { Client } from '@upstash/qstash';
import { prisma } from '@/lib/prisma';
import { filterUsersWithCircuitBreaker } from '@/lib/circuit-breaker';
import { chunk } from '@/lib/utils';
import { logger } from '@/lib/logger';

/**
 * Cron endpoint (triggered hourly by QStash)
 * - Fetches active users
 * - Filters with circuit breaker
 * - Creates batches (50 users per batch)
 * - Queues batch jobs with spread distribution
 */
async function handler(_req: NextRequest) {
  logger.info('Starting hourly archival job');

  try {
    // Fetch active users with tokens
    const activeUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        accessToken: { not: null },
        refreshToken: { not: null }
      },
      select: {
        id: true,
        consecutiveFailures: true,
        lastFailureType: true,
        lastFailedAt: true
      },
      orderBy: [
        { consecutiveFailures: 'asc' }, // Process healthy users first
        { createdAt: 'asc' }
      ]
    });

    logger.info({ activeUserCount: activeUsers.length }, 'Found active users');

    // Filter with circuit breaker
    const usersToProcess = filterUsersWithCircuitBreaker(activeUsers);

    logger.info({
      usersToProcess: usersToProcess.length,
      filteredOut: activeUsers.length - usersToProcess.length
    }, 'Applied circuit breaker filtering');

    if (usersToProcess.length === 0) {
      return NextResponse.json({
        message: 'No users to process',
        totalUsers: activeUsers.length,
        filteredUsers: 0
      });
    }

    // Create batches (50 users per batch)
    const batches = chunk(usersToProcess, 50);

    logger.info({ batchCount: batches.length }, 'Created batches');

    // Initialize QStash client
    const qstash = new Client({
      token: process.env.QSTASH_TOKEN!
    });

    // Calculate equidistant interval for job spreading
    const CRON_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    const equidistantInterval = CRON_INTERVAL_MS / batches.length; // in milliseconds
    const equidistantIntervalSeconds = Math.floor(equidistantInterval / 1000); // QStash expects seconds

    // Queue batch jobs with delays
    for (let i = 0; i < batches.length; i++) {
      const delay = i * equidistantIntervalSeconds;

      await qstash.publishJSON({
        url: `${process.env.VERCEL_URL || process.env.NEXTAUTH_URL}/api/queue/archive-batch`,
        body: {
          userIds: batches[i].map(u => u.id),
          batchNumber: i + 1,
          totalBatches: batches.length
        },
        delay: delay > 0 ? delay : undefined // Only add delay if > 0
      });

      logger.debug({
        batchNumber: i + 1,
        totalBatches: batches.length,
        userCount: batches[i].length,
        delaySeconds: delay
      }, 'Queued batch');
    }

    return NextResponse.json({
      success: true,
      batchCount: batches.length,
      userCount: usersToProcess.length,
      totalActiveUsers: activeUsers.length,
      filteredOut: activeUsers.length - usersToProcess.length
    });

  } catch (error: unknown) {
    logger.error({ err: error }, 'Error in archival cron job');
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Cron job failed', message },
      { status: 500 }
    );
  }
}

// Wrap with QStash signature verification (only if QStash is configured)
export const POST = process.env.QSTASH_CURRENT_SIGNING_KEY
  ? verifySignatureAppRouter(handler)
  : handler;
