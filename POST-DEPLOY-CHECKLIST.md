# Post-Deploy Checklist

**Created:** December 4, 2025
**App Name:** Audiospective
**Status:** Deployment in progress

---

## Overview

This checklist covers all steps needed AFTER your Vercel deployment succeeds. Complete these in order.

**Estimated Time:** 30-45 minutes

---

## Prerequisites

- [ ] Vercel deployment succeeded (check https://vercel.com/djadejam-commits-projects/spotify-time-machine)
- [ ] You have your production URL (e.g., `https://spotify-time-machine-xxx.vercel.app`)
- [ ] All service credentials ready (from setup phase)

---

## Step 1: Configure Environment Variables in Vercel

**Time:** 10 minutes

### Required Variables (5)

1. **Go to:** https://vercel.com/djadejam-commits-projects/spotify-time-machine/settings/environment-variables

2. **Add each variable:**
   - Click "Add New"
   - Select Environment: **Production**
   - Enter Name and Value

### Variables to Add:

#### Required (5)

```bash
# 1. Database
DATABASE_URL=postgresql://username:password@host.neon.tech/neondb?sslmode=require

# 2. NextAuth Secret (generated earlier)
NEXTAUTH_SECRET=gBNtQu78Cr3PWObXLXXcLE76Z7g+54vtBZ9UxYEwp3k36L2zajwR2ZkD8T7HuzygYuei/KdrjLEGIsoQgSK+og==

# 3. NextAuth URL (your production URL)
NEXTAUTH_URL=https://spotify-time-machine-xxx.vercel.app

# 4. Spotify Client ID
SPOTIFY_CLIENT_ID=your_client_id_here

# 5. Spotify Client Secret
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

#### Recommended (8)

```bash
# 6-7. Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxx...

# 8-11. Upstash QStash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=eyJ...
QSTASH_CURRENT_SIGNING_KEY=your_signing_key_here
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key_here

# 12. Sentry (error monitoring)
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123

# 13. Node environment
NODE_ENV=production
```

### After Adding Variables:

3. **Redeploy** to apply environment variables:
   - Go to: https://vercel.com/djadejam-commits-projects/spotify-time-machine
   - Click "Deployments" tab
   - Find latest deployment
   - Click "..." menu → "Redeploy"
   - Check "Use existing Build Cache" = OFF
   - Click "Redeploy"

**⏱️ Wait 2-3 minutes for redeployment**

**Expected Result:** Deployment succeeds with all environment variables loaded

---

## Step 2: Update Spotify OAuth Redirect URI

**Time:** 3 minutes

### Steps:

1. **Go to:** https://developer.spotify.com/dashboard
2. **Select your app:** "Audiospective" (or your app name)
3. **Click:** "Settings"
4. **Click:** "Edit Settings"
5. **Add Redirect URIs:**
   ```
   https://YOUR-PRODUCTION-URL/api/auth/callback/spotify
   ```
   Example:
   ```
   https://spotify-time-machine-3fsnut51e-djadejam-commits-projects.vercel.app/api/auth/callback/spotify
   ```

6. **Click:** "Add"
7. **Click:** "Save"

**Expected Result:** You should see the redirect URI listed in your Spotify app settings

---

## Step 3: Create QStash Hourly Schedule

**Time:** 5 minutes

### Steps:

1. **Go to:** https://console.upstash.com/qstash
2. **Click:** "Schedules" in left sidebar
3. **Click:** "Create Schedule"
4. **Fill in:**
   - **Destination URL:**
     ```
     https://YOUR-PRODUCTION-URL/api/cron/archive
     ```
     Example:
     ```
     https://spotify-time-machine-3fsnut51e-djadejam-commits-projects.vercel.app/api/cron/archive
     ```

   - **Method:** POST

   - **Headers:**
     ```
     Content-Type: application/json
     ```

   - **Cron Expression:**
     ```
     0 * * * *
     ```
     (This means: Every hour at minute 0)

   - **Schedule Name:**
     ```
     hourly-archive-audiospective
     ```

   - **Timezone:** UTC (default)

5. **Click:** "Create"

**Expected Result:** Schedule shows as "Active" in QStash dashboard

---

## Step 4: Run Database Migrations

**Time:** 5 minutes

### Option A: Via Vercel CLI (Recommended)

```bash
# Set DATABASE_URL temporarily in your terminal
export DATABASE_URL="postgresql://username:password@host.neon.tech/neondb?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Expected output:
# ✔ Migration applied successfully
```

### Option B: Via Neon SQL Editor

1. **Go to:** https://console.neon.tech
2. **Select your project:** "audiospective" (or your project name)
3. **Click:** "SQL Editor"
4. **Run each migration** from `prisma/migrations/` folders manually

### Verify Migrations:

```bash
# Check database schema
npx prisma db pull

# Expected: No changes (schema matches migrations)
```

**Expected Result:** All migrations applied, database schema up to date

---

## Step 5: Create Database Indexes

**Time:** 3 minutes

### Steps:

Run these SQL commands in Neon SQL Editor or via Prisma:

```sql
-- Index 1: User + Date lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_playevent_user_date
ON "PlayEvent"("userId", "playedAt" DESC);

-- Index 2: Track + User lookup (for top tracks)
CREATE INDEX IF NOT EXISTS idx_playevent_track_user
ON "PlayEvent"("trackId", "userId");

-- Index 3: Share report lookup (public sharing)
CREATE INDEX IF NOT EXISTS idx_sharedreport_shareid
ON "SharedReport"("shareId");

-- Index 4: User Spotify ID lookup (auth)
CREATE INDEX IF NOT EXISTS idx_user_spotifyid
ON "User"("spotifyId");

-- Index 5: Artist Spotify ID lookup (archival)
CREATE INDEX IF NOT EXISTS idx_artist_spotifyid
ON "Artist"("spotifyId");
```

### Verify Indexes:

```bash
# Connect to database
psql "$DATABASE_URL"

# List indexes
\di

# Expected: See all 5 indexes listed
```

**Expected Result:** All 5 indexes created successfully

---

## Step 6: Test Your Production App

**Time:** 10 minutes

### Basic Health Checks:

1. **Homepage:**
   - Visit: `https://YOUR-PRODUCTION-URL`
   - Expected: Homepage loads, shows "Audiospective" branding
   - Check: No console errors in browser DevTools

2. **Health Endpoint:**
   ```bash
   curl https://YOUR-PRODUCTION-URL/api/health

   # Expected response:
   # {"status":"ok","timestamp":"2025-12-04T..."}
   ```

3. **Sign In Flow:**
   - Click "Sign In" button
   - Expected: Redirects to Spotify OAuth
   - Authorize the app
   - Expected: Redirects back to dashboard
   - Check: Session cookie set

4. **Dashboard:**
   - After signing in, check dashboard loads
   - Expected: Shows "No data yet" or your archived data
   - Check: No errors in browser console

5. **Archival Job (Manual Trigger):**
   ```bash
   # Get your session cookie from browser DevTools
   # Then test archival endpoint
   curl -X POST https://YOUR-PRODUCTION-URL/api/cron/archive \
     -H "Authorization: Bearer $QSTASH_TOKEN"

   # Expected: 200 OK response
   ```

### Advanced Tests:

6. **Rate Limiting:**
   ```bash
   # Send 101 requests rapidly
   for i in {1..101}; do
     curl https://YOUR-PRODUCTION-URL/api/health
   done

   # Expected: Last request returns 429 Too Many Requests
   ```

7. **Error Monitoring (Sentry):**
   - Go to: https://sentry.io
   - Check: No errors logged (or only expected initialization errors)

8. **Data Export:**
   - In dashboard, click "Export Data"
   - Expected: Downloads CSV file with your listening history

**Expected Result:** All tests pass, app functions correctly

---

## Step 7: Set Up UptimeRobot (Optional)

**Time:** 5 minutes

### Steps:

1. **Go to:** https://uptimerobot.com/
2. **Sign up** (free account)
3. **Create Monitor:**
   - Click "Add New Monitor"
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `Audiospective - Health Check`
   - URL: `https://YOUR-PRODUCTION-URL/api/health`
   - Monitoring Interval: **5 minutes** (free tier)
   - Monitor Timeout: **30 seconds**
   - Click "Create Monitor"

4. **Set up alerts** (optional):
   - Email notifications on downtime
   - Slack/Discord webhooks

**Expected Result:** Monitor shows "Up" status, you receive email confirmation

---

## Step 8: Final Verification Checklist

**Time:** 5 minutes

### Verify All Systems:

- [ ] **Vercel:** Deployment shows "Ready" status
- [ ] **Environment Variables:** All 13+ variables configured
- [ ] **Spotify OAuth:** Redirect URI added, sign-in works
- [ ] **Database:** Migrations applied, indexes created
- [ ] **QStash:** Hourly schedule active
- [ ] **Redis:** Rate limiting functional
- [ ] **Sentry:** Error tracking active
- [ ] **Homepage:** Loads without errors
- [ ] **Sign In:** Works via Spotify OAuth
- [ ] **Dashboard:** Displays correctly
- [ ] **Archival:** Manual trigger succeeds
- [ ] **Export:** Data export downloads
- [ ] **UptimeRobot:** Monitor active (optional)

---

## Troubleshooting

### Issue: Environment variables not loading

**Solution:**
1. Check variables are set for "Production" environment
2. Redeploy without build cache
3. Check Vercel deployment logs for errors

### Issue: Spotify OAuth redirect fails

**Solution:**
1. Verify redirect URI exactly matches: `https://YOUR-URL/api/auth/callback/spotify`
2. Check NEXTAUTH_URL environment variable matches production URL
3. Ensure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are correct

### Issue: Database connection fails

**Solution:**
1. Verify DATABASE_URL ends with `?sslmode=require`
2. Check Neon database is not paused (free tier auto-pauses after 5 minutes idle)
3. Test connection: `psql "$DATABASE_URL"`

### Issue: Rate limiting not working

**Solution:**
1. Check UPSTASH_REDIS_REST_URL and TOKEN are set
2. Verify Redis database is active in Upstash console
3. Test manually: send 101 requests, expect 429 on last one

### Issue: Archival job not running

**Solution:**
1. Check QStash schedule is active
2. Verify QSTASH_* environment variables are correct
3. Check Vercel function logs for errors
4. Test manual trigger: `POST /api/cron/archive`

---

## Next Steps (After Launch)

1. **Monitor for first 24 hours:**
   - Check Sentry for errors
   - Monitor Vercel function logs
   - Verify QStash jobs running hourly

2. **Week 1 tasks:**
   - Review performance metrics
   - Check database usage (Neon free tier: 512MB limit)
   - Monitor Redis usage (Upstash free tier: 10K commands/day)
   - Review QStash usage (free tier: 500 messages/day)

3. **Week 3 tasks:**
   - Upgrade NextAuth (to fix low-severity cookie vulnerability)
   - Review user feedback
   - Plan additional features

---

## Support Resources

### Documentation:
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Spotify API: https://developer.spotify.com/documentation/web-api

### Your Project:
- GitHub: https://github.com/djadejam-commits/audiospective
- Vercel: https://vercel.com/djadejam-commits-projects/spotify-time-machine
- Deployment Runbook: See DEPLOYMENT-RUNBOOK.md
- Production Prep: See PRODUCTION-DEPLOY-PREP.md

---

## Success Criteria

✅ **You're done when:**
1. Production URL loads without errors
2. Users can sign in via Spotify
3. Archival job runs every hour
4. All monitoring systems active
5. No critical errors in Sentry

**Congratulations! Audiospective is live! 🎉**

---

**Document Version:** 1.0
**Last Updated:** December 4, 2025
**Deployment Status:** In Progress

---

🤖 **Generated with Claude Code**

Co-Authored-By: Claude <noreply@anthropic.com>
