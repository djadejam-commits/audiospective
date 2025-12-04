# Sentry Error Monitoring Setup

**Status:** Optional but highly recommended for production

**Time Required:** 15 minutes

---

## Why Sentry?

Sentry provides real-time error monitoring and tracking for production applications:

✅ **Automatic error capture** - All errors sent to Sentry dashboard
✅ **User context** - See what user was doing when error occurred
✅ **Source maps** - View exact line of code that caused error
✅ **Stack traces** - Full error details with variable values
✅ **Performance monitoring** - Track slow API calls and page loads
✅ **Session Replay** - Watch recordings of user sessions with errors
✅ **Alerts** - Get notified via email/Slack when errors spike

**Without Sentry:** Errors happen silently, users leave, you never know why.
**With Sentry:** Know about errors before users report them, fix them proactively.

---

## Step 1: Create Sentry Account (5 minutes)

1. Visit: https://sentry.io
2. Click **"Get Started"** → Sign up with GitHub/email
3. Select **"Next.js"** as your platform
4. Create project name: `audiospective`
5. Select region: **US East (default)**

**Result:** You'll see the Sentry dashboard with a DSN key.

---

## Step 2: Get Your Sentry DSN (2 minutes)

1. In Sentry dashboard → **Settings** → **Projects**
2. Click your project: `audiospective`
3. Go to **Settings** → **Client Keys (DSN)**
4. Copy the **DSN** URL:
   ```
   https://abc123@o456789.ingest.sentry.io/789
   ```

---

## Step 3: Generate Auth Token (3 minutes)

This token allows uploading source maps for better error debugging.

1. In Sentry dashboard → Click your profile (bottom left)
2. Go to **Auth Tokens**
3. Click **"Create New Token"**
4. Configure:
   - **Name:** `audiospective-ci`
   - **Scopes:** Check these boxes:
     - `project:read`
     - `project:releases`
     - `org:read`
