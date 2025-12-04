// src/lib/metadata-upsert.ts
import { prisma } from './prisma';

/**
 * Upserts an artist record, handling race conditions gracefully
 */
export async function upsertArtist(artist: {
  id: string;
  name: string;
  genres?: string[];
}) {
  try {
    return await prisma.artist.upsert({
      where: { spotifyId: artist.id },
      update: {
        name: artist.name,
        genres: artist.genres?.join(',') || ''
      },
      create: {
        spotifyId: artist.id,
        name: artist.name,
        genres: artist.genres?.join(',') || ''
      }
    });
  } catch (error: any) {
    // Handle race condition (P2002 = unique constraint violation)
    if (error.code === 'P2002') {
      // Another job just created this artist, fetch it
      return await prisma.artist.findUniqueOrThrow({
        where: { spotifyId: artist.id }
      });
    }
    throw error;
  }
}

/**
 * Upserts an album record, handling race conditions gracefully
 */
export async function upsertAlbum(album: {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
}) {
  try {
    return await prisma.album.upsert({
      where: { spotifyId: album.id },
      update: {
        name: album.name,
        imageUrl: album.images?.[0]?.url || null
      },
      create: {
        spotifyId: album.id,
        name: album.name,
        imageUrl: album.images?.[0]?.url || null
      }
    });
  } catch (error: any) {
    // Handle race condition
    if (error.code === 'P2002') {
      return await prisma.album.findUniqueOrThrow({
        where: { spotifyId: album.id }
      });
    }
    throw error;
  }
}

/**
 * Upserts a track with its album and artists, handling all race conditions
 */
export async function upsertTrack(track: {
  id: string;
  name: string;
  duration_ms: number;
  album?: { id: string; name: string; images?: Array<{ url: string }> };
  artists: Array<{ id: string; name: string }>;
}) {
  // Upsert album first (if exists)
  const albumRecord = track.album ? await upsertAlbum(track.album) : null;

  // Upsert artists
  const artistRecords = await Promise.all(
    track.artists.map(artist => upsertArtist(artist))
  );

  // Upsert track
  try {
    // First, try to upsert the track
    const trackRecord = await prisma.track.upsert({
      where: { spotifyId: track.id },
      update: {
        name: track.name,
        durationMs: track.duration_ms,
        albumId: albumRecord?.id || null
      },
      create: {
        spotifyId: track.id,
        name: track.name,
        durationMs: track.duration_ms,
        albumId: albumRecord?.id || null
      }
    });

    // Connect artists (many-to-many)
    // Use set to replace existing connections
    await prisma.track.update({
      where: { id: trackRecord.id },
      data: {
        artists: {
          set: artistRecords.map(a => ({ id: a.id }))
        }
      }
    });

    return trackRecord;
  } catch (error: any) {
    // Handle race condition
    if (error.code === 'P2002') {
      return await prisma.track.findUniqueOrThrow({
        where: { spotifyId: track.id }
      });
    }
    throw error;
  }
}

/**
 * Creates a play event for a user, handling deduplication via unique constraint
 */
export async function createPlayEvent(
  userId: string,
  trackSpotifyId: string,
  playedAt: string | Date
) {
  try {
    // Find the track first
    const track = await prisma.track.findUniqueOrThrow({
      where: { spotifyId: trackSpotifyId }
    });

    // Create play event (will fail if duplicate due to unique constraint)
    return await prisma.playEvent.create({
      data: {
        userId,
        trackId: track.id,
        playedAt: typeof playedAt === 'string' ? new Date(playedAt) : playedAt
      }
    });
  } catch (error: any) {
    // Ignore duplicate errors (P2002)
    if (error.code === 'P2002') {
      // This play event already exists, which is fine
      return null;
    }
    throw error;
  }
}
