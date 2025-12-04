// tests/integration/api/stats.test.ts
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
    }
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

  it('should return user stats when authenticated', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1', name: 'Test User', email: 'test@example.com' }
    });

    // Mock total plays count
    (prisma.playEvent.count as any).mockResolvedValue(100);

    // Mock unique tracks
    (prisma.playEvent.findMany as any)
      .mockResolvedValueOnce([
        { trackId: 'track1' },
        { trackId: 'track2' },
        { trackId: 'track3' }
      ])
      // Mock unique artists query
      .mockResolvedValueOnce([
        {
          track: {
            artists: [
              { id: 'artist1', name: 'Artist 1' },
              { id: 'artist2', name: 'Artist 2' }
            ]
          }
        },
        {
          track: {
            artists: [
              { id: 'artist1', name: 'Artist 1' }
            ]
          }
        }
      ])
      // Mock unique albums query
      .mockResolvedValueOnce([
        { track: { albumId: 'album1' } },
        { track: { albumId: 'album2' } },
        { track: { albumId: 'album1' } }
      ]);

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
      uniqueArtists: 2, // artist1 and artist2
      uniqueAlbums: 2, // album1 and album2
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
    (prisma.playEvent.findMany as any)
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValue([]);
    (prisma.playEvent.findFirst as any)
      .mockResolvedValue(null)
      .mockResolvedValue(null);

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
    (prisma.playEvent.findFirst as any)
      .mockResolvedValue(null)
      .mockResolvedValue(null);

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
