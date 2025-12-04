# Audiospective - Production Deployment Guide

**Status:** ✅ 90% Production Ready (Days 1-10 Complete)

This guide covers everything you need to deploy Audiospective to production, including infrastructure setup, security configuration, monitoring, and operational procedures.

---

## Table of Contents

1. [Production Readiness Status](#production-readiness-status)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Infrastructure Services](#infrastructure-services)
6. [Security Configuration](#security-configuration)
7. [Deployment Steps](#deployment-steps)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring & Observability](#monitoring--observability)
10. [Backup & Recovery](#backup--recovery)
11. [Rollback Procedure](#rollback-procedure)
12. [Production Checklist](#production-checklist)

---

## Production Readiness Status

### Completed (Days 1-10) ✅

| Category | Status | Completion Date |
|----------|--------|-----------------|
| **Security Foundations** | ✅ Complete | Day 1 |
| - Rate limiting (3-tier system) | ✅ | Day 1 |
| - Security headers (HSTS, CSP, etc.) | ✅ | Day 1 |
| - Input validation (Zod) | ✅ | Day 1 |
| **Database & Monitoring** | ✅ Complete | Day 2 |
| - PostgreSQL migration | ✅ | Day 2 |
| - Environment validation | ✅ | Day 2 |
| - Health check endpoint | ✅ | Day 2 |
| - Sentry error monitoring | ✅ | Day 2 |
| - Database backups | ✅ | Day 2 |
| **Testing Infrastructure** | ✅ Complete | Day 3 |
| - Unit tests (80% coverage) | ✅ | Day 3 |
| - Integration tests | ✅ | Day 3 |
| - E2E tests (Playwright) | ✅ | Day 3 |
| **CI/CD Pipeline** | ✅ Complete | Day 4 |
| - PR checks (lint, test, build) | ✅ | Day 4 |
| - Security scanning | ✅ | Day 4 |
| - Pre-commit hooks | ✅ | Day 4 |
| - Deployment automation | ✅ | Day 4 |
| **Legal Compliance** | ✅ Complete | Day 5 |
| - GDPR compliance | ✅ | Day 5 |
| - Privacy Policy | ✅ | Day 5 |
| - Terms of Service | ✅ | Day 5 |
| - Cookie consent | ✅ | Day 5 |
| **Architecture Improvements** | ✅ Complete | Day 8 |
| - Service layer | ✅ | Day 8 |
| - Repository pattern | ✅ | Day 8 |
| - DTOs & standardization | ✅ | Day 8 |
| - Error handler utility | ✅ | Day 8 |
| **Performance & Caching** | ✅ Complete | Day 9 |
| - Redis caching | ✅ | Day 9 |
| - Query optimization | ✅ | Day 9 |
| - Bundle optimization | ✅ | Day 9 |
| **Advanced Monitoring** | ✅ Complete | Day 10 |
| - Structured logging (Pino) | ✅ | Day 10 |
| - Vercel Analytics | ✅ | Day 10 |
| - Security hardening | ✅ | Day 10 |

### Remaining (Days 12-14) 📋

- [ ] Day 12: Final QA on staging
- [ ] Day 13: Production environment setup
- [ ] Day 13: Configure UptimeRobot monitoring
- [ ] Day 13: Configure Sentry alerts
- [ ] Day 14: Production launch

---

## Prerequisites

### Required

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **PostgreSQL**: 14+ (recommended: [Neon](https://neon.tech) free tier)
- **Spotify Developer Account**: [Create app](https://developer.spotify.com/dashboard)
- **Vercel Account**: For hosting (or alternative platform)

### Recommended

- **Upstash Redis**: For rate limiting and caching ([free tier](https://upstash.com))
- **Upstash QStash**: For background jobs ([free tier](https://upstash.com))
- **Sentry Account**: For error monitoring ([free tier](https://sentry.io))
- **UptimeRobot Account**: For uptime monitoring ([free tier](https://uptimerobot.com))

---

## Environment Setup

### 1. Required Environment Variables

Create `.env.production` file:

```bash
# =============================================================================
# REQUIRED - Application will not start without these
# =============================================================================

# Database (PostgreSQL required for production)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Spotify OAuth
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"

# NextAuth
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="generate_with_openssl_rand_base64_32"

# =============================================================================
# RECOMMENDED - Core functionality enhanced with these
# =============================================================================

# Upstash Redis (enables rate limiting, caching, idempotency)
UPSTASH_REDIS_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_TOKEN="your_redis_token"

# Upstash QStash (enables automatic hourly archival)
QSTASH_TOKEN="your_qstash_token"
QSTASH_URL="https://qstash.upstash.io"
QSTASH_CURRENT_SIGNING_KEY="your_current_key"
QSTASH_NEXT_SIGNING_KEY="your_next_key"

# =============================================================================
# OPTIONAL - Production monitoring and error tracking
# =============================================================================

# Sentry (error monitoring)
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"
SENTRY_AUTH_TOKEN="your_sentry_auth_token"
SENTRY_ORG="your_org_slug"
SENTRY_PROJECT="your_project_slug"

# Vercel (auto-configured if deployed to Vercel)
VERCEL_URL="your-app.vercel.app"

# Cron Secret (for manual cron triggers - optional)
CRON_SECRET="generate_another_random_string"

# =============================================================================
# DEVELOPMENT ONLY - Do not use in production
# =============================================================================

# Logging
NODE_ENV="production"
LOG_LEVEL="info"  # Options: trace, debug, info, warn, error, fatal
```

### 2. Generate Secrets

```bash
# Generate NEXTAUTH_SECRET (required)
openssl rand -base64 32

# Generate CRON_SECRET (optional)
openssl rand -hex 32
```

### 3. Environment Variable Validation

The application validates all environment variables at startup using Zod schemas (implemented in Day 2).

**Fail-Fast Behavior:**
- App crashes immediately if required variables are missing
- Clear error messages indicate which variables are invalid
- Type-safe environment variables throughout codebase

**Example validation output:**

```
❌ Invalid environment variables:

  DATABASE_URL: DATABASE_URL must be a valid PostgreSQL or SQLite connection string
  NEXTAUTH_SECRET: NEXTAUTH_SECRET must be at least 32 characters - Generate with: openssl rand -base64 32

💡 Fix these errors in your .env file, then restart the server.
📖 See .env.example for required variables.
```

---

## Database Setup

### 1. Choose Database Provider

**Recommended: Neon (PostgreSQL)**
- ✅ Generous free tier (0.5GB storage, 100 hours compute/month)
- ✅ Automatic backups
- ✅ Branching for testing
- ✅ Autoscaling
- ✅ Serverless (no cold starts for Vercel)

**Alternatives:**
- Supabase (PostgreSQL + additional features)
- PlanetScale (MySQL)
- Railway (PostgreSQL)

### 2. Create Database

**Neon Setup:**

1. Sign up at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Add to `DATABASE_URL` environment variable

### 3. Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (production)
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

### 4. Verify Database

```bash
# Test connection
npx prisma db execute --stdin <<EOF
SELECT version();
EOF

# Check tables
npx prisma studio
```

**Expected Tables:**
- `users`
- `play_events`
- `tracks`
- `artists`
- `albums`
- `shareable_reports`
- `_ArtistToTrack` (join table)

### 5. Database Indexes

Already configured in Prisma schema:

```prisma
@@index([userId, playedAt(sort: Desc)])  // For recent plays
@@index([trackId])                       // For top tracks
@@index([userId, trackId])               // For user-specific queries
@@index([albumId])                       // For album joins
```

**Verify indexes created:**

```sql
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## Infrastructure Services

### 1. Upstash Redis Setup

**Purpose:** Rate limiting, caching, idempotency checks

**Setup Steps:**

1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database (choose region closest to your app)
3. Copy REST URL and token
4. Add to environment variables:
   ```bash
   UPSTASH_REDIS_URL="https://your-redis.upstash.io"
   UPSTASH_REDIS_TOKEN="your_token"
   ```

**Configuration:**
- Eviction policy: `allkeys-lru` (default)
- Max memory: 256 MB (free tier)
- TLS: Enabled

### 2. Upstash QStash Setup

**Purpose:** Background job scheduling (hourly archival)

**Setup Steps:**

1. In Upstash dashboard, go to QStash
2. Get API token and signing keys
3. Add to environment variables:
   ```bash
   QSTASH_TOKEN="your_token"
   QSTASH_CURRENT_SIGNING_KEY="your_current_key"
   QSTASH_NEXT_SIGNING_KEY="your_next_key"
   ```

4. Create schedule in QStash dashboard:
   - **URL:** `https://your-domain.com/api/cron/archive`
   - **Schedule:** `0 * * * *` (every hour)
   - **Method:** POST
   - **Headers:** None (QStash adds signature automatically)

**Expected Behavior:**
- Cron job runs every hour at :00
- Fetches active users with valid tokens
- Creates batches (50 users per batch)
- Queues batch jobs with equidistant delays

### 3. Sentry Setup

**Purpose:** Error monitoring, performance tracking

**Setup Steps:**

1. Already configured via `npx @sentry/wizard@latest -i nextjs` (Day 2)
2. Create project at [sentry.io](https://sentry.io)
3. Copy DSN and add to environment variables
4. Configure alert rules (Day 13)

**Day 10 Security Improvement:**
- GET handlers removed from cron endpoints
- Forces QStash signature verification
- Reduces attack surface

### 4. Vercel Analytics Setup

**Purpose:** Web Vitals tracking, performance monitoring

**Setup Steps:**

1. Already installed via `@vercel/analytics` (Day 10)
2. Component added to `src/app/layout.tsx`
3. Automatically enabled when deployed to Vercel

**Tracked Metrics:**
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

---

## Security Configuration

### 1. Security Headers

**Already configured in `next.config.mjs` (Day 1):**

```javascript
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains'
},
{
  key: 'X-Frame-Options',
  value: 'DENY'
},
{
  key: 'X-Content-Type-Options',
  value: 'nosniff'
},
{
  key: 'Referrer-Policy',
  value: 'strict-origin-when-cross-origin'
},
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; ..."
}
```

**Expected Security Score:** A+ on [securityheaders.com](https://securityheaders.com)

### 2. Rate Limiting

**3-Tier System (Day 1):**

| Tier | Paths | Limit | Window |
|------|-------|-------|--------|
| **Strict** | `/api/share`, `/api/export`, `/api/user/delete` | 10 req | 10s |
| **Normal** | Most API endpoints | 100 req | 10s |
| **Lenient** | `/api/health`, auth callbacks | 1000 req | 10s |

**Implementation:** Upstash Redis + `@upstash/ratelimit`

**Note:** Rate limiting disabled if Redis not configured (development mode).

### 3. Input Validation

**Zod Schemas (Day 1):**

- `/api/share` - `createShareSchema`
- `/api/export` - Query parameter validation
- `/api/stats` - Range validation
- All validators in `src/validators/`

**Benefits:**
- Type-safe request handling
- Clear validation errors
- SQL injection prevention
- XSS prevention

### 4. CORS Configuration

**Already configured (Day 1):**

```javascript
{
  key: 'Access-Control-Allow-Origin',
  value: process.env.NEXTAUTH_URL || 'http://localhost:3000'
},
{
  key: 'Access-Control-Allow-Methods',
  value: 'GET,POST,PUT,DELETE,OPTIONS'
},
{
  key: 'Access-Control-Allow-Credentials',
  value: 'true'
}
```

**Security:**
- No wildcard origins
- Credentials allowed only for authorized origin
- CSRF token support

### 5. CSRF Protection

**NextAuth Built-in (Day 10 verified):**

- Automatic CSRF token generation
- SameSite=Lax cookies
- Origin header validation
- No additional configuration needed

---

## Deployment Steps

### Option 1: Vercel (Recommended)

#### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Click button above
2. Import your repository
3. Configure environment variables (see [Environment Setup](#environment-setup))
4. Deploy!

#### Manual Vercel Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

#### Vercel Configuration

Create `vercel.json` (optional):

```json
{
  "version": 2,
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "regions": ["iad1"],
  "framework": "nextjs"
}
```

### Option 2: Self-Hosted

#### Build Production Bundle

```bash
# Install dependencies
npm ci --production=false

# Run tests
npm test

# Build application
npm run build

# Start production server
npm start
```

#### Production Server

**Recommended:** PM2 for process management

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "audiospective" -- start

# Save configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

### Option 3: Docker (Advanced)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build image
docker build -t audiospective .

# Run container
docker run -p 3000:3000 --env-file .env.production audiospective
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

**Expected Response:**

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
      "status": "healthy",
      "responseTime": 8
    }
  },
  "environment": "production"
}
```

### 2. Smoke Tests

**Authentication:**
```bash
# Test sign-in flow
open https://your-domain.com/api/auth/signin
```

**Dashboard:**
```bash
# After signing in, visit dashboard
open https://your-domain.com/dashboard
```

**API Endpoints:**
```bash
# Test stats API (requires authentication)
curl https://your-domain.com/api/stats \
  -H "Cookie: next-auth.session-token=<your-token>"
```

### 3. Monitoring Verification

**Sentry:**
1. Trigger test error: `throw new Error('Test error');`
2. Check Sentry dashboard for error capture
3. Verify source maps uploaded

**Vercel Analytics:**
1. Visit production site
2. Navigate to Vercel Dashboard → Analytics
3. Verify Web Vitals data appears (may take 24h)

**UptimeRobot (Setup on Day 13):**
1. Create monitor for `/api/health`
2. Verify 200 OK responses
3. Set up alert contacts

### 4. Performance Tests

**Lighthouse Audit:**

```bash
npm install -g lighthouse

lighthouse https://your-domain.com \
  --output html \
  --output-path ./lighthouse-report.html
```

**Expected Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## Monitoring & Observability

### 1. Structured Logging (Day 10)

**Pino JSON Logs:**

```typescript
import { logger } from '@/lib/logger';

// In production
logger.info({ userId, archivedCount: 42 }, 'Successfully archived tracks');

// Output (JSON)
{
  "level": 30,
  "time": "2025-12-04T12:00:00.000Z",
  "msg": "Successfully archived tracks",
  "userId": "abc123",
  "archivedCount": 42,
  "env": "production",
  "service": "audiospective"
}
```

**View Logs:**
- **Vercel:** Dashboard → Logs
- **Self-hosted:** PM2 logs or Docker logs
- **Optional:** Configure [Logtail](https://logtail.com) for advanced log management

### 2. Error Monitoring (Day 2)

**Sentry Dashboard Setup (Day 13):**

1. **Alert Rules:**
   - Error count > 10 in 5 minutes
   - p95 response time > 1000ms
   - Database errors > 5 in 10 minutes
   - Token refresh failures > 20 in 1 hour

2. **Notifications:**
   - Email for high-priority errors
   - Slack integration (optional)

3. **Custom Dashboards:**
   - Error overview
   - Performance metrics
   - User impact
   - Infrastructure health

### 3. Uptime Monitoring (Day 13)

**UptimeRobot Setup:**

1. Create monitor:
   - Type: HTTP(S)
   - URL: `https://your-domain.com/api/health`
   - Interval: 5 minutes
   - Alert threshold: Down 2 times

2. Status page (optional):
   - Public URL: `status.your-domain.com`
   - Shows uptime percentage and incidents

**Target:** 99.9% uptime (< 1 hour downtime per month)

### 4. Performance Monitoring (Day 10)

**Vercel Analytics:**
- Automatic Web Vitals tracking
- Real-time performance dashboard
- Page-level performance metrics

---

## Backup & Recovery

### 1. Database Backups

**Automated Backups (Day 2):**

```bash
# Manual backup
npm run backup

# Neon automatic backups
# - Daily automatic backups (retained for 7 days on free tier)
# - Point-in-time recovery
# - Branch-based backups
```

**Backup Strategy:**
- **Frequency:** Daily automated + pre-deployment manual
- **Retention:** 7 days (Neon free tier)
- **Storage:** Neon managed backups
- **Testing:** Monthly restore test

### 2. Restore Procedure

```bash
# Restore from backup
npm run restore

# Or manually with Neon dashboard
# 1. Go to Neon console
# 2. Select backup
# 3. Click "Restore"
# 4. Choose target database
```

### 3. Configuration Backup

**Backup `.env.production`:**

```bash
# Encrypt and backup
gpg --symmetric --cipher-algo AES256 .env.production

# Store encrypted file in secure location
# DO NOT commit to version control
```

---

## Rollback Procedure

### Immediate Rollback (Critical Issues)

**Vercel:**

```bash
# List deployments
vercel list

# Rollback to previous deployment
vercel rollback <deployment-url>
```

**Or via Vercel Dashboard:**
1. Navigate to Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Database Rollback

**If migration fails:**

```bash
# Rollback migration
npx prisma migrate resolve --rolled-back <migration-name>

# Or restore from backup
npm run restore
```

### Partial Rollback (Feature Flags)

**For non-critical issues:**

1. Disable feature via environment variable
2. Deploy configuration change
3. Fix issue in development
4. Re-enable feature in next deployment

---

## Production Checklist

### Pre-Deployment ✅

- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Spotify redirect URI updated
- [ ] Secrets rotated (NEXTAUTH_SECRET, etc.)
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Sentry integrated
- [ ] Backup procedure tested

### Deployment ✅

- [ ] Deploy to production
- [ ] Health check passes
- [ ] Smoke tests complete
- [ ] Error monitoring active
- [ ] Performance metrics normal
- [ ] No errors in logs
- [ ] Database queries performant

### Post-Deployment ✅

- [ ] UptimeRobot configured
- [ ] Sentry alerts configured
- [ ] Team notified
- [ ] Documentation updated
- [ ] Rollback plan ready
- [ ] Monitor for 2 hours

### Day 1 Post-Launch ✅

- [ ] Verify archival jobs running
- [ ] Check error rates
- [ ] Review performance metrics
- [ ] Monitor user feedback
- [ ] Check database growth rate

---

## Production Limits

### Free Tier Limits

**Neon (Database):**
- 0.5 GB storage
- 100 hours compute/month
- 1 project, 10 branches

**Upstash (Redis):**
- 10,000 commands/day
- 256 MB storage
- 1 database

**Upstash (QStash):**
- 500 messages/day
- 7-day retention

**Vercel (Hobby):**
- 100 GB bandwidth/month
- 6,000 build minutes/month
- Unlimited deployments

**Recommendations:**
- Monitor usage via dashboards
- Set up usage alerts
- Plan upgrade path for growth

---

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions to common production issues.

**Quick Reference:**

- **500 errors:** Check Sentry dashboard
- **Slow queries:** Review Prisma logs
- **Failed archival:** Check QStash dashboard
- **Rate limited:** Verify Upstash Redis
- **Token refresh failed:** Check Spotify credentials

---

## Next Steps

### Immediate (Day 12-13)

1. **Day 12:** Full QA pass on staging environment
2. **Day 13:** Configure production monitoring
3. **Day 13:** Final security scan
4. **Day 13:** Deployment runbook review

### Day 14: Production Launch

See [14-DAY-PRODUCTION-PLAN.md](14-DAY-PRODUCTION-PLAN.md) for detailed launch procedure.

---

## Support

- **Documentation:** [README.md](README.md), [API.md](API.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Issues:** [GitHub Issues](<your-repo-url>/issues)

---

**Last Updated:** December 4, 2025 (Day 11 Complete)

**Production Readiness:** 90% (Days 1-10 Complete)

**Next Milestone:** Day 12 - Final QA & Staging Deploy

---

🚀 **You're almost there! Just 3 days until production launch.**
