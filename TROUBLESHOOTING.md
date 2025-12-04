# Audiospective - Troubleshooting Guide

This guide covers common issues and their solutions for Audiospective. Problems are organized by category with step-by-step debugging instructions.

---

## Table of Contents

1. [Environment & Startup Issues](#environment--startup-issues)
2. [Database Problems](#database-problems)
3. [Authentication Issues](#authentication-issues)
4. [Archival & Background Jobs](#archival--background-jobs)
5. [API Errors](#api-errors)
6. [Performance Issues](#performance-issues)
7. [Deployment Problems](#deployment-problems)
8. [Testing Issues](#testing-issues)
9. [Monitoring & Logging](#monitoring--logging)
10. [Emergency Procedures](#emergency-procedures)

---

## Environment & Startup Issues

### Error: "Invalid environment variables"

**Symptom:**
```
❌ Invalid environment variables:
  DATABASE_URL: DATABASE_URL must be a valid PostgreSQL or SQLite connection string
  NEXTAUTH_SECRET: NEXTAUTH_SECRET must be at least 32 characters
```

**Cause:** Required environment variables are missing or invalid.

**Solution:**

1. Check `.env` file exists:
   ```bash
   ls -la .env
   ```

2. Verify required variables are set:
   ```bash
   # Required variables
   DATABASE_URL
   SPOTIFY_CLIENT_ID
   SPOTIFY_CLIENT_SECRET
   NEXTAUTH_URL
   NEXTAUTH_SECRET
   ```

3. Generate missing secrets:
   ```bash
   # NEXTAUTH_SECRET (must be 32+ characters)
   openssl rand -base64 32
   ```

4. Validate DATABASE_URL format:
   - PostgreSQL: `postgresql://user:password@host:5432/dbname`
   - SQLite: `file:./prisma/dev.db`

5. Restart server:
   ```bash
   npm run dev
   ```

**Related Files:**
- `src/config/env.ts:135` - Environment validation logic

---

### Error: "Module not found: Can't resolve '@/...' "

**Symptom:**
```
Module not found: Can't resolve '@/lib/prisma'
```

**Cause:** Import path alias not configured correctly.

**Solution:**

1. Verify `tsconfig.json` has path mapping:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

2. Restart TypeScript server (VS Code):
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
   - Type: "TypeScript: Restart TS Server"

3. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

---

### Error: "Prisma Client not generated"

**Symptom:**
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

**Cause:** Prisma client not generated after schema changes.

**Solution:**

```bash
# Generate Prisma client
npx prisma generate

# If that fails, regenerate from scratch
rm -rf node_modules/@prisma/client
rm -rf node_modules/.prisma
npm install
npx prisma generate

# Restart dev server
npm run dev
```

**When to run:**
- After changing `prisma/schema.prisma`
- After `npm install`
- After pulling schema changes from git

---

## Database Problems

### Error: "Database locked" (SQLite)

**Symptom:**
```
Error: SQLITE_BUSY: database is locked
```

**Cause:** SQLite cannot handle concurrent writes. **SQLite is not recommended for production.**

**Solution:**

**Option 1: Migrate to PostgreSQL (Recommended)**

1. Follow [POSTGRESQL-MIGRATION.md](POSTGRESQL-MIGRATION.md)

2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Update `.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   ```

4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

**Option 2: Reduce Concurrency (Temporary)**

For development only:

1. Reduce archival batch size in `src/lib/archive-user.ts`:
   ```typescript
   const batches = chunk(usersToProcess, 10); // Was 50
   ```

2. Disable background jobs temporarily

**Related Files:**
- `docs/POSTGRESQL-MIGRATION.md` - Full migration guide

---

### Error: "Connection timeout" (PostgreSQL)

**Symptom:**
```
Error: Can't reach database server at `host:5432`
```

**Cause:** Database not accessible or connection string invalid.

**Solution:**

1. Verify DATABASE_URL format:
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:password@host:5432/dbname
   ```

2. Test connection:
   ```bash
   npx prisma db execute --stdin <<EOF
   SELECT version();
   EOF
   ```

3. Check database is running:
   - **Neon:** Check dashboard at [neon.tech](https://neon.tech)
   - **Self-hosted:** `pg_isready -h localhost -p 5432`

4. Verify firewall rules allow connections from your IP

5. Check connection string secrets:
   - Username correct?
   - Password correct? (URL-encode special characters)
   - Host correct?
   - Port correct? (default: 5432)

**URL-encode password if it contains special characters:**
```bash
# Example: password with @ symbol
# Bad:  postgresql://user:p@ssw0rd@host:5432/db
# Good: postgresql://user:p%40ssw0rd@host:5432/db
```

---

### Error: "Relation does not exist"

**Symptom:**
```
Error: relation "User" does not exist
```

**Cause:** Database migrations not run.

**Solution:**

```bash
# Check migration status
npx prisma migrate status

# Run pending migrations
npx prisma migrate deploy

# If migrations are corrupted, reset (DEVELOPMENT ONLY - DELETES DATA)
npx prisma migrate reset

# For production, never use reset - use proper migration rollback
npx prisma migrate resolve --rolled-back <migration-name>
```

**Verify tables created:**
```bash
npx prisma studio
# Check for: users, play_events, tracks, artists, albums, shareable_reports
```

---

## Authentication Issues

### Error: "Token refresh failed"

**Symptom:**
- Users logged out unexpectedly
- "Token refresh failed" in Sentry
- Archival fails with 401 errors

**Cause:** Spotify refresh token invalid or expired.

**Solution:**

1. **Verify Spotify credentials:**
   ```bash
   echo $SPOTIFY_CLIENT_ID
   echo $SPOTIFY_CLIENT_SECRET
   ```

2. **Check credentials in Spotify Dashboard:**
   - Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   - Verify Client ID matches `.env`
   - Verify Client Secret matches `.env`

3. **Check redirect URI:**
   - Must match exactly: `https://your-domain.com/api/auth/callback/spotify`
   - No trailing slash
   - Protocol must match (http vs https)

4. **Force re-authentication:**
   ```sql
   -- Clear user's tokens (they'll need to re-login)
   UPDATE users
   SET "accessToken" = NULL, "refreshToken" = NULL
   WHERE id = 'user-id-here';
   ```

5. **Check token expiry logic:**
   - File: `src/lib/ensure-fresh-token.ts`
   - Tokens refresh when < 5 minutes remaining

**Related Files:**
- `src/lib/ensure-fresh-token.ts:26` - Token refresh logic
- `src/lib/auth.ts` - NextAuth configuration

---

### Error: "Not authenticated" (API requests)

**Symptom:**
```json
{
  "error": "Not authenticated"
}
```

**Status Code:** `401`

**Cause:** Session cookie missing or expired.

**Solution:**

1. **Verify session exists:**
   ```bash
   # Check session endpoint
   curl http://localhost:3000/api/auth/session \
     --cookie "next-auth.session-token=<token>"
   ```

2. **Check cookie configuration:**
   - In `src/lib/auth.ts`, verify:
     ```typescript
     cookies: {
       sessionToken: {
         name: 'next-auth.session-token',
         options: {
           httpOnly: true,
           sameSite: 'lax',
           path: '/',
           secure: process.env.NODE_ENV === 'production'
         }
       }
     }
     ```

3. **Verify NEXTAUTH_URL matches your domain:**
   ```bash
   # Development
   NEXTAUTH_URL="http://localhost:3000"

   # Production
   NEXTAUTH_URL="https://your-domain.com"
   ```

4. **Clear browser cookies and re-login**

5. **Check NEXTAUTH_SECRET is set and matches across deployments**

---

### Error: "Callback URL mismatch"

**Symptom:**
- OAuth fails with "redirect_uri_mismatch"
- Can't complete sign-in

**Cause:** Spotify redirect URI doesn't match configured value.

**Solution:**

1. **Update Spotify App Settings:**
   - Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   - Edit your app
   - Under "Redirect URIs", add:
     ```
     Development: http://localhost:3000/api/auth/callback/spotify
     Production:  https://your-domain.com/api/auth/callback/spotify
     ```

2. **Verify NEXTAUTH_URL is correct:**
   ```bash
   # Must not have trailing slash
   NEXTAUTH_URL="https://your-domain.com"  # Correct
   NEXTAUTH_URL="https://your-domain.com/" # Wrong
   ```

3. **Wait 5 minutes** for Spotify to propagate changes

4. **Clear browser cache** and try again

---

## Archival & Background Jobs

### Error: "No tracks archived" / Zero songs archived

**Symptom:**
- Manual archival returns 0 songs
- Dashboard shows no data

**Cause:** Multiple possible causes.

**Solution:**

**Step 1: Verify user has Spotify listening history**

1. Check recent plays on Spotify:
   - Open Spotify app
   - Go to "Recently Played"
   - Verify tracks appear

**Step 2: Check token validity**

```sql
SELECT
  id,
  email,
  "accessToken" IS NOT NULL as has_access_token,
  "refreshToken" IS NOT NULL as has_refresh_token,
  "tokenExpiresAt",
  "lastPolledAt"
FROM users
WHERE id = 'your-user-id';
```

**Step 3: Test Spotify API directly**

```bash
# Get access token from database
TOKEN="your-access-token-here"

# Test Spotify API
curl "https://api.spotify.com/v1/me/player/recently-played?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:** JSON with recent tracks

**If 401 Unauthorized:** Token expired, trigger refresh:
```bash
# Visit test page to trigger refresh
curl http://localhost:3000/api/test-archive \
  --cookie "next-auth.session-token=<your-token>"
```

**Step 4: Check logs for errors**

```bash
# Development
npm run dev | grep -i error

# Production (Vercel)
# Check Vercel Dashboard → Logs
```

**Related Files:**
- `src/lib/archive-user.ts:26` - Main archival logic
- `src/lib/spotify-api.ts:42` - Spotify API client

---

### Error: "QStash signature verification failed"

**Symptom:**
- Cron jobs fail with 401 errors
- Background archival not running

**Cause:** QStash signing keys incorrect or mismatched.

**Solution:**

1. **Verify QStash credentials:**
   ```bash
   echo $QSTASH_TOKEN
   echo $QSTASH_CURRENT_SIGNING_KEY
   echo $QSTASH_NEXT_SIGNING_KEY
   ```

2. **Get correct keys from Upstash dashboard:**
   - Go to [console.upstash.com](https://console.upstash.com)
   - Navigate to QStash
   - Copy signing keys exactly as shown

3. **Update environment variables:**
   ```bash
   QSTASH_TOKEN="your_token"
   QSTASH_CURRENT_SIGNING_KEY="your_current_key"
   QSTASH_NEXT_SIGNING_KEY="your_next_key"
   ```

4. **Redeploy application**

5. **Test cron endpoint:**
   ```bash
   # This should fail (no signature)
   curl -X POST https://your-domain.com/api/cron/archive
   # Expected: 401 Unauthorized
   ```

**Manual trigger via QStash dashboard:**
- Go to QStash → Messages
- Click "Publish Message"
- URL: `https://your-domain.com/api/cron/archive`
- Method: POST

**Related Files:**
- `src/app/api/cron/archive/route.ts:113` - Signature verification

---

### Error: "Circuit breaker blocking users"

**Symptom:**
- Users not being archived
- Logs show "filtered out by circuit breaker"

**Cause:** User has consecutive failures, circuit breaker preventing further attempts.

**Solution:**

1. **Check user failure status:**
   ```sql
   SELECT
     id,
     email,
     "consecutiveFailures",
     "lastFailureType",
     "lastFailedAt",
     "isActive"
   FROM users
   WHERE "consecutiveFailures" > 0
   ORDER BY "consecutiveFailures" DESC;
   ```

2. **Understand circuit breaker thresholds:**
   - 3+ AUTH failures → Skip for 24 hours
   - 5+ NETWORK failures → Skip for 2 hours
   - 10+ UNKNOWN failures → Skip for 1 hour

3. **Reset circuit breaker manually:**
   ```sql
   UPDATE users
   SET
     "consecutiveFailures" = 0,
     "lastFailureType" = NULL,
     "lastFailedAt" = NULL
   WHERE id = 'user-id-here';
   ```

4. **Fix root cause:**
   - AUTH failures: User needs to re-authenticate
   - NETWORK failures: Check Spotify API status
   - UNKNOWN failures: Check application logs

**Related Files:**
- `src/lib/circuit-breaker.ts:8` - Circuit breaker logic

---

## API Errors

### Error: "Rate limit exceeded" (429)

**Symptom:**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

**Status Code:** `429`

**Cause:** User exceeded rate limit for endpoint.

**Solution:**

1. **Check rate limit tier:**
   - Strict (10 req/10s): `/api/share`, `/api/export`, `/api/user/delete`
   - Normal (100 req/10s): Most endpoints
   - Lenient (1000 req/10s): `/api/health`

2. **Wait for rate limit window to reset:**
   - Check `X-RateLimit-Reset` header
   - Wait 10 seconds for window reset

3. **Verify Redis is configured:**
   ```bash
   echo $UPSTASH_REDIS_URL
   echo $UPSTASH_REDIS_TOKEN
   ```

4. **If Redis not configured:**
   - Rate limiting is disabled (development mode)
   - Error shouldn't occur without Redis

5. **Check Upstash Redis dashboard:**
   - Verify within daily command limit (10,000 on free tier)
   - Check for connection issues

**Related Files:**
- `src/middleware/rate-limit.ts:14` - Rate limiting logic
- `src/middleware.ts:20` - Middleware configuration

---

### Error: "Validation error" (400)

**Symptom:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input: ..."
}
```

**Status Code:** `400`

**Cause:** Request body or query parameters failed Zod validation.

**Solution:**

1. **Check API documentation:** [API.md](API.md)

2. **Verify request format:**
   - Headers: `Content-Type: application/json`
   - Body: Valid JSON
   - Parameters: Correct types

3. **Common validation issues:**

   **POST /api/share:**
   ```json
   {
     "title": "Required, 1-100 characters",
     "description": "Optional, max 500 characters",
     "dateRange": "Required: 1d, 7d, 30d, or all"
   }
   ```

   **GET /api/export:**
   ```
   ?format=csv|json (default: json)
   ?range=1d|7d|30d|all (default: all)
   ?gdpr=true|false (default: false)
   ```

4. **Check validator schemas:**
   - `src/validators/share.validator.ts`
   - `src/validators/export.validator.ts`
   - `src/validators/stats.validator.ts`

**Related Files:**
- `src/validators/*` - All validation schemas

---

### Error: "Internal server error" (500)

**Symptom:**
```json
{
  "error": "Internal server error",
  "message": "..."
}
```

**Status Code:** `500`

**Cause:** Unhandled server error.

**Solution:**

1. **Check Sentry dashboard:**
   - Go to [sentry.io](https://sentry.io)
   - View recent errors
   - Check stack trace

2. **Check application logs:**
   ```bash
   # Development
   npm run dev | grep -i error

   # Production (Vercel)
   vercel logs

   # Self-hosted
   pm2 logs audiospective
   ```

3. **Common causes:**
   - Database query failures
   - Spotify API errors
   - Missing environment variables
   - Unhandled edge cases

4. **Enable debug logging:**
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

5. **Reproduce locally:**
   - Copy request from error report
   - Test with same data
   - Check for stack trace

**Related Files:**
- `src/lib/error-handler.ts:45` - Centralized error handling

---

## Performance Issues

### Issue: "Slow database queries"

**Symptom:**
- API responses > 500ms
- Dashboard takes > 5 seconds to load

**Solution:**

1. **Check database indexes:**
   ```sql
   SELECT indexname, tablename FROM pg_indexes
   WHERE schemaname = 'public'
   ORDER BY tablename, indexname;
   ```

   **Expected indexes:**
   - `play_events_userId_playedAt_idx`
   - `play_events_trackId_idx`
   - `play_events_userId_trackId_idx`
   - `tracks_albumId_idx`

2. **Run EXPLAIN ANALYZE on slow queries:**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM play_events
   WHERE "userId" = 'user-id'
   ORDER BY "playedAt" DESC
   LIMIT 50;
   ```

3. **Check for N+1 queries:**
   - Enable Prisma query logging:
     ```typescript
     const prisma = new PrismaClient({
       log: ['query', 'info', 'warn', 'error'],
     })
     ```

4. **Verify Redis caching is enabled:**
   ```bash
   echo $UPSTASH_REDIS_URL
   ```

5. **Check cache hit rate:**
   - Stats cache: 1 hour TTL
   - Genre cache: 6 hour TTL
   - Top tracks/artists: 1 hour TTL

**Related Files:**
- `src/lib/cache.ts:8` - Caching logic
- `src/app/api/stats/route.ts:30` - Cached stats query

---

### Issue: "High memory usage"

**Symptom:**
- Server crashes with "Out of memory"
- Process uses > 1GB RAM

**Solution:**

1. **Check export limits:**
   - Max 10,000 plays per export
   - File: `src/app/api/export/route.ts:53`

2. **Limit query result sizes:**
   ```typescript
   // Bad
   const plays = await prisma.playEvent.findMany({ where: { userId } });

   // Good
   const plays = await prisma.playEvent.findMany({
     where: { userId },
     take: 1000,
     select: { id: true, playedAt: true, trackId: true } // Only needed fields
   });
   ```

3. **Use pagination for large datasets:**
   - Implement cursor-based pagination
   - Load data in chunks

4. **Check for memory leaks:**
   ```bash
   # Run with memory profiling
   node --inspect node_modules/.bin/next dev

   # Open chrome://inspect in Chrome
   # Take heap snapshots
   ```

5. **Increase memory limit (temporary):**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

---

## Deployment Problems

### Error: "Build failed" (CI/CD)

**Symptom:**
- GitHub Actions build fails
- Vercel deployment fails

**Solution:**

1. **Check build logs:**
   ```bash
   # Local build test
   npm run build
   ```

2. **Common build failures:**

   **TypeScript errors:**
   ```bash
   # Check types
   npx tsc --noEmit

   # Fix type errors in code
   ```

   **Linting errors:**
   ```bash
   # Run linter
   npm run lint

   # Auto-fix
   npx eslint --fix src/**/*.ts
   ```

   **Missing environment variables:**
   - Build-time variables must be set in CI/CD
   - Check `.github/workflows/pr-checks.yml`

3. **Prisma generation:**
   ```bash
   # Ensure this runs in build
   npx prisma generate
   ```

4. **Check for import errors:**
   - Verify all imports resolve
   - Check for circular dependencies

5. **Test build locally:**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   npm start
   ```

---

### Error: "Deployment successful but site not working"

**Symptom:**
- Deployment shows "Success" but site returns errors
- Health check fails

**Solution:**

1. **Check health endpoint:**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Verify environment variables in deployment platform:**
   - Vercel: Settings → Environment Variables
   - Check all required variables are set
   - No typos in variable names

3. **Check database connectivity:**
   ```bash
   # Test from deployment platform
   curl https://your-domain.com/api/health | jq '.services.database'
   ```

4. **Verify Prisma client generated:**
   - Must run `npx prisma generate` during build
   - Check build logs

5. **Check for production-only errors:**
   - Review Sentry dashboard
   - Check Vercel/PM2 logs

6. **Rollback if necessary:**
   ```bash
   vercel rollback <previous-deployment-url>
   ```

---

## Testing Issues

### Error: "Tests failing after changes"

**Symptom:**
- Tests that previously passed now fail
- CI/CD pipeline blocked

**Solution:**

1. **Run tests locally:**
   ```bash
   # All tests
   npm test

   # Watch mode (auto-rerun)
   npm run test:watch

   # With coverage
   npm run test:coverage
   ```

2. **Check for mock issues:**
   - Verify mocks still match actual implementations
   - Update mocks if API signatures changed

3. **Common test failures:**

   **Database tests:**
   ```bash
   # Reset test database
   DATABASE_URL="file:./test.db" npx prisma migrate reset
   ```

   **Crypto mock failures:**
   - Known issue with `crypto.randomBytes` mocking
   - See `tests/integration/api/share.test.ts`
   - Use real crypto in tests (remove mock)

   **Session mock failures:**
   - Update `jest.mock('next-auth/next')` if NextAuth API changed

4. **Update snapshots if needed:**
   ```bash
   npm test -- -u
   ```

5. **Clear test cache:**
   ```bash
   npx vitest run --clearCache
   ```

**Related Files:**
- `tests/` - All test files

---

## Monitoring & Logging

### Issue: "Sentry not capturing errors"

**Symptom:**
- Known errors not appearing in Sentry
- Dashboard shows no data

**Solution:**

1. **Verify Sentry DSN:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Test error capture:**
   ```typescript
   // Add to any page temporarily
   throw new Error('Test Sentry error');
   ```

3. **Check Sentry initialization:**
   - File: `instrumentation.ts` (server)
   - File: `instrumentation-client.ts` (client)

4. **Verify source maps uploaded:**
   ```bash
   # Check build logs for Sentry upload
   npm run build | grep -i sentry
   ```

5. **Check Sentry auth token:**
   ```bash
   echo $SENTRY_AUTH_TOKEN
   ```

6. **Verify Sentry project settings:**
   - Organization slug correct?
   - Project slug correct?
   - Auth token has upload permissions?

**Related Files:**
- `instrumentation.ts:13` - Server-side Sentry
- `instrumentation-client.ts:8` - Client-side Sentry
- `sentry.client.config.ts` - Client configuration
- `sentry.server.config.ts` - Server configuration

---

### Issue: "Logs not showing up"

**Symptom:**
- Structured logs not visible
- Pino logs missing

**Solution:**

1. **Check log level:**
   ```bash
   echo $LOG_LEVEL
   # Should be: debug (dev) or info (prod)
   ```

2. **Verify logger usage:**
   ```typescript
   import { logger } from '@/lib/logger';

   // Correct
   logger.info({ userId }, 'User archived');

   // Wrong (won't show)
   console.log('User archived'); // Still works but not structured
   ```

3. **Check log output:**
   - **Development:** Pretty-printed to console
   - **Production:** JSON logs
   - **Vercel:** Dashboard → Logs
   - **Self-hosted:** PM2 logs or Docker logs

4. **Enable verbose logging:**
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

5. **Check log aggregation service:**
   - If using Logtail, verify token set:
     ```bash
     echo $LOGTAIL_SOURCE_TOKEN
     ```

**Related Files:**
- `src/lib/logger.ts:10` - Logger configuration

---

## Emergency Procedures

### Critical: "Production site is down"

**Immediate Actions (< 5 minutes):**

1. **Check health endpoint:**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Check Vercel status:**
   - Go to [vercel-status.com](https://www.vercel-status.com)
   - Check for incidents

3. **Check Sentry for error spike:**
   - Login to Sentry dashboard
   - Check recent errors

4. **Rollback immediately:**
   ```bash
   vercel rollback <previous-working-deployment>
   ```

5. **Notify team:**
   - Post in incident channel
   - Update status page if you have one

**Follow-up Actions (< 1 hour):**

1. **Investigate root cause:**
   - Review Sentry errors
   - Check deployment diff
   - Review recent changes

2. **Fix issue:**
   - Create hotfix branch
   - Test fix thoroughly
   - Deploy with monitoring

3. **Post-mortem:**
   - Document what happened
   - Document how it was fixed
   - Add prevention measures

---

### Critical: "Data loss detected"

**Immediate Actions:**

1. **STOP all write operations:**
   ```sql
   -- Disable user archival
   UPDATE users SET "isActive" = false;
   ```

2. **Assess damage:**
   ```sql
   -- Check play event count
   SELECT COUNT(*) FROM play_events;

   -- Check last play event
   SELECT * FROM play_events
   ORDER BY "playedAt" DESC LIMIT 1;
   ```

3. **Restore from backup:**
   ```bash
   npm run restore
   ```

4. **Verify restoration:**
   ```sql
   -- Check counts match expected
   SELECT
     (SELECT COUNT(*) FROM users) as users,
     (SELECT COUNT(*) FROM play_events) as plays,
     (SELECT COUNT(*) FROM tracks) as tracks;
   ```

5. **Resume operations gradually:**
   ```sql
   -- Re-enable users in batches
   UPDATE users
   SET "isActive" = true
   WHERE id IN (...); -- Small batch first
   ```

---

### Critical: "Security breach suspected"

**Immediate Actions:**

1. **Rotate all secrets:**
   ```bash
   # Generate new secrets
   openssl rand -base64 32 > new_secret.txt

   # Update environment variables
   NEXTAUTH_SECRET="<new-secret>"
   ```

2. **Revoke all user sessions:**
   ```sql
   -- Clear all access/refresh tokens
   UPDATE users SET
     "accessToken" = NULL,
     "refreshToken" = NULL,
     "tokenExpiresAt" = NULL;
   ```

3. **Check for unauthorized access:**
   ```sql
   -- Check recent logins
   SELECT * FROM users
   WHERE "updatedAt" > NOW() - INTERVAL '24 hours'
   ORDER BY "updatedAt" DESC;
   ```

4. **Review access logs:**
   - Check Vercel logs
   - Review Sentry breadcrumbs
   - Check for suspicious patterns

5. **Notify affected users** (if personal data accessed)

6. **File security incident report**

---

## Getting Help

If you can't resolve an issue using this guide:

1. **Check documentation:**
   - [README.md](README.md) - Overview and setup
   - [API.md](API.md) - API reference
   - [DEPLOYMENT-READY.md](DEPLOYMENT-READY.md) - Deployment guide
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

2. **Search GitHub Issues:**
   - [github.com/your-repo/issues](https://github.com/your-repo/issues)
   - Check for similar problems

3. **Enable debug logging:**
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

4. **Collect diagnostic information:**
   - Error message (full text)
   - Stack trace
   - Steps to reproduce
   - Environment (Node version, OS, etc.)
   - Recent changes

5. **Create GitHub issue:**
   - Include diagnostic information
   - Attach logs (remove secrets!)
   - Describe expected vs actual behavior

---

**Last Updated:** December 4, 2025 (Day 11)

**Need urgent help?** Check the emergency procedures above or contact your team's on-call engineer.
