# Pre-Launch Action Checklist - User Actions Required

**Created:** December 4, 2025
**Owner:** You (Project Owner)
**Deadline:** Before Day 14 Launch
**Estimated Time:** 2-3 hours

---

## Overview

This checklist contains **manual actions YOU must complete** before Day 14 production launch. These cannot be automated and require your accounts, credentials, and decisions.

**Status Tracker:**
- ⏳ Not Started
- 🔄 In Progress
- ✅ Complete

---

## Critical: Naming & Branding (MUST DO FIRST)

### ⚠️ TRADEMARK ISSUE: Cannot Use "Audiospective"

**Issue:** You mentioned you cannot use "audiospective" due to copyright restrictions.

**Impact:** The name appears in:
- [ ] Repository name
- [ ] Package.json
- [ ] Documentation (10+ files)
- [ ] Spotify Developer App name
- [ ] Domain/URL (if purchased)
- [ ] Marketing materials

**Action Required:** Choose new name before proceeding ⬇️

---

## Step 1: Choose New Application Name

**Requirements:**
- ✅ Avoid "Spotify" in the name (trademark)
- ✅ Avoid "Time Machine" (if copyrighted)
- ✅ Be descriptive of music/listening/archival
- ✅ Available as domain (.com or .app)
- ✅ Not trademarked by others

**Name Suggestions:**

| Name | Domain Check | Trademark Risk | Notes |
|------|--------------|----------------|-------|
| **TuneVault** | tunevault.app | Low | Archive + Music |
| **PlayTracker** | playtracker.app | Low | Simple, clear |
| **MusicMemory** | musicmemory.app | Low | Descriptive |
| **ListenLog** | listenlog.app | Low | Alliteration |
| **TrackArchive** | trackarchive.app | Low | Direct |
| **SoundScroll** | soundscroll.app | Low | Unique |
| **BeatBank** | beatbank.app | Medium | Financial metaphor |
| **GrooveVault** | groovevault.app | Low | Fun, memorable |
| **Histunes** | histunes.app | Low | History + Tunes |
| **PlayPast** | playpast.app | Low | Past plays |

**Your Choice:** ___________________________

**Verification:**
- [ ] Domain available? (Check at namecheap.com or similar)
- [ ] Trademark search? (uspto.gov for US, tmdn.org for EU)
- [ ] Google search shows no major conflicts?

---

## Step 2: Rename Project Files

**After choosing name, update these files:**

### Package.json
```bash
# Current
"name": "audiospective"

# Change to
"name": "your-new-name"
```

### README.md
```bash
# Find and replace all instances of "Audiospective"
# with "Your New Name"
```

### All Documentation Files
- [ ] README.md
- [ ] API.md
- [ ] DEPLOYMENT-READY.md
- [ ] TROUBLESHOOTING.md
- [ ] ARCHITECTURE.md
- [ ] STAGING-SETUP.md
- [ ] QA-CHECKLIST.md
- [ ] PRODUCTION-DEPLOY-PREP.md
- [ ] DEPLOYMENT-RUNBOOK.md
- [ ] SECURITY-ASSESSMENT.md

**Bulk Replace Command:**
```bash
# From project root
find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/Audiospective/Your New Name/g' {} +

find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/audiospective/your-new-name/g' {} +
```

### Repository Name (Optional)
If you want to rename the GitHub repository:
1. Go to GitHub repository settings
2. Change repository name
3. Update local remote: `git remote set-url origin [new-url]`

---

## Required Account Setups

### Account 1: Vercel (Deployment Platform) ⏳

**Purpose:** Host the production application

**Steps:**
1. [ ] Go to https://vercel.com/signup
2. [ ] Sign up (use GitHub OAuth recommended)
3. [ ] Verify email
4. [ ] Note your Vercel username: _______________

**Free Tier Limits:**
- 100GB bandwidth/month
- Unlimited projects
- Should be sufficient for MVP

**Cost:** $0/month (free tier)

---

### Account 2: Neon PostgreSQL (Production Database) ⏳

**Purpose:** Store user data, play events, artists

**Steps:**
1. [ ] Go to https://console.neon.tech/signup
2. [ ] Sign up (use GitHub OAuth recommended)
3. [ ] Verify email
4. [ ] Create new project:
   - Project name: `[your-app-name]-production`
   - Region: **US East (Ohio) us-east-2** (closest to Vercel)
   - PostgreSQL version: **16**
