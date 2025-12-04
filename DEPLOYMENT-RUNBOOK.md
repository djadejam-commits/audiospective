# Deployment Runbook - Production Launch

**Created:** December 4, 2025
**For:** Day 14 - Production Launch
**Version:** 1.0
**Owner:** DevOps + Product Manager

---

## Purpose

This runbook provides step-by-step instructions for deploying the Audiospective application to production. It includes pre-deployment checks, deployment procedures, post-deployment verification, and rollback procedures.

**Audience:** Deployment team, on-call engineers, incident responders

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedure](#deployment-procedure)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Monitoring Protocol](#monitoring-protocol)
5. [Rollback Procedure](#rollback-procedure)
6. [Incident Response](#incident-response)
7. [Communication Plan](#communication-plan)
8. [Contacts](#contacts)

---

## Pre-Deployment Checklist

**Run this checklist T-30 minutes before deployment (9:30 AM UTC)**

### Team Readiness

- [ ] **Deployment Lead** online and ready
  - Responsible for: Triggering deployment, making rollback decisions

- [ ] **Monitoring Lead** online with dashboards open
  - Responsible for: Watching metrics, alerting to issues

- [ ] **Support Lead** online and ready for user questions
  - Responsible for: User communication, feedback collection

- [ ] **Backup Engineer** on standby
  - Responsible for: Assisting with issues, rollback support

- [ ] Communication channel open (Slack #deployment or Discord #launches)

---

### Environment Verification

#### Vercel Project

- [ ] Production project exists
- [ ] Custom domain configured (if applicable)
- [ ] Automatic deployments enabled (or manual ready)
- [ ] Build logs accessible

#### Environment Variables

Run verification script:

```bash
./verify-production-env.sh

# Expected output:
# ✅ DATABASE_URL is set
# ✅ NEXTAUTH_URL is set
# ✅ NEXTAUTH_SECRET is set
# ✅ SPOTIFY_CLIENT_ID is set
# ✅ SPOTIFY_CLIENT_SECRET is set
# ✅ All required environment variables verified!
```

- [ ] All 15 environment variables verified
- [ ] No trailing slashes in URLs
- [ ] SSL mode in DATABASE_URL
- [ ] NEXTAUTH_SECRET 64+ characters
- [ ] NODE_ENV = "production"

#### Database

```bash
# Test production database connection
export DATABASE_URL="[production-url]"
npx prisma db pull

# Expected: Schema pulled successfully
```

- [ ] Production database accessible
- [ ] Migrations up to date
- [ ] Indexes created (5 indexes)
- [ ] Backup taken within last hour
- [ ] Storage < 80% (400 MB / 512 MB)
- [ ] Connections < 50 (of 100 max)

#### External Services

**Spotify OAuth:**
- [ ] Production app configured
- [ ] Redirect URI matches production domain
- [ ] Client ID/Secret valid

**Redis (Upstash):**
```bash
curl $UPSTASH_REDIS_REST_URL/ping \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# Expected: "PONG"
```
- [ ] Redis responds to ping

**QStash:**
```bash
curl https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer $QSTASH_TOKEN"

# Expected: 200 OK
```
- [ ] QStash accessible
- [ ] Hourly schedule configured

**Sentry:**
- [ ] Production project exists
- [ ] DSN configured
- [ ] Test error captured

---

### Code Verification

```bash
# Pull latest code
git pull origin main

# Verify on main branch
git branch --show-current
# Expected: main

# Check latest commit
git log -1 --oneline
# Verify this is the commit you want to deploy

# Run tests locally
npm test
# Expected: 39/42 passing (93%)

# Run production build
npm run build
# Expected: ✓ Compiled successfully
```

- [ ] On main branch
- [ ] Latest code pulled
- [ ] Tests passing (>90%)
- [ ] Build succeeds locally
- [ ] No uncommitted changes

---

### Monitoring Setup

**Open these dashboards:**

1. **Vercel Dashboard**
   - https://vercel.com/[your-team]/[project]
   - Tab 1: Deployments
   - Tab 2: Logs (real-time)
   - Tab 3: Analytics

2. **Sentry Dashboard**
   - https://sentry.io/organizations/[org]/projects/[project]/
   - Issues view (real-time)

3. **Neon Database Console**
   - https://console.neon.tech/app/projects/[project-id]
   - Monitoring tab

4. **UptimeRobot Dashboard**
   - https://uptimerobot.com/dashboard
   - Health check monitor

5. **Terminal with Production Logs**
   ```bash
   vercel logs --prod --follow
   ```

- [ ] All dashboards open and accessible
- [ ] Real-time logs streaming
- [ ] Alerting channels ready (email, Slack)

---

### Rollback Preparation

**Identify last known good deployment:**

```bash
# List recent deployments
vercel ls

# Note the last successful deployment URL
# Example: audiospective-abc123.vercel.app
```

- [ ] Last good deployment URL documented
- [ ] Rollback command ready:
  ```bash
  vercel rollback [last-good-deployment-url]
  ```

- [ ] Alternative: Previous git tag ready
  ```bash
  git tag -l
  # Note: v0.9.9 (or whatever is previous stable)
  ```

---

### Communication Preparation

**Draft messages (send after successful deployment):**

1. **Internal Announcement (Slack/Discord):**
   ```
   🚀 Audiospective v1.0.0 is now LIVE in production!

   URL: https://[your-domain]
   Status: All systems operational

   Monitoring for the next 2 hours. Report any issues in #incidents.
   ```

2. **Public Announcement (Twitter/X):**
   ```
   🎉 Excited to launch Audiospective!

   ✨ Archive your Spotify history automatically
   📊 Visualize your music trends
   🔗 Share your top tracks

   Try it now: https://[your-domain]

   #Spotify #WebDev #MadeWithNextJS
   ```

3. **Status Page (if applicable):**
   ```
   All Systems Operational

   Audiospective v1.0.0 deployed successfully at 10:15 AM UTC.
   ```

- [ ] Announcements drafted and ready to send
- [ ] Social media accounts accessible
- [ ] Launch blog post ready (if applicable)

---

### Final Checks (T-5 minutes)

- [ ] All team members confirm ready (thumbs up in chat)
- [ ] All dashboards showing green/healthy
- [ ] No ongoing incidents in dependencies (Vercel, Neon, Spotify)
- [ ] Deployment window confirmed (10:00 AM UTC, Tuesday)
- [ ] Low traffic time verified (avoid peak hours)

**If any item is not checked:** Delay deployment and investigate.

---

## Deployment Procedure

**Timeline: 10:00 AM - 10:15 AM UTC (15 minutes)**

**Deployment Lead executes these steps**

---

### Step 1: Create Git Tag (2 minutes)

**Purpose:** Mark this release in git history for rollback reference

```bash
# Ensure on main branch with latest code
git checkout main
git pull origin main

# Create annotated tag
git tag -a v1.0.0 -m "Production release - December 17, 2025"

# Verify tag created
git tag -l v1.0.0

# Expected output: v1.0.0
```

**Push tag to GitHub:**

```bash
git push origin v1.0.0

# Expected output:
# To github.com:your-username/audiospective.git
#  * [new tag]         v1.0.0 -> v1.0.0
```

**Checkpoint:**
- [ ] Tag v1.0.0 created
- [ ] Tag pushed to GitHub
- [ ] Confirm in GitHub: https://github.com/[user]/[repo]/tags

---

### Step 2: Trigger Deployment (5 minutes)

#### Option A: Automatic Deployment (CI/CD)

**If GitHub Actions is configured:**

```bash
# Deployment triggers automatically on tag push
# Watch GitHub Actions workflow

# View workflow status
gh run list --workflow=deploy-production.yml --limit=1

# Or visit: https://github.com/[user]/[repo]/actions
```

**Monitor workflow:**
- [ ] Workflow "deploy-production" started
- [ ] Build step passes
- [ ] Deployment step passes
- [ ] Post-deployment checks pass

---

#### Option B: Manual Deployment (Vercel CLI)

**If deploying manually:**

```bash
# Deploy to production
vercel --prod

# Expected output:
# 🔍  Inspect: https://vercel.com/[team]/[project]/[deployment-id]
# ✅  Production: https://[your-domain]
```

**Checkpoint:**
- [ ] Deployment initiated
- [ ] Build started (check Vercel dashboard)
- [ ] Build completed successfully
- [ ] Deployment URL received

---

### Step 3: Initial Health Check (2 minutes)

**Wait 30 seconds for deployment to propagate**

```bash
# Test health endpoint
curl -s https://[your-domain]/api/health | jq

# Expected output:
{
  "status": "healthy",
  "timestamp": "2025-12-17T10:02:30.000Z",
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

**Validation:**
- [ ] Status: "healthy" ✅
- [ ] Database: "healthy" ✅
- [ ] Redis: "healthy" ✅
- [ ] Spotify: "healthy" ✅
- [ ] All latencies < 100ms ✅
- [ ] Version: "1.0.0" ✅
- [ ] Environment: "production" ✅

**If any service unhealthy:** STOP and investigate immediately.

---

### Step 4: Smoke Tests (5 minutes)

**Execute these manual tests:**

#### Test 1: Homepage Loads

```bash
curl -I https://[your-domain]

# Expected:
# HTTP/2 200
# content-type: text/html
# x-frame-options: DENY
# (other security headers...)
```

- [ ] Homepage returns 200 OK
- [ ] Security headers present

---

#### Test 2: Sign In Flow

**Manual test in browser:**

1. Visit https://[your-domain]
2. Click "Sign in with Spotify"
3. Should redirect to `accounts.spotify.com`
4. Authorize app
5. Should redirect back to production domain
6. Should see dashboard (or onboarding for new user)

- [ ] Sign in button present
- [ ] Redirects to Spotify OAuth
- [ ] Callback returns to production
- [ ] Session created successfully
- [ ] Dashboard loads

**If sign in fails:** 🔴 **CRITICAL** - Investigate immediately or rollback

---

#### Test 3: Dashboard Loads

**For authenticated user:**

- [ ] Dashboard page loads (no errors)
- [ ] Stats cards display (or empty state if new user)
- [ ] Charts render correctly
- [ ] No console errors
- [ ] Loading states work

---

#### Test 4: Manual Archival

**Click "Archive Now" button:**

- [ ] Button becomes disabled during request
- [ ] Success toast appears
- [ ] Toast shows "Successfully archived X tracks"
- [ ] Dashboard updates with new data (if first archival)
- [ ] Button re-enables after completion

**Check database:**
```bash
# Verify plays were written
npx prisma studio --url="$DATABASE_URL"

# Or query:
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"PlayEvent\";"

# Should show > 0 if user has recent plays
```

- [ ] Archival completes successfully
- [ ] Data written to database
- [ ] No errors in logs

---

#### Test 5: Export Data

**Click "Export" → "CSV":**

- [ ] Export modal opens
- [ ] CSV file downloads
- [ ] Filename: `spotify-archive-YYYY-MM-DD.csv`
- [ ] File contains data (if user has plays)
- [ ] CSV format valid (open in Excel/Numbers)

- [ ] Export works
- [ ] File downloads
- [ ] Data correct

---

#### Test 6: Create Share Report

**Click "Share":**

- [ ] Share modal opens
- [ ] Enter title: "Test Share"
- [ ] Select time range: "Last 7 days"
- [ ] Click "Create Share Report"
- [ ] Success message appears
- [ ] Shareable link displayed
- [ ] Link copied to clipboard

**Open share link in incognito window:**

- [ ] Share page loads (unauthenticated)
- [ ] Shows report title
- [ ] Shows top tracks
- [ ] Shows date range
- [ ] No personal info exposed (email, etc.)

- [ ] Share creation works
- [ ] Public share accessible
- [ ] Data displays correctly

---

#### Test 7: Error Logging

**Trigger a test error:**

```bash
# If you created a test error endpoint
curl https://[your-domain]/api/test-sentry

# Expected: 500 Internal Server Error
```

**Check Sentry:**
- [ ] Error appears in Sentry dashboard (within 30 seconds)
- [ ] Error includes stack trace
- [ ] Environment tagged as "production"

- [ ] Error logging works

---

### Step 5: Monitoring Verification (1 minute)

**Check all monitoring systems:**

**Vercel Dashboard:**
- [ ] Deployment status: "Ready"
- [ ] Build: Successful
- [ ] No 5xx errors in logs
- [ ] Response time < 500ms

**Sentry:**
- [ ] No unexpected errors (except test error)
- [ ] Error rate < 0.1%

**Neon Database:**
- [ ] Connections: < 10 (low at launch)
- [ ] CPU: < 10%
- [ ] Storage: Within limits

**UptimeRobot:**
- [ ] Health check: "Up"
- [ ] Response time: < 1000ms

**Vercel Logs:**
```bash
vercel logs --prod --tail

# Watch for errors (should be minimal)
```
- [ ] No error-level logs (except test)
- [ ] Info logs showing activity

---

### Step 6: Announce Success (after 15 minutes of stability)

**Internal announcement (Slack/Discord):**

Post in #general or #announcements:
```
🚀 Audiospective v1.0.0 is now LIVE!

✅ Deployment successful at 10:05 AM UTC
✅ All health checks passing
✅ Smoke tests completed
✅ Monitoring active

URL: https://[your-domain]

Team: Please test and report any issues in #incidents
Users: Monitoring closely for next 2 hours
```

**Checkpoint:**
- [ ] Internal team notified
- [ ] Launch time documented
- [ ] Monitoring plan communicated

**Do NOT announce publicly yet** - Wait 2 hours of stability first

---

### Deployment Complete ✅

**Time:** ~15 minutes

**Status:** Production deployment complete and verified

**Next:** Begin post-deployment monitoring protocol

---

## Post-Deployment Verification

**Timeline: First 2 hours after deployment**

---

### First 15 Minutes (10:15 AM - 10:30 AM)

**Monitoring Lead watches these metrics:**

#### Vercel Metrics (refresh every minute)

- [ ] Error rate: < 1% ✅
- [ ] Response time p95: < 500ms ✅
- [ ] Active requests: Increasing (sign of traffic) ✅
- [ ] Build status: Successful ✅

#### Sentry (refresh every 30 seconds)

- [ ] Error count: < 5 in 15 minutes ✅
- [ ] No new error types (except test) ✅
- [ ] Error rate declining ✅

#### Neon Database

- [ ] Connection count: < 20 ✅
- [ ] CPU usage: < 20% ✅
- [ ] Query latency p95: < 50ms ✅
- [ ] Storage growth: Linear (not spiking) ✅

#### Application Health

```bash
# Check health every 2 minutes
watch -n 120 'curl -s https://[your-domain]/api/health | jq ".status"'

# Should consistently show: "healthy"
```

- [ ] Health check: "healthy" (all 5 checks) ✅

#### User Activity

**Watch for first real users:**

```bash
# Monitor sign-ins in logs
vercel logs --prod | grep "User authenticated"

# Or in Vercel dashboard Analytics tab
```

- [ ] First user sign-in detected ✅
- [ ] Dashboard loads for users ✅
- [ ] No critical errors for users ✅

---

#### Decision Point (10:30 AM)

**After 15 minutes of stability:**

**If all metrics green:** ✅ Continue monitoring

**If any critical issues:** 🔴 Execute rollback procedure (see below)

---

### First Hour (10:30 AM - 11:00 AM)

#### Regression Testing

```bash
# Run automated tests against production
npm run test:e2e -- --project=production

# Or manually run CI pipeline
gh workflow run pr-checks.yml
```

- [ ] Automated tests pass ✅
- [ ] No regressions detected ✅

#### Background Jobs

**Verify QStash schedule:**

```bash
# Check QStash dashboard
# https://console.upstash.com/qstash

# Should see:
# - Schedule: hourly-archive-production
# - Status: Active
# - Next run: :00 of next hour
```

- [ ] QStash schedule active ✅
- [ ] Next run scheduled ✅

**Wait for next hourly archival (top of the hour):**

```bash
# At 11:00 AM, watch logs for cron job
vercel logs --prod | grep "/api/cron/archive"

# Expected:
# [11:00:01] POST /api/cron/archive 200 (2.3s)
```

- [ ] Cron job triggered at :00 ✅
- [ ] Cron job completed successfully ✅
- [ ] Users' data archived ✅

#### Token Refresh

**Verify Spotify token refresh working:**

```bash
# Watch logs for token refresh events
vercel logs --prod | grep "Token refresh"

# Expected (every 1 hour per active user):
# Token refreshed for user [userId]
```

- [ ] Token refresh working ✅
- [ ] No "refresh failed" errors ✅

#### User Feedback

**Monitor feedback channels:**

- Email inbox
- Twitter mentions
- Reddit posts/comments
- Support tickets
- Discord/Slack DMs

- [ ] No critical user-reported issues ✅
- [ ] Respond to user questions promptly ✅

---

### First 2 Hours (11:00 AM - 12:00 PM)

#### Performance Analysis

**Vercel Analytics (Speed Insights):**
- [ ] LCP (Largest Contentful Paint): < 2.5s ✅
- [ ] FID (First Input Delay): < 100ms ✅
- [ ] CLS (Cumulative Layout Shift): < 0.1 ✅
- [ ] Overall score: > 90 ✅

**Response Time Analysis:**
```bash
# Check p50, p95, p99 response times
# In Vercel dashboard → Analytics → Performance
```

- [ ] p50: < 200ms ✅
- [ ] p95: < 500ms ✅
- [ ] p99: < 1000ms ✅

#### Database Growth

**Monitor database size:**

```bash
# Check storage usage in Neon console
# Or query:
psql "$DATABASE_URL" -c "
SELECT pg_size_pretty(pg_database_size(current_database()));
"
```

- [ ] Storage growing linearly (not exponentially) ✅
- [ ] Current usage: ___ MB (< 100 MB for first day) ✅
- [ ] Projected 30-day usage: ___ MB (< 500 MB) ✅

#### Error Rate Analysis

**Sentry Dashboard:**

- [ ] Total errors in 2 hours: < 10 ✅
- [ ] Error rate: < 0.1% ✅
- [ ] No new error patterns ✅
- [ ] All errors have stack traces ✅

**Categorize errors:**
- **Critical (data loss, security):** 0 ✅
- **High (feature broken):** 0 ✅
- **Medium (degraded UX):** < 5 ✅
- **Low (minor glitch):** < 10 ✅

#### User Metrics

**Vercel Analytics:**
- [ ] Total users: ___ (expect low on day 1)
- [ ] Total page views: ___
- [ ] Bounce rate: < 70% (users stay on site)
- [ ] Average session: > 2 minutes

**Application Metrics (from logs):**
- [ ] Total sign-ups: ___
- [ ] Successful archival events: ___
- [ ] Export downloads: ___
- [ ] Share reports created: ___

---

#### Decision Point (12:00 PM - 2 Hours Stable)

**After 2 hours of stability:**

✅ **All green:** Proceed to public announcement

⚠️ **Some warnings:** Delay announcement, continue monitoring

🔴 **Critical issues:** Execute rollback

---

### Public Announcement (12:00 PM)

**If all systems stable for 2 hours, announce publicly:**

#### Twitter/X Post

```
🎉 Excited to launch Audiospective!

Archive your Spotify listening history automatically and visualize your music journey over time.

Features:
✨ Automatic hourly archival
📊 Beautiful data visualizations
📥 Export to CSV/JSON
🔗 Shareable reports
🔒 GDPR compliant

Try it now: https://[your-domain]

Built with @vercel @nextjs @prisma @upstash

#Spotify #WebDev #BuildInPublic
```

#### Reddit Posts

**r/spotify:**
```
Title: Built a tool to archive & visualize your Spotify history

I created Audiospective to solve a problem I had: Spotify only shows your last 50 plays. This tool automatically archives your listening history every hour so you never lose data.

Features:
- Automatic archival (using Spotify API)
- Dashboard with visualizations
- Export to CSV/JSON
- Shareable reports
- Open source & privacy-focused

Try it: [your-domain]

Feedback welcome!
```

**r/webdev:**
```
Title: Launched my Next.js + PostgreSQL Spotify analytics app

Just launched Audiospective after 2 weeks of development. It archives Spotify listening history and provides visualizations.

Tech stack:
- Next.js 14 (App Router)
- PostgreSQL (Neon)
- Prisma ORM
- NextAuth for Spotify OAuth
- Redis for rate limiting
- QStash for background jobs
- Deployed on Vercel

Live demo: [your-domain]
Code: github.com/[user]/[repo]

Happy to answer any technical questions!
```

#### Email Newsletter (if applicable)

```
Subject: 🎉 Audiospective is now live!

Hi [Name],

I'm excited to announce that Audiospective is now available for everyone!

What is it?
Audiospective automatically archives your Spotify listening history every hour and provides beautiful visualizations of your music journey.

Key Features:
✅ Automatic hourly archival (never lose your listening data)
✅ Interactive dashboard with charts and stats
✅ Export your data to CSV/JSON
✅ Create shareable reports for friends
✅ GDPR compliant (delete your data anytime)

Try it now: [your-domain]

It's completely free to use and respects your privacy (see our Privacy Policy).

Questions? Reply to this email!

Cheers,
[Your Name]

P.S. It's open source! Check out the code: github.com/[user]/[repo]
```

#### Status Page (if using one)

```
All Systems Operational

Audiospective v1.0.0 launched successfully on December 17, 2025 at 10:05 AM UTC.

Current Status:
✅ Authentication: Operational
✅ Archival System: Operational
✅ API: Operational
✅ Background Jobs: Operational

Uptime: 99.9%
```

**Checklist:**
- [ ] Twitter post published
- [ ] Reddit posts published
- [ ] Email sent (if applicable)
- [ ] Status page updated
- [ ] Landing page updated
- [ ] Launch announcement on website
- [ ] GitHub repository made public (if private)

---

## Monitoring Protocol

**Ongoing monitoring after launch**

---

### First Day (12:00 PM - 11:59 PM)

**Check every hour:**

- [ ] Sentry: No new critical errors
- [ ] UptimeRobot: Uptime > 99%
- [ ] Vercel: Response times stable
- [ ] Database: Storage growth linear
- [ ] User feedback: No critical issues reported

**Set alerts:**

- Error rate > 1% → Slack + Email
- Uptime < 99% → SMS + Email
- Response time p95 > 1000ms → Slack
- Database storage > 80% → Email
- CPU > 80% → Email

---

### First Week (7 days)

**Daily checks:**

- [ ] Morning: Review Sentry errors from previous 24h
- [ ] Afternoon: Check database size and connections
- [ ] Evening: Review user feedback and support tickets

**Weekly review (Friday):**

- [ ] Total uptime: > 99.5%
- [ ] Total errors: < 100
- [ ] User sign-ups: ___
- [ ] Feature usage: Archival ___, Export ___, Share ___
- [ ] Performance: Meets targets (LCP < 2.5s, etc.)
- [ ] Database: < 10% of capacity (< 50 MB)

---

### Ongoing (After Week 1)

**Monthly tasks:**

- [ ] Review Sentry error trends
- [ ] Optimize slow queries
- [ ] Update dependencies (`npm audit`)
- [ ] Rotate secrets (NEXTAUTH_SECRET, etc.)
- [ ] Database backup verification
- [ ] Review and respond to user feedback

---

## Rollback Procedure

**Execute this if critical issues detected**

---

### When to Rollback

#### Immediate Rollback Required (Critical) 🔴

- **Data Loss:** Users' data deleted or corrupted
- **Security Breach:** Credentials exposed, unauthorized access
- **Complete Failure:** Application not loading at all
- **Database Issues:** Cannot connect, data corruption
- **Authentication Broken:** >50% users cannot sign in
- **High Error Rate:** >50% of requests failing

#### Rollback Recommended (Major) ⚠️

- **Partial Failure:** Key feature broken (e.g., archival fails for all users)
- **High Error Rate:** >10% of requests failing
- **Performance Degradation:** Response time >2x normal (>1s p95)
- **Background Jobs Failing:** QStash cron not running

#### No Rollback (Minor) ✅

- **UI Glitches:** Visual bugs, non-blocking
- **Low Error Rate:** <1% of requests failing
- **Individual User Issues:** <5 users affected
- **Minor Performance:** Response time 1.5x normal

---

### Rollback Decision Matrix

| Issue | Severity | Users Affected | Action |
|-------|----------|---------------|--------|
| Data loss | Critical | Any | **Immediate rollback** |
| Security breach | Critical | Any | **Immediate rollback** |
| Auth broken | Critical | >50% | **Immediate rollback** |
| Feature broken | High | >20% | **Rollback** |
| High errors | High | >10% | **Rollback** |
| UI bugs | Low | Any | Fix in hotfix |
| Performance slow | Medium | All | Investigate, rollback if >2x |

**Rollback Authority:**
- **Deployment Lead** can initiate rollback (any time)
- **Monitoring Lead** can request rollback (requires approval)
- **Anyone** can request rollback for critical issues

---

### Rollback Steps (Vercel)

**Timeline: 2-5 minutes**

#### Step 1: Identify Last Good Deployment

```bash
# List recent deployments
vercel ls

# Output shows:
# audiospective-abc123.vercel.app  (current, broken)
# audiospective-xyz789.vercel.app  (previous, stable)
```

**Identify last stable deployment:**
- Check deployment time (before issues started)
- Verify it was working (check logs, metrics)
- Note the deployment URL

---

#### Step 2: Execute Rollback

**Method 1: Vercel Dashboard (Recommended)**

1. Go to Vercel dashboard → Deployments
2. Find last stable deployment
3. Click "..." menu → "Redeploy"
4. Select "Use existing build" (faster)
5. Click "Redeploy"

**Method 2: Vercel CLI**

```bash
# Rollback to specific deployment
vercel rollback [deployment-url]

# Example:
vercel rollback audiospective-xyz789.vercel.app

# Expected output:
# ✓ Rolled back to audiospective-xyz789
```

**Method 3: Git Revert + Redeploy**

```bash
# Revert to previous commit
git revert HEAD --no-edit
git push origin main

# CI/CD will auto-deploy
# Or manual:
vercel --prod
```

---

#### Step 3: Verify Rollback

```bash
# Test health check
curl https://[your-domain]/api/health

# Expected: status "healthy"
```

**Verify:**
- [ ] Health check passes ✅
- [ ] Deployment shows old version (not v1.0.0) ✅
- [ ] Error rate decreased ✅
- [ ] Users can access site ✅

---

#### Step 4: Communicate Rollback

**Internal (Slack/Discord):**
```
🔄 ROLLBACK EXECUTED

Issue: [Brief description]
Time: [Time of rollback]
Status: Rolled back to v0.9.9 (stable)

Current status: All systems operational
Investigation: In progress

Team: Please avoid deploying until further notice
```

**Public (Twitter/Status Page):**
```
We're currently investigating an issue with our service. We've rolled back to a stable version. Apologies for any inconvenience.

Status: https://status.[your-domain]
```

**User-facing (if needed):**
- Update status page: "Investigating"
- Pin tweet about temporary issue
- Add notice to homepage (if accessible)

---

#### Step 5: Post-Rollback Actions

**Immediate (within 30 minutes):**

1. **Verify Stability:**
   - Monitor metrics for 15 minutes
   - Ensure error rate back to normal
   - Verify users can use application

2. **Preserve Evidence:**
   ```bash
   # Save logs from failed deployment
   vercel logs [broken-deployment-url] > incident-logs.txt

   # Screenshot Sentry errors
   # Export database state (if relevant)
   ```

3. **Notify Stakeholders:**
   - Engineering team: Root cause investigation
   - Product team: User impact assessment
   - Support team: User communication

**Within 2 hours:**

4. **Root Cause Analysis:**
   - What went wrong?
   - Why did pre-deployment checks not catch it?
   - How many users were affected?
   - What was the blast radius?

5. **Fix Development:**
   - Create hotfix branch
   - Develop fix
   - Test thoroughly (include new test case)
   - Create PR with detailed explanation

**Within 24 hours:**

6. **Post-Mortem:**
   - Document timeline of events
   - Identify root cause
   - List contributing factors
   - Propose preventive measures
   - Share with team

---

### Rollback Testing

**Verify you can rollback before launch:**

```bash
# Deploy to staging
vercel --prod --env=staging

# Note deployment URL
STAGING_URL=$(vercel ls --environment=staging | head -n1)

# Make a change and redeploy
echo "// test change" >> src/app/page.tsx
vercel --prod --env=staging

# Rollback to previous
vercel rollback $STAGING_URL --env=staging

# Verify rollback successful
curl https://staging-[your-domain]/api/health
```

- [ ] Rollback tested on staging ✅
- [ ] Rollback time measured: ___ minutes ✅
- [ ] Team knows rollback procedure ✅

---

## Incident Response

**Protocol for handling production incidents**

---

### Incident Severity Levels

#### SEV-1 (Critical) 🔴

**Definition:** Complete outage or data loss affecting all users

**Examples:**
- Site completely down (502/503 errors)
- Database unreachable
- Data loss or corruption
- Security breach

**Response Time:** Immediate (page on-call engineer)

**Response:**
1. Page all team members
2. Create incident channel (#incident-[timestamp])
3. Assign incident commander
4. Execute rollback (if needed)
5. Communicate to users immediately

---

#### SEV-2 (High) ⚠️

**Definition:** Major feature broken, affecting >20% of users

**Examples:**
- Authentication failures
- Archival system not working
- High error rate (>10%)
- Slow performance (>2x normal)

**Response Time:** Within 15 minutes

**Response:**
1. Notify engineering team
2. Investigate root cause
3. Consider rollback
4. Develop fix
5. Deploy hotfix

---

#### SEV-3 (Medium) 🟡

**Definition:** Minor feature degraded, affecting <20% of users

**Examples:**
- Export failing for some users
- Share reports not generating
- Minor UI bugs
- Slow API responses (1.5x normal)

**Response Time:** Within 1 hour

**Response:**
1. Create issue in GitHub
2. Investigate during business hours
3. Fix in next deployment
4. Monitor for escalation

---

#### SEV-4 (Low) 🟢

**Definition:** Cosmetic issues, no functional impact

**Examples:**
- UI alignment issues
- Typos
- Minor visual bugs
- Non-critical warnings in logs

**Response Time:** Next sprint

**Response:**
1. Create issue in backlog
2. Fix when convenient
3. No user communication needed

---

### Incident Response Procedure

#### 1. Detection (0-5 minutes)

**How incidents are detected:**
- Monitoring alerts (Sentry, UptimeRobot)
- User reports (email, Twitter, support tickets)
- Team member notices issue

**First Responder Actions:**
1. Verify incident is real (not false alarm)
2. Assess severity (SEV-1 through SEV-4)
3. Create incident in tracking system
4. Notify appropriate team members

---

#### 2. Response (5-30 minutes)

**Incident Commander (usually Deployment Lead):**

1. **Assess Situation:**
   - What is broken?
   - How many users affected?
   - Is data at risk?
   - Is rollback needed?

2. **Assemble Team:**
   - SEV-1: All hands
   - SEV-2: Engineering team
   - SEV-3: On-call engineer

3. **Communicate:**
   - Internal: Slack incident channel
   - External: Status page (SEV-1/SEV-2 only)

4. **Decide Action:**
   - Rollback immediately (if critical)
   - Investigate and fix (if time permits)
   - Hotfix deployment (if fix is quick)

---

#### 3. Mitigation (30 minutes - 2 hours)

**Execute chosen action:**

**If Rollback:**
- Follow rollback procedure (above)
- Verify stability after rollback
- Communicate resolution

**If Hotfix:**
```bash
# Create hotfix branch
git checkout -b hotfix/critical-issue main

# Make fix
# ... edit files ...

# Test locally
npm test
npm run build

# Deploy to staging first (if time permits)
vercel --env=staging

# Test on staging
# ... manual verification ...

# Deploy to production
vercel --prod

# Verify fix
curl https://[your-domain]/api/health
```

**If Investigation Needed:**
- Gather logs and metrics
- Reproduce issue locally
- Identify root cause
- Develop comprehensive fix

---

#### 4. Recovery (2-4 hours)

**Verify system is stable:**

- [ ] Health checks passing
- [ ] Error rate back to normal (<0.1%)
- [ ] User reports stopped
- [ ] Metrics stable for 30 minutes

**Communicate resolution:**

**Internal:**
```
✅ INCIDENT RESOLVED

Issue: [Description]
Duration: [Start time] - [End time] ([X] minutes)
Users Affected: [Estimate]
Resolution: [What was done]

Root cause analysis to follow in post-mortem.
```

**Public (if communicated publicly):**
```
✅ The issue has been resolved. All systems are operational.

We apologize for any inconvenience. A detailed post-mortem will be shared soon.
```

---

#### 5. Post-Mortem (Within 24 hours)

**Create incident report:**

```markdown
# Incident Post-Mortem: [Brief Description]

**Date:** December 17, 2025
**Duration:** 10:15 AM - 10:45 AM UTC (30 minutes)
**Severity:** SEV-2
**Users Affected:** Approximately 50 users

## Summary

Brief description of what happened.

## Timeline

- **10:15 AM:** Deployment completed
- **10:17 AM:** First error detected in Sentry
- **10:20 AM:** User reports started coming in
- **10:22 AM:** Incident declared (SEV-2)
- **10:25 AM:** Root cause identified
- **10:30 AM:** Rollback executed
- **10:35 AM:** Stability verified
- **10:45 AM:** Incident closed

## Root Cause

Detailed explanation of what caused the issue.

## Resolution

How the issue was fixed.

## Impact

- Users affected: ~50 (approximately 80% of active users at time)
- Duration: 30 minutes
- Revenue impact: None (free product)
- Data loss: None

## Lessons Learned

### What Went Well

- Monitoring detected issue within 2 minutes
- Rollback executed quickly (8 minutes)
- Team responded promptly

### What Went Wrong

- Pre-deployment checks didn't catch the issue
- No staging environment test before production
- Insufficient test coverage for this scenario

### Action Items

- [ ] Add integration test for this scenario (Owner: [Name], Due: [Date])
- [ ] Update pre-deployment checklist (Owner: [Name], Due: [Date])
- [ ] Improve staging environment parity (Owner: [Name], Due: [Date])
- [ ] Conduct team training on incident response (Owner: [Name], Due: [Date])

## Prevention

Steps to prevent this from happening again.

---

**Post-Mortem Author:** [Name]
**Reviewed By:** [Team Members]
**Date Published:** [Date]
```

**Share post-mortem:**
- Internal: Post in #engineering channel
- Public: Optional blog post (if SEV-1/SEV-2 and users impacted)

---

### Incident Communication Templates

#### SEV-1 Incident (Critical Outage)

**Status Page:**
```
🔴 INVESTIGATING: Major Service Disruption

We're currently experiencing a major service disruption. Our team is actively investigating and working to resolve this as quickly as possible.

We apologize for the inconvenience and will provide updates every 15 minutes.

Status: Investigating
Started: [Time] UTC
Updates: https://status.[your-domain]
```

**Twitter:**
```
We're currently experiencing technical difficulties. Our team is working to resolve this ASAP. We'll provide updates as we have them. Apologies for any inconvenience.
```

---

#### SEV-2 Incident (Major Feature Broken)

**Status Page:**
```
⚠️ DEGRADED PERFORMANCE: Archival System

We're aware of an issue affecting the automatic archival system. Manual archival may be impacted. Other features are working normally.

Our team is investigating.

Status: Investigating
Started: [Time] UTC
```

**Twitter:**
```
We're investigating an issue with automatic archival. The team is working on a fix. Other features are working normally.
```

---

#### Incident Resolved

**Status Page:**
```
✅ RESOLVED: All Systems Operational

The issue affecting [feature] has been resolved. All systems are now operational.

Duration: [X] minutes
Cause: [Brief explanation]

We apologize for any inconvenience. A detailed post-mortem will be available soon.
```

**Twitter:**
```
✅ The issue has been resolved. All systems are back to normal. Thanks for your patience!

We'll be sharing a detailed post-mortem on what happened and how we're preventing it in the future.
```

---

## Communication Plan

**Stakeholder communication during deployment**

---

### Internal Communication

#### Before Launch (T-24 hours)

**Email to team:**
```
Subject: 🚀 Production Launch - Tomorrow at 10:00 AM UTC

Team,

We're launching Audiospective to production tomorrow (December 17) at 10:00 AM UTC.

**Who needs to be available:**
- [Deployment Lead]: Online from 9:30 AM - 12:00 PM UTC
- [Monitoring Lead]: Online from 9:30 AM - 12:00 PM UTC
- [Support Lead]: Online from 10:00 AM - 2:00 PM UTC
- [Backup Engineer]: On standby

**Communication channel:**
- Slack #deployment (or create channel)

**Pre-deployment checklist:**
- Reviewed: DEPLOYMENT-RUNBOOK.md
- Rollback plan: Ready
- Monitoring dashboards: Bookmarked

**Timeline:**
- 9:30 AM: Pre-deployment checks
- 10:00 AM: Deployment begins
- 10:15 AM: Smoke tests
- 12:00 PM: Public announcement (if stable)

Questions? Reply to this email or ask in #deployment.

See you tomorrow!
[Your Name]
```

---

#### During Launch (Every 30 minutes)

**Slack updates in #deployment:**

```
10:00 AM - 🚀 Deployment started
- Tag: v1.0.0
- Deployment: In progress
- Status: Building...

10:05 AM - ✅ Deployment complete
- Build: Successful
- Health check: Passing
- Starting smoke tests...

10:15 AM - ✅ Smoke tests passed
- Sign in: Working
- Dashboard: Working
- Archival: Working
- All systems nominal
- Monitoring for next 2 hours

11:00 AM - ✅ 1 hour stable
- Errors: 0 critical
- Uptime: 100%
- Response time: p95 = 245ms
- Users: 5 sign-ups
- Continuing monitoring

12:00 PM - ✅ 2 hours stable - READY FOR PUBLIC ANNOUNCEMENT
- All metrics green
- No critical issues
- Proceeding with launch announcement
```

---

#### After Launch

**Post-launch email (end of day):**
```
Subject: ✅ Launch Successful - Day 1 Metrics

Team,

Great work today! Audiospective v1.0.0 is now live and stable.

**Launch Stats:**
- Deployment time: 10:05 AM UTC
- Downtime: 0 minutes
- Critical errors: 0
- Rollbacks: 0

**Day 1 Metrics (12 hours):**
- Uptime: 100%
- Users: 23 sign-ups
- Page views: 547
- Archival events: 89
- Error rate: 0.02%
- Response time p95: 310ms

**User Feedback:**
- Positive: 8 mentions on Twitter
- Neutral: 2 feature requests
- Negative: 0 critical issues

**Next Steps:**
- Continue monitoring for next 7 days
- Address user feedback
- Plan v1.1.0 features

Thanks for your hard work!
[Your Name]
```

---

### External Communication

#### Launch Announcement

**See "Public Announcement" section above**

---

#### User Support

**Response templates for common questions:**

**Q: "Why does the app need so many Spotify permissions?"**
```
We request these permissions to archive your listening history:

- user-read-recently-played: To fetch your last 50 plays
- user-top-read: To show your top tracks and artists
- user-read-email: To identify your account

We never access your playlists, followers, or private data. See our Privacy Policy for details: [link]
```

**Q: "How often is my data archived?"**
```
Your Spotify history is archived automatically every hour. You can also trigger manual archival anytime by clicking "Archive Now" on your dashboard.
```

**Q: "Can I delete my data?"**
```
Yes! We're GDPR compliant. You can delete all your data anytime:

1. Go to your dashboard
2. Click "Settings" → "Delete Account"
3. Confirm deletion

All your data will be permanently deleted within 24 hours.
```

**Q: "Is this safe? Do you sell my data?"**
```
Your data is safe and we NEVER sell it.

Security:
- All connections encrypted (HTTPS)
- Spotify tokens securely stored
- Regular security audits

Privacy:
- We don't sell or share your data
- You can delete anytime
- Open source (see the code)

See our Privacy Policy: [link]
```

---

## Contacts

**Emergency contact list for production incidents**

---

### Team Contacts

| Role | Name | Phone | Email | Timezone |
|------|------|-------|-------|----------|
| **Deployment Lead** | [Name] | +1-XXX-XXX-XXXX | [email] | UTC-8 |
| **Monitoring Lead** | [Name] | +1-XXX-XXX-XXXX | [email] | UTC-5 |
| **Support Lead** | [Name] | +1-XXX-XXX-XXXX | [email] | UTC+0 |
| **Backup Engineer** | [Name] | +1-XXX-XXX-XXXX | [email] | UTC-5 |

---

### Service Providers

| Service | Support | Contact | SLA |
|---------|---------|---------|-----|
| **Vercel** | support@vercel.com | https://vercel.com/support | 24-48h (Pro plan) |
| **Neon** | support@neon.tech | https://neon.tech/docs/introduction/support | 24-48h (Free tier) |
| **Upstash** | support@upstash.com | Discord: discord.gg/upstash | Community support |
| **Sentry** | support@sentry.io | https://sentry.io/support | 24-48h (Team plan) |
| **Spotify** | api-support@spotify.com | https://developer.spotify.com/support | Community forum |

---

### Escalation Path

**For critical incidents:**

1. **First Response:** On-call engineer (immediate)
2. **Escalation L1:** Deployment Lead (if >15 min)
3. **Escalation L2:** All team members (if SEV-1)
4. **Escalation L3:** Service provider support (if infrastructure issue)

---

### Communication Channels

| Channel | Purpose | URL |
|---------|---------|-----|
| **Slack #deployment** | Launch coordination | slack.com/[workspace]/deployment |
| **Slack #incidents** | Production incidents | slack.com/[workspace]/incidents |
| **GitHub Issues** | Bug tracking | github.com/[user]/[repo]/issues |
| **Status Page** | Public status | status.[your-domain] |
| **Twitter** | Public announcements | twitter.com/[account] |

---

## Appendix

### Deployment Checklist (Printable)

```
☐ Pre-Deployment
  ☐ Team online
  ☐ Dashboards open
  ☐ Environment variables verified
  ☐ Database backup taken
  ☐ Rollback plan ready

☐ Deployment
  ☐ Git tag created (v1.0.0)
  ☐ Tag pushed
  ☐ Deployment triggered
  ☐ Build successful
  ☐ Deployment URL received

☐ Verification
  ☐ Health check passing
  ☐ Homepage loads
  ☐ Sign in works
  ☐ Dashboard loads
  ☐ Archival works
  ☐ Export works
  ☐ Share works
  ☐ Monitoring active

☐ Announcement
  ☐ 2 hours stable
  ☐ Twitter posted
  ☐ Reddit posted
  ☐ Status page updated

☐ Ongoing
  ☐ Monitoring every hour (first day)
  ☐ Respond to user feedback
  ☐ Daily check (first week)
```

---

### Quick Reference Commands

```bash
# Health check
curl https://[your-domain]/api/health

# Tail production logs
vercel logs --prod --tail

# List deployments
vercel ls

# Rollback
vercel rollback [deployment-url]

# Environment variables
vercel env ls
vercel env pull .env.production.local

# Database
npx prisma studio --url="$DATABASE_URL"
psql "$DATABASE_URL"

# Test deployment
npm test && npm run build

# Create tag
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0

# Deploy
vercel --prod
```

---

### Monitoring URLs

- **Vercel Dashboard:** https://vercel.com/[team]/[project]
- **Sentry Dashboard:** https://sentry.io/organizations/[org]/projects/[project]/
- **Neon Console:** https://console.neon.tech/app/projects/[project-id]
- **Upstash Console:** https://console.upstash.com
- **UptimeRobot Dashboard:** https://uptimerobot.com/dashboard
- **Production URL:** https://[your-domain]
- **Health Check:** https://[your-domain]/api/health

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-04 | Claude Code | Initial release |

---

**Last Updated:** December 4, 2025

**Next Review:** After Day 14 launch (post-mortem)

---

🤖 **Generated with Claude Code**

Co-Authored-By: Claude <noreply@anthropic.com>
