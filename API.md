# Audiospective - API Documentation

Complete API reference for all endpoints, including authentication, request/response formats, and error codes.

**Base URL:** `https://your-domain.com/api`

**Version:** 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Codes](#error-codes)
4. [Endpoints](#endpoints)
   - [Health & Monitoring](#health--monitoring)
   - [Authentication](#authentication-endpoints)
   - [Stats & Analytics](#stats--analytics)
   - [Data Export & Sharing](#data-export--sharing)
   - [User Management](#user-management)
   - [Background Jobs](#background-jobs-internal)

---

## Authentication

Most endpoints require authentication via NextAuth session cookies.

### How to Authenticate

1. **Sign In**: Visit `/api/auth/signin` or use the NextAuth client SDK
2. **Session Cookie**: NextAuth automatically manages session cookies
3. **API Requests**: Include session cookie in subsequent requests

### Authentication Header

```http
Cookie: next-auth.session-token=<session_token>
```

### Unauthenticated Requests

Endpoints marked with 🔒 require authentication. Requests without valid session return:

```json
{
  "error": "Not authenticated"
}
```

**Status Code:** `401 Unauthorized`

---

## Rate Limiting

The API implements a 3-tier rate limiting system based on request path:

| Tier | Paths | Limit | Window |
|------|-------|-------|--------|
| **Strict** | `/api/share`, `/api/export`, `/api/user/delete` | 10 requests | 10 seconds |
| **Normal** | Most API endpoints | 100 requests | 10 seconds |
| **Lenient** | `/api/health`, NextAuth callbacks | 1000 requests | 10 seconds |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699564800
```

### Rate Limit Exceeded

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

**Status Code:** `429 Too Many Requests`

**Note:** Rate limiting requires Upstash Redis. If not configured, rate limiting is disabled (development mode).

---

## Error Codes

All errors follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {} // Optional additional context
}
```

### Standard Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated or session expired |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `BAD_REQUEST` | 400 | Invalid request parameters or body |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed (Zod) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `SPOTIFY_API_ERROR` | 502 | Spotify API request failed |

---

## Endpoints

### Health & Monitoring

#### GET /api/health

Check system health status.

**Authentication:** None

**Rate Limit:** Lenient (1000/10s)

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-12-04T12:00:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 12
    },
    "spotify": {
      "status": "healthy",
      "responseTime": 45
    },
    "sentry": {
      "status": "connected"
    },
    "redis": {
      "status": "not_configured"
    }
  },
  "environment": "production"
}
```

**Status Codes:**
- `200` - All critical services healthy
- `503` - One or more critical services unhealthy

---

### Authentication Endpoints

#### POST /api/auth/signin

Initiate Spotify OAuth flow.

**Handled by NextAuth** - See [NextAuth.js Documentation](https://next-auth.js.org/)

---

#### GET /api/auth/callback/spotify

OAuth callback handler.

**Handled by NextAuth** - Automatically processes Spotify OAuth callback.

---

#### POST /api/auth/signout

Sign out and clear session.

**Handled by NextAuth**

---

#### GET /api/auth/session

Get current session information.

**Handled by NextAuth**

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://i.scdn.co/image/..."
  },
  "expires": "2025-12-31T23:59:59.999Z"
}
```

---

### Stats & Analytics

#### GET /api/stats 🔒

Get overall listening statistics.

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Query Parameters:** None

**Response:**

```json
{
  "totalPlays": 15420,
  "uniqueTracks": 3842,
  "uniqueArtists": 1205,
  "uniqueAlbums": 987,
  "estimatedListeningHours": 771,
  "firstPlayAt": "2024-01-01T10:30:00.000Z",
  "lastPlayAt": "2025-12-04T11:45:00.000Z"
}
```

**Caching:** 1 hour TTL (Redis)

---

#### GET /api/top-tracks 🔒

Get top tracks by play count.

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `range` | string | `all` | Time range: `1d`, `7d`, `30d`, `all` |
| `limit` | number | `10` | Number of tracks (max: 50) |

**Example Request:**

```http
GET /api/top-tracks?range=7d&limit=20
```

**Response:**

```json
{
  "range": "7d",
  "tracks": [
    {
      "track": {
        "id": "uuid",
        "name": "Song Title",
        "spotifyId": "spotify:track:...",
        "durationMs": 214000,
        "album": {
          "name": "Album Name",
          "imageUrl": "https://i.scdn.co/image/..."
        },
        "artists": [
          {
            "name": "Artist Name",
            "spotifyId": "spotify:artist:..."
          }
        ]
      },
      "playCount": 42
    }
    // ...
  ]
}
```

---

#### GET /api/top-artists 🔒

Get top artists by play count.

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `range` | string | `all` | Time range: `1d`, `7d`, `30d`, `all` |
| `limit` | number | `10` | Number of artists (max: 50) |

**Response:**

```json
{
  "range": "7d",
  "artists": [
    {
      "artist": {
        "id": "uuid",
        "name": "Artist Name",
        "spotifyId": "spotify:artist:...",
        "genres": "pop,indie,electronic"
      },
      "playCount": 128
    }
    // ...
  ]
}
```

---

#### GET /api/genres 🔒

Get genre breakdown with percentages.

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `range` | string | `all` | Time range: `1d`, `7d`, `30d`, `all` |

**Response:**

```json
{
  "range": "7d",
  "genres": [
    {
      "genre": "indie",
      "count": 342,
      "percentage": 28.5
    },
    {
      "genre": "electronic",
      "count": 215,
      "percentage": 17.9
    }
    // ...
  ],
  "totalPlays": 1200
}
```

**Caching:** 6 hour TTL (Redis)

---

#### GET /api/activity 🔒

Get listening activity by hour of day and day of week.

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `range` | string | `30d` | Time range: `7d`, `30d`, `all` |

**Response:**

```json
{
  "range": "30d",
  "byHour": {
    "0": 15,
    "1": 8,
    // ... 0-23
    "23": 42
  },
  "byDayOfWeek": {
    "0": 120, // Sunday
    "1": 145, // Monday
    // ... 0-6
    "6": 98
  },
  "totalPlays": 1200
}
```

---

#### GET /api/recent-plays 🔒

Get recent play history.

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | `50` | Number of plays (max: 100) |

**Response:**

```json
{
  "plays": [
    {
      "id": "uuid",
      "playedAt": "2025-12-04T11:45:00.000Z",
      "track": {
        "name": "Song Title",
        "spotifyId": "spotify:track:...",
        "durationMs": 214000,
        "album": {
          "name": "Album Name",
          "imageUrl": "https://i.scdn.co/image/..."
        },
        "artists": [
          {
            "name": "Artist Name"
          }
        ]
      }
    }
    // ...
  ],
  "total": 50
}
```

---

#### GET /api/comparison 🔒

Compare this week vs last week stats.

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Response:**

```json
{
  "thisWeek": {
    "totalPlays": 245,
    "uniqueTracks": 89,
    "uniqueArtists": 42,
    "topTrack": {
      "name": "Song Title",
      "playCount": 12
    },
    "topArtist": {
      "name": "Artist Name",
      "playCount": 28
    }
  },
  "lastWeek": {
    "totalPlays": 198,
    "uniqueTracks": 76,
    "uniqueArtists": 38,
    "topTrack": {
      "name": "Different Song",
      "playCount": 10
    },
    "topArtist": {
      "name": "Different Artist",
      "playCount": 24
    }
  },
  "changes": {
    "totalPlays": {
      "value": 47,
      "percentage": 23.7
    },
    "uniqueTracks": {
      "value": 13,
      "percentage": 17.1
    },
    "uniqueArtists": {
      "value": 4,
      "percentage": 10.5
    }
  }
}
```

---

#### GET /api/analytics/discovery 🔒

Get discovery rate (new vs repeat tracks).

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `range` | string | `30d` | Time range: `7d`, `30d`, `all` |

**Response:**

```json
{
  "range": "30d",
  "totalPlays": 1200,
  "newTracks": 342,
  "repeatTracks": 858,
  "discoveryRate": 28.5,
  "averageRepeats": 2.5
}
```

---

#### GET /api/analytics/streaks 🔒

Get listening streaks (consecutive days).

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Response:**

```json
{
  "currentStreak": {
    "days": 12,
    "startDate": "2025-11-22",
    "endDate": "2025-12-04"
  },
  "longestStreak": {
    "days": 45,
    "startDate": "2025-08-01",
    "endDate": "2025-09-15"
  },
  "totalActiveDays": 187,
  "totalDaysSinceFirstPlay": 337
}
```

---

#### GET /api/analytics/trends 🔒

Get listening trends over time.

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `interval` | string | `day` | Interval: `hour`, `day`, `week`, `month` |
| `range` | string | `30d` | Time range: `7d`, `30d`, `90d`, `all` |

**Response:**

```json
{
  "interval": "day",
  "range": "30d",
  "data": [
    {
      "date": "2025-11-04",
      "plays": 42,
      "uniqueTracks": 18,
      "uniqueArtists": 12
    }
    // ... 30 data points
  ]
}
```

---

#### GET /api/analytics/diversity 🔒

Get diversity scores (genre and artist variety).

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `range` | string | `30d` | Time range: `7d`, `30d`, `all` |

**Response:**

```json
{
  "range": "30d",
  "genreDiversity": {
    "score": 0.72,
    "uniqueGenres": 24,
    "totalPlays": 1200,
    "topGenres": ["indie", "electronic", "pop"]
  },
  "artistDiversity": {
    "score": 0.68,
    "uniqueArtists": 145,
    "totalPlays": 1200,
    "concentrationIndex": 0.32
  }
}
```

**Note:** Diversity score ranges from 0 (low diversity) to 1 (high diversity).

---

### Data Export & Sharing

#### GET /api/export 🔒

Export listening history.

**Authentication:** Required

**Rate Limit:** Strict (10/10s)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `json` | Format: `csv`, `json` |
| `range` | string | `all` | Range: `1d`, `7d`, `30d`, `all` |
| `gdpr` | boolean | `false` | GDPR mode (includes all user data) |

**Example Request:**

```http
GET /api/export?format=csv&range=30d
```

**Response (JSON format):**

```json
{
  "exportedAt": "2025-12-04T12:00:00.000Z",
  "exportType": "listening-history-export",
  "dateRange": {
    "start": "2025-11-04T12:00:00.000Z",
    "end": "2025-12-04T12:00:00.000Z",
    "label": "30d"
  },
  "totalPlays": 1200,
  "exportedPlays": 1200,
  "isTruncated": false,
  "plays": [
    {
      "playedAt": "2025-12-04T11:45:00.000Z",
      "track": {
        "name": "Song Title",
        "spotifyId": "spotify:track:...",
        "durationMs": 214000,
        "album": {
          "name": "Album Name",
          "imageUrl": "https://i.scdn.co/image/..."
        },
        "artists": [
          {
            "name": "Artist Name",
            "spotifyId": "spotify:artist:..."
          }
        ]
      }
    }
    // ... up to 10,000 plays
  ]
}
```

**Response (CSV format):**

```csv
Date,Time,Track,Artists,Album,Duration (min)
12/04/2025,11:45:00 AM,"Song Title","Artist Name","Album Name",3.57
...
```

**GDPR Mode (`gdpr=true`):**

Exports ALL user data including:
- User profile (no tokens)
- Complete listening history
- All shareable reports
- Account statistics

**Limits:**
- Maximum 10,000 plays per export
- CSV/JSON file download
- `isTruncated: true` if limit exceeded

---

#### POST /api/share 🔒

Create a shareable report.

**Authentication:** Required

**Rate Limit:** Strict (10/10s)

**Request Body:**

```json
{
  "title": "My Music Taste - December 2025",
  "description": "Check out what I've been listening to!",
  "dateRange": "30d"
}
```

**Validation:**
- `title`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `dateRange`: Required, one of: `1d`, `7d`, `30d`, `all`

**Response:**

```json
{
  "success": true,
  "data": {
    "shareId": "abc123xyz",
    "shareUrl": "https://your-domain.com/share/abc123xyz",
    "title": "My Music Taste - December 2025",
    "description": "Check out what I've been listening to!",
    "dateRange": "30d",
    "createdAt": "2025-12-04T12:00:00.000Z",
    "expiresAt": null
  }
}
```

---

#### GET /api/share

Get a public shareable report.

**Authentication:** None (public endpoint)

**Rate Limit:** Normal (100/10s)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Share ID from URL |

**Example Request:**

```http
GET /api/share?id=abc123xyz
```

**Response:**

```json
{
  "success": true,
  "data": {
    "shareId": "abc123xyz",
    "title": "My Music Taste - December 2025",
    "description": "Check out what I've been listening to!",
    "dateRange": "30d",
    "userName": "John Doe",
    "viewCount": 42,
    "createdAt": "2025-12-04T12:00:00.000Z",
    "reportData": {
      "stats": { ... },
      "topTracks": [ ... ],
      "topArtists": [ ... ],
      "genres": [ ... ]
    }
  }
}
```

**Error Response (Not Found):**

```json
{
  "error": "NOT_FOUND",
  "message": "Share report not found or expired"
}
```

**Status Code:** `404`

---

### User Management

#### DELETE /api/user/delete 🔒

Delete user account and all associated data (GDPR compliance).

**Authentication:** Required

**Rate Limit:** Strict (10/10s)

**Request Body:** None

**Response:**

```json
{
  "success": true,
  "message": "User account and all associated data deleted successfully",
  "deletedRecords": {
    "playEvents": 15420,
    "shareableReports": 3,
    "user": 1
  },
  "deletedAt": "2025-12-04T12:00:00.000Z"
}
```

**Warning:** This action is irreversible. All user data including:
- User profile
- Listening history (play events)
- Shareable reports
- All relationships

---

### Background Jobs (Internal)

These endpoints are for internal use by QStash and should not be called directly.

#### POST /api/cron/archive

Hourly cron job to archive user listening history.

**Authentication:** QStash signature verification

**Triggered By:** QStash schedule (hourly)

**Response:**

```json
{
  "success": true,
  "batchCount": 4,
  "userCount": 187,
  "totalActiveUsers": 200,
  "filteredOut": 13
}
```

---

#### POST /api/queue/archive-batch

Process a batch of users for archival.

**Authentication:** QStash signature verification

**Triggered By:** `/api/cron/archive` via QStash queue

**Request Body:**

```json
{
  "userIds": ["uuid1", "uuid2", ...],
  "batchNumber": 1,
  "totalBatches": 4
}
```

**Response:**

```json
{
  "success": true,
  "batchNumber": 1,
  "totalBatches": 4,
  "results": {
    "successful": 45,
    "skipped": 3,
    "failed": 2
  },
  "duration": 12345
}
```

---

#### POST /api/test-archive 🔒

Manual trigger for archival (testing only).

**Authentication:** Required

**Rate Limit:** Normal (100/10s)

**Use Case:** Development and manual testing

**Response:**

```json
{
  "status": "success",
  "songsArchived": 42,
  "userId": "uuid"
}
```

---

## Webhooks

### QStash Signature Verification

All `/api/cron/*` and `/api/queue/*` endpoints verify QStash signatures:

**Headers:**
```http
Upstash-Signature: <signature>
Upstash-Timestamp: <timestamp>
```

**Verification:**
- HMAC-SHA256 signature validation
- Timestamp freshness check (< 5 minutes)
- Rejects unsigned requests

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Fetch stats
const response = await fetch('/api/stats', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' // Include session cookie
});

const stats = await response.json();
```

### Python

```python
import requests

# Fetch stats
response = requests.get(
    'https://your-domain.com/api/stats',
    cookies={'next-auth.session-token': session_token}
)

stats = response.json()
```

### cURL

```bash
# Fetch stats
curl -X GET https://your-domain.com/api/stats \
  -H "Cookie: next-auth.session-token=<token>" \
  -H "Content-Type: application/json"
```

---

## Pagination

Currently, pagination is implemented via limits:

- `/api/top-tracks`: `limit` parameter (max 50)
- `/api/top-artists`: `limit` parameter (max 50)
- `/api/recent-plays`: `limit` parameter (max 100)
- `/api/export`: Fixed limit of 10,000 plays

**Future Enhancement:** Cursor-based pagination for large datasets.

---

## Caching

Endpoints with Redis caching:

| Endpoint | TTL | Cache Key |
|----------|-----|-----------|
| `/api/stats` | 1 hour | `stats:{userId}` |
| `/api/genres` | 6 hours | `genres:{userId}:{range}` |
| `/api/top-tracks` | 1 hour | `top-tracks:{userId}:{range}` |
| `/api/top-artists` | 1 hour | `top-artists:{userId}:{range}` |

**Cache Invalidation:**
- Automatic TTL expiration
- Manual invalidation on new archival (future enhancement)

---

## Changelog

### v1.0.0 (Current)
- Initial production release
- All endpoints documented
- Rate limiting implemented
- GDPR compliance endpoints

---

## Support

For API issues or questions:
- **Documentation**: See `/docs` directory
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Issues**: [GitHub Issues](<your-repo-url>/issues)

---

**Last Updated:** December 4, 2025

**API Version:** 1.0.0
