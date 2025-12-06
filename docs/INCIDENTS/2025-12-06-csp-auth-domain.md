# Incident Report: CSP Worker Violation & OAuth Domain Mismatch

**Incident ID:** INC-2025-12-06-001
**Date:** December 6, 2025
**Severity:** SEV-1 (Critical - Authentication completely broken)
**Status:** ✅ **RESOLVED**
**Duration:** ~2 hours (detection to resolution)

---

## Executive Summary

Critical production errors prevented users from signing in to the application. Two related issues were identified:
1. **CSP Worker Violation**: Sentry web workers blocked by Content Security Policy
2. **OAuth Domain Mismatch**: NEXTAUTH_URL and Spotify redirect URIs pointed to wrong domain

**Impact:** All users unable to authenticate. Sign-in flow completely broken with 400/500 errors.

**Resolution:**
- Fixed CSP policy to allow `worker-src 'self' blob:`
- Corrected domain from `spotify-time-machine-nu.vercel.app` to `audiospective.vercel.app`
- Updated Vercel environment variables and Spotify OAuth configuration

---

## Timeline (UTC)

| Time | Event |
|------|-------|
| ~16:00 | **User reported errors** - CSP violation blocking Sentry workers, OAuth failing with 400/500 |
| 16:15 | **Investigation started** - Analyzed error logs, identified CSP `worker-src` missing |
| 16:20 | **Initial fix attempted** - Verified local code had `worker-src 'self' blob:` in next.config.mjs:58 |
| 16:25 | **Deployment triggered** - Empty commit to force Vercel rebuild |
| 16:40 | **Issue persisted** - Vercel still serving old CSP policy (cache issue) |
| 16:45 | **Cache-busting fix** - Added timestamp comment to next.config.mjs, commit `da2bc46` |
| 17:00 | **Domain mismatch discovered** - Production using `spotify-time-machine-nu.vercel.app` but code/OAuth expecting `audiospective.vercel.app` |
| 17:15 | **Domain reconfigured** - Updated Vercel domain, NEXTAUTH_URL, and Spotify redirect URIs |
| 17:20 | **Redeployed without cache** - Forced fresh build in Vercel |
| 17:25 | **Deployment complete** - New version live with correct CSP and domain |
| 17:30 | **✅ Verified working** - User confirmed sign-in successful |

**Total Resolution Time:** ~90 minutes

---

## Root Cause Analysis

### Problem 1: CSP Worker Violation

**What Happened:**
- Sentry SDK creates web workers for session replay functionality
- Workers are created from `blob:` URLs
- Content Security Policy blocked these workers because `worker-src` directive was missing
- Without explicit `worker-src`, browser falls back to `script-src` which didn't allow `blob:`

**Error Message:**
```
Creating a worker from 'blob:https://audiospective.vercel.app/...' violates
the following Content Security Policy directive: "script-src 'self' 'unsafe-eval'
'unsafe-inline'". Note that 'worker-src' was not explicitly set, so 'script-src'
is used as a fallback.
```

**Root Cause:**
- Initial CSP implementation didn't include `worker-src` directive
- Was added in commit `f52a804` but Vercel served cached config
- Build cache prevented config changes from taking effect

### Problem 2: OAuth Domain Mismatch

**What Happened:**
- Vercel production deployment assigned to `spotify-time-machine-nu.vercel.app`
- Code and environment variables configured for `audiospective.vercel.app`
- Spotify OAuth redirect URIs didn't match actual deployment domain
- NextAuth redirects failed, causing 400/500 errors

**Root Cause:**
- Project originally named "Spotify Time Machine" before rebranding to "Audiospective"
- Vercel domain not updated during rebrand
- Environment variables and OAuth configuration pointed to non-existent domain

---

## Technical Details

### Files Modified

**next.config.mjs** (lines 47-66):
```javascript
// Content Security Policy (CSP)
// Updated: 2025-12-06 - Fixed worker-src for Sentry web workers
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://i.scdn.co https://*.spotifycdn.com https://*.fbcdn.net data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.spotify.com https://accounts.spotify.com https://*.upstash.io https://*.sentry.io",
    "media-src 'self'",
    "worker-src 'self' blob:", // CRITICAL: Allow Sentry web workers
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ')
}
```

### Configuration Changes

**Vercel Environment Variables:**
- `NEXTAUTH_URL`: Updated from `https://spotify-time-machine-nu.vercel.app` to `https://audiospective.vercel.app`

**Vercel Domains:**
- Added `audiospective.vercel.app` as production domain
- Set as primary production domain

**Spotify Developer Dashboard:**
- Added redirect URI: `https://audiospective.vercel.app/api/auth/callback/spotify`
- Removed old URI: `https://spotify-time-machine-nu.vercel.app/api/auth/callback/spotify`