5. Click **"Create Token"**
6. **IMPORTANT:** Copy the token immediately (you can't see it again!)

---

## Step 4: Update .env File (2 minutes)

Add these to your `.env` file:

```bash
# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="development"  # or "production"
SENTRY_AUTH_TOKEN="sntrys_your_auth_token_here"
SENTRY_ORG="your-sentry-organization-slug"
SENTRY_PROJECT="audiospective"
```

**How to find these values:**

- **DSN:** From Step 2 above
- **Environment:** `development` for local, `production` for deployed
- **Auth Token:** From Step 3 above
- **Org Slug:** In Sentry URL: `https://sentry.io/organizations/YOUR-ORG-SLUG/`
- **Project:** `audiospective` (or your project name)

---

## Step 5: Test Sentry Integration (3 minutes)

**1. Start dev server:**
```bash
npm run dev
```

**2. Visit:** http://localhost:3000

**3. Open browser console and run:**
```javascript
throw new Error("Test error for Sentry");
```

**4. Check Sentry Dashboard:**
- Go to: https://sentry.io → Your Project → **Issues**
- You should see the test error appear within 30 seconds
- Click the error to see full details:
  - Stack trace
  - Browser info
  - User actions (breadcrumbs)

**If error appears in Sentry: ✅ Setup complete!**

---

## Step 6: Production Setup (Vercel)

**Set environment variables in Vercel:**

```bash
# Using Vercel CLI
vercel env add NEXT_PUBLIC_SENTRY_DSN production
# Paste your DSN when prompted

vercel env add NEXT_PUBLIC_SENTRY_ENVIRONMENT production
# Type: production

vercel env add SENTRY_AUTH_TOKEN production
# Paste your auth token

vercel env add SENTRY_ORG production
# Type your org slug

vercel env add SENTRY_PROJECT production
# Type: audiospective
```

**Or via Vercel Dashboard:**
1. Go to: https://vercel.com → Your Project → **Settings** → **Environment Variables**
2. Add each variable above
3. Select **"Production"** environment
4. Click **Save**

**Then redeploy:**
```bash
git push origin main
```

---

## What Sentry Captures

### Automatic Error Tracking

**Client-side:**
- Unhandled exceptions
- Promise rejections
- Console errors
- React component errors

**Server-side:**
- API route errors
- Database errors
- Authentication failures
- External API failures (Spotify)

### Performance Monitoring

- Page load times
- API response times
- Database query performance
- Slow Spotify API calls

### Session Replay

- User actions before error
- Mouse movements
- Clicks and scrolls
- Form interactions
- Network requests

---

## Sentry Dashboard Features

### Issues Tab
- All errors grouped by type
- Error frequency and trends
- Affected users count
- First seen / Last seen timestamps

### Performance Tab
- Slow API endpoints
- Page load metrics
- Database query performance
- Bottleneck identification

### Releases Tab
- Track errors by deployment
- Compare error rates between versions
- See which release introduced a bug

### Alerts Tab
- Configure email/Slack notifications
- Alert on error spikes
- Alert on new error types
- Alert on performance degradation

---

## Best Practices

### 1. Use Environments
```bash
# Development
NEXT_PUBLIC_SENTRY_ENVIRONMENT="development"

# Staging
NEXT_PUBLIC_SENTRY_ENVIRONMENT="staging"

# Production
NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"
```

### 2. Filter Sensitive Data
Already configured in `sentry.*.config.ts`:
- Passwords redacted
- Auth tokens removed
- API keys hidden
- Database URLs stripped

### 3. Ignore Expected Errors
Already configured to ignore:
- Network errors (user's internet)
- Browser extension errors
- Rate limit errors (expected)
- Unauthorized errors (user's fault)

### 4. Set Up Alerts
In Sentry Dashboard:
1. **Alerts** → **Create Alert Rule**
2. Configure:
   - **Name:** "Production Error Spike"
   - **Condition:** "Issues seen by more than 10 users"
   - **Action:** "Send email to team"

### 5. Review Weekly
- Check **Issues** tab every Monday
- Fix high-frequency errors first
- Monitor performance trends
- Update ignored errors list

---

## Pricing

**Free Tier (Sufficient for MVP):**
- 5,000 errors/month
- 10,000 performance transactions/month
- 50 session replays/month
- 1 team member
- 30-day data retention

**Paid Tiers (If needed later):**
- **Team ($26/month):**
  - 50,000 errors/month
  - 100,000 performance transactions/month
  - Unlimited replays
  - 5 team members

- **Business ($80/month):**
  - 500,000 errors/month
  - Unlimited performance monitoring
  - 90-day data retention

**For most apps:** Free tier is enough for the first year.

---

## Troubleshooting

### Error: "Sentry not capturing errors"

**Check 1:** Verify DSN in .env
```bash
echo $NEXT_PUBLIC_SENTRY_DSN
# Should output your DSN URL
```

**Check 2:** Verify Sentry is enabled
```bash
# In dev, Sentry is disabled by default
# Set this to test:
NEXT_PUBLIC_SENTRY_ENVIRONMENT="staging"
```

**Check 3:** Check browser console
Look for: `[Sentry] Error sent successfully`

### Error: "Source maps not uploading"

**Check 1:** Verify auth token
```bash
echo $SENTRY_AUTH_TOKEN
# Should output your token
```

**Check 2:** Check build logs
```bash
npm run build
# Look for: "[Sentry] Source maps uploaded successfully"
```

**Check 3:** Verify org/project names
```bash
echo $SENTRY_ORG
echo $SENTRY_PROJECT
# Should match your Sentry dashboard
```

### Error: "Too many events (rate limited)"

**Solution:** You've hit the free tier limit
- Upgrade plan ($26/month Team tier)
- Or reduce sample rates in config:
  ```typescript
  tracesSampleRate: 0.1, // 10% instead of 100%
  ```

---

## Monitoring Checklist

After setup, verify:

- [ ] Sentry account created
- [ ] Project configured
- [ ] DSN added to .env
- [ ] Auth token generated
- [ ] Test error appears in dashboard
- [ ] Production env vars set in Vercel
- [ ] Source maps uploading on build
- [ ] Alerts configured
- [ ] Team invited (if applicable)
- [ ] Weekly review scheduled

---

## Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Pricing](https://sentry.io/pricing/)
- [Source Maps Guide](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

---

**Setup created:** Day 2 of 14-Day Plan
**Time investment:** 15 minutes
**Production value:** High - Know about errors before users complain
