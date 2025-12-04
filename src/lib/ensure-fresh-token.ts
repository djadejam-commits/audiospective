import { refreshAccessToken } from "./spotify-auth";
import { needsRefresh } from "./token-utils";
import { prisma } from "./prisma";

/**
 * Ensures a user has a fresh, valid access token before making Spotify API calls.
 *
 * This is the "Just-In-Time" (JIT) refresh strategy - a belt-and-suspenders approach
 * that complements the proactive session callback refresh. Even if the session
 * callback refresh failed or didn't run, this ensures we always have a fresh token
 * right before API calls.
 *
 * CRITICAL: This function MUST be called by background workers before every
 * Spotify API request to prevent 401 errors (EC-AUTH-001: Token Death Spiral).
 *
 * @param userId - The user ID to refresh the token for
 * @returns Fresh access token and expiration time
 * @throws Error if user not found or refresh fails
 */
export async function ensureFreshToken(userId: string): Promise<{
  accessToken: string;
  expiresAt: number;
}> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      accessToken: true,
      refreshToken: true,
      tokenExpiresAt: true,
    },
  });

  if (!user.refreshToken) {
    throw new Error(`User ${userId} has no refresh token`);
  }

  if (!user.tokenExpiresAt) {
    throw new Error(`User ${userId} has no token expiration`);
  }

  // 5-minute buffer check - refresh if token expires soon
  if (!needsRefresh(user.tokenExpiresAt)) {
    // Token is still fresh, return it
    return {
      accessToken: user.accessToken!,
      expiresAt: user.tokenExpiresAt,
    };
  }

  // Token needs refresh
  console.log(`[JIT] Refreshing token for user ${userId}`);

  const refreshed = await refreshAccessToken(user.refreshToken);

  // Save to database immediately
  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken, // CRITICAL: Update if rotated
      tokenExpiresAt: refreshed.expiresAt,
    },
  });

  console.log(`[JIT] Token refreshed successfully for user ${userId}`);

  return {
    accessToken: refreshed.accessToken,
    expiresAt: refreshed.expiresAt,
  };
}
