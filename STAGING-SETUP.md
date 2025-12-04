# Staging Environment Setup Guide

**Created:** December 4, 2025
**For:** Day 12 - Final QA & Staging Deploy
**Status:** Ready for setup

---

## Overview

This guide walks through setting up a complete staging environment on Vercel for the Audiospective application. The staging environment should mirror production as closely as possible while using separate databases and API credentials.

---

## Prerequisites

### Required Accounts
- [ ] Vercel account (free tier acceptable)
- [ ] Neon PostgreSQL account (free tier)
- [ ] Spotify Developer account
- [ ] Upstash Redis account (free tier)
- [ ] Upstash QStash account (free tier)

### Recommended Accounts
- [ ] Sentry account (free tier)
- [ ] UptimeRobot account (free tier)

### Local Requirements
- [ ] Vercel CLI installed: `npm install -g vercel`
- [ ] Git repository connected to GitHub

---

## Step 1: Create Staging Database

### 1.1 Provision Neon Database

1. **Navigate to Neon Console:**
   - Go to https://console.neon.tech
   - Sign in or create account

2. **Create New Project:**
   ```
   Project Name: audiospective-staging
   PostgreSQL Version: 16
   Region: US East (closest to Vercel)
   ```

3. **Get Connection String:**
   ```bash
   # Format:
   postgresql://[user]:[password]@[host]/[database]?sslmode=require

   # Example:
   postgresql://user:pass@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

4. **Save Connection String:**
   - Copy to password manager
   - Label as "Staging DATABASE_URL"

### 1.2 Run Database Migrations

```bash
# Set staging database URL temporarily
export DATABASE_URL="postgresql://[staging-connection-string]"

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma db pull
```

**Expected Output:**
```
✅ Migration(s) applied successfully
```

### 1.3 Verify Database Structure

```bash
# Connect to database
npx prisma studio

# Or use SQL:
npx prisma db execute --stdin < verify.sql

# verify.sql:
SELECT
  table_name
FROM
  information_schema.tables
WHERE
  table_schema = 'public';
```

**Expected Tables:**
- User
- PlayEvent
- Artist
- Genre
- SharedReport
- _prisma_migrations

---

## Step 2: Configure Spotify OAuth (Staging)

### 2.1 Create Staging App

1. **Go to Spotify Developer Dashboard:**
   - https://developer.spotify.com/dashboard

2. **Create New App:**
   ```
   App Name: Audiospective (Staging)
   App Description: Staging environment for testing
   Website: https://audiospective-staging.vercel.app
   Redirect URIs:
     - https://audiospective-staging.vercel.app/api/auth/callback/spotify
     - http://localhost:3000/api/auth/callback/spotify (for local testing)
   ```

3. **Get Credentials:**
   - Click "Settings"
   - Copy **Client ID**
   - Click "View client secret"
   - Copy **Client Secret**

4. **Save Credentials:**
   ```bash
   SPOTIFY_CLIENT_ID=your_staging_client_id
   SPOTIFY_CLIENT_SECRET=your_staging_client_secret
   ```

### 2.2 Configure API Scopes

**Required Scopes:** (already configured in code)
- `user-read-recently-played`
- `user-top-read`
- `user-read-email`

---

## Step 3: Configure Infrastructure Services

### 3.1 Upstash Redis (Rate Limiting & Caching)

1. **Create Database:**
   ```
   Name: audiospective-staging
   Region: us-east-1 (closest to Vercel)
   Type: Regional
   ```

2. **Get Credentials:**
   ```bash
   UPSTASH_REDIS_REST_URL=https://[your-staging-id].upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_staging_token
   ```

3. **Test Connection:**
   ```bash
   curl https://[your-id].upstash.io/ping \
     -H "Authorization: Bearer your_token"

   # Expected: "PONG"
   ```

### 3.2 Upstash QStash (Background Jobs)

1. **Get QStash Credentials:**
   - Go to https://console.upstash.com/qstash
   - Copy **QSTASH_URL**
   - Copy **QSTASH_TOKEN**
   - Copy **QSTASH_CURRENT_SIGNING_KEY**
   - Copy **QSTASH_NEXT_SIGNING_KEY**

2. **Save Credentials:**
   ```bash
   QSTASH_URL=https://qstash.upstash.io
   QSTASH_TOKEN=your_staging_token
   QSTASH_CURRENT_SIGNING_KEY=sig_staging_key1
   QSTASH_NEXT_SIGNING_KEY=sig_staging_key2
   ```

### 3.3 Sentry (Error Monitoring)

1. **Create Staging Project:**
   ```
   Platform: Next.js
   Project Name: audiospective-staging
   Team: [Your Team]
   Alert Rules: Critical errors only
   ```

2. **Get DSN:**
   ```bash
   SENTRY_DSN=https://[key]@o[orgid].ingest.sentry.io/[projectid]
   SENTRY_AUTH_TOKEN=your_staging_auth_token
   SENTRY_ORG=your_org
   SENTRY_PROJECT=audiospective-staging
   ```

### 3.4 Vercel Analytics

1. **Enable in Vercel Dashboard:**
   - Project Settings > Analytics
   - Enable "Audience" (free)
   - Enable "Web Vitals" (free)

2. **No additional env vars needed** (auto-configured)

---

## Step 4: Generate NextAuth Secret

```bash
# Generate strong secret (32+ characters required)
openssl rand -base64 32

