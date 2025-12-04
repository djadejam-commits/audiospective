// src/services/archival-service.ts
import { archiveUser, ArchiveResult } from '@/lib/archive-user';
import { userRepository } from '@/repositories/user-repository';
import { ErrorCode, throwError } from '@/lib/error-handler';
import { BatchArchivalResponse } from '@/dto/archival.dto';

/**
 * Archival Service - Business logic for user archival operations
 */
export class ArchivalService {
  /**
   * Archive a single user's listening history
   */
  async archiveSingleUser(userId: string): Promise<ArchiveResult> {
    // Verify user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throwError(ErrorCode.NOT_FOUND, 'User not found', { userId });
    }

    if (!user.isActive) {
      throwError(ErrorCode.BAD_REQUEST, 'User account is not active', { userId });
    }

    // Archive the user's tracks
    const result = await archiveUser(userId);
    return result;
  }

  /**
   * Archive multiple users in batch
   */
  async archiveBatch(userIds: string[]): Promise<BatchArchivalResponse> {
    const results = await Promise.allSettled(
      userIds.map(async (userId) => {
        const result = await archiveUser(userId);
        return {
          userId,
          ...result,
        };
      })
    );

    let successful = 0;
    let failed = 0;
    let skipped = 0;

    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        const { userId, status, songsArchived, reason, error } = result.value;

        if (status === 'success') {
          successful++;
        } else if (status === 'skipped') {
          skipped++;
        } else {
          failed++;
        }

        return {
          userId,
          status,
          songsArchived,
          error: error || reason,
        };
      } else {
        // Promise rejected
        failed++;
        return {
          userId: userIds[index],
          status: 'failed' as const,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    return {
      totalUsers: userIds.length,
      successful,
      failed,
      skipped,
      results: processedResults,
    };
  }

  /**
   * Archive all active users
   */
  async archiveAllActiveUsers(): Promise<BatchArchivalResponse> {
    const activeUsers = await userRepository.findActiveUsers();
    const userIds = activeUsers.map(u => u.id);

    console.log(`[ArchivalService] Starting batch archival for ${userIds.length} active users`);

    return this.archiveBatch(userIds);
  }

  /**
   * Get archival status for a user
   */
  async getUserArchivalStatus(userId: string) {
    const user = await userRepository.findByIdWithSelect(userId, {
      id: true,
      lastPolledAt: true,
      lastSuccessfulScrobble: true,
      consecutiveFailures: true,
      lastFailedAt: true,
      lastFailureType: true,
      isActive: true,
    });

    if (!user) {
      throwError(ErrorCode.NOT_FOUND, 'User not found', { userId });
    }

    return {
      userId: user.id,
      lastPolledAt: user.lastPolledAt,
      lastSuccessfulScrobble: user.lastSuccessfulScrobble,
      consecutiveFailures: user.consecutiveFailures,
      lastFailedAt: user.lastFailedAt,
      lastFailureType: user.lastFailureType,
      isActive: user.isActive,
      status: user.consecutiveFailures > 0 ? 'degraded' : 'healthy',
    };
  }
}

// Export singleton instance
export const archivalService = new ArchivalService();
