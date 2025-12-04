# GitHub Secrets Configuration Guide

This document explains how to configure the required GitHub secrets for CI/CD workflows.

## Required Secrets

Navigate to your repository Settings → Secrets and variables → Actions → New repository secret

### 1. Vercel Deployment Secrets

#### `VERCEL_TOKEN`
- **Purpose:** Authenticate with Vercel for deployments
- **How to get:**
  1. Go to https://vercel.com/account/tokens
  2. Click "Create Token"
  3. Name it "GitHub Actions Deployment"
  4. Copy the token (you won't see it again!)
  5. Add to GitHub as `VERCEL_TOKEN`

#### `VERCEL_ORG_ID`
- **Purpose:** Identify your Vercel organization
- **How to get:**
  1. Go to your Vercel project settings
  2. Or run: `vercel link` locally and check `.vercel/project.json`
  3. Copy the `orgId` value
  4. Add to GitHub as `VERCEL_ORG_ID`

#### `VERCEL_PROJECT_ID`
- **Purpose:** Identify your Vercel project
- **How to get:**
  1. Go to your Vercel project settings
  2. Or run: `vercel link` locally and check `.vercel/project.json`
  3. Copy the `projectId` value
  4. Add to GitHub as `VERCEL_PROJECT_ID`

#### `PRODUCTION_URL`
- **Purpose:** URL of your production deployment for health checks
- **Value:** `https://your-domain.com` (or your Vercel URL)
- **Example:** `https://audiospective.vercel.app`

### 2. Sentry Monitoring (Optional but Recommended)

#### `SENTRY_AUTH_TOKEN`
- **Purpose:** Upload source maps to Sentry for error tracking
- **How to get:**
  1. Go to https://sentry.io/settings/account/api/auth-tokens/
  2. Click "Create New Token"
  3. Name it "GitHub Actions"
  4. Grant permissions: `project:read`, `project:write`, `org:read`
  5. Copy the token
  6. Add to GitHub as `SENTRY_AUTH_TOKEN`

**Note:** Only needed if you're using Sentry for error monitoring

### 3. Database Configuration (Test Environment)

#### `TEST_DATABASE_URL`
- **Purpose:** Database connection for running tests in CI
- **Value:** `file:./test.db` (SQLite for tests)
- **Note:** This is optional as tests use the default value if not set

## Production Environment Variables

These should be configured in Vercel Dashboard (not GitHub):

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add the following for **Production** environment:

```bash
# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# NextAuth
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=random-generated-secret-string

# Database
DATABASE_URL=your_production_postgresql_url

# Redis (Upstash)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# QStash (Upstash)
QSTASH_TOKEN=your_qstash_token
QSTASH_URL=https://qstash.upstash.io/v2/publish
QSTASH_CURRENT_SIGNING_KEY=your_current_key
QSTASH_NEXT_SIGNING_KEY=your_next_key

# Sentry (Optional)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Vercel (Auto-populated)
VERCEL_URL=auto-populated-by-vercel
```

## Security Best Practices

### Secret Rotation Schedule

| Secret | Rotation Frequency | Priority |
|--------|-------------------|----------|
| `VERCEL_TOKEN` | Every 6 months | High |
| `SENTRY_AUTH_TOKEN` | Every 6 months | Medium |
| `NEXTAUTH_SECRET` | Annually | Critical |
| `SPOTIFY_CLIENT_SECRET` | When compromised | Critical |

### Never Commit Secrets

The following files are gitignored to prevent secret leaks:
- `.env`
- `.env.local`
- `.env.*.local`
- `.vercel/`

### Pre-commit Hook Protection

The security workflow checks for hardcoded secrets. If you need to reference secrets in code:

✅ **Good:**
```typescript
const secret = process.env.SPOTIFY_CLIENT_SECRET;
```

❌ **Bad:**
```typescript
const secret = "abc123_hardcoded_secret";
```

## Verification

After adding secrets, verify they're working:

1. **Test Deployment Workflow:**
   ```bash
   # Push to main branch or create a tag
   git tag v0.1.0-test
   git push origin v0.1.0-test
   ```

2. **Check GitHub Actions:**
   - Go to Actions tab
   - Look for "Deploy to Production" workflow
   - Ensure it completes successfully

3. **Verify Health Check:**
   ```bash
   curl https://your-production-url.com/api/health
   ```
   Should return 200 OK

## Troubleshooting

### Error: "VERCEL_TOKEN is not set"
- **Solution:** Add `VERCEL_TOKEN` secret in GitHub repository settings

### Error: "Failed to authenticate with Vercel"
- **Solution:** Regenerate Vercel token and update GitHub secret

### Error: "Project not found"
- **Solution:** Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct

### Error: "Health check failed"
- **Solution:** Ensure `PRODUCTION_URL` secret matches your actual deployment URL

## Getting Help

If you encounter issues:
1. Check the [GitHub Actions logs](../../actions)
2. Review the [deployment documentation](../docs/DEPLOYMENT-READY.md)
3. Check [Vercel deployment logs](https://vercel.com/dashboard)
4. Search [GitHub Issues](../../issues) for similar problems

## Updates

**Last Updated:** December 4, 2025
**Version:** 1.0
**Maintainer:** Project Team