# Save output as:
NEXTAUTH_SECRET=your_generated_secret_here
```

---

## Step 5: Deploy to Vercel Staging

### 5.1 Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

### 5.2 Link Project

```bash
# Navigate to project root
cd /path/to/audiospective

# Link to Vercel
vercel link

# Select options:
# - Link to existing project? No
# - Project name: audiospective-staging
# - Directory: ./
```

### 5.3 Configure Environment Variables

```bash
# Add all environment variables to Vercel
vercel env add DATABASE_URL production
# Paste staging DATABASE_URL

vercel env add SPOTIFY_CLIENT_ID production
# Paste staging client ID

vercel env add SPOTIFY_CLIENT_SECRET production
# Paste staging client secret

vercel env add NEXTAUTH_URL production
# Enter: https://audiospective-staging.vercel.app

vercel env add NEXTAUTH_SECRET production
# Paste generated secret

vercel env add UPSTASH_REDIS_REST_URL production
# Paste Redis URL

vercel env add UPSTASH_REDIS_REST_TOKEN production
# Paste Redis token

vercel env add QSTASH_URL production
# Paste QStash URL

vercel env add QSTASH_TOKEN production
# Paste QStash token

vercel env add QSTASH_CURRENT_SIGNING_KEY production
# Paste signing key

vercel env add QSTASH_NEXT_SIGNING_KEY production
# Paste next signing key

vercel env add SENTRY_DSN production
# Paste Sentry DSN

vercel env add SENTRY_AUTH_TOKEN production
# Paste Sentry auth token

vercel env add SENTRY_ORG production
# Paste Sentry org

vercel env add SENTRY_PROJECT production
# Paste Sentry project name

vercel env add NODE_ENV production
# Enter: production
```

### 5.4 Deploy Staging

```bash
# Deploy to production environment (will be staging)
vercel --prod

# Or deploy preview first, then promote:
vercel
# Test preview URL
vercel --prod
```

**Expected Output:**
```
✅ Deployment Complete
🔍 Inspect: https://vercel.com/[your-team]/[project]/[deployment-id]
✅ Production: https://audiospective-staging.vercel.app
```

---

## Step 6: Post-Deployment Verification

### 6.1 Health Check

```bash
# Test health endpoint
curl https://audiospective-staging.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-04T12:00:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "latency": "12ms"
    },
    "redis": {
      "status": "healthy",
      "latency": "8ms"
    },
    "spotify": {
      "status": "healthy",
      "latency": "45ms"
    }
  },
  "version": "1.0.0",
  "environment": "production"
}
```

### 6.2 Smoke Tests

**Test 1: Homepage Loads**
```bash
curl -I https://audiospective-staging.vercel.app

