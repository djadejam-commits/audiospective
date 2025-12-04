// src/repositories/play-event-repository.ts
import { prisma } from '@/lib/prisma';
import { PlayEvent, Prisma } from '@prisma/client';

/**
 * Play Event Repository - Abstracts database operations for PlayEvent entity
 */
export class PlayEventRepository {
  /**
   * Create a play event (idempotent based on userId + trackId + playedAt)
   */
  async create(
    userId: string,
    trackId: string,
    playedAt: Date
  ): Promise<PlayEvent | null> {
    try {
      return await prisma.playEvent.create({
        data: {
          userId,
          trackId,
          playedAt,
        },
      });
    } catch (error) {
      // Handle unique constraint violation (duplicate play event)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        console.log(`[PlayEvent] Duplicate play event skipped: ${userId} - ${trackId} - ${playedAt}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Count total play events for a user
   */
  async countByUser(
    userId: string,
    dateRange?: { start?: Date; end?: Date }
  ): Promise<number> {
    const where: Prisma.PlayEventWhereInput = { userId };

    if (dateRange) {
      where.playedAt = {};
      if (dateRange.start) {
        where.playedAt.gte = dateRange.start;
      }
      if (dateRange.end) {
        where.playedAt.lte = dateRange.end;
      }
    }

    return prisma.playEvent.count({ where });
  }

  /**
   * Get unique track count for a user
   */
  async countUniqueTracksByUser(
    userId: string,
    dateRange?: { start?: Date; end?: Date }
  ): Promise<number> {
    const where: Prisma.PlayEventWhereInput = { userId };

    if (dateRange) {
      where.playedAt = {};
      if (dateRange.start) {
        where.playedAt.gte = dateRange.start;
      }
      if (dateRange.end) {
        where.playedAt.lte = dateRange.end;
      }
    }

    const result = await prisma.playEvent.groupBy({
      by: ['trackId'],
      where,
      _count: true,
    });

    return result.length;
  }

  /**
   * Get top tracks for a user
   */
  async getTopTracks(
    userId: string,
    limit: number = 10,
    dateRange?: { start?: Date; end?: Date }
  ) {
    const where: Prisma.PlayEventWhereInput = { userId };

    if (dateRange) {
      where.playedAt = {};
      if (dateRange.start) {
        where.playedAt.gte = dateRange.start;
      }
      if (dateRange.end) {
        where.playedAt.lte = dateRange.end;
      }
    }

    return prisma.playEvent.groupBy({
      by: ['trackId'],
      where,
      _count: { trackId: true },
      orderBy: { _count: { trackId: 'desc' } },
      take: limit,
    });
  }

  /**
   * Get top artists for a user (via play events)
   */
  async getTopArtists(
    userId: string,
    _limit: number = 10, // Reserved for future pagination
    dateRange?: { start?: Date; end?: Date }
  ) {
    const where: Prisma.PlayEventWhereInput = { userId };

    if (dateRange) {
      where.playedAt = {};
      if (dateRange.start) {
        where.playedAt.gte = dateRange.start;
      }
      if (dateRange.end) {
        where.playedAt.lte = dateRange.end;
      }
    }

    // This requires joining through tracks to get artists
    // For now, return play events with track data and let the service layer handle aggregation
    return prisma.playEvent.findMany({
      where,
      include: {
        track: {
          include: {
            artists: true,
          },
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
    });
  }

  /**
   * Get recent plays for a user with pagination
   */
  async getRecentPlays(
    userId: string,
    page: number = 1,
    pageSize: number = 50,
    dateRange?: { start?: Date; end?: Date }
  ) {
    const where: Prisma.PlayEventWhereInput = { userId };

    if (dateRange) {
      where.playedAt = {};
      if (dateRange.start) {
        where.playedAt.gte = dateRange.start;
      }
      if (dateRange.end) {
        where.playedAt.lte = dateRange.end;
      }
    }

    const skip = (page - 1) * pageSize;

    const [plays, total] = await Promise.all([
      prisma.playEvent.findMany({
        where,
        include: {
          track: {
            include: {
              artists: true,
              album: true,
            },
          },
        },
        orderBy: {
          playedAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.playEvent.count({ where }),
    ]);

    return { plays, total };
  }

  /**
   * Get activity data (play counts by date)
   */
  async getActivityData(
    userId: string,
    dateRange?: { start?: Date; end?: Date }
  ) {
    const where: Prisma.PlayEventWhereInput = { userId };

    if (dateRange) {
      where.playedAt = {};
      if (dateRange.start) {
        where.playedAt.gte = dateRange.start;
      }
      if (dateRange.end) {
        where.playedAt.lte = dateRange.end;
      }
    }

    // Get all play events and group by date in the application layer
    return prisma.playEvent.findMany({
      where,
      select: {
        playedAt: true,
      },
      orderBy: {
        playedAt: 'asc',
      },
    });
  }

  /**
   * Export all play events for a user (GDPR)
   */
  async exportUserData(
    userId: string,
    limit: number = 10000
  ) {
    return prisma.playEvent.findMany({
      where: { userId },
      include: {
        track: {
          include: {
            artists: true,
            album: true,
          },
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Delete all play events for a user (cascades via Prisma schema)
   */
  async deleteByUser(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.playEvent.deleteMany({
      where: { userId },
    });
  }
}

// Export singleton instance
export const playEventRepository = new PlayEventRepository();