5. [ ] Copy connection string
6. [ ] Save connection string to password manager
7. [ ] Label as: "Production DATABASE_URL"

**Connection String Format:**
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Example:**
```
postgresql://user:XyZ123@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Free Tier Limits:**
- 512 MB storage
- 100 compute hours/month
- Should be sufficient for first 100-500 users

**Cost:** $0/month (free tier)

---

### Account 3: Spotify Developer (OAuth) ⏳

**Purpose:** Allow users to sign in with Spotify

**Steps:**
1. [ ] Go to https://developer.spotify.com/dashboard
2. [ ] Sign in with your Spotify account
3. [ ] Click "Create App"
4. [ ] Fill in details:
   - **App Name:** `[Your App Name] (Production)`
   - **App Description:** `Archive your Spotify listening history automatically`
   - **Website:** `https://[your-domain]` (or leave blank for now)
   - **Redirect URIs:** `https://[your-domain]/api/auth/callback/spotify`
     - **Note:** You can add this later after deploying
   - **APIs Used:** Web API
5. [ ] Accept terms and conditions
6. [ ] Click "Create"
7. [ ] Click "Settings"
8. [ ] Copy **Client ID**
9. [ ] Click "View client secret"
10. [ ] Copy **Client Secret**
11. [ ] Save both to password manager
12. [ ] Label as: "Production Spotify Client ID/Secret"

**Important:**
- Keep Client Secret secure (never commit to git)
- You'll add the redirect URI after deploying to Vercel

**Cost:** $0/month (free)

---

### Account 4: Upstash Redis (Rate Limiting & Caching) ⏳

**Purpose:** Rate limiting and caching for performance

**Steps:**
1. [ ] Go to https://console.upstash.com/signup
2. [ ] Sign up (use GitHub OAuth recommended)
3. [ ] Verify email
4. [ ] Click "Create Database"
5. [ ] Configure:
   - **Name:** `[your-app-name]-production`
   - **Type:** Regional
   - **Region:** **us-east-1** (closest to Vercel)
   - **TLS:** Enabled (default)