# Expected: HTTP 200
```

**Test 2: Sign In Page**
- Visit: https://audiospective-staging.vercel.app
- Click "Sign in with Spotify"
- Should redirect to Spotify OAuth

**Test 3: OAuth Callback**
- Complete Spotify authorization
- Should redirect back to staging
- Should show dashboard

**Test 4: Manual Archival**
- Click "Archive Now"
- Should see success toast
- Should see tracks in database

**Test 5: Export**
- Click "Export Data"
- Should download CSV file

**Test 6: Share**
- Click "Create Share Report"
- Should generate shareable link
- Link should be publicly accessible

### 6.3 Database Verification

```bash
# Check if data was created
npx prisma studio --url="postgresql://staging-url"

# Or via SQL:
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "PlayEvent";
```

### 6.4 Monitoring Verification

**Sentry:**
1. Go to Sentry dashboard
2. Verify no errors captured
3. Trigger test error:
   ```bash
   curl https://audiospective-staging.vercel.app/api/test-error
   ```
4. Verify error appears in Sentry

**Vercel Analytics:**
1. Go to Vercel dashboard
2. Select project
3. Click "Analytics"
4. Verify page views recorded

---

## Step 7: Configure QStash Schedule

### 7.1 Create Schedule

1. **Go to QStash Console:**
   - https://console.upstash.com/qstash

2. **Create New Schedule:**
   ```
   Name: hourly-archive-staging
   Destination: https://audiospective-staging.vercel.app/api/cron/archive
   Method: POST
   Cron: 0 * * * * (every hour at :00)
   Body: {}
   Headers:
     Content-Type: application/json
   ```

3. **Test Schedule:**
   - Click "Trigger Now"
   - Check Vercel logs
   - Verify archival runs

---

## Step 8: Create Staging Test Users

### 8.1 Create Test Accounts

**Test User 1: Normal User**
- Spotify account: staging-user-1@example.com
- Purpose: Test normal user flows

**Test User 2: Power User**
- Spotify account: staging-user-2@example.com
- Purpose: Test with large datasets (1000+ plays)

**Test User 3: New User**
- Spotify account: staging-user-3@example.com
- Purpose: Test first-time user experience

### 8.2 Seed Data (Optional)

```bash
# Create seed script
node scripts/seed-staging.js

# Or manually trigger archival for test users
```

---

## Environment Variables Checklist

### Required (Application will not start without these)

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SPOTIFY_CLIENT_ID` - Spotify OAuth client ID
- [ ] `SPOTIFY_CLIENT_SECRET` - Spotify OAuth client secret
- [ ] `NEXTAUTH_URL` - Full staging URL
- [ ] `NEXTAUTH_SECRET` - Random secret (32+ chars)

### Recommended (Application will work but with degraded features)

- [ ] `UPSTASH_REDIS_REST_URL` - Redis URL for rate limiting
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Redis token
- [ ] `QSTASH_URL` - QStash URL for background jobs
- [ ] `QSTASH_TOKEN` - QStash token
- [ ] `QSTASH_CURRENT_SIGNING_KEY` - Signature verification
- [ ] `QSTASH_NEXT_SIGNING_KEY` - Signature verification

### Optional (Monitoring and observability)

- [ ] `SENTRY_DSN` - Error monitoring
- [ ] `SENTRY_AUTH_TOKEN` - Sentry auth
- [ ] `SENTRY_ORG` - Sentry organization
- [ ] `SENTRY_PROJECT` - Sentry project
- [ ] `NODE_ENV` - Should be "production"

---

## Troubleshooting

### Issue: "Invalid environment variables"

**Solution:**
```bash
# Verify all required env vars are set in Vercel
vercel env ls

# Pull env vars locally to test
vercel env pull .env.production
```

### Issue: "Database connection failed"

**Solution:**
1. Verify DATABASE_URL is correct
2. Check Neon database is running
3. Verify SSL mode: `?sslmode=require`
4. Test connection:
   ```bash
   npx prisma db pull
   ```

### Issue: "OAuth callback error"

**Solution:**
1. Verify NEXTAUTH_URL matches Vercel URL
2. Check Spotify redirect URIs include staging URL
3. Verify NEXTAUTH_SECRET is set

### Issue: "Rate limiting not working"

**Solution:**
1. Verify Redis env vars are set
2. Test Redis connection:
   ```bash
   curl https://[redis-url]/ping -H "Authorization: Bearer [token]"
   ```

### Issue: "QStash signature verification failed"

