// tests/integration/api/share.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/share/route';
import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    playEvent: {
      count: vi.fn(),
      groupBy: vi.fn()
    },
    track: {
      findMany: vi.fn()
    },
    shareableReport: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    randomBytes: vi.fn(() => ({
      toString: () => 'abc123def456'
    }))
  };
});

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

describe('POST /api/share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  it('should return 401 if not authenticated', async () => {
    (getServerSession as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Report' })
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });

  it('should create a shareable report successfully', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1', name: 'Test User', email: 'test@example.com' }
    });

    // Mock play count
    (prisma.playEvent.count as any).mockResolvedValue(100);

    // Mock top tracks
    (prisma.playEvent.groupBy as any).mockResolvedValue([
      { trackId: 'track1', _count: { trackId: 10 } },
      { trackId: 'track2', _count: { trackId: 8 } },
      { trackId: 'track3', _count: { trackId: 6 } }
    ]);

    // Mock track details
    (prisma.track.findMany as any).mockResolvedValue([
      {
        id: 'track1',
        name: 'Song 1',
        artists: [{ name: 'Artist 1' }],
        album: { name: 'Album 1' }
      },
      {
        id: 'track2',
        name: 'Song 2',
        artists: [{ name: 'Artist 2' }],
        album: { name: 'Album 2' }
      },
      {
        id: 'track3',
        name: 'Song 3',
        artists: [{ name: 'Artist 3' }],
        album: { name: 'Album 3' }
      }
    ]);

    // Mock report creation
    (prisma.shareableReport.create as any).mockResolvedValue({
      id: 'report1',
      shareId: 'abc123def456',
      userId: 'user1',
      title: 'My Listening Report',
      description: null,
      reportData: '{}',
      dateRange: 'all'
    });

    const req = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({
        title: 'My Listening Report',
        description: 'My favorite tracks',
        dateRange: 'all'
      })
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      shareId: 'abc123def456',
      shareUrl: 'http://localhost:3000/share/abc123def456'
    });
  });

  it('should return 400 for invalid input', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1', name: 'Test User' }
    });

    const req = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({
        title: '', // Empty title should fail validation
        dateRange: 'invalid-range'
      })
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should use default title if not provided', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1', name: 'Test User' }
    });

    (prisma.playEvent.count as any).mockResolvedValue(10);
    (prisma.playEvent.groupBy as any).mockResolvedValue([]);
    (prisma.track.findMany as any).mockResolvedValue([]);
    (prisma.shareableReport.create as any).mockResolvedValue({
      shareId: 'abc123'
    });

    const req = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({}) // No title provided
    });

    const response = await POST(req);

    expect(prisma.shareableReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Test User's Listening Report"
        })
      })
    );
  });

  it('should include top 5 tracks in report data', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1', name: 'Test User' }
    });

    (prisma.playEvent.count as any).mockResolvedValue(100);

    // Return 10 tracks
    const topTracks = Array.from({ length: 10 }, (_, i) => ({
      trackId: `track${i + 1}`,
      _count: { trackId: 10 - i }
    }));
    (prisma.playEvent.groupBy as any).mockResolvedValue(topTracks);

    const trackDetails = Array.from({ length: 10 }, (_, i) => ({
      id: `track${i + 1}`,
      name: `Song ${i + 1}`,
      artists: [{ name: `Artist ${i + 1}` }]
    }));
    (prisma.track.findMany as any).mockResolvedValue(trackDetails);

    (prisma.shareableReport.create as any).mockImplementation((args) => {
      const reportData = JSON.parse(args.data.reportData);
      expect(reportData.topTracks).toHaveLength(5); // Only top 5
      return Promise.resolve({ shareId: 'abc123' });
    });

    const req = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({})
    });

    await POST(req);
  });

  it('should handle database errors gracefully', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user1' }
    });

    (prisma.playEvent.count as any).mockRejectedValue(
      new Error('Database error')
    );

    const req = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create shareable report');
  });
});

describe('GET /api/share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if share ID not provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/share');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Share ID required');
  });

  it('should return report for valid share ID', async () => {
    const mockReport = {
      id: 'report1',
      shareId: 'abc123',
      title: 'My Report',
      description: 'Test description',
      reportData: JSON.stringify({
        totalPlays: 100,
        topTracks: []
      }),
      createdAt: new Date('2024-01-01'),
      viewCount: 5,
      isPublic: true,
      user: {
        name: 'Test User',
        image: null
      }
    };

    (prisma.shareableReport.findUnique as any).mockResolvedValue(mockReport);
    (prisma.shareableReport.update as any).mockResolvedValue({});

    const req = new NextRequest('http://localhost:3000/api/share?id=abc123');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      title: 'My Report',
      description: 'Test description',
      reportData: {
        totalPlays: 100,
        topTracks: []
      },
      userName: 'Test User',
      viewCount: 6 // Incremented
    });

    // Verify view count was incremented
    expect(prisma.shareableReport.update).toHaveBeenCalledWith({
      where: { id: 'report1' },
      data: { viewCount: { increment: 1 } }
    });
  });

  it('should return 404 for non-existent share ID', async () => {
    (prisma.shareableReport.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/share?id=nonexistent');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Report not found');
  });

  it('should return 404 for private reports', async () => {
    const mockReport = {
      id: 'report1',
      shareId: 'abc123',
      isPublic: false, // Private report
      user: { name: 'Test User' }
    };

    (prisma.shareableReport.findUnique as any).mockResolvedValue(mockReport);

    const req = new NextRequest('http://localhost:3000/api/share?id=abc123');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Report not found');
  });

  it('should handle database errors gracefully', async () => {
    (prisma.shareableReport.findUnique as any).mockRejectedValue(
      new Error('Database error')
    );

    const req = new NextRequest('http://localhost:3000/api/share?id=abc123');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch report');
  });
});
