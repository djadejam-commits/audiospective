// src/app/api/cron/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { Client } from '@upstash/qstash';
import { prisma } from '@/lib/prisma';
import { filterUsersWithCircuitBreaker } from '@/lib/circuit-breaker';
import { chunk } from '@/lib/utils';

/**
 * Cron endpoint (triggered hourly by QStash)
 * - Fetches active users
 * - Filters with circuit breaker
 * - Creates batches (50 users per batch)
 * - Queues batch jobs with spread distribution
 */
async function handler(req: NextRequest) {
  console.log('[Cron] Starting hourly archival job');

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

    console.log(`[Cron] Found ${activeUsers.length} active users`);

    // Filter with circuit breaker
    const usersToProcess = filterUsersWithCircuitBreaker(activeUsers);

    console.log(`[Cron] After circuit breaker: ${usersToProcess.length} users to process`);

    if (usersToProcess.length === 0) {
      return NextResponse.json({
        message: 'No users to process',
        totalUsers: activeUsers.length,
        filteredUsers: 0
      });
    }

    // Create batches (50 users per batch)
    const batches = chunk(usersToProcess, 50);

    console.log(`[Cron] Created ${batches.length} batches`);

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

      console.log(`[Cron] Queued batch ${i + 1}/${batches.length} with ${batches[i].length} users (delay: ${delay}s)`);
    }

    return NextResponse.json({
      success: true,
      batchCount: batches.length,
      userCount: usersToProcess.length,
      totalActiveUsers: activeUsers.length,
      filteredOut: activeUsers.length - usersToProcess.length
    });

  } catch (error: any) {
    console.error('[Cron] Error in archival job:', error);
    return NextResponse.json(
      { error: 'Cron job failed', message: error.message },
      { status: 500 }
    );
  }
}

// Wrap with QStash signature verification
export const POST = verifySignatureAppRouter(handler);

// Allow GET for manual testing (remove in production)
export async function GET(req: NextRequest) {
  // Check for auth header or secret for manual triggers
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handler(req);
}
