// src/app/api/queue/archive-batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { archiveUser } from '@/lib/archive-user';

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

    console.log(`[Batch Worker] Processing batch ${batchNumber || '?'}/${totalBatches || '?'} with ${userIds.length} users`);

    const startTime = Date.now();

    // Process users in parallel using Promise.allSettled
    // This prevents one user's failure from crashing the entire batch (EC-BATCH-001)
    const results = await Promise.allSettled(
      userIds.map(async (userId: string) => {
        try {
          return await archiveUser(userId);
        } catch (error: any) {
          console.error(`[Batch Worker] Failed to archive user ${userId}:`, error);
          return {
            status: 'failed' as const,
            userId,
            error: error.message || 'Unknown error'
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
      console.warn(`[Batch Worker] Batch ${batchNumber} completed with ${failed.length}/${userIds.length} failures`);
      failed.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[Batch Worker] User failed (rejected):`, result.reason);
        } else if (result.status === 'fulfilled') {
          console.error(`[Batch Worker] User failed:`, result.value);
        }
      });
    }

    console.log(`[Batch Worker] Batch ${batchNumber} completed in ${duration}ms: ${successful.length} success, ${skipped.length} skipped, ${failed.length} failed`);

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

  } catch (error: any) {
    console.error('[Batch Worker] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Batch processing failed', message: error.message },
      { status: 500 }
    );
  }
}

// Wrap with QStash signature verification
export const POST = verifySignatureAppRouter(handler);

// Allow GET for manual testing (remove in production)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handler(req);
}
