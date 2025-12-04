// src/services/share-service.ts
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { shareRepository } from '@/repositories/share-repository';
import { playEventRepository } from '@/repositories/play-event-repository';
import { ErrorCode, throwError } from '@/lib/error-handler';
import {
  ShareReportResponse,
  ShareReportData,
  PublicShareReportResponse,
} from '@/dto/share.dto';

/**
 * Share Service - Business logic for shareable reports
 */
export class ShareService {
  /**
   * Create a shareable report for a user
   */
  async createShareReport(
    userId: string,
    userName: string | null | undefined,
    userEmail: string | null | undefined,
    title?: string,
    description?: string,
    dateRange?: string
  ): Promise<ShareReportResponse> {
    // Generate unique share ID
    const shareId = randomBytes(8).toString('hex');

    // Fetch user's stats for the report
    const [stats, topTracks] = await Promise.all([
      // Total play count
      playEventRepository.countByUser(userId),

      // Top tracks (grouped by trackId with counts)
      playEventRepository.getTopTracks(userId, 10),
    ]);

    // Fetch full track details for top tracks
    const trackIds = topTracks.map(t => t.trackId);
    const trackDetails = await prisma.track.findMany({
      where: { id: { in: trackIds } },
      include: { artists: true, album: true },
    });

    // Create a map for quick lookup
    const trackMap = new Map(trackDetails.map(t => [t.id, t]));

    // Build report data with correct track information
    const reportData: ShareReportData = {
      totalPlays: stats,
      userName: userName || userEmail || 'Unknown User',
      topTracks: topTracks.slice(0, 5).map(t => {
        const track = trackMap.get(t.trackId);
        return {
          name: track?.name || 'Unknown',
          artists: track?.artists.map(a => a.name).join(', ') || 'Unknown',
          playCount: t._count.trackId,
        };
      }),
      generatedAt: new Date().toISOString(),
    };

    // Create shareable report
    const report = await shareRepository.create({
      userId,
      shareId,
      title: title || `${userName || 'My'}'s Listening Report`,
      description: description || null,
      reportData: JSON.stringify(reportData),
      dateRange: dateRange || 'all',
    });

    return {
      shareId: report.shareId,
      shareUrl: `${process.env.NEXTAUTH_URL}/share/${report.shareId}`,
      title: report.title,
      createdAt: report.createdAt.toISOString(),
    };
  }

  /**
   * Get a public shareable report by shareId
   */
  async getPublicShareReport(shareId: string): Promise<PublicShareReportResponse> {
    if (!shareId) {
      throwError(ErrorCode.BAD_REQUEST, 'Share ID is required');
    }

    const report = await shareRepository.findByShareId(shareId);

    if (!report) {
      throwError(ErrorCode.NOT_FOUND, 'Report not found');
    }

    if (!report.isPublic) {
      throwError(ErrorCode.NOT_FOUND, 'Report not found');
    }

    // Increment view count (don't await to avoid blocking response)
    shareRepository.incrementViewCount(report.id).catch(error => {
      console.error('[ShareService] Failed to increment view count:', error);
    });

    return {
      title: report.title,
      description: report.description,
      reportData: JSON.parse(report.reportData) as ShareReportData,
      createdAt: report.createdAt,
      viewCount: report.viewCount + 1,
      userName: report.user.name || 'Unknown User',
      userImage: report.user.image,
    };
  }

  /**
   * Get all reports for a user
   */
  async getUserReports(userId: string, page: number = 1, pageSize: number = 10) {
    return shareRepository.findByUserId(userId, page, pageSize);
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId: string, userId: string): Promise<void> {
    const report = await prisma.shareableReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throwError(ErrorCode.NOT_FOUND, 'Report not found');
    }

    if (report.userId !== userId) {
      throwError(ErrorCode.FORBIDDEN, 'You do not have permission to delete this report');
    }

    await shareRepository.delete(reportId);
  }

  /**
   * Update report visibility
   */
  async updateReportVisibility(
    reportId: string,
    userId: string,
    isPublic: boolean
  ): Promise<void> {
    const report = await prisma.shareableReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throwError(ErrorCode.NOT_FOUND, 'Report not found');
    }

    if (report.userId !== userId) {
      throwError(ErrorCode.FORBIDDEN, 'You do not have permission to update this report');
    }

    await shareRepository.updateVisibility(reportId, isPublic);
  }
}

// Export singleton instance
export const shareService = new ShareService();
