import { sleep } from "./token-utils";

/**
 * Custom error class for Spotify API errors.
 *
 * Includes status code and optional retry-after header for 429 rate limit errors.
 */
export class SpotifyAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'SpotifyAPIError';
  }
}

/**
 * Makes a request to the Spotify API with proper error handling.
 *
 * Handles:
 * - 401 Unauthorized (token expired/invalid)
 * - 429 Rate Limit (extracts Retry-After header)
 * - Other HTTP errors
 *
 * @param endpoint - Spotify API endpoint (e.g., "/v1/me/player/recently-played")
 * @param accessToken - Valid Spotify access token
 * @returns Parsed JSON response
 * @throws SpotifyAPIError with appropriate status code
 */
export async function fetchSpotifyAPI<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(`https://api.spotify.com${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  // Handle rate limits (429)
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    throw new SpotifyAPIError(
      'Rate limit exceeded',
      429,
      retryAfter
    );
  }

  // Handle auth errors (401)
  if (response.status === 401) {
    throw new SpotifyAPIError('Unauthorized - token may be expired', 401);
  }

  // Handle other errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new SpotifyAPIError(
      error.error?.message || 'Spotify API error',
      response.status
    );
  }

  return response.json();
}

/**
 * Calculates exponential backoff delay with jitter.
 *
 * Prevents thundering herd problem by adding randomness to retry delays.
 * Based on best practices from jjsizemore's analysis.
 *
 * @param retryCount - Current retry attempt (0-based)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns Delay in milliseconds with jitter added
 */
function calculateBackoffDelay(retryCount: number, baseDelay = 1000): number {
  // Exponential backoff: baseDelay * 2^retryCount, capped at 30 seconds
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), 30000);
  // Add jitter: random value between 0-1000ms
  const jitter = Math.random() * 1000;
  return exponentialDelay + jitter;
}

/**
 * Makes a request to the Spotify API with automatic retries and exponential backoff.
 *
 * Retry behavior:
 * - 401 errors: No retry (indicates auth failure)
 * - 429 rate limits: Waits for Retry-After duration, then continues
 * - Other errors: Exponential backoff with jitter (max 3 attempts)
 *
 * @param endpoint - Spotify API endpoint
 * @param accessToken - Valid Spotify access token
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Parsed JSON response
 * @throws SpotifyAPIError if all retries fail
 */
export async function fetchSpotifyAPIWithRetry<T>(
  endpoint: string,
  accessToken: string,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchSpotifyAPI<T>(endpoint, accessToken);
    } catch (error) {
      lastError = error as Error;

      if (error instanceof SpotifyAPIError) {
        // Don't retry auth errors - these require token refresh
        if (error.statusCode === 401) {
          throw error;
        }

        // Respect Retry-After for 429 rate limits
        if (error.statusCode === 429) {
          const waitTime = (error.retryAfter || 60) * 1000;
          console.warn(`[Spotify API] Rate limited, waiting ${waitTime}ms`);
          await sleep(waitTime);
          continue;
        }
      }

      // Exponential backoff for other errors
      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        console.warn(
          `[Spotify API] Request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Spotify API response types
 */
export interface RecentlyPlayedResponse {
  items: Array<{
    track: {
      id: string;
      name: string;
      duration_ms: number;
      album: {
        id: string;
        name: string;
        images: Array<{ url: string; height: number; width: number }>;
      };
      artists: Array<{
        id: string;
        name: string;
      }>;
    };
    played_at: string;
  }>;
  next?: string;
  cursors?: {
    after: string;
    before: string;
  };
}

/**
 * Fetches the user's recently played tracks from Spotify.
 *
 * Returns up to `limit` tracks (max 50). Uses single API call strategy
 * for first-time users as per implementation plan.
 *
 * @param accessToken - Valid Spotify access token
 * @param limit - Number of tracks to fetch (1-50, default: 50)
 * @returns Recently played tracks
 */
export async function getRecentlyPlayed(
  accessToken: string,
  limit = 50
): Promise<RecentlyPlayedResponse> {
  return fetchSpotifyAPIWithRetry<RecentlyPlayedResponse>(
    `/v1/me/player/recently-played?limit=${limit}`,
    accessToken
  );
}

/**
 * Spotify Artist Details Response
 */
export interface ArtistDetails {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: Array<{ url: string; height: number; width: number }>;
}

/**
 * Fetches full details for multiple artists from Spotify.
 *
 * The Spotify API allows fetching up to 50 artists in a single request.
 * This function chunks artist IDs and fetches them in batches.
 *
 * @param accessToken - Valid Spotify access token
 * @param artistIds - Array of Spotify artist IDs
 * @returns Array of artist details with genres
 */
export async function getArtists(
  accessToken: string,
  artistIds: string[]
): Promise<ArtistDetails[]> {
  if (artistIds.length === 0) {
    return [];
  }

  // Spotify API allows max 50 artists per request
  const chunkSize = 50;
  const chunks: string[][] = [];

  for (let i = 0; i < artistIds.length; i += chunkSize) {
    chunks.push(artistIds.slice(i, i + chunkSize));
  }

  // Fetch all chunks in parallel
  const responses = await Promise.all(
    chunks.map(chunk =>
      fetchSpotifyAPIWithRetry<{ artists: ArtistDetails[] }>(
        `/v1/artists?ids=${chunk.join(',')}`,
        accessToken
      )
    )
  );

  // Flatten results
  return responses.flatMap(response => response.artists);
}
