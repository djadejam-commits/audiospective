import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { ensureFreshToken } from '@/lib/ensure-fresh-token';
import { getRecentlyPlayed } from '@/lib/spotify-api';
import { prisma } from '@/lib/prisma';

/**
 * Test endpoint to verify Spotify token refresh and API access.
 *
 * This endpoint:
 * 1. Checks user authentication
 * 2. Ensures token is fresh (uses JIT refresh if needed)
 * 3. Fetches recently played tracks from Spotify
 * 4. Returns token status and track count
 *
 * Use this to verify Phase 1 implementation (EC-AUTH-001: Token Death Spiral prevention).
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        spotifyId: true,
        tokenExpiresAt: true,
        consecutiveFailures: true,
        lastSuccessfulScrobble: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Ensure fresh token (JIT refresh if needed)
    const { accessToken, expiresAt } = await ensureFreshToken(user.id);

    const now = Math.floor(Date.now() / 1000);
    const minutesUntilExpiry = Math.floor((expiresAt - now) / 60);

    // Fetch recently played tracks
    const recentlyPlayed = await getRecentlyPlayed(accessToken, 10);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        spotifyId: user.spotifyId,
      },
      token: {
        expiresAt,
        minutesUntilExpiry,
        isValid: minutesUntilExpiry > 0,
      },
      spotify: {
        tracksCount: recentlyPlayed.items.length,
        tracks: recentlyPlayed.items.map(item => ({
          name: item.track.name,
          artist: item.track.artists[0]?.name,
          playedAt: item.played_at,
        })),
      },
      healthCheck: {
        consecutiveFailures: user.consecutiveFailures,
        lastSuccessfulScrobble: user.lastSuccessfulScrobble,
      },
    });
  } catch (error) {
    console.error('[Test Endpoint] Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name,
      },
      { status: 500 }
    );
  }
}
