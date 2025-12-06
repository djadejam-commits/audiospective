// tests/integration/api/stats.test.ts
/**
 * Integration tests for /api/stats
 *
 * Prevents regression of INC-2025-12-05-001 (SQL table name mismatch)
 * Tests verify correct PostgreSQL table names are used in raw SQL queries
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/stats/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    playEvent: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn()
    },
    $queryRaw: vi.fn()
  }
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    (getServerSession as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/stats');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });

  it('should use correct PostgreSQL table names in raw SQL', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1', name: 'Test User', email: 'test@example.com' }
    });

    // Mock all the queries
    (prisma.playEvent.count as any).mockResolvedValue(100);
    (prisma.playEvent.findMany as any).mockResolvedValue([
      { trackId: 'track1' },
      { trackId: 'track2' }
    ]);

    // Mock $queryRaw for unique artists and albums
    (prisma.$queryRaw as any)
      .mockResolvedValueOnce([{ count: BigInt(5) }]) // unique artists
      .mockResolvedValueOnce([{ count: BigInt(3) }]); // unique albums

    (prisma.playEvent.findFirst as any)
      .mockResolvedValueOnce({ playedAt: new Date('2024-01-01') })
      .mockResolvedValueOnce({ playedAt: new Date('2024-01-10') });

    const req = new NextRequest('http://localhost:3000/api/stats');
    await GET(req);

    // Verify $queryRaw was called
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);

    // Check unique artists query
    const artistsQueryCall = (prisma.$queryRaw as any).mock.calls[0];
    const artistsQuery = artistsQueryCall[0].toString();

    // CRITICAL: Must use snake_case table names (INC-2025-12-05-001 prevention)
    expect(artistsQuery).toContain('play_events'); // NOT "PlayEvent"
    expect(artistsQuery).toContain('tracks'); // NOT "Track"
    expect(artistsQuery).toContain('artists'); // NOT "Artist"
    expect(artistsQuery).toContain('_TrackArtists'); // NOT "_ArtistToTrack"

    // CRITICAL: Must use snake_case column names
    expect(artistsQuery).toContain('track_id'); // NOT "trackId"
    expect(artistsQuery).toContain('user_id'); // NOT "userId"

    // Check unique albums query
    const albumsQueryCall = (prisma.$queryRaw as any).mock.calls[1];
    const albumsQuery = albumsQueryCall[0].toString();

    expect(albumsQuery).toContain('play_events');
    expect(albumsQuery).toContain('tracks');
    expect(albumsQuery).toContain('album_id');
    expect(albumsQuery).toContain('user_id');

    // Should NOT contain PascalCase table names
    expect(artistsQuery).not.toContain('"PlayEvent"');
    expect(artistsQuery).not.toContain('"Track"');
    expect(artistsQuery).not.toContain('"Artist"');
    expect(albumsQuery).not.toContain('"PlayEvent"');
    expect(albumsQuery).not.toContain('"Track"');
  });

  it('should return user stats when authenticated', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1', name: 'Test User', email: 'test@example.com' }
    });

    // Mock total plays count
    (prisma.playEvent.count as any).mockResolvedValue(100);

    // Mock unique tracks
    (prisma.playEvent.findMany as any).mockResolvedValue([
      { trackId: 'track1' },
      { trackId: 'track2' },
      { trackId: 'track3' }
    ]);

    // Mock raw SQL queries
    (prisma.$queryRaw as any)
      .mockResolvedValueOnce([{ count: BigInt(2) }]) // unique artists
      .mockResolvedValueOnce([{ count: BigInt(2) }]); // unique albums

    // Mock first play
    (prisma.playEvent.findFirst as any)
      .mockResolvedValueOnce({
        playedAt: new Date('2024-01-01T00:00:00Z')
      })
      // Mock last play
      .mockResolvedValueOnce({
        playedAt: new Date('2024-01-10T00:00:00Z')
      });

    const req = new NextRequest('http://localhost:3000/api/stats');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      totalPlays: 100,
      uniqueTracks: 3,
      uniqueArtists: 2,
      uniqueAlbums: 2,
      estimatedListeningHours: expect.any(Number),
      firstPlayAt: expect.any(String),
      lastPlayAt: expect.any(String)
    });
  });

  it('should calculate estimated listening hours correctly', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1' }
    });

    (prisma.playEvent.count as any).mockResolvedValue(20); // 20 plays * 3 min = 60 min = 1 hour
    (prisma.playEvent.findMany as any).mockResolvedValue([]);
    (prisma.$queryRaw as any)
      .mockResolvedValueOnce([{ count: BigInt(0) }])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);
    (prisma.playEvent.findFirst as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/stats');
    const response = await GET(req);
    const data = await response.json();

    expect(data.estimatedListeningHours).toBe(1);
  });

  it('should handle users with no play data', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1' }
    });

    (prisma.playEvent.count as any).mockResolvedValue(0);
    (prisma.playEvent.findMany as any).mockResolvedValue([]);
    (prisma.$queryRaw as any)
      .mockResolvedValueOnce([{ count: BigInt(0) }])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);
    (prisma.playEvent.findFirst as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/stats');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      totalPlays: 0,
      uniqueTracks: 0,
      uniqueArtists: 0,
      uniqueAlbums: 0,
      estimatedListeningHours: 0
    });
    // firstPlayAt and lastPlayAt may not be present or may be undefined
    expect([null, undefined]).toContain(data.firstPlayAt);
    expect([null, undefined]).toContain(data.lastPlayAt);
  });

  it('should handle database errors gracefully', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1' }
    });

    (prisma.playEvent.count as any).mockRejectedValue(
      new Error('Database connection failed')
    );

    const req = new NextRequest('http://localhost:3000/api/stats');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch stats');
    expect(data.message).toBe('Database connection failed');
  });

  it('should handle session with missing user ID', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { email: 'test@example.com' }
      // Missing id field
    });

    const req = new NextRequest('http://localhost:3000/api/stats');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });
});