### Commits

- `f52a804`: Initial worker-src fix (cached by Vercel)
- `09de784`: Empty commit to trigger deployment
- `da2bc46`: Cache-busting comment addition (final fix)

---

## Impact Assessment

### User Impact
- **Severity**: Critical (SEV-1)
- **Affected Users**: 100% of users attempting to sign in
- **Duration**: ~90 minutes
- **User Experience**: Complete authentication failure, error pages shown

### Business Impact
- New user onboarding blocked
- Existing users unable to access their data
- Potential reputation damage from broken authentication

### Data Impact
- No data loss
- No security breach
- No unauthorized access

---

## Resolution Steps

### Immediate Actions Taken

1. **CSP Fix**:
   - Verified `worker-src 'self' blob:` present in next.config.mjs
   - Added cache-busting comment with timestamp
   - Committed changes (da2bc46)
   - Pushed to trigger deployment

2. **Domain Configuration**:
   - Added `audiospective.vercel.app` in Vercel domains
   - Set as production domain
   - Updated `NEXTAUTH_URL` environment variable
   - Updated Spotify OAuth redirect URIs

3. **Cache Clearing**:
   - Redeployed from Vercel dashboard
   - Disabled "Use existing Build Cache" option
   - Forced fresh build to pick up config changes

4. **Verification**:
   - Tested sign-in flow on production
   - Confirmed CSP violations resolved
   - Confirmed OAuth flow working correctly

---

## Preventive Measures

### Immediate (Implemented)

1. ✅ **CSP Worker Support**: Added `worker-src 'self' blob:` to CSP
2. ✅ **Correct Domain**: Configured `audiospective.vercel.app` as production domain
3. ✅ **Environment Variables**: Updated NEXTAUTH_URL to match actual domain
4. ✅ **OAuth Configuration**: Updated Spotify redirect URIs

### Short-term (Recommended)

1. **Environment Variable Validation**:
   - Add startup validation to verify NEXTAUTH_URL matches deployment domain
   - Log warnings if mismatch detected
   - Location: `src/config/env.ts`

2. **Deployment Verification Script**:
   - Create script to verify CSP headers are correctly deployed
   - Check domain configuration matches environment
   - Run as part of CI/CD pipeline

3. **Monitoring Alerts**:
   - Set up Sentry alerts for CSP violations
   - Monitor OAuth callback failures
   - Alert on 400/500 errors on auth endpoints

### Long-term (Planned)

1. **Infrastructure as Code**:
   - Document Vercel configuration in version control
   - Use `vercel.json` for explicit configuration
   - Reduce reliance on dashboard settings

2. **Automated Testing**:
   - Add E2E tests for complete auth flow
   - Test CSP headers in staging before production
   - Verify environment variable consistency

3. **Documentation**:
   - Document deployment domain configuration
   - Create runbook for domain changes
   - Document OAuth provider setup

---

## Lessons Learned

### What Went Well

1. **Quick Diagnosis**: CSP error messages were clear and specific
2. **Systematic Approach**: Methodical investigation identified both root causes
3. **User Communication**: User reported issue promptly with detailed error logs
4. **Legal Compliance**: User chose legally compliant domain name (audiospective)

### What Could Be Improved

1. **Deployment Verification**: Should have verified CSP headers after initial deployment
2. **Domain Management**: Domain mismatch should have been caught during rebrand
3. **Cache Awareness**: Didn't initially consider Vercel build cache impact
4. **Environment Parity**: Staging environment should mirror production domain setup

### Action Items

- [ ] Implement environment variable validation (Priority: High)
- [ ] Create deployment verification checklist (Priority: High)
- [ ] Add CSP header monitoring (Priority: Medium)
- [ ] Document domain configuration process (Priority: Medium)
- [ ] Add E2E auth tests (Priority: Low)

---

## References

### Related Documentation
- [Content Security Policy (CSP) - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Sentry Browser Configuration](https://docs.sentry.io/platforms/javascript/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Related Incidents
- INC-2025-12-05-001: SQL Table Name Mismatch

### Git Commits
- `f52a804`: fix: add worker-src to CSP for Sentry web workers
- `09de784`: chore: trigger deployment to apply worker-src CSP fix
- `da2bc46`: fix: force CSP worker-src update with cache-busting comment

---

## Sign-off

**Incident Commander**: Claude Code (AI Assistant)
**Reported By**: User (Adeoluwa Tokuta)
**Verified By**: User (Adeoluwa Tokuta)
**Date Closed**: December 6, 2025

**Status**: ✅ **RESOLVED** - Sign-in working, CSP violations eliminated, OAuth configured correctly
