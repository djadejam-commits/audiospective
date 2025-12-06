# Vercel Cron Jobs Setup Guide

## Overview

This project uses **Vercel Cron Jobs** to automatically archive user listening history every hour. This solution is **free on Vercel Hobby plan** and has **no timeout limits**.

## Why Vercel Cron Jobs?

**Problem**: The manual archive endpoint (`/api/test-archive`) takes 60-90 seconds to complete, which exceeds the Vercel Hobby plan's 10-second serverless function timeout.

**Solution**: Vercel Cron Jobs run independently with no timeout restrictions, making them perfect for long-running tasks like data archiving.

## Configuration Files

### 1. `vercel.json`
Defines the cron schedule:

```json
{
  "crons": [
    {
      "path": "/api/cron/simple-archive",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedule format**: Standard cron syntax
- `0 * * * *` = Every hour at minute 0
- `*/30 * * * *` = Every 30 minutes
- `0 */2 * * *` = Every 2 hours

### 2. `/api/cron/simple-archive/route.ts`
The cron endpoint that processes user archiving:

**Features**:
- Processes up to 50 users per run
- Prioritizes healthy users (low consecutive failures)
- Includes circuit breaker (skips users with 5+ failures)
- Protected by `CRON_SECRET` for security
- Structured logging with Pino

## Deployment Steps

### Step 1: Add Environment Variable to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate with `openssl rand -base64 32` or use:
     ```
     Nrrav6i2V1C1WPANn6rk0TyKl9okgNejc8l/DX44wiQ=
     ```
   - **Environments**: Production, Preview, Development (select all)
4. Click **Save**

### Step 2: Deploy to Vercel

Push your code to trigger a deployment:

```bash
git add .
git commit -m "feat: add Vercel Cron Jobs for automated archiving"
git push origin main
```

### Step 3: Verify Cron Job Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. You should see:
   - **Path**: `/api/cron/simple-archive`
   - **Schedule**: `0 * * * *` (Every hour)
   - **Status**: Active

### Step 4: Monitor Cron Job Execution

#### View Logs in Vercel Dashboard
1. Go to **Deployments** → Select your production deployment
2. Click on **Functions** tab
3. Find `/api/cron/simple-archive`
4. View execution logs

#### Manual Trigger (Testing)
You can manually trigger the cron job for testing:

```bash
# From your terminal (replace with your production URL and CRON_SECRET)
curl -X GET "https://audiospective.vercel.app/api/cron/simple-archive" \
  -H "Authorization: Bearer Nrrav6i2V1C1WPANn6rk0TyKl9okgNejc8l/DX44wiQ="