**Solution:**
1. Verify QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY are set
2. Check QStash console for correct keys
3. Re-deploy after updating keys

---

## Success Criteria

### ✅ Staging is ready when:

**Infrastructure:**
- [ ] Staging URL is accessible
- [ ] Health check returns 200
- [ ] Database is connected
- [ ] Redis is connected

**Authentication:**
- [ ] Can sign in with Spotify
- [ ] OAuth callback works
- [ ] Session persists

**Core Features:**
- [ ] Manual archival works
- [ ] Dashboard displays data
- [ ] Export works
- [ ] Share works

**Background Jobs:**
- [ ] QStash schedule created
- [ ] Cron endpoint returns 200
- [ ] Archival runs automatically

**Monitoring:**
- [ ] Sentry captures errors
- [ ] Vercel Analytics tracks visits
- [ ] Logs are visible in Vercel dashboard

---

## Next Steps

After staging is set up:
1. **Run full QA pass** (see QA-CHECKLIST.md)
2. **Fix any issues found**
3. **Run regression tests**
4. **Get QA sign-off**
5. **Proceed to Day 13: Production Deploy Preparation**

---

## Staging vs Production

### Differences

| Aspect | Staging | Production |
|--------|---------|------------|
| **URL** | `*-staging.vercel.app` | Custom domain |
| **Database** | Neon free tier (staging) | Neon scale tier |
| **Redis** | Upstash free tier | Upstash pro tier (if needed) |
| **Monitoring** | Alert on critical only | Alert on all errors |
| **Uptime Monitoring** | Optional | Required |
| **Backup Frequency** | Daily | Hourly |
| **Test Data** | Allowed | Not allowed |
| **Public Access** | Limited (team only) | Public |

### Similarities (Should Match)

- [ ] Same Next.js version
- [ ] Same Node.js version
- [ ] Same environment variables (different values)
- [ ] Same database schema
- [ ] Same deployment process
- [ ] Same monitoring tools

---

## Rollback Plan

**If staging deployment fails:**

```bash
# Rollback to previous deployment
vercel rollback [previous-deployment-url]

# Or redeploy from working branch
git checkout [working-branch]
vercel --prod
```

---

## Maintenance

### Weekly Tasks
- [ ] Check staging database size (Neon free tier: 512MB limit)
- [ ] Clear old test data
- [ ] Verify monitoring still working
- [ ] Update env vars if changed

### Monthly Tasks
- [ ] Review Sentry error trends
- [ ] Update dependencies (same as production)
- [ ] Re-run full QA checklist

---

## Security Notes

### Staging Security Considerations

1. **Don't use production data in staging**
   - Risk: Data breach, GDPR violations
   - Solution: Use synthetic test data only

2. **Limit staging access**
   - Risk: Unauthorized access
   - Solution: Use Vercel's password protection or IP allowlist

3. **Rotate secrets regularly**
   - Risk: Compromised credentials
   - Solution: Rotate every 90 days

4. **Monitor staging for abuse**
   - Risk: API abuse, DoS attacks
   - Solution: Same rate limits as production

---

## Cost Estimate (Free Tier)

| Service | Free Tier Limit | Cost if Exceeded |
|---------|----------------|------------------|
| **Vercel** | 100GB bandwidth/month | $20/100GB |
| **Neon** | 512MB storage | $0.10/GB/month |
| **Upstash Redis** | 10K commands/day | $0.20/100K |
| **Upstash QStash** | 500 messages/day | $1/10K messages |
| **Sentry** | 5K errors/month | $26/month (team plan) |
| **UptimeRobot** | 50 monitors | $7/month (pro plan) |

**Expected Monthly Cost (Staging):** $0 (within free tiers)

---

## Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments)
- [Neon PostgreSQL Docs](https://neon.tech/docs/introduction)
- [Upstash Redis Docs](https://upstash.com/docs/redis)
- [Upstash QStash Docs](https://upstash.com/docs/qstash)
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

**Document Version:** 1.0
**Last Updated:** December 4, 2025
**Next Review:** After Day 12 QA completion

---

🤖 **Generated with Claude Code**

Co-Authored-By: Claude <noreply@anthropic.com>
