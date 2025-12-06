// src/app/api/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { shareService } from '@/services/share-service';
import { logger } from '@/lib/logger';

/**
 * POST /api/share
 * Creates a shareable link for user's listening stats
 *
 * Body:
 * - title: string (optional)
 * - description: string (optional)
 * - dateRange: '1d' | '7d' | '30d' | 'all' (optional, defaults to 'all')
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, dateRange = 'all' } = body;

    logger.info('Creating share report', {
      userId: session.user.id,
      dateRange,
    });

    // Create shareable report
    const shareReport = await shareService.createShareReport(
      session.user.id,
      session.user.name,
      session.user.email,
      title,
      description,
      dateRange
    );

    logger.info('Share report created successfully', {
      shareId: shareReport.shareId,
      userId: session.user.id,
    });

    return NextResponse.json(shareReport, { status: 201 });

  } catch (error: unknown) {
    logger.error({ err: error }, 'Failed to create share report');
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create share link', message },
      { status: 500 }
    );
  }
}
