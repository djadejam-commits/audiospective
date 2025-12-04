// src/app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/export?format=csv|json&range=7d
 * Exports user's listening history in CSV or JSON format
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

    // Fetch all plays in range
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
      }
    });

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
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
      const exportData = {
        exportedAt: new Date().toISOString(),
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
          label: range
        },
        totalPlays: plays.length,
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

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="spotify-history-${range}.json"`
        }
      });
    }

  } catch (error: any) {
    console.error('[Export API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export data', message: error.message },
      { status: 500 }
    );
  }
}