6. [ ] Click "Create"
7. [ ] Copy **REST URL** (starts with https://)
8. [ ] Copy **REST TOKEN** (long string)
9. [ ] Save both to password manager
10. [ ] Label as: "Production Redis URL/Token"

**Free Tier Limits:**
- 10,000 commands/day
- Should be sufficient for ~100-200 users

**Cost:** $0/month (free tier)

---

### Account 5: Upstash QStash (Background Jobs) ⏳

**Purpose:** Run automatic hourly archival for all users

**Steps:**
1. [ ] In Upstash console (same account as Redis)
2. [ ] Click "QStash" in sidebar
3. [ ] Click "Get Started" (if first time)
4. [ ] Copy these values:
   - **QSTASH_URL:** `https://qstash.upstash.io`
   - **QSTASH_TOKEN:** `[shown in dashboard]`
   - **QSTASH_CURRENT_SIGNING_KEY:** `sig_[...]`
   - **QSTASH_NEXT_SIGNING_KEY:** `sig_[...]`
5. [ ] Save all 4 values to password manager
6. [ ] Label as: "Production QStash Credentials"

**Note:** You'll create the schedule (cron job) after deployment

**Free Tier Limits:**
- 500 messages/day
- Sufficient for ~500 users with hourly archival

**Cost:** $0/month (free tier)

---

### Account 6: Sentry (Error Monitoring) - RECOMMENDED ⏳

**Purpose:** Track and alert on production errors

**Steps:**
1. [ ] Go to https://sentry.io/signup
2. [ ] Sign up (use GitHub OAuth recommended)
3. [ ] Select platform: **Next.js**
4. [ ] Create project:
   - **Project Name:** `[your-app-name]-production`
   - **Team:** Default
5. [ ] Copy **DSN** (looks like: `https://[key]@o[orgid].ingest.sentry.io/[projectid]`)
6. [ ] Go to Settings → API Keys
7. [ ] Create new Auth Token:
   - **Name:** Production Deploy
   - **Scopes:** `project:releases`, `project:write`
8. [ ] Copy **Auth Token**
9. [ ] Save DSN and Auth Token to password manager
10. [ ] Label as: "Production Sentry DSN/Token"

**Free Tier Limits:**
- 5,000 errors/month
- Should be sufficient

**Cost:** $0/month (free tier)

**Optional:** Skip if you want to launch without error monitoring (can add later)

---

### Account 7: UptimeRobot (Uptime Monitoring) - OPTIONAL ⏳

**Purpose:** Get alerted if your app goes down

**Steps:**
1. [ ] Go to https://uptimerobot.com/signUp
2. [ ] Sign up (free account)
3. [ ] Verify email
4. [ ] Note: You'll create the monitor after deployment

**Free Tier Limits:**
- 50 monitors
- 5-minute checks

**Cost:** $0/month (free tier)

**Optional:** Skip if you want to launch without uptime monitoring

---

## Environment Variables Setup

### Step 1: Generate NEXTAUTH_SECRET

**Run this command:**
```bash
openssl rand -base64 64
```

**Copy output and save as:** `NEXTAUTH_SECRET`

**Example output:**
```
xK7nM9pQw2LrT5vB8hJ3mN6cD1fG4sA7yU9xZ2bV5nM8kL3pR6wT9qH4jC7nB2mY
```

**Requirements:**
- Must be 64+ characters
- Must be different from any staging/dev secret
- Never commit to git

---

### Step 2: Create .env.production.local Template

Create a file to store all your production credentials locally (for reference):

```bash
# Create file (DO NOT COMMIT THIS)
touch .env.production.local

# Add to .gitignore
echo ".env.production.local" >> .gitignore
```

**Add these values to .env.production.local:**

```bash
# Required
DATABASE_URL="postgresql://[from Neon]"
NEXTAUTH_URL="https://[your-vercel-url or custom domain]"
NEXTAUTH_SECRET="[from openssl command]"
SPOTIFY_CLIENT_ID="[from Spotify Developer]"
SPOTIFY_CLIENT_SECRET="[from Spotify Developer]"

# Recommended
UPSTASH_REDIS_REST_URL="[from Upstash Redis]"
UPSTASH_REDIS_REST_TOKEN="[from Upstash Redis]"
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="[from Upstash QStash]"
QSTASH_CURRENT_SIGNING_KEY="[from Upstash QStash]"
QSTASH_NEXT_SIGNING_KEY="[from Upstash QStash]"

# Optional (if using Sentry)
SENTRY_DSN="[from Sentry]"
SENTRY_AUTH_TOKEN="[from Sentry]"
SENTRY_ORG="[your-sentry-org]"
SENTRY_PROJECT="[your-app-name]-production"

# Automatic (Vercel sets this)
NODE_ENV="production"
```

**Save this file** - you'll use it to configure Vercel environment variables.

---

## Database Setup

### Step 1: Run Migrations on Production Database

**Prerequisites:**
- [ ] Neon database created
- [ ] DATABASE_URL copied

**Steps:**

```bash
# 1. Set DATABASE_URL temporarily
export DATABASE_URL="[your production Neon URL]"

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migrations
npx prisma migrate deploy

# Expected output:
# ✓ Migration applied successfully
```

**Verification:**
```bash
# 4. Verify tables created
npx prisma db pull

# Should show: Schema is already up to date
```

---

### Step 2: Create Database Indexes

**Run these SQL commands to optimize performance:**

```bash
# Connect to database
psql "$DATABASE_URL"
```

**Then paste these commands:**
```sql
-- Index 1: PlayEvent lookup by user and date
CREATE INDEX IF NOT EXISTS idx_playevent_user_date
ON "PlayEvent" ("userId", "playedAt" DESC);

-- Index 2: PlayEvent lookup by track
CREATE INDEX IF NOT EXISTS idx_playevent_track_user
ON "PlayEvent" ("trackId", "userId", "playedAt" DESC);

-- Index 3: SharedReport lookup by shareId
CREATE INDEX IF NOT EXISTS idx_sharedreport_shareid
ON "SharedReport" ("shareId");

-- Index 4: User lookup by Spotify ID
CREATE INDEX IF NOT EXISTS idx_user_spotifyid
ON "User" ("spotifyId");

-- Index 5: Artist lookup by Spotify ID
CREATE INDEX IF NOT EXISTS idx_artist_spotifyid
ON "Artist" ("spotifyId");

-- Verify indexes created
\di
```

**Expected:** Shows 5 new indexes

**Type** `\q` to exit psql

---

### Step 3: Take Pre-Launch Backup

**Manual backup before launch:**

```bash
# Backup production database
pg_dump "$DATABASE_URL" > production-pre-launch-backup.sql

# Verify backup
ls -lh production-pre-launch-backup.sql
```

**Save this file** - you can restore if something goes wrong during launch.

---

## Vercel Project Setup

### Step 1: Create Vercel Project

**Steps:**

1. [ ] Go to https://vercel.com/dashboard
2. [ ] Click "Add New..." → "Project"
3. [ ] Import your GitHub repository
4. [ ] Configure project:
   - **Project Name:** `[your-app-name]`
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. [ ] **DO NOT DEPLOY YET** - Click "Skip" or "Environment Variables" first

---

### Step 2: Add Environment Variables to Vercel

**In Vercel project settings → Environment Variables:**

**Add each variable** (copy from your .env.production.local file):

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production |
| `NEXTAUTH_URL` | `https://[your-domain]` | Production |
| `NEXTAUTH_SECRET` | `[64-char string]` | Production |
| `SPOTIFY_CLIENT_ID` | `[from Spotify]` | Production |
| `SPOTIFY_CLIENT_SECRET` | `[from Spotify]` | Production |
| `UPSTASH_REDIS_REST_URL` | `https://...` | Production |
| `UPSTASH_REDIS_REST_TOKEN` | `[token]` | Production |
| `QSTASH_URL` | `https://qstash.upstash.io` | Production |
| `QSTASH_TOKEN` | `[token]` | Production |
| `QSTASH_CURRENT_SIGNING_KEY` | `sig_...` | Production |
| `QSTASH_NEXT_SIGNING_KEY` | `sig_...` | Production |
| `SENTRY_DSN` | `https://...` | Production |
| `SENTRY_AUTH_TOKEN` | `[token]` | Production |
| `SENTRY_ORG` | `[org-name]` | Production |
| `SENTRY_PROJECT` | `[project-name]` | Production |
| `NODE_ENV` | `production` | Production |

**Steps for each variable:**
1. Click "Add Variable"
2. Enter Name (e.g., `DATABASE_URL`)
3. Enter Value (paste from .env.production.local)
4. Select Environment: **Production** (and optionally Preview)
5. Click "Save"

**Repeat for all 16 variables.**

---

### Step 3: Get Your Vercel URL

After adding environment variables:

1. [ ] Deploy the project (or it may auto-deploy)
2. [ ] Copy your Vercel URL: `https://[your-app-name].vercel.app`
3. [ ] Save this URL - you'll need it for Spotify OAuth

---

## Update Spotify OAuth Redirect URI

**Now that you have your Vercel URL, update Spotify:**

1. [ ] Go to https://developer.spotify.com/dashboard
2. [ ] Select your production app
3. [ ] Click "Settings"
4. [ ] Click "Edit Settings"
5. [ ] Under "Redirect URIs", add:
   ```
   https://[your-vercel-url]/api/auth/callback/spotify
   ```
   Example: `https://tunevault.vercel.app/api/auth/callback/spotify`
6. [ ] Click "Add"
7. [ ] Click "Save"

**Also update NEXTAUTH_URL in Vercel:**

1. [ ] Go to Vercel project settings → Environment Variables
2. [ ] Find `NEXTAUTH_URL`
3. [ ] Update value to: `https://[your-vercel-url]`
4. [ ] Save

---

## QStash Schedule Setup (Automatic Archival)

**Create hourly schedule for automatic archival:**

1. [ ] Go to https://console.upstash.com/qstash
2. [ ] Click "Schedules" → "Create Schedule"
3. [ ] Configure:
   - **Name:** `hourly-archive-production`
   - **Destination:** `https://[your-vercel-url]/api/cron/archive`
   - **Method:** POST
   - **Schedule (Cron):** `0 * * * *` (every hour at :00)
   - **Body:** `{}`
   - **Headers:**
     - `Content-Type: application/json`
4. [ ] Click "Create"
5. [ ] Click "Trigger Now" to test
6. [ ] Check Vercel logs to verify it worked

---

## Custom Domain Setup (OPTIONAL)

**If you want a custom domain instead of .vercel.app:**

### Step 1: Purchase Domain

1. [ ] Go to domain registrar (Namecheap, Google Domains, etc.)
2. [ ] Purchase domain: `[your-app-name].com` or `.app`
3. [ ] Cost: ~$10-15/year

### Step 2: Add Domain to Vercel

1. [ ] Go to Vercel project settings → Domains
2. [ ] Click "Add Domain"
3. [ ] Enter your domain: `[your-app-name].com`
4. [ ] Follow Vercel's instructions to update DNS records

### Step 3: Update Environment Variables

1. [ ] Update `NEXTAUTH_URL` in Vercel to `https://[your-domain].com`
2. [ ] Update Spotify redirect URI to `https://[your-domain].com/api/auth/callback/spotify`
3. [ ] Update QStash schedule destination to `https://[your-domain].com/api/cron/archive`

---

## Pre-Launch Testing Checklist

**After all setup is complete, test on production:**

### Test 1: Health Check
```bash
curl https://[your-vercel-url]/api/health

# Expected: 200 OK with "healthy" status
```

### Test 2: Sign In
1. [ ] Visit `https://[your-vercel-url]`
2. [ ] Click "Sign in with Spotify"
3. [ ] Authorize app
4. [ ] Should redirect back to your app
5. [ ] Should see dashboard

### Test 3: Manual Archival
1. [ ] Click "Archive Now"
2. [ ] Should see success message
3. [ ] Should see tracks in dashboard

### Test 4: Export
1. [ ] Click "Export" → "CSV"
2. [ ] CSV file should download

### Test 5: Share
1. [ ] Click "Share"
2. [ ] Create share report
3. [ ] Open share link in incognito
4. [ ] Should see public report

---

## Master Checklist Summary

### Critical (Must Complete Before Launch)

- [ ] **Choose new app name** (avoid "Spotify")
- [ ] **Update all documentation** with new name
- [ ] **Create Vercel account**
- [ ] **Create Neon database account**
- [ ] **Create Spotify Developer app**
- [ ] **Create Upstash Redis account**
- [ ] **Create Upstash QStash account**
- [ ] **Generate NEXTAUTH_SECRET**
- [ ] **Set all 16 environment variables in Vercel**
- [ ] **Run database migrations**
- [ ] **Create database indexes**
- [ ] **Update Spotify OAuth redirect URI**
- [ ] **Create QStash schedule**
- [ ] **Test all 5 features on production**

### Recommended (Can Add Later)

- [ ] Create Sentry account (error monitoring)
- [ ] Create UptimeRobot account (uptime monitoring)
- [ ] Purchase custom domain
- [ ] Configure custom domain

### Optional (Nice to Have)

- [ ] Set up automated backups beyond Neon
- [ ] Create status page
- [ ] Set up email notifications
- [ ] Configure additional monitoring

---

## Estimated Time

**Total Time:** 2-3 hours

| Task | Time |
|------|------|
| Choose name & update files | 30 min |
| Create accounts | 30 min |
| Database setup | 20 min |
| Vercel setup & env vars | 30 min |
| OAuth configuration | 15 min |
| QStash schedule | 10 min |
| Testing | 20 min |
| **Total** | **~2.5 hours** |

---

## Need Help?

**If you get stuck:**

1. Check TROUBLESHOOTING.md
2. Check PRODUCTION-DEPLOY-PREP.md (detailed guides)
3. Check DEPLOYMENT-RUNBOOK.md (launch procedures)
4. Check service provider documentation:
   - Vercel: https://vercel.com/docs
   - Neon: https://neon.tech/docs
   - Upstash: https://docs.upstash.com

---

## Next Steps

**After completing this checklist:**

1. Review DAY-14-COMPLETE.md (not yet created)
2. Follow DEPLOYMENT-RUNBOOK.md for launch procedure
3. Execute Day 14: Production Launch

---

**Checklist Version:** 1.0
**Last Updated:** December 4, 2025
**For:** Day 13 → Day 14 Transition

---

🤖 **Generated with Claude Code**

Co-Authored-By: Claude <noreply@anthropic.com>
