// tests/unit/lib/circuit-breaker.test.ts
import { describe, it, expect, vi } from 'vitest';
import { filterUsersWithCircuitBreaker, recordFailure, recordSuccess } from '@/lib/circuit-breaker';
import type { UserWithFailureTracking } from '@/lib/circuit-breaker';

describe('Circuit Breaker', () => {
  describe('filterUsersWithCircuitBreaker', () => {
    it('should include users with no failures', () => {
      const users: UserWithFailureTracking[] = [
        {
          id: 'user1',
          consecutiveFailures: 0,
          lastFailureType: null,
          lastFailedAt: null
        }
      ];

      const result = filterUsersWithCircuitBreaker(users);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user1');
    });

    it('should exclude users in cooldown period', () => {
      const now = new Date();
      const recentFailure = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

      const users: UserWithFailureTracking[] = [
        {
          id: 'user1',
          consecutiveFailures: 1,
          lastFailureType: 'AUTH',
          lastFailedAt: recentFailure // AUTH base cooldown is 30 min
        }
      ];

      const result = filterUsersWithCircuitBreaker(users);

      expect(result).toHaveLength(0);
    });

    it('should include users past cooldown period', () => {
      const now = new Date();
      const oldFailure = new Date(now.getTime() - 40 * 60 * 1000); // 40 minutes ago

      const users: UserWithFailureTracking[] = [
        {
          id: 'user1',
          consecutiveFailures: 1,
          lastFailureType: 'AUTH',
          lastFailedAt: oldFailure // AUTH base cooldown is 30 min, so 40 min is past cooldown
        }
      ];

      const result = filterUsersWithCircuitBreaker(users);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user1');
    });

    it('should calculate exponential backoff correctly', () => {
      const now = new Date();

      // 1 failure: 30 min cooldown
      const failure1 = new Date(now.getTime() - 25 * 60 * 1000); // 25 min ago
      const user1: UserWithFailureTracking = {
        id: 'user1',
        consecutiveFailures: 1,
        lastFailureType: 'AUTH',
        lastFailedAt: failure1
      };

      // 2 failures: 60 min cooldown (30 * 2^1)
      const failure2 = new Date(now.getTime() - 50 * 60 * 1000); // 50 min ago
      const user2: UserWithFailureTracking = {
        id: 'user2',
        consecutiveFailures: 2,
        lastFailureType: 'AUTH',
        lastFailedAt: failure2
      };

      // 3 failures: 120 min cooldown (30 * 2^2)
      const failure3 = new Date(now.getTime() - 100 * 60 * 1000); // 100 min ago
      const user3: UserWithFailureTracking = {
        id: 'user3',
        consecutiveFailures: 3,
        lastFailureType: 'AUTH',
        lastFailedAt: failure3
      };

      const result = filterUsersWithCircuitBreaker([user1, user2, user3]);

      // user1: 25 min < 30 min - excluded
      // user2: 50 min < 60 min - excluded
      // user3: 100 min < 120 min - excluded
      expect(result).toHaveLength(0);
    });

    it('should cap cooldown at maximum', () => {
      const now = new Date();
      // AUTH max is 240 minutes
      const failure = new Date(now.getTime() - 250 * 60 * 1000); // 250 min ago

      const user: UserWithFailureTracking = {
        id: 'user1',
        consecutiveFailures: 10, // Should result in huge cooldown, but capped at 240
        lastFailureType: 'AUTH',
        lastFailedAt: failure
      };

      const result = filterUsersWithCircuitBreaker([user]);

      // 250 min > 240 min max - should be included
      expect(result).toHaveLength(1);
    });

    it('should handle different failure types', () => {
      const now = new Date();

      // NETWORK: base 10, max 60
      const networkFailure = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago
      const networkUser: UserWithFailureTracking = {
        id: 'user1',
        consecutiveFailures: 1,
        lastFailureType: 'NETWORK',
        lastFailedAt: networkFailure // 5 min < 10 min base
      };

      // UNKNOWN: base 20, max 180
      const unknownFailure = new Date(now.getTime() - 15 * 60 * 1000); // 15 min ago
      const unknownUser: UserWithFailureTracking = {
        id: 'user2',
        consecutiveFailures: 1,
        lastFailureType: 'UNKNOWN',
        lastFailedAt: unknownFailure // 15 min < 20 min base
      };

      const result = filterUsersWithCircuitBreaker([networkUser, unknownUser]);

      // Both should be excluded (still in cooldown)
      expect(result).toHaveLength(0);
    });

    it('should handle multiple users with mixed states', () => {
      const now = new Date();

      const users: UserWithFailureTracking[] = [
        // No failures - should be included
        {
          id: 'user1',
          consecutiveFailures: 0,
          lastFailureType: null,
          lastFailedAt: null
        },
        // In cooldown - should be excluded
        {
          id: 'user2',
          consecutiveFailures: 1,
          lastFailureType: 'AUTH',
          lastFailedAt: new Date(now.getTime() - 10 * 60 * 1000)
        },
        // Past cooldown - should be included
        {
          id: 'user3',
          consecutiveFailures: 1,
          lastFailureType: 'NETWORK',
          lastFailedAt: new Date(now.getTime() - 15 * 60 * 1000) // 15 min > 10 min base
        }
      ];

      const result = filterUsersWithCircuitBreaker(users);

      expect(result).toHaveLength(2);
      expect(result.map(u => u.id)).toEqual(['user1', 'user3']);
    });
  });

  describe('recordFailure', () => {
    it('should increment consecutive failures and record failure details', async () => {
      const mockPrisma = {
        user: {
          update: vi.fn().mockResolvedValue({})
        }
      };

      await recordFailure(mockPrisma, 'user1', 'AUTH');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: {
          consecutiveFailures: { increment: 1 },
          lastFailureType: 'AUTH',
          lastFailedAt: expect.any(Date)
        }
      });
    });

    it('should handle different failure types', async () => {
      const mockPrisma = {
        user: {
          update: vi.fn().mockResolvedValue({})
        }
      };

      await recordFailure(mockPrisma, 'user1', 'NETWORK');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastFailureType: 'NETWORK'
          })
        })
      );
    });
  });

  describe('recordSuccess', () => {
    it('should reset failure tracking on success', async () => {
      const mockPrisma = {
        user: {
          update: vi.fn().mockResolvedValue({})
        }
      };

      await recordSuccess(mockPrisma, 'user1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: {
          lastSuccessfulScrobble: expect.any(Date),
          consecutiveFailures: 0,
          lastFailureType: null,
          lastFailedAt: null
        }
      });
    });
  });
});
