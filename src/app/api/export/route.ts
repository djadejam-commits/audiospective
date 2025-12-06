// src/app/api/export/route.ts

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/export?format=csv|json&range=7d&gdpr=true
 * Exports user's listening history in CSV or JSON format
 *
 * GDPR Mode (gdpr=true):
 * Exports ALL user data including profile, listening history, shared reports
 * for compliance with GDPR Article 20 (Right to Data Portability)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const range = searchParams.get('range') || 'all';
    const gdprMode = searchParams.get('gdpr') === 'true';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    // Fetch plays in range (with 10k limit to prevent memory issues)
    const MAX_EXPORT_LIMIT = 10000;
    const plays = await prisma.playEvent.findMany({
      where: {
        userId,
        playedAt: {
          gte: startDate
        }
      },
      include: {
        track: {
          include: {
            album: true,
            artists: true
          }
        }
      },
      orderBy: {
        playedAt: 'desc'
      },
      take: MAX_EXPORT_LIMIT
    });

    // Count total plays for informational purposes
    const totalPlays = await prisma.playEvent.count({
      where: {
        userId,
        playedAt: {
          gte: startDate
        }
      }
    });

    const isTruncated = totalPlays > MAX_EXPORT_LIMIT;

    // GDPR Mode: Fetch ALL user data
    let userData = null;
    let shareableReports = null;

    if (gdprMode) {
      // Fetch user profile data
      userData = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          spotifyId: true,
          email: true,
          name: true,
          image: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastPolledAt: true,
          lastSuccessfulScrobble: true,
          subscriptionPlan: true,
          foundingMemberNumber: true,
          // Do NOT include tokens for security
          refreshToken: false,
          accessToken: false,
          tokenExpiresAt: false,
        },
      });

      // Fetch all shareable reports
      shareableReports = await prisma.shareableReport.findMany({
        where: { userId },
        select: {
          id: true,
          shareId: true,
          title: true,
          description: true,
          reportData: true,
          dateRange: true,
          isPublic: true,
          viewCount: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
        // Warning comment if truncated
        ...(isTruncated ? [
          `# Warning: Export limited to ${MAX_EXPORT_LIMIT} most recent plays (Total: ${totalPlays})`
        ] : []),
        // Header
        ['Date', 'Time', 'Track', 'Artists', 'Album', 'Duration (min)'].join(','),
        // Data rows
        ...plays.map(play => {
          const date = new Date(play.playedAt);
          const artists = play.track.artists.map(a => a.name).join('; ');
          const album = play.track.album?.name || '';
          const durationMin = (play.track.durationMs / 1000 / 60).toFixed(2);

          return [
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            `"${play.track.name.replace(/"/g, '""')}"`, // Escape quotes
            `"${artists.replace(/"/g, '""')}"`,
            `"${album.replace(/"/g, '""')}"`,
            durationMin
          ].join(',');
        })
      ];

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="spotify-history-${range}.csv"`
        }
      });

    } else {
      // Generate JSON
      const exportData: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        exportType: gdprMode ? 'gdpr-full-data-export' : 'listening-history-export',
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
          label: range
        },
        totalPlays,
        exportedPlays: plays.length,
        isTruncated,
        ...(isTruncated && {
          warning: `Export limited to ${MAX_EXPORT_LIMIT} most recent plays. Total plays: ${totalPlays}`
        }),
        plays: plays.map(play => ({
          playedAt: play.playedAt,
          track: {
            name: play.track.name,
            spotifyId: play.track.spotifyId,
            durationMs: play.track.durationMs,
            album: play.track.album ? {
              name: play.track.album.name,
              imageUrl: play.track.album.imageUrl
            } : null,
            artists: play.track.artists.map(a => ({
              name: a.name,
              spotifyId: a.spotifyId
            }))
          }
        }))
      };

      // Add GDPR data if requested
      if (gdprMode) {
        exportData.gdprCompliance = {
          regulation: 'GDPR Article 20 - Right to Data Portability',
          exportDate: new Date().toISOString(),
          dataSubject: userId,
        };

        exportData.profile = userData;

        exportData.shareableReports = shareableReports?.map(report => ({
          id: report.id,
          shareId: report.shareId,
          title: report.title,
          description: report.description,
          reportData: JSON.parse(report.reportData),
          dateRange: report.dateRange,
          isPublic: report.isPublic,
          viewCount: report.viewCount,
          createdAt: report.createdAt,
          expiresAt: report.expiresAt,
        }));

        exportData.statistics = {
          totalListeningHistory: plays.length,
          totalShareableReports: shareableReports?.length || 0,
          accountCreated: userData?.createdAt,
          lastActivity: userData?.lastPolledAt,
        };
      }

      const filename = gdprMode
        ? `audiospective-gdpr-export-${new Date().toISOString().split('T')[0]}.json`
        : `spotify-history-${range}.json`;

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

  } catch (error) {
    console.error('[Export API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to export data', message },
      { status: 500 }
    );
  }
}
