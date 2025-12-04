// src/app/api/queue/archive-batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { archiveUser } from '@/lib/archive-user';
import { logger } from '@/lib/logger';

/**
 * Batch worker endpoint
 * - Processes a batch of users (up to 50)
 * - Uses Promise.allSettled to prevent Poison Pill errors
 * - Each user failure is isolated and logged
 */
async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { userIds, batchNumber, totalBatches } = body;

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Invalid request body: userIds array required' },
        { status: 400 }
      );
    }

    logger.info({
      batchNumber: batchNumber || 0,
      totalBatches: totalBatches || 0,
      userCount: userIds.length
    }, 'Processing batch');

    const startTime = Date.now();

    // Process users in parallel using Promise.allSettled
    // This prevents one user's failure from crashing the entire batch (EC-BATCH-001)
    const results = await Promise.allSettled(
      userIds.map(async (userId: string) => {
        try {
          return await archiveUser(userId);
        } catch (error: unknown) {
          logger.error({ userId, err: error }, 'Failed to archive user in batch');
          const message = error instanceof Error ? error.message : 'Unknown error';
          return {
            status: 'failed' as const,
            userId,
            error: message
          };
        }
      })
    );

    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success');
    const skipped = results.filter(r => r.status === 'fulfilled' && r.value.status === 'skipped');
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed'));

    // Calculate total songs archived
    const totalSongsArchived = successful.reduce((sum, r) => {
      return sum + ((r.status === 'fulfilled' && r.value.status === 'success') ? (r.value.songsArchived || 0) : 0);
    }, 0);

    const duration = Date.now() - startTime;

    // Log failures for monitoring
    if (failed.length > 0) {
      logger.warn({
        batchNumber,
        failedCount: failed.length,
        totalCount: userIds.length
      }, 'Batch completed with failures');
      failed.forEach((result) => {
        if (result.status === 'rejected') {
          logger.error({ err: result.reason }, 'User failed (rejected)');
        } else if (result.status === 'fulfilled') {
          logger.error({ result: result.value }, 'User failed');
        }
      });
    }

    logger.info({
      batchNumber,
      durationMs: duration,
      successful: successful.length,
      skipped: skipped.length,
      failed: failed.length
    }, 'Batch completed');

    return NextResponse.json({
      success: true,
      processed: userIds.length,
      successful: successful.length,
      skipped: skipped.length,
      failed: failed.length,
      totalSongsArchived,
      durationMs: duration,
      batchNumber,
      totalBatches
    });

  } catch (error: unknown) {
    logger.error({ err: error }, 'Unexpected error in batch worker');
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Batch processing failed', message },
      { status: 500 }
    );
  }
}

// Wrap with QStash signature verification (only if QStash is configured)
export const POST = process.env.QSTASH_CURRENT_SIGNING_KEY
  ? verifySignatureAppRouter(handler)
  : handler;
