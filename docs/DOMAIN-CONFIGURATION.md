# Domain Configuration Guide

This guide documents how to properly configure domain settings for Audiospective to prevent authentication and deployment issues like INC-2025-12-06-001.

---

## Overview

Audiospective requires consistent domain configuration across multiple services:
1. **Vercel Deployment** - Where the app is hosted
2. **Environment Variables** - Runtime configuration
3. **OAuth Providers** - Authentication redirect URIs (Spotify, etc.)

**Current Production Domain**: `audiospective.vercel.app`

**Previous Domain** (deprecated): `spotify-time-machine-nu.vercel.app`

---

## Prerequisites

Before starting, ensure you have:
- [ ] Access to Vercel dashboard
- [ ] Access to Spotify Developer Dashboard
- [ ] Admin permissions on the GitHub repository
- [ ] Understanding of OAuth redirect flow

---

## Part 1: Vercel Domain Configuration

### Step 1: Access Vercel Project Settings

1. Log into **Vercel Dashboard**: https://vercel.com/dashboard
2. Select the **audiospective** project
3. Navigate to **Settings** tab

### Step 2: Configure Production Domain

1. Click **Domains** in the left sidebar
2. You should see your current domains listed

#### Add New Domain (if needed)
1. In the "Add Domain" input field, enter: `audiospective.vercel.app`
2. Click **Add**
3. Vercel automatically verifies `.vercel.app` subdomains

#### Set Primary Production Domain
1. Find `audiospective.vercel.app` in the domain list
2. Click the **three dots (⋯)** menu next to it
3. Select **"Set as Production Domain"**
4. Confirm the action

#### Remove Old Domains (optional)
1. Find deprecated domains (e.g., `spotify-time-machine-nu.vercel.app`)
2. Click **three dots (⋯)** → **Remove**
3. Confirm removal

### Step 3: Verify Domain Configuration

- [ ] `audiospective.vercel.app` is marked with a **"Production"** badge
- [ ] Domain status shows **"Valid"** or **"Ready"**
- [ ] Old domains are removed or clearly marked as non-production

---

## Part 2: Environment Variables

### Step 1: Access Environment Variables

1. In Vercel Dashboard → **audiospective** project
2. Go to **Settings** → **Environment Variables**

### Step 2: Configure NEXTAUTH_URL

**Critical**: This must exactly match your production domain.

1. Find `NEXTAUTH_URL` in the list
   - If not present, click **Add New** at the top

2. Set the value:
   ```
   https://audiospective.vercel.app
   ```

3. Select environments:
   - ✅ **Production** - Always required
   - ⬜ **Preview** - Optional (can use dynamic preview URLs)
   - ⬜ **Development** - Optional (use localhost)

4. Click **Save**

### Step 3: Verify Other Required Variables

Ensure these are also configured:

| Variable | Environment | Example Value | Notes |
|----------|-------------|---------------|-------|
| `NEXTAUTH_SECRET` | Production | `[random-32-char-string]` | Generate with: `openssl rand -base64 32` |
| `SPOTIFY_CLIENT_ID` | Production | `abc123...` | From Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | Production | `xyz789...` | From Spotify Developer Dashboard |
| `DATABASE_URL` | Production | `postgresql://...` | Production database connection |

### Step 4: Environment Variable Checklist

- [ ] `NEXTAUTH_URL` = `https://audiospective.vercel.app`
- [ ] `NEXTAUTH_SECRET` is set (at least 32 characters)
- [ ] `SPOTIFY_CLIENT_ID` is set
- [ ] `SPOTIFY_CLIENT_SECRET` is set
- [ ] `DATABASE_URL` points to production database
- [ ] All variables are assigned to **Production** environment

---

## Part 3: OAuth Provider Configuration

### Spotify Configuration

#### Step 1: Access Spotify Developer Dashboard

1. Navigate to: https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Select your **Audiospective** app
   - Or create a new app if this is initial setup

#### Step 2: Configure Redirect URIs

1. Click **Settings** (or **Edit Settings**)
2. Scroll to **Redirect URIs** section
3. Add the following URIs:

**Production** (Required):
```
https://audiospective.vercel.app/api/auth/callback/spotify
```

**Development** (Recommended):
```
http://localhost:3000/api/auth/callback/spotify
```

**Preview/Staging** (Optional):
```
https://[your-preview-domain].vercel.app/api/auth/callback/spotify
```

#### Step 3: Remove Deprecated URIs

If present, **remove** these old redirect URIs:
```
https://spotify-time-machine-nu.vercel.app/api/auth/callback/spotify
```

#### Step 4: Save Settings

1. Scroll to the bottom
2. Click **Save** button
3. Verify changes are persisted

#### Step 5: Verify Client Credentials

- [ ] Copy **Client ID** - should match `SPOTIFY_CLIENT_ID` in Vercel
- [ ] Copy **Client Secret** - should match `SPOTIFY_CLIENT_SECRET` in Vercel

### Adding Additional OAuth Providers (Future)

If adding Google, Facebook, etc.:

1. Go to respective developer console
2. Configure OAuth app with redirect URI:
   ```
   https://audiospective.vercel.app/api/auth/callback/[provider]
   ```
3. Add client credentials to Vercel environment variables
4. Update `src/lib/auth.ts` to include new provider

---

## Part 4: Deployment & Verification

### Step 1: Trigger Deployment

After making configuration changes:

1. Go to Vercel → **Deployments** tab
2. Click **three dots (⋯)** next to latest deployment
3. Click **Redeploy**
4. **CRITICAL**: ❌ **Uncheck** "Use existing Build Cache"
5. Select **Production** environment
6. Click **Redeploy**

