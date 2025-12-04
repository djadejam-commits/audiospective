// src/lib/circuit-breaker.ts

/**
 * Circuit breaker configuration for different failure types
 * - AUTH: Authentication failures (longest cooldown)
 * - NETWORK: Network/connectivity issues
 * - UNKNOWN: Unexpected errors
 */
const COOLDOWN_CONFIG = {
  AUTH: { base: 30, max: 240 },      // 30 min base, 4 hour max
  NETWORK: { base: 10, max: 60 },    // 10 min base, 1 hour max
  UNKNOWN: { base: 20, max: 180 }    // 20 min base, 3 hour max
} as const;

type FailureType = keyof typeof COOLDOWN_CONFIG;

/**
 * Calculates cooldown period using exponential backoff
 * Formula: base * (2 ^ (failures - 1)), capped at max
 */
function calculateCooldownPeriod(
  failureType: string,
  consecutiveFailures: number
): number {
  const config = COOLDOWN_CONFIG[failureType as FailureType] || COOLDOWN_CONFIG.UNKNOWN;

  // Exponential backoff: base * (2 ^ (failures - 1))
  // Max multiplier is 8 (2^3) to prevent excessive growth
  const multiplier = Math.min(Math.pow(2, consecutiveFailures - 1), 8);
  const cooldown = config.base * multiplier;

  return Math.min(cooldown, config.max);
}

export interface UserWithFailureTracking {
  id: string;
  consecutiveFailures: number;
  lastFailureType: string | null;
  lastFailedAt: Date | null;
}

/**
 * Filters users based on circuit breaker logic
 * Users in cooldown period are excluded from processing
 */
export function filterUsersWithCircuitBreaker(
  users: UserWithFailureTracking[]
): UserWithFailureTracking[] {
  const now = new Date();

  return users.filter(user => {
    // No failures - process normally
    if (user.consecutiveFailures === 0 || !user.lastFailedAt) {
      return true;
    }

    const cooldownMinutes = calculateCooldownPeriod(
      user.lastFailureType || 'UNKNOWN',
      user.consecutiveFailures
    );

    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timeSinceLastFailure = now.getTime() - user.lastFailedAt.getTime();

    if (timeSinceLastFailure < cooldownMs) {
      const remainingMinutes = Math.round((cooldownMs - timeSinceLastFailure) / 1000 / 60);
      console.log(`[Circuit Breaker] User ${user.id} in cooldown for ${remainingMinutes} more minutes`);
      return false;
    }

    return true;
  });
}

/**
 * Records a failure for a user
 */
export async function recordFailure(
  prisma: any,
  userId: string,
  failureType: 'AUTH' | 'NETWORK' | 'UNKNOWN'
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      consecutiveFailures: { increment: 1 },
      lastFailureType: failureType,
      lastFailedAt: new Date()
    }
  });
}

/**
 * Records a success for a user (resets failure tracking)
 */
export async function recordSuccess(
  prisma: any,
  userId: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastSuccessfulScrobble: new Date(),
      consecutiveFailures: 0,
      lastFailureType: null,
      lastFailedAt: null
    }
  });
}
