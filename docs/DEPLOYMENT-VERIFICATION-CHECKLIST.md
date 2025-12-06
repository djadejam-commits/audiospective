# Deployment Verification Checklist

This checklist ensures that critical configurations are verified before and after production deployments to prevent incidents like INC-2025-12-06-001 (CSP/OAuth domain mismatch).

---

## Pre-Deployment Checks

### Environment Variables
- [ ] `NEXTAUTH_URL` matches the production domain
- [ ] `NEXTAUTH_SECRET` is set and at least 32 characters
- [ ] `SPOTIFY_CLIENT_ID` is set
- [ ] `SPOTIFY_CLIENT_SECRET` is set
- [ ] `DATABASE_URL` points to production database
- [ ] Optional: `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` configured if using Redis
- [ ] Optional: `NEXT_PUBLIC_SENTRY_DSN` configured if using Sentry

### Domain Configuration
- [ ] Production domain is set in Vercel (e.g., `audiospective.vercel.app`)
- [ ] Domain is marked as "Production Domain" in Vercel settings
- [ ] `NEXTAUTH_URL` environment variable matches the production domain exactly
- [ ] No references to old/deprecated domains (e.g., `spotify-time-machine-nu.vercel.app`)

### OAuth Provider Configuration
- [ ] Spotify Developer Dashboard → Redirect URIs includes:
  - `https://{production-domain}/api/auth/callback/spotify`
  - `http://localhost:3000/api/auth/callback/spotify` (for development)
- [ ] OAuth client ID and secret match environment variables
- [ ] All deprecated redirect URIs are removed

### Security Headers (CSP)
- [ ] `worker-src 'self' blob:` is present in CSP (next.config.mjs line ~59)
- [ ] `img-src` includes necessary CDNs (Spotify, OAuth providers)
- [ ] `connect-src` includes necessary API endpoints

### Build Verification
- [ ] `npm run build` succeeds locally
- [ ] TypeScript compilation passes (`npm run type-check` or in build)
- [ ] ESLint passes (if configured)
- [ ] No critical warnings in build output

---

## Deployment Steps

### 1. Trigger Deployment
- [ ] Push to `main` branch triggers automatic Vercel deployment
- [ ] OR manually deploy via Vercel dashboard
- [ ] **IMPORTANT**: Uncheck "Use existing Build Cache" if config changes were made

### 2. Monitor Deployment
- [ ] Watch deployment logs in Vercel dashboard
- [ ] Deployment status shows "Ready" (not "Error" or "Canceled")
- [ ] Build completes without errors
- [ ] Note deployment URL for verification

---

## Post-Deployment Verification

### Critical Path Testing

#### 1. Homepage Load
- [ ] Visit `https://{production-domain}`
- [ ] Page loads without errors
- [ ] No console errors in browser DevTools
- [ ] No CSP violations in console

#### 2. Authentication Flow
- [ ] Click "Sign in with Spotify" button
- [ ] Redirects to Spotify authorization page
- [ ] After authorization, redirects back to app successfully
- [ ] User session is established (shows user name/profile)
- [ ] No 400/500 errors in Network tab

#### 3. Dashboard Load
- [ ] Navigate to dashboard/main app view
- [ ] User data loads correctly
- [ ] API calls succeed (check Network tab)
- [ ] No authentication errors

#### 4. Sign Out
- [ ] Click sign out
- [ ] User is signed out successfully
- [ ] Redirects to appropriate page

### Security Headers Verification

#### Check CSP Headers
Run this command to verify Content Security Policy:
```bash
curl -I https://{production-domain} | grep -i content-security-policy
```

Verify it includes:
- [ ] `worker-src 'self' blob:`
- [ ] `script-src 'self' 'unsafe-eval' 'unsafe-inline'`
- [ ] `img-src` with all required domains
- [ ] `connect-src` with all required API endpoints

#### Browser DevTools Check
- [ ] Open browser DevTools → Console
- [ ] Reload the page
- [ ] No CSP violation errors
- [ ] No blocked resources

### Error Monitoring

#### Sentry Verification (if configured)
- [ ] Log into Sentry dashboard
- [ ] Check for new errors in the last 5 minutes
- [ ] Verify no critical errors related to deployment
- [ ] Confirm error tracking is working (artificially trigger test error if needed)

#### Vercel Logs
- [ ] Check Vercel → Functions logs
- [ ] Look for any server-side errors
- [ ] Verify no startup errors in logs

