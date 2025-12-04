# Production Setup Guide

This guide explains how to set up the background polling system for automatic listening history archival in production.

## Overview

The Spotify Time Machine uses **Upstash QStash** (serverless job queue) and **Upstash Redis** (idempotency tracking) to automatically archive users' listening history every hour.

## Architecture

```
Hourly Cron Trigger (QStash)
    ↓
/api/cron/archive (Circuit Breaker Filtering)
    ↓
/api/queue/archive-batch (Batch Worker)
    ↓
archive-user.ts (Core Logic with JIT Token Refresh)
```

## Prerequisites

1. **Upstash Account** (free tier available)
   - Sign up at: https://upstash.com

## Step 1: Set Up Upstash Redis

Redis is used for idempotency keys to prevent duplicate archival runs.

1. Go to https://console.upstash.com/redis
2. Click "Create Database"
3. Choose a name (e.g., "spotify-time-machine")
4. Select a region close to your deployment
5. Click "Create"
6. Copy the following credentials:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

## Step 2: Set Up Upstash QStash

QStash is used to trigger the hourly archival cron job.

1. Go to https://console.upstash.com/qstash
2. Copy your credentials:
   - **QSTASH_URL**
   - **QSTASH_TOKEN**
   - **QSTASH_CURRENT_SIGNING_KEY**
   - **QSTASH_NEXT_SIGNING_KEY**

## Step 3: Configure Environment Variables

Add these to your `.env` file:

```bash
# Upstash Redis (Idempotency)
UPSTASH_REDIS_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_TOKEN="your-redis-token"

# Upstash QStash (Job Queue)
QSTASH_URL="https://qstash.upstash.io/v2/publish"
QSTASH_TOKEN="your-qstash-token"
QSTASH_CURRENT_SIGNING_KEY="your-current-signing-key"
QSTASH_NEXT_SIGNING_KEY="your-next-signing-key"
```

## Step 4: Create Scheduled Job

### Option A: Using QStash Console (Recommended)

1. Go to https://console.upstash.com/qstash
2. Click "Schedules" in the sidebar
3. Click "Create Schedule"
4. Configure:
   - **URL**: `https://your-domain.com/api/cron/archive`
   - **Schedule**: `0 * * * *` (every hour on the hour)
   - **Method**: POST
   - **Headers**:
     - `Authorization: Bearer YOUR_INTERNAL_CRON_SECRET`
   - **Body**: Empty
5. Click "Create"

### Option B: Using QStash API

```bash
curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://your-domain.com/api/cron/archive",
    "cron": "0 * * * *",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer YOUR_INTERNAL_CRON_SECRET"
    }
  }'
```

## Step 5: Secure Cron Endpoint

Add this to your `.env`:

```bash
# Internal cron secret (generate a random string)
CRON_SECRET="your-random-secret-key-here"
```

The cron endpoint at `/api/cron/archive` checks for this secret to prevent unauthorized access.

## How It Works

### 1. Hourly Trigger
QStash triggers `/api/cron/archive` every hour.

### 2. Circuit Breaker Filtering
The endpoint filters out users who are in cooldown period:
- **AUTH errors**: 30min → 4 hours (exponential backoff)
- **NETWORK errors**: 10min → 1 hour (exponential backoff)

### 3. Batch Processing
Active users are split into batches of 10 and sent to `/api/queue/archive-batch`.

### 4. Individual Archival
For each user:
- Check Redis for idempotency key (format: `archive_{userId}_{YYYY_MM_DD_HH}`)
- If already processed, skip
- Refresh access token (JIT with 5-minute buffer)
- Fetch recent tracks from Spotify (last 50)
- Upsert artists, albums, tracks
- Create play events (with deduplication)
- Mark as complete in Redis (24-hour TTL)

### 5. Error Handling
- Uses `Promise.allSettled` to prevent poison pill crashes
- Tracks consecutive failures and failure types in database
- Implements exponential backoff based on error type
- Gracefully handles race conditions in upsert operations

## Testing Locally

The system works without Redis/QStash for local development:

```bash
# Manual archival (no auth required)
curl http://localhost:3000/api/test-archive

# Or use the UI at /test
```

## Monitoring

### Check User Status

```sql
SELECT
  email,
  lastPolledAt,
  consecutiveFailures,
  lastFailureType,
  isActive
FROM users
ORDER BY lastPolledAt DESC;
```

### Check Play Events

```sql
SELECT COUNT(*) as total_plays,
       DATE(playedAt) as date
FROM play_events
GROUP BY date
ORDER BY date DESC;
```

### Redis Idempotency Keys

Keys follow this pattern: `archive_{userId}_{YYYY_MM_DD_HH}`

Example: `archive_c6bfd08a-d254-40f9-b923-cff218f7cf90_2025_12_03_15`

Keys expire after 24 hours (TTL: 86400 seconds).

## Cost Estimation (Free Tier)

### Upstash Redis
- **Free Tier**: 10,000 commands/day
- **Usage per user/hour**: ~3 commands (check + set + TTL)
- **Supports**: ~3,300 user archival operations/day
- **For 100 users**: ~7,200 commands/day (well within limit)

### Upstash QStash
- **Free Tier**: 500 messages/day
- **Usage**: 24 cron triggers/day + batch jobs
- **For 100 users with 10 per batch**: 24 + (100/10 * 24) = 264 messages/day
- **Supports**: Up to ~150 active users on free tier

## Troubleshooting

### Issue: Users Not Being Archived

**Check:**
1. Are Redis credentials correct? (logs will show "Redis not configured")
2. Is QStash schedule active? (check console)
3. Is CRON_SECRET correct?
4. Are users in cooldown period? (check `lastFailureType` and `consecutiveFailures`)

### Issue: Duplicate Play Events

**Check:**
1. Is Redis working? (idempotency prevents duplicates)
2. Is database unique constraint working? (`userId`, `trackId`, `playedAt`)

### Issue: High Failure Rate

**Check:**
1. Spotify API rate limits (429 errors)
2. Token refresh issues (check `tokenExpiresAt`)
3. Network connectivity

## Production Checklist

- [ ] Upstash Redis database created
- [ ] Upstash QStash configured
- [ ] Environment variables added to production
- [ ] QStash schedule created (hourly cron)
- [ ] CRON_SECRET generated and configured
- [ ] Tested manual archival in production
- [ ] Verified idempotency keys in Redis
- [ ] Set up monitoring/alerts for failures
- [ ] Documented deployment-specific settings

## Next Steps

Once configured, the system will:
- Automatically archive listening history every hour
- Handle rate limits and errors gracefully
- Prevent duplicate processing
- Track and recover from failures
- Scale to hundreds of users on free tier

For more details, see:
- [Edge Cases Documentation](./edge-cases.md)
- [Implementation Plan](./implementation-plan.md)