### Step 2: Monitor Deployment

1. Watch build logs in real-time
2. Wait for deployment status: **"Ready"**
3. Note the deployment URL

### Step 3: Verify Configuration

Run through the **Deployment Verification Checklist**:
- See: `docs/DEPLOYMENT-VERIFICATION-CHECKLIST.md`

Quick verification commands:

```bash
# Check CSP headers include worker-src
curl -I https://audiospective.vercel.app | grep -i content-security-policy

# Check auth endpoint is accessible
curl -s https://audiospective.vercel.app/api/auth/session

# Check if site is up
curl -I https://audiospective.vercel.app
```

### Step 4: Test Authentication Flow

1. Open browser to: `https://audiospective.vercel.app`
2. Click **"Sign in with Spotify"**
3. Authorize on Spotify (if prompted)
4. Verify successful redirect back to app
5. Verify user is signed in (check profile/dashboard)
6. Check browser console for errors:
   - [ ] No CSP violations
   - [ ] No 400/500 errors
   - [ ] No OAuth errors

---

## Part 5: Custom Domain (Optional)

If you want to use a custom domain (e.g., `audiospective.com`):

### Step 1: Purchase Domain

1. Purchase domain from registrar (Namecheap, GoDaddy, etc.)
2. Access domain's DNS settings

### Step 2: Add Domain to Vercel

1. Vercel → **Settings** → **Domains**
2. Enter your custom domain: `audiospective.com`
3. Click **Add**

### Step 3: Configure DNS

Vercel will provide DNS records. Add these to your registrar:

**For apex domain** (`audiospective.com`):
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain** (`www.audiospective.com`):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 4: Update Configuration

1. Update `NEXTAUTH_URL` in Vercel to: `https://audiospective.com`
2. Update Spotify redirect URI to: `https://audiospective.com/api/auth/callback/spotify`
3. Redeploy application

### Step 5: SSL Certificate

Vercel automatically provisions SSL certificates for custom domains.
- Wait 5-10 minutes for certificate to be issued
- Verify HTTPS works: `https://audiospective.com`

---

## Troubleshooting

### Issue: "OAuth callback error" or 400/500 on auth

**Causes**:
- NEXTAUTH_URL doesn't match deployment domain
- Spotify redirect URI not configured correctly
- Domain mismatch between Vercel and OAuth provider

**Solution**:
1. Verify `NEXTAUTH_URL` matches actual domain exactly
2. Check Spotify redirect URIs include current domain
3. Ensure protocol matches (https:// in production)
4. Check environment variable validation logs in Vercel

### Issue: "CSP violation blocking workers"

**Causes**:
- `worker-src` directive missing from CSP
- Old cached build deployed

**Solution**:
1. Verify `next.config.mjs` includes `worker-src 'self' blob:`
2. Redeploy **without build cache**
3. Clear browser cache and test
4. Check CSP headers with curl command above

### Issue: "Domain not found" or 404

**Causes**:
- Domain not properly configured in Vercel
- DNS not propagated (for custom domains)
- Deployment failed

**Solution**:
1. Check Vercel → Domains shows domain as "Valid"
2. For custom domains, verify DNS records
3. Wait up to 48 hours for DNS propagation
4. Check Vercel deployment status

### Issue: Environment variable validation warnings

**Cause**:
- Domain mismatch detected by `src/config/env.ts`

**Solution**:
1. Check Vercel deployment logs for warnings
2. Update `NEXTAUTH_URL` to match `VERCEL_URL`
3. Redeploy application

---

## Monitoring & Alerts

### Sentry Monitoring

CSP violations and auth errors are automatically reported to Sentry:

1. Log into Sentry: https://sentry.io
2. Select **Audiospective** project
3. Filter by tags:
   - `csp_violation: true` - CSP issues
   - `incident_prevention: INC-2025-12-06-001` - Domain/auth issues

### Vercel Logs

Monitor real-time logs:

1. Vercel → **Deployments** → Select deployment
2. View **Build Logs** for deployment errors
3. View **Function Logs** for runtime errors

---

## Related Documentation

- [Deployment Verification Checklist](./DEPLOYMENT-VERIFICATION-CHECKLIST.md)
- [Incident Report: INC-2025-12-06-001](./INCIDENTS/2025-12-06-csp-auth-domain.md)
- [NextAuth.js Documentation](https://next-auth.js.org/configuration/options)
- [Vercel Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Spotify OAuth Documentation](https://developer.spotify.com/documentation/general/guides/authorization/)

---

## Quick Reference

### Production Domain
```
https://audiospective.vercel.app
```

### OAuth Redirect URIs
```
https://audiospective.vercel.app/api/auth/callback/spotify
http://localhost:3000/api/auth/callback/spotify (dev)
```

### Environment Variables
```bash
NEXTAUTH_URL=https://audiospective.vercel.app
NEXTAUTH_SECRET=[32+ character secret]
SPOTIFY_CLIENT_ID=[from Spotify dashboard]
SPOTIFY_CLIENT_SECRET=[from Spotify dashboard]
DATABASE_URL=[PostgreSQL connection string]
```

### Verification Commands
```bash
# Check site is up
curl -I https://audiospective.vercel.app

# Check CSP headers
curl -I https://audiospective.vercel.app | grep -i content-security-policy

# Check auth endpoint
curl -s https://audiospective.vercel.app/api/auth/session
```

---

**Last Updated**: 2025-12-06
**Maintained By**: Development Team
**Related Incident**: INC-2025-12-06-001
