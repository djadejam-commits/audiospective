/**
 * Token refresh buffer configuration.
 *
 * CRITICAL: The 5-minute buffer ensures tokens are refreshed BEFORE they expire,
 * preventing 401 errors from the Spotify API (EC-AUTH-001: Token Death Spiral).
 */
const BUFFER_SECONDS = 5 * 60; // 5 minutes

/**
 * Checks if a token needs to be refreshed based on its expiration time.
 *
 * Returns true if the token will expire within 5 minutes, ensuring proactive
 * refresh before the token becomes invalid.
 *
 * @param expiresAt - Unix timestamp (in seconds) when the token expires
 * @returns true if token should be refreshed now
 */
export function needsRefresh(expiresAt: number): boolean {
  const expirationTime = (expiresAt * 1000) - (BUFFER_SECONDS * 1000);
  return Date.now() >= expirationTime;
}

/**
 * Calculates how many minutes remain until a token expires.
 *
 * Useful for logging and debugging token refresh behavior.
 *
 * @param expiresAt - Unix timestamp (in seconds) when the token expires
 * @returns Minutes until expiration (can be negative if already expired)
 */
export function minutesUntilExpiry(expiresAt: number): number {
  return Math.floor((expiresAt * 1000 - Date.now()) / 1000 / 60);
}

/**
 * Utility to sleep for a specified duration.
 *
 * Used for implementing retry delays and backoff strategies.
 *
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