---

## Environment-Specific Checks

### Production Environment
- [ ] `NODE_ENV=production`
- [ ] Database points to production DB
- [ ] No test/debug flags enabled
- [ ] Analytics/monitoring enabled
- [ ] Error tracking enabled

### Staging Environment (if applicable)
- [ ] `NODE_ENV=production` (or staging if configured)
- [ ] Database points to staging DB
- [ ] OAuth configured for staging domain
- [ ] Can test without affecting production

---

## Rollback Plan

If deployment verification fails:

### Immediate Rollback
1. [ ] Go to Vercel → Deployments
2. [ ] Find last known good deployment
3. [ ] Click "..." menu → "Promote to Production"
4. [ ] Verify rollback successful

### Investigation
1. [ ] Check Vercel deployment logs for errors
2. [ ] Check Sentry for error details
3. [ ] Check browser console for client-side errors
4. [ ] Review recent code changes

### Fix Forward
1. [ ] Identify root cause
2. [ ] Fix issue locally
3. [ ] Test fix thoroughly
4. [ ] Redeploy following this checklist

---

## Common Issues & Solutions

### CSP Violations
**Symptom**: Console errors about blocked resources
**Check**:
- Verify CSP headers are deployed (curl command above)
- Check if `worker-src 'self' blob:` is present
**Fix**:
- Update next.config.mjs
- Redeploy **without cache**

### OAuth Failures (400/500 errors)
**Symptom**: Sign-in redirects to error page
**Check**:
- `NEXTAUTH_URL` matches deployment domain
- Spotify redirect URIs include current domain
- No domain mismatch warnings in Vercel logs
**Fix**:
- Update environment variables
- Update OAuth provider settings
- Redeploy

### Database Connection Issues
**Symptom**: 500 errors when loading data
**Check**:
- `DATABASE_URL` is correct
- Database is accessible from Vercel
- Database credentials are valid
**Fix**:
- Verify database connection string
- Check database firewall rules
- Verify database is running

### Missing Environment Variables
**Symptom**: Build fails or runtime errors
**Check**:
- All required variables set in Vercel
- Variables set for correct environment (Production/Preview/Development)
**Fix**:
- Add missing variables in Vercel dashboard
- Redeploy

---

## Automated Verification (Future Enhancement)

### Script to Run Post-Deployment
```bash
#!/bin/bash
# scripts/verify-deployment.sh

DOMAIN="https://audiospective.vercel.app"

echo "🔍 Verifying deployment: $DOMAIN"
echo ""

# Check if site is up
echo "1. Checking if site is accessible..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN)
if [ $STATUS -eq 200 ]; then
  echo "   ✅ Site is up (HTTP $STATUS)"
else
  echo "   ❌ Site returned HTTP $STATUS"
  exit 1
fi

# Check CSP headers
echo "2. Checking CSP headers..."
CSP=$(curl -s -I $DOMAIN | grep -i content-security-policy)
if echo "$CSP" | grep -q "worker-src"; then
  echo "   ✅ worker-src directive found in CSP"
else
  echo "   ⚠️  worker-src directive NOT found in CSP"
fi

# Check auth endpoint
echo "3. Checking auth API endpoint..."
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/api/auth/session")
if [ $AUTH_STATUS -eq 200 ]; then
  echo "   ✅ Auth endpoint accessible (HTTP $AUTH_STATUS)"
else
  echo "   ⚠️  Auth endpoint returned HTTP $AUTH_STATUS"
fi

echo ""
echo "✅ Deployment verification complete!"
```

**Usage**:
```bash
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh
```

---

## Checklist History

| Date | Deployment | Verified By | Issues Found | Status |
|------|------------|-------------|--------------|--------|
| 2025-12-06 | `da2bc46` | Claude Code | CSP + Domain mismatch | ✅ Resolved |
| | | | | |

---

## Related Documentation

- [Incident Report: INC-2025-12-06-001](./INCIDENTS/2025-12-06-csp-auth-domain.md)
- [Domain Configuration Guide](./DOMAIN-CONFIGURATION.md) (to be created)
- [Environment Variables Reference](./.env.example)
- [Vercel Deployment Docs](https://vercel.com/docs/concepts/deployments)
- [NextAuth.js Documentation](https://next-auth.js.org/configuration/options)

---

**Last Updated**: 2025-12-06
**Maintained By**: Development Team
