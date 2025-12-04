// src/app/api/genres/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/genres?range=7d
 * Returns genre breakdown for user's listening history
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
    const range = searchParams.get('range') || '7d';

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

    // Get all plays with artist genres
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
            artists: true
          }
        }
      }
    });

    // Count genres
    const genreCounts = new Map<string, number>();

    plays.forEach(play => {
      play.track.artists.forEach(artist => {
        if (artist.genres) {
          // Genres are stored as comma-separated string
          const genres = artist.genres.split(',').filter(g => g.trim());
          genres.forEach(genre => {
            const normalized = genre.trim().toLowerCase();
            if (normalized) {
              genreCounts.set(normalized, (genreCounts.get(normalized) || 0) + 1);
            }
          });
        }
      });
    });

    // Sort by count and take top genres
    const topGenres = Array.from(genreCounts.entries())
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: (count / plays.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 genres

    return NextResponse.json({
      totalPlays: plays.length,
      totalGenres: genreCounts.size,
      topGenres,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Genres API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genres', message: error.message },
      { status: 500 }
    );
  }
}
