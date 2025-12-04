// src/repositories/user-repository.ts
import { prisma } from '@/lib/prisma';
import { User, Prisma } from '@prisma/client';

/**
 * User Repository - Abstracts database operations for User entity
 */
export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by ID with specific fields
   */
  async findByIdWithSelect<T extends Prisma.UserSelect>(
    id: string,
    select: T
  ): Promise<Prisma.UserGetPayload<{ select: T }> | null> {
    return prisma.user.findUnique({
      where: { id },
      select,
    });
  }

  /**
   * Find user by Spotify ID
   */
  async findBySpotifyId(spotifyId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { spotifyId },
    });
  }

  /**
   * Find all active users (for batch processing)
   */
  async findActiveUsers(): Promise<User[]> {
    return prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update user's last polled timestamp
   */
  async updateLastPolled(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { lastPolledAt: new Date() },
    });
  }

  /**
   * Update user's last successful scrobble timestamp
   */
  async updateLastSuccessfulScrobble(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { lastSuccessfulScrobble: new Date() },
    });
  }

  /**
   * Update user's access token and expiry
   */
  async updateTokens(
    userId: string,
    data: {
      accessToken: string;
      refreshToken?: string;
      tokenExpiresAt: number; // Unix timestamp in seconds
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Record user failure (for circuit breaker)
   */
  async recordFailure(
    userId: string,
    failureType: 'AUTH' | 'NETWORK' | 'UNKNOWN'
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        consecutiveFailures: { increment: 1 },
        lastFailedAt: new Date(),
        lastFailureType: failureType,
      },
    });
  }

  /**
   * Record user success (resets failure tracking)
   */
  async recordSuccess(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        consecutiveFailures: 0,
        lastFailedAt: null,
        lastFailureType: null,
        lastSuccessfulScrobble: new Date(),
      },
    });
  }

  /**
   * Delete user and all related data (GDPR)
   */
  async deleteUser(userId: string): Promise<User> {
    return prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Get user count for stats
   */
  async count(): Promise<number> {
    return prisma.user.count();
  }

  /**
   * Get user with related data counts
   */
  async findByIdWithCounts(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        spotifyId: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            playEvents: true,
            reports: true,
          },
        },
      },
    });
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
