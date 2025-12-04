// src/app/api/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { createShareSchema } from '@/validators/share.validator';
import { ZodError } from 'zod';

/**
 * POST /api/share
 * Creates a shareable report
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

    const userId = session.user.id;
    const body = await req.json();

    // Validate input
    const validated = createShareSchema.parse(body);
    const { title, description, dateRange } = validated;

    // Generate unique share ID
    const shareId = randomBytes(8).toString('hex');

    // Fetch user's stats for the report
    const [stats, topTracks] = await Promise.all([
      // Stats
      prisma.playEvent.count({ where: { userId } }),

      // Top tracks (grouped by trackId with counts)
      prisma.playEvent.groupBy({
        by: ['trackId'],
        where: { userId },
        _count: { trackId: true },
        orderBy: { _count: { trackId: 'desc' } },
        take: 10
      })
    ]);

    // Fetch full track details for top tracks
    const trackIds = topTracks.map(t => t.trackId);
    const trackDetails = await prisma.track.findMany({
      where: { id: { in: trackIds } },
      include: { artists: true, album: true }
    });

    // Create a map for quick lookup
    const trackMap = new Map(trackDetails.map(t => [t.id, t]));

    // Build report data with correct track information
    const reportData = {
      totalPlays: stats,
      userName: session.user.name || session.user.email,
      topTracks: topTracks.slice(0, 5).map(t => {
        const track = trackMap.get(t.trackId);
        return {
          name: track?.name || 'Unknown',
          artists: track?.artists.map(a => a.name).join(', ') || 'Unknown',
          playCount: t._count.trackId
        };
      }),
      generatedAt: new Date().toISOString()
    };

    // Create shareable report
    const report = await prisma.shareableReport.create({
      data: {
        userId,
        shareId,
        title: title || `${session.user.name}'s Listening Report`,
        description: description || null,
        reportData: JSON.stringify(reportData),
        dateRange: dateRange || 'all'
      }
    });

    return NextResponse.json({
      success: true,
      shareId: report.shareId,
      shareUrl: `${process.env.NEXTAUTH_URL}/share/${report.shareId}`
    });

  } catch (error: any) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    console.error('[Share API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create shareable report', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/share/:shareId
 * Gets a shareable report by share ID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get('id');

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 });
    }

    const report = await prisma.shareableReport.findUnique({
      where: { shareId },
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        }
      }
    });

    if (!report || !report.isPublic) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.shareableReport.update({
      where: { id: report.id },
      data: { viewCount: { increment: 1 } }
    });

    return NextResponse.json({
      title: report.title,
      description: report.description,
      reportData: JSON.parse(report.reportData),
      createdAt: report.createdAt,
      viewCount: report.viewCount + 1,
      userName: report.user.name
    });

  } catch (error: any) {
    console.error('[Share API GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report', message: error.message },
      { status: 500 }
    );
  }
}
