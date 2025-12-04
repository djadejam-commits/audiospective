// tests/unit/lib/archive-user.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { archiveUser } from '@/lib/archive-user';
import { SpotifyAPIError } from '@/lib/spotify-api';

// Mock all dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn()
    }
  }
}));

vi.mock('@/lib/ensure-fresh-token', () => ({
  ensureFreshToken: vi.fn()
}));

vi.mock('@/lib/spotify-api', () => ({
  getRecentlyPlayed: vi.fn(),
  getArtists: vi.fn(),
  SpotifyAPIError: class SpotifyAPIError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message);
      this.name = 'SpotifyAPIError';
    }
  }
}));

vi.mock('@/lib/metadata-upsert', () => ({
  upsertTrack: vi.fn(),
  createPlayEvent: vi.fn(),
  upsertArtist: vi.fn()
}));

vi.mock('@/lib/idempotency', () => ({
  generateIdempotencyKey: vi.fn(() => 'test-key'),
  isJobComplete: vi.fn(),
  markJobComplete: vi.fn()
}));

vi.mock('@/lib/circuit-breaker', () => ({
  recordSuccess: vi.fn(),
  recordFailure: vi.fn()
}));

import { prisma } from '@/lib/prisma';
import { ensureFreshToken } from '@/lib/ensure-fresh-token';
import { getRecentlyPlayed, getArtists } from '@/lib/spotify-api';
import { upsertTrack, createPlayEvent, upsertArtist } from '@/lib/metadata-upsert';
import { generateIdempotencyKey, isJobComplete, markJobComplete } from '@/lib/idempotency';
import { recordSuccess, recordFailure } from '@/lib/circuit-breaker';