```

Expected response:
```json
{
  "success": true,
  "processedCount": 10,
  "successful": 9,
  "failed": 1,
  "duration": 75432
}
```

## How It Works

### Execution Flow

1. **Vercel triggers cron** every hour at minute 0
2. **Authentication check**: Verifies `Authorization: Bearer CRON_SECRET` header
3. **Fetch active users**:
   - `isActive = true`
   - Has valid `accessToken` and `refreshToken`
   - `consecutiveFailures < 5` (circuit breaker)
   - Ordered by: least failures first, least recently polled
   - Limit: 50 users per run
4. **Process each user**:
   - Call `archiveUser(userId)` to fetch Spotify data
   - Save tracks to database
   - Update user's `lastPolledAt` timestamp
   - Track success/failure counts
5. **Return results**: JSON response with statistics

### Circuit Breaker Logic

Users are automatically skipped if they have 5+ consecutive failures. This prevents:
- Wasting API quota on broken accounts
- Slowing down processing for healthy users
- Rate limit issues with Spotify API

Users are re-enabled once they successfully authenticate again.

### Processing Limits

**50 users per cron run** ensures:
- Each run completes within reasonable time
- Fair distribution of API quota
- No single run overwhelms the database

If you have more than 50 active users, subsequent users will be processed in the next hourly run.

## Monitoring & Debugging

### Check if cron is running

```bash
# View recent function invocations in Vercel dashboard
# Settings → Functions → /api/cron/simple-archive
```

### Common Issues

#### Issue 1: Cron not running
**Symptom**: No logs in Vercel dashboard

**Solution**:
1. Check `vercel.json` is committed and deployed
2. Verify cron job appears in Vercel dashboard (Settings → Cron Jobs)
3. Wait for next hour mark (cron runs at minute 0)

#### Issue 2: 401 Unauthorized
**Symptom**: Logs show `Unauthorized cron request attempt`

**Solution**:
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Ensure the secret matches between `.env` and Vercel dashboard
3. Redeploy after adding the environment variable

#### Issue 3: No users being processed
**Symptom**: Response shows `processedCount: 0`

**Solution**:
1. Check database - are there users with `isActive = true`?
2. Verify users have valid `accessToken` and `refreshToken`
3. Check if users have `consecutiveFailures >= 5` (circuit breaker)

#### Issue 4: High failure rate
**Symptom**: `failed` count is high compared to `successful`

**Solution**:
1. Check logs for specific error messages
2. Verify Spotify API credentials are valid
3. Ensure token refresh logic is working in `src/lib/auth.ts`
4. Check if Spotify API is experiencing downtime

## Upgrading to QStash (Optional)

If you need more advanced features, you can upgrade to Upstash QStash:

**Benefits**:
- Batch processing with delays
- Retry logic with exponential backoff
- Dead letter queue for failed jobs
- Signature verification for security

**Trade-offs**:
- Requires Upstash account (free tier available)
- More complex setup
- Not necessary for Hobby plan usage

See `src/app/api/cron/archive/route.ts` for QStash implementation.

## Cost Analysis

### Vercel Cron Jobs (Current Solution)
- **Cost**: FREE on Hobby plan
- **Limits**: No timeout limits for cron jobs
- **Usage**: 24 executions per day (hourly)

### Alternative: QStash
- **Cost**: FREE tier includes 500 requests/day
- **Limits**: Same as Vercel Cron Jobs
- **Usage**: 24 cron triggers + batch jobs

## Performance Benchmarks

Based on testing with `/api/test-archive`:

- **Single user archive**: ~80 seconds
- **50 users (estimated)**: ~4000 seconds (66 minutes)

**Recommendation**: Keep batch size at 50 users or lower to ensure each cron run completes within the hour.

## Security Considerations

### CRON_SECRET
- **Purpose**: Prevents unauthorized access to cron endpoint
- **Generation**: Use `openssl rand -base64 32` for cryptographically secure random string
- **Storage**:
  - Local: `.env` file (NOT committed to git)
  - Production: Vercel environment variables
- **Rotation**: Regenerate and update in Vercel dashboard if compromised

### Vercel's Built-in Protection
Vercel also provides additional security:
- Cron jobs can only be triggered by Vercel's cron system (not externally)
- Request headers include Vercel-specific identifiers
- Rate limiting on cron endpoints

## Next Steps

After deployment:

1. **Monitor first execution**:
   - Wait for next hour mark
   - Check Vercel function logs
   - Verify users are being processed

2. **Adjust schedule if needed**:
   - If you have many users, consider running every 30 minutes: `*/30 * * * *`
   - For fewer users, every 2 hours might be sufficient: `0 */2 * * *`

3. **Set up alerts** (optional):
   - Use Sentry to monitor cron job failures
   - Set up Vercel Notifications for function errors

4. **Remove test endpoint** (optional):
   - Once cron is working, you can remove `/api/test-archive`
   - Or keep it for manual testing with proper authentication

## Support

If you encounter issues:
1. Check Vercel documentation: https://vercel.com/docs/cron-jobs
2. Review function logs in Vercel dashboard
3. Check Sentry for error reports
4. Verify environment variables are set correctly
