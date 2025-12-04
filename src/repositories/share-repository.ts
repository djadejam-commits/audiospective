// src/repositories/share-repository.ts
import { prisma } from '@/lib/prisma';
import { ShareableReport, Prisma } from '@prisma/client';

/**
 * Share Repository - Abstracts database operations for ShareableReport entity
 */
export class ShareRepository {
  /**
   * Create a shareable report
   */
  async create(data: {
    userId: string;
    shareId: string;
    title: string;
    description: string | null;
    reportData: string;
    dateRange: string;
  }): Promise<ShareableReport> {
    return prisma.shareableReport.create({
      data,
    });
  }

  /**
   * Find shareable report by shareId
   */
  async findByShareId(shareId: string) {
    return prisma.shareableReport.findUnique({
      where: { shareId },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });
  }

  /**
   * Find all reports for a user
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    pageSize: number = 10
  ) {
    const skip = (page - 1) * pageSize;

    const [reports, total] = await Promise.all([
      prisma.shareableReport.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.shareableReport.count({ where: { userId } }),
    ]);

    return { reports, total };
  }

  /**
   * Increment view count for a report
   */
  async incrementViewCount(reportId: string): Promise<ShareableReport> {
    return prisma.shareableReport.update({
      where: { id: reportId },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  /**
   * Update report visibility
   */
  async updateVisibility(
    reportId: string,
    isPublic: boolean
  ): Promise<ShareableReport> {
    return prisma.shareableReport.update({
      where: { id: reportId },
      data: { isPublic },
    });
  }

  /**
   * Delete a report
   */
  async delete(reportId: string): Promise<ShareableReport> {
    return prisma.shareableReport.delete({
      where: { id: reportId },
    });
  }

  /**
   * Delete all reports for a user (GDPR)
   */
  async deleteByUser(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.shareableReport.deleteMany({
      where: { userId },
    });
  }

  /**
   * Count reports for a user
   */
  async countByUser(userId: string): Promise<number> {
    return prisma.shareableReport.count({
      where: { userId },
    });
  }

  /**
   * Get report statistics
   */
  async getStats() {
    const [totalReports, totalViews] = await Promise.all([
      prisma.shareableReport.count(),
      prisma.shareableReport.aggregate({
        _sum: { viewCount: true },
      }),
    ]);

    return {
      totalReports,
      totalViews: totalViews._sum.viewCount || 0,
    };
  }
}

// Export singleton instance
export const shareRepository = new ShareRepository();