describe('Archive User', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up Redis env vars for idempotency checks
    process.env.UPSTASH_REDIS_URL = 'https://test-redis.upstash.io';
    process.env.UPSTASH_REDIS_TOKEN = 'test-token';

    // Reset idempotency check to false by default
    (isJobComplete as any).mockResolvedValue(false);
  });

  it('should successfully archive user tracks', async () => {
    // Mock fresh token
    (ensureFreshToken as any).mockResolvedValue({
      accessToken: 'fresh-token',
      expiresAt: Math.floor(Date.now() / 1000) + 3600
    });

    // Mock recently played tracks
    const mockTracks = {
      items: [
        {
          track: {
            id: 'track1',
            name: 'Song 1',
            artists: [{ id: 'artist1', name: 'Artist 1' }],
            album: { id: 'album1', name: 'Album 1' }
          },
          played_at: '2024-01-01T12:00:00Z'
        },
        {
          track: {
            id: 'track2',
            name: 'Song 2',
            artists: [{ id: 'artist2', name: 'Artist 2' }],
            album: { id: 'album2', name: 'Album 2' }
          },
          played_at: '2024-01-01T12:05:00Z'
        }
      ]
    };
    (getRecentlyPlayed as any).mockResolvedValue(mockTracks);

    // Mock artist details
    (getArtists as any).mockResolvedValue([
      { id: 'artist1', name: 'Artist 1', genres: ['rock'] },
      { id: 'artist2', name: 'Artist 2', genres: ['pop'] }
    ]);

    // Mock successful upserts
    (upsertArtist as any).mockResolvedValue({});
    (upsertTrack as any).mockResolvedValue({});
    (createPlayEvent as any).mockResolvedValue({ id: 'event1' });

    // Mock database update
    (prisma.user.update as any).mockResolvedValue({});

    const result = await archiveUser('user1');

    expect(result.status).toBe('success');
    expect(result.songsArchived).toBe(2);
    expect(ensureFreshToken).toHaveBeenCalledWith('user1');
    expect(getRecentlyPlayed).toHaveBeenCalledWith('fresh-token', 50);
    expect(upsertTrack).toHaveBeenCalledTimes(2);
    expect(createPlayEvent).toHaveBeenCalledTimes(2);
    expect(recordSuccess).toHaveBeenCalledWith(prisma, 'user1');
  });

  it('should skip if job already completed (idempotency)', async () => {
    (isJobComplete as any).mockResolvedValue(true);

    const result = await archiveUser('user1');

    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('already_completed');
    expect(ensureFreshToken).not.toHaveBeenCalled();
    expect(getRecentlyPlayed).not.toHaveBeenCalled();
  });

  it('should handle case with no tracks found', async () => {
    (ensureFreshToken as any).mockResolvedValue({ accessToken: 'token' });
    (getRecentlyPlayed as any).mockResolvedValue({ items: [] });

    const result = await archiveUser('user1');

    expect(result.status).toBe('success');
    expect(result.songsArchived).toBe(0);
    expect(markJobComplete).toHaveBeenCalled();
    expect(recordSuccess).toHaveBeenCalled();
  });

  it('should handle AUTH failure and record it', async () => {
    (ensureFreshToken as any).mockRejectedValue(
      new SpotifyAPIError('Unauthorized', 401)
    );

    const result = await archiveUser('user1');

    expect(result.status).toBe('failed');
    expect(result.reason).toBe('AUTH');
    expect(recordFailure).toHaveBeenCalledWith(prisma, 'user1', 'AUTH');
  });

  it('should handle NETWORK failure (429 rate limit)', async () => {
    (ensureFreshToken as any).mockResolvedValue({ accessToken: 'token' });
    (getRecentlyPlayed as any).mockRejectedValue(
      new SpotifyAPIError('Too Many Requests', 429)
    );

    const result = await archiveUser('user1');

    expect(result.status).toBe('failed');
    expect(result.reason).toBe('NETWORK');
    expect(recordFailure).toHaveBeenCalledWith(prisma, 'user1', 'NETWORK');
  });

  it('should handle NETWORK failure (500 server error)', async () => {
    (ensureFreshToken as any).mockResolvedValue({ accessToken: 'token' });
    (getRecentlyPlayed as any).mockRejectedValue(
      new SpotifyAPIError('Internal Server Error', 500)
    );

    const result = await archiveUser('user1');

    expect(result.status).toBe('failed');
    expect(result.reason).toBe('NETWORK');
  });

  it('should handle UNKNOWN failure', async () => {
    (ensureFreshToken as any).mockResolvedValue({ accessToken: 'token' });
    (getRecentlyPlayed as any).mockRejectedValue(
      new Error('Unexpected error')
    );

    const result = await archiveUser('user1');

    expect(result.status).toBe('failed');
    expect(result.reason).toBe('UNKNOWN');
    expect(recordFailure).toHaveBeenCalledWith(prisma, 'user1', 'UNKNOWN');
  });

  it('should continue processing even if individual track fails', async () => {
    (ensureFreshToken as any).mockResolvedValue({ accessToken: 'token' });
    (getRecentlyPlayed as any).mockResolvedValue({
      items: [
        {
          track: {
            id: 'track1',
            name: 'Song 1',
            artists: [{ id: 'artist1', name: 'Artist 1' }]
          },
          played_at: '2024-01-01T12:00:00Z'
        },
        {
          track: {
            id: 'track2',
            name: 'Song 2',
            artists: [{ id: 'artist2', name: 'Artist 2' }]
          },
          played_at: '2024-01-01T12:05:00Z'
        }
      ]
    });

    (getArtists as any).mockResolvedValue([
      { id: 'artist1', name: 'Artist 1', genres: [] },
      { id: 'artist2', name: 'Artist 2', genres: [] }
    ]);

    (upsertArtist as any).mockResolvedValue({});

    // First track succeeds, second fails
    (upsertTrack as any).mockResolvedValueOnce({});
    (upsertTrack as any).mockRejectedValueOnce(new Error('Database error'));

    (createPlayEvent as any).mockResolvedValue({ id: 'event1' });
    (prisma.user.update as any).mockResolvedValue({});

    const result = await archiveUser('user1');

    // Should still succeed overall, but only 1 track archived
    expect(result.status).toBe('success');
    expect(result.songsArchived).toBe(1);
  });

  it('should skip idempotency check when Redis not configured', async () => {
    // Remove Redis env vars
    delete process.env.UPSTASH_REDIS_URL;
    delete process.env.UPSTASH_REDIS_TOKEN;

    (ensureFreshToken as any).mockResolvedValue({ accessToken: 'token' });
    (getRecentlyPlayed as any).mockResolvedValue({ items: [] });

    await archiveUser('user1');

    expect(isJobComplete).not.toHaveBeenCalled();
    expect(markJobComplete).not.toHaveBeenCalled();
  });

  it('should fetch and upsert artist genres', async () => {
    (ensureFreshToken as any).mockResolvedValue({ accessToken: 'token' });
    (getRecentlyPlayed as any).mockResolvedValue({
      items: [
        {
          track: {
            id: 'track1',
            name: 'Song 1',
            artists: [
              { id: 'artist1', name: 'Artist 1' },
              { id: 'artist2', name: 'Artist 2' }
            ]
          },
          played_at: '2024-01-01T12:00:00Z'
        }
      ]
    });

    (getArtists as any).mockResolvedValue([
      { id: 'artist1', name: 'Artist 1', genres: ['rock', 'indie'] },
      { id: 'artist2', name: 'Artist 2', genres: ['pop'] }
    ]);

    (upsertArtist as any).mockResolvedValue({});
    (upsertTrack as any).mockResolvedValue({});
    (createPlayEvent as any).mockResolvedValue({ id: 'event1' });
    (prisma.user.update as any).mockResolvedValue({});

    await archiveUser('user1');

    expect(getArtists).toHaveBeenCalledWith('token', ['artist1', 'artist2']);
    expect(upsertArtist).toHaveBeenCalledWith({
      id: 'artist1',
      name: 'Artist 1',
      genres: ['rock', 'indie']
    });
    expect(upsertArtist).toHaveBeenCalledWith({
      id: 'artist2',
      name: 'Artist 2',
      genres: ['pop']
    });
  });

  it('should mark job complete after successful archival', async () => {
    (ensureFreshToken as any).mockResolvedValue({ accessToken: 'token' });
    (getRecentlyPlayed as any).mockResolvedValue({ items: [] });

    await archiveUser('user1');

    expect(markJobComplete).toHaveBeenCalledWith('test-key');
  });
});
