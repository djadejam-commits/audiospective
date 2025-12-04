export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TokenRefreshError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

/**
 * Refreshes the Spotify access token using a refresh token.
 *
 * CRITICAL: Spotify may rotate refresh tokens. Always save the new refreshToken
 * returned in the response to prevent token death spiral (EC-AUTH-001).
 *
 * @param refreshToken - The Spotify refresh token
 * @returns New access token, refresh token (if rotated), and expiration time
 * @throws TokenRefreshError if the refresh fails
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown' }));
    throw new TokenRefreshError(
      `Token refresh failed: ${error.error_description || error.error}`,
      error.error
    );
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    // CRITICAL: Use new refresh token if rotated, otherwise keep the old one
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in
  };
}
