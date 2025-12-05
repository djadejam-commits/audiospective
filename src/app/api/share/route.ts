// src/app/api/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/share
 * Creates a shareable link for user's listening stats
 *
 * Body:
 * - title: string (optional)
 * - dateRange: '1d' | '7d' | '30d' | 'all'
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
    const { title: _title, dateRange: _dateRange = 'all' } = body;

    // For now, return a simple message
    // TODO: Implement full share functionality with database storage
    return NextResponse.json({
      error: 'Share functionality coming soon! This feature will allow you to create shareable links of your listening stats.'
    }, { status: 501 }); // 501 Not Implemented

  } catch (error: unknown) {
    console.error('[Share API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create share link', message },
      { status: 500 }
    );
  }
}
