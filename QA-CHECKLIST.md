# QA Checklist - Day 12 Final QA Pass

**Created:** December 4, 2025
**Version:** 1.0
**Status:** Ready for QA
**Environment:** Staging (audiospective-staging.vercel.app)

---

## Overview

This comprehensive QA checklist covers all user flows, edge cases, and system behaviors for the Audiospective application. Each item should be tested on the staging environment before production deployment.

**Testing Approach:**
- ✅ = Passed
- ❌ = Failed (create issue)
- ⚠️ = Partial (works but has minor issues)
- ⏭️ = Skipped (document reason)

---

## Pre-QA Setup

### Environment Verification

- [ ] Staging URL accessible: https://audiospective-staging.vercel.app
- [ ] Health check passes: `/api/health` returns 200
- [ ] Database connected (PostgreSQL)
- [ ] Redis connected (Upstash)
- [ ] QStash configured
- [ ] Sentry capturing events
- [ ] All environment variables set

### Test Data Preparation

- [ ] Test User 1: Normal user (0-100 plays)
- [ ] Test User 2: Power user (1000+ plays)
- [ ] Test User 3: New user (never signed in)
- [ ] Clear browser cache and cookies

---

## 1. Authentication Flow

### 1.1 Sign In - Happy Path

**Test Case:** New user signs in successfully

- [ ] **Step 1:** Navigate to homepage
  - [ ] Homepage loads (no errors)
  - [ ] "Sign in with Spotify" button visible
  - [ ] Dark mode toggle works

- [ ] **Step 2:** Click "Sign in with Spotify"
  - [ ] Redirects to Spotify OAuth page
  - [ ] URL includes correct client_id
  - [ ] Scope includes required permissions
  - [ ] Redirect URI is correct

- [ ] **Step 3:** Authorize on Spotify
  - [ ] Spotify permissions page loads
  - [ ] Required scopes listed:
    - [ ] `user-read-recently-played`
    - [ ] `user-top-read`
    - [ ] `user-read-email`

- [ ] **Step 4:** Callback and redirect
  - [ ] Redirects back to staging
  - [ ] Dashboard loads
  - [ ] User session created
  - [ ] No console errors

**Expected Result:** User is authenticated and sees dashboard

**Actual Result:** _____________

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 1.2 Sign In - Error Cases

**Test Case 1.2a:** User denies Spotify authorization

- [ ] Click "Sign in with Spotify"
- [ ] On Spotify OAuth page, click "Cancel"
- [ ] Should redirect back with error message
- [ ] Error should be user-friendly (not technical)

**Expected:** "Authorization was cancelled. Please try again."

**Actual:** _____________

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

**Test Case 1.2b:** Invalid OAuth callback

- [ ] Manually visit `/api/auth/callback/spotify?error=access_denied`
- [ ] Should show error message
- [ ] Should not crash application

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 1.3 Session Management

**Test Case:** Session persists across page refreshes

- [ ] Sign in successfully
- [ ] Refresh page (F5)
- [ ] Still authenticated (dashboard visible)
- [ ] No new OAuth prompt

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

**Test Case:** Session expires after timeout

- [ ] Sign in successfully
- [ ] Wait 30 days (or manually expire session)
- [ ] Refresh page
- [ ] Should be redirected to sign in

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (cannot test 30-day timeout)

---

### 1.4 Sign Out

**Test Case:** User can sign out

- [ ] Click user profile/menu
- [ ] Click "Sign Out"
- [ ] Redirects to homepage
- [ ] Session cleared (cookie deleted)
- [ ] Cannot access dashboard (redirects to sign in)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

## 2. Dashboard (Main Page)

### 2.1 Dashboard Load - New User

**Test Case:** First-time user sees empty state

- [ ] Sign in with brand new Spotify account
- [ ] Dashboard loads
- [ ] Shows empty state message
- [ ] "Archive Now" button visible
- [ ] No errors in console

**Expected:** "No listening history yet. Click 'Archive Now' to get started!"

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 2.2 Dashboard Load - Existing User

**Test Case:** User with data sees populated dashboard

- [ ] Sign in with account that has archived data
- [ ] Dashboard loads within 2 seconds
- [ ] Stats cards populated:
  - [ ] Total Plays
  - [ ] Unique Tracks
  - [ ] Unique Artists
  - [ ] Listening Hours
- [ ] Charts render:
  - [ ] Top Tracks chart
  - [ ] Top Artists chart
  - [ ] Genre Distribution
  - [ ] Activity Heatmap
- [ ] No console errors

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 2.3 Dashboard - Performance

**Test Case:** Dashboard loads quickly

- [ ] Use browser DevTools Network tab
- [ ] Measure page load time
- [ ] Should be < 2 seconds on 3G connection

**Expected:** < 2 seconds
**Actual:** _______ seconds

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

**Test Case:** Dashboard with 10,000+ plays

- [ ] Sign in with power user account (10K+ plays)
- [ ] Dashboard loads
- [ ] Charts render correctly
- [ ] No performance issues (lag, freezing)
- [ ] No out-of-memory errors

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (no test account with 10K+ plays)

---

## 3. Manual Archival

### 3.1 Archive Now - Happy Path

**Test Case:** Manual archival works

- [ ] Click "Archive Now" button
- [ ] Loading state shows (spinner/disabled button)
- [ ] Success toast appears after completion
- [ ] Toast message: "Successfully archived X tracks"
- [ ] Dashboard updates with new data
- [ ] Button re-enables

**Expected Duration:** 2-5 seconds
**Actual Duration:** _______ seconds

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 3.2 Archive Now - Idempotency

**Test Case:** Clicking "Archive Now" twice doesn't duplicate data

- [ ] Click "Archive Now"
- [ ] Wait for success
- [ ] Note total play count
- [ ] Immediately click "Archive Now" again
- [ ] Total play count should not change (or minimal change)
- [ ] No duplicate entries in database

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 3.3 Archive Now - Error Cases

**Test Case 3.3a:** Archival with no new tracks

- [ ] Click "Archive Now"
- [ ] Wait for completion
- [ ] Click "Archive Now" again immediately
- [ ] Should show message: "No new tracks to archive"

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

**Test Case 3.3b:** Archival while token expired

- [ ] Manually expire access token (modify in database)
- [ ] Click "Archive Now"
- [ ] Should trigger token refresh
- [ ] Archival should succeed
- [ ] No error visible to user

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires manual database modification)

---

**Test Case 3.3c:** Archival while Spotify API down

- [ ] Simulate Spotify API error (block requests in DevTools)
- [ ] Click "Archive Now"
- [ ] Should show user-friendly error message
- [ ] Should log error to Sentry
- [ ] Application should not crash

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (cannot simulate API down easily)

---

## 4. Data Export

### 4.1 Export - CSV Format

**Test Case:** Export data as CSV

- [ ] Click "Export" button
- [ ] Select "CSV" format
- [ ] File downloads automatically
- [ ] Filename format: `spotify-archive-YYYY-MM-DD.csv`
- [ ] Open CSV file
- [ ] Headers present: `Played At, Track Name, Artist, Album, Duration`
- [ ] Data rows populated
- [ ] Dates formatted correctly
- [ ] Special characters handled (commas, quotes)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 4.2 Export - JSON Format

**Test Case:** Export data as JSON

- [ ] Click "Export" button
- [ ] Select "JSON" format
- [ ] File downloads automatically
- [ ] Filename format: `spotify-archive-YYYY-MM-DD.json`
- [ ] Open JSON file
- [ ] Valid JSON (parse without errors)
- [ ] Structure:
  ```json
  {
    "exportedAt": "timestamp",
    "playCount": 123,
    "plays": [...]
  }
  ```
- [ ] All fields populated

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 4.3 Export - GDPR Mode

**Test Case:** GDPR data export

- [ ] Navigate to `/api/export?format=json&gdpr=true`
- [ ] Should download JSON with ALL user data:
  - [ ] User profile
  - [ ] Play events
  - [ ] Artists
  - [ ] Shared reports
  - [ ] Account metadata
- [ ] Data should be complete and machine-readable

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 4.4 Export - Large Dataset

**Test Case:** Export 10,000+ records

- [ ] Use power user account (10K+ plays)
- [ ] Click "Export CSV"
- [ ] File downloads (may take 10-30 seconds)
- [ ] File size reasonable (< 10MB)
- [ ] All records present (verify count)

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (no large dataset)

---

### 4.5 Export - Error Cases

**Test Case:** Export with no data

- [ ] Use new account with no archived data
- [ ] Click "Export"
- [ ] Should show error: "No data to export"
- [ ] Or export empty file with headers only

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

## 5. Share Reports

### 5.1 Create Share - Happy Path

**Test Case:** Create shareable report

- [ ] Click "Share" button
- [ ] Modal opens
- [ ] Enter title: "My December Listening"
- [ ] Select date range: "Last 7 days"
- [ ] Check "Make Public"
- [ ] Click "Create Share Report"
- [ ] Success message appears
- [ ] Shareable link displayed
- [ ] Link copied to clipboard

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 5.2 View Share - Public

**Test Case:** View public share report

- [ ] Create share report (as above)
- [ ] Copy shareable link
- [ ] Open link in incognito/private window (not signed in)
- [ ] Report loads
- [ ] Shows:
  - [ ] Report title
  - [ ] Date range
  - [ ] Top 5 tracks
  - [ ] Top 5 artists
  - [ ] Total plays
- [ ] No personal information exposed (email, full name)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 5.3 View Share - Private

**Test Case:** Private reports not accessible publicly

- [ ] Create share report
- [ ] Uncheck "Make Public"
- [ ] Click "Create Share Report"
- [ ] Copy link
- [ ] Open in incognito window
- [ ] Should show 404 or "Private report"

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 5.4 Share - Default Title

**Test Case:** Share without custom title uses default

- [ ] Click "Share"
- [ ] Leave title field empty
- [ ] Click "Create Share Report"
- [ ] Should use default title: "Listening Report - [Date]"

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 5.5 Share - Validation

**Test Case:** Share with invalid date range

- [ ] Click "Share"
- [ ] Select invalid date range (e.g., "invalid")
- [ ] Click "Create Share Report"
- [ ] Should show validation error
- [ ] Should not create report

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

## 6. Background Jobs (QStash)

### 6.1 Hourly Archival - Automated

**Test Case:** QStash triggers archival

- [ ] Wait for next hour (or trigger manually in QStash dashboard)
- [ ] Check QStash logs
- [ ] Verify request sent to `/api/cron/archive`
- [ ] Check Vercel logs
- [ ] Verify archival executed
- [ ] Check database
- [ ] New play events should be added

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires waiting)

---

### 6.2 Cron Endpoint - Security

**Test Case:** Cron endpoint requires signature

- [ ] Send POST request without signature:
  ```bash
  curl -X POST https://staging.vercel.app/api/cron/archive
  ```
- [ ] Should return 401 Unauthorized
- [ ] Should log to Sentry

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

**Test Case:** Cron endpoint with invalid signature

- [ ] Send POST request with wrong signature:
  ```bash
  curl -X POST https://staging.vercel.app/api/cron/archive \
    -H "Upstash-Signature: invalid"
  ```
- [ ] Should return 401 Unauthorized

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 6.3 Batch Processing

**Test Case:** Batch archival processes all users

- [ ] Have 3+ test users with data
- [ ] Trigger hourly archival
- [ ] Check QStash logs
- [ ] Verify fan-out to `/api/queue/archive-batch`
- [ ] Verify all users processed
- [ ] No users skipped

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires multiple test users)

---

## 7. Circuit Breaker

### 7.1 Circuit Breaker - Open State

**Test Case:** Circuit breaker opens after consecutive failures

- [ ] Create test user with invalid/revoked tokens (manually in DB)
- [ ] Trigger archival for that user
- [ ] Should fail
- [ ] Increment `consecutiveFailures`
- [ ] After 3 failures, circuit should open
- [ ] User should be skipped in next archival

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires manual DB manipulation)

---

### 7.2 Circuit Breaker - Cooldown

**Test Case:** Circuit breaker respects cooldown period

- [ ] Have user with open circuit (consecutiveFailures = 3)
- [ ] Trigger archival immediately
- [ ] User should be skipped (cooldown not expired)
- [ ] Wait 1 hour
- [ ] Trigger archival
- [ ] User should be retried (cooldown expired)

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires waiting 1 hour)

---

### 7.3 Circuit Breaker - Reset

**Test Case:** Circuit breaker resets after success

- [ ] Have user with consecutiveFailures = 2
- [ ] Fix token issue
- [ ] Trigger archival
- [ ] Should succeed
- [ ] `consecutiveFailures` should reset to 0

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires manual DB setup)

---

## 8. API Endpoints

### 8.1 GET /api/stats

**Test Case:** Stats endpoint returns correct data

- [ ] Send authenticated request:
  ```bash
  curl https://staging.vercel.app/api/stats \
    -H "Cookie: next-auth.session-token=..."
  ```
- [ ] Returns 200 OK
- [ ] Response shape:
  ```json
  {
    "totalPlays": 123,
    "uniqueTracks": 45,
    "uniqueArtists": 30,
    "uniqueAlbums": 25,
    "estimatedListeningHours": 15,
    "firstPlayAt": "timestamp",
    "lastPlayAt": "timestamp"
  }
  ```
- [ ] Numbers are accurate (verify against database)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 8.2 GET /api/top-tracks

**Test Case:** Top tracks endpoint

- [ ] Send authenticated request with limit=10
- [ ] Returns 200 OK
- [ ] Returns array of 10 tracks (or fewer if less data)
- [ ] Sorted by play count (descending)
- [ ] Each track has:
  - [ ] `id`
  - [ ] `name`
  - [ ] `artists`
  - [ ] `album`
  - [ ] `playCount`

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 8.3 GET /api/genres

**Test Case:** Genres endpoint

- [ ] Send authenticated request
- [ ] Returns 200 OK
- [ ] Returns array of genres with counts
- [ ] Sorted by count (descending)
- [ ] Percentages add up to ~100%

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 8.4 Authentication Required

**Test Case:** Protected endpoints require auth

- [ ] Send unauthenticated request to `/api/stats`
- [ ] Returns 401 Unauthorized
- [ ] Error message: "Not authenticated"

**Test endpoints:**
- [ ] `/api/stats` → 401
- [ ] `/api/top-tracks` → 401
- [ ] `/api/top-artists` → 401
- [ ] `/api/recent-plays` → 401
- [ ] `/api/export` → 401

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

## 9. Rate Limiting

### 9.1 Rate Limit - Normal Tier

**Test Case:** Normal endpoints rate limited

- [ ] Send 101 requests to `/api/stats` in 10 seconds
- [ ] First 100 should succeed (200 OK)
- [ ] 101st request should fail (429 Too Many Requests)
- [ ] Response headers:
  - [ ] `X-RateLimit-Limit: 100`
  - [ ] `X-RateLimit-Remaining: 0`
  - [ ] `Retry-After: <seconds>`

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires Redis configured)

---

### 9.2 Rate Limit - Strict Tier

**Test Case:** Strict endpoints heavily rate limited

- [ ] Send 11 requests to `/api/share` in 10 seconds
- [ ] First 10 should succeed
- [ ] 11th should fail (429)

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires Redis configured)

---

### 9.3 Rate Limit - Lenient Tier

**Test Case:** Health check not rate limited

- [ ] Send 1001 requests to `/api/health` in 10 seconds
- [ ] All should succeed (200 OK)
- [ ] No rate limiting

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires load testing tool)

---

## 10. Security

### 10.1 Security Headers

**Test Case:** Security headers present

- [ ] Send request to homepage
- [ ] Check response headers:
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Permissions-Policy: camera=(), microphone=()`
  - [ ] `Content-Security-Policy: ...` (present)
  - [ ] `Strict-Transport-Security: max-age=...` (HSTS)

**Tool:** https://securityheaders.com

**Expected Grade:** A or A+

**Actual Grade:** _______

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 10.2 Input Validation

**Test Case:** API endpoints validate input

- [ ] Send request to `/api/export?format=invalid`
- [ ] Should return 400 Bad Request
- [ ] Error message: "Invalid format"

**Test invalid inputs:**
- [ ] `/api/top-tracks?limit=9999` → 400 (exceeds max)
- [ ] `/api/share` with empty body → 400
- [ ] `/api/export?format=<script>` → 400 (XSS attempt)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 10.3 CORS

**Test Case:** CORS configured correctly

- [ ] Send cross-origin request from different domain
- [ ] Should be blocked (unless whitelisted)
- [ ] Check `Access-Control-Allow-Origin` header

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires cross-origin test)

---

## 11. Error Handling

### 11.1 404 Not Found

**Test Case:** Non-existent pages return 404

- [ ] Navigate to `/non-existent-page`
- [ ] Should show 404 page
- [ ] Page should be styled (not default Next.js 404)
- [ ] Has link back to homepage

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 11.2 500 Internal Server Error

**Test Case:** Server errors handled gracefully

- [ ] Trigger server error (test endpoint: `/api/test-error`)
- [ ] Should return 500 status
- [ ] Should show user-friendly error page
- [ ] Error should be logged to Sentry
- [ ] Application should not crash

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 11.3 Error Boundary

**Test Case:** React errors caught by error boundary

- [ ] Trigger client-side error (e.g., undefined.property)
- [ ] Should show error boundary UI
- [ ] Should not crash entire application
- [ ] Error logged to Sentry

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires intentional client error)

---

## 12. Performance

### 12.1 Lighthouse Score

**Test Case:** Lighthouse performance audit

- [ ] Run Lighthouse on staging URL
- [ ] Performance score: > 90
- [ ] Accessibility score: > 90
- [ ] Best Practices score: > 90
- [ ] SEO score: > 80

**Scores:**
- Performance: _______
- Accessibility: _______
- Best Practices: _______
- SEO: _______

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 12.2 Core Web Vitals

**Test Case:** Core Web Vitals within targets

- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

**Tool:** Vercel Analytics or Chrome DevTools

**Actual:**
- LCP: _______ s
- FID: _______ ms
- CLS: _______

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 12.3 Load Testing

**Test Case:** Application handles 100 concurrent users

- [ ] Use load testing tool (k6, Artillery, etc.)
- [ ] Simulate 100 concurrent users
- [ ] Test for 5 minutes
- [ ] Monitor:
  - [ ] Response times (p95 < 500ms)
  - [ ] Error rate (< 1%)
  - [ ] Database connections (< max pool size)
  - [ ] Memory usage (stable, no leaks)

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires load testing tool)

---

## 13. Monitoring & Observability

### 13.1 Sentry Error Tracking

**Test Case:** Sentry captures errors

- [ ] Trigger test error: `/api/test-error`
- [ ] Go to Sentry dashboard
- [ ] Error should appear within 1 minute
- [ ] Error details include:
  - [ ] Stack trace
  - [ ] Request details (URL, method, headers)
  - [ ] User context (if authenticated)
  - [ ] Breadcrumbs (actions leading to error)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 13.2 Logging

**Test Case:** Structured logs in Vercel

- [ ] Trigger archival
- [ ] Go to Vercel dashboard → Logs
- [ ] Should see structured logs (JSON format)
- [ ] Logs include:
  - [ ] Timestamp
  - [ ] Log level (info, warn, error)
  - [ ] User ID (if applicable)
  - [ ] Message
  - [ ] Additional context

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 13.3 Health Check

**Test Case:** Health check endpoint

- [ ] GET `/api/health`
- [ ] Returns 200 OK if all services healthy
- [ ] Returns 503 if any service down
- [ ] Response includes:
  - [ ] Database status
  - [ ] Redis status (if configured)
  - [ ] Spotify API status
  - [ ] Latency for each service

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

## 14. Mobile Responsiveness

### 14.1 Mobile View (320px)

**Test Case:** Application works on small screens

- [ ] Set viewport to 320px width (iPhone SE)
- [ ] Homepage loads correctly
- [ ] Sign in button visible and clickable
- [ ] Dashboard renders (no horizontal scroll)
- [ ] Charts adapt to small screen
- [ ] Buttons/links large enough to tap (44x44px minimum)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 14.2 Tablet View (768px)

**Test Case:** Application works on tablets

- [ ] Set viewport to 768px width (iPad)
- [ ] Dashboard renders correctly
- [ ] Uses tablet-optimized layout
- [ ] Charts sized appropriately

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 14.3 Touch Interactions

**Test Case:** Touch gestures work

- [ ] Test on actual mobile device (or emulator)
- [ ] Tap buttons (should work)
- [ ] Scroll dashboard (smooth)
- [ ] Pinch to zoom (disabled for UI, works for charts if needed)

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires mobile device)

---

## 15. Browser Compatibility

### 15.1 Chrome (Latest)

- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 15.2 Firefox (Latest)

- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 15.3 Safari (Latest)

- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly
- [ ] OAuth callback works (Safari has strict cookie policies)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 15.4 Edge (Latest)

- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

## 16. Legal & Compliance

### 16.1 Privacy Policy

**Test Case:** Privacy policy accessible

- [ ] Link to privacy policy in footer
- [ ] Privacy policy page loads
- [ ] Content is readable
- [ ] Covers GDPR requirements

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 16.2 Terms of Service

**Test Case:** Terms of service accessible

- [ ] Link to ToS in footer
- [ ] ToS page loads
- [ ] Content is readable

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 16.3 Cookie Consent

**Test Case:** Cookie consent banner

- [ ] First visit shows cookie consent banner
- [ ] Banner explains cookie usage
- [ ] Has "Accept" button
- [ ] Has link to privacy policy
- [ ] Accepting hides banner
- [ ] Consent remembered (doesn't show again)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 16.4 GDPR Data Deletion

**Test Case:** User can delete account

- [ ] Sign in
- [ ] Navigate to account settings
- [ ] Click "Delete Account"
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Account and all data deleted
- [ ] Redirected to homepage
- [ ] Cannot sign back in (data gone)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

## 17. Edge Cases

### 17.1 User with No Recent Plays

**Test Case:** Archival with empty Spotify history

- [ ] Use Spotify account with no recent plays
- [ ] Click "Archive Now"
- [ ] Should succeed (no error)
- [ ] Message: "No new tracks to archive"

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 17.2 User Listens to Same Track 100 Times

**Test Case:** Many plays of same track

- [ ] Listen to same track 100 times on Spotify
- [ ] Trigger archival
- [ ] Should create 100 play events (not deduplicated)
- [ ] Track should appear in top tracks with count = 100

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires manual Spotify listening)

---

### 17.3 Track with Special Characters

**Test Case:** Tracks with emoji, unicode, etc.

- [ ] Archive track with emoji in name (e.g., "Song 💙")
- [ ] Should display correctly in dashboard
- [ ] Should export correctly (CSV escaping)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 17.4 User Revokes App Access

**Test Case:** User removes app authorization

- [ ] Sign in and archive data
- [ ] Go to Spotify account settings
- [ ] Remove app authorization
- [ ] Trigger archival
- [ ] Should fail gracefully
- [ ] Circuit breaker should open
- [ ] User sees message: "Please reconnect your Spotify account"

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (requires manual Spotify revocation)

---

## 18. Deployment Verification

### 18.1 Build Successful

**Test Case:** Production build succeeds

- [ ] Run `npm run build` locally
- [ ] No build errors
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Build output size reasonable (< 5MB)

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 18.2 Environment Variables Set

**Test Case:** All required env vars in Vercel

- [ ] Go to Vercel project settings
- [ ] Navigate to Environment Variables
- [ ] Verify all required vars present:
  - [ ] `DATABASE_URL`
  - [ ] `SPOTIFY_CLIENT_ID`
  - [ ] `SPOTIFY_CLIENT_SECRET`
  - [ ] `NEXTAUTH_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] (Optional) `UPSTASH_REDIS_REST_URL`
  - [ ] (Optional) `UPSTASH_REDIS_REST_TOKEN`
  - [ ] (Optional) `QSTASH_*` variables
  - [ ] (Optional) `SENTRY_*` variables

**Status:** [ ] ✅ [ ] ❌ [ ] ⚠️

---

### 18.3 Domain Configuration

**Test Case:** Custom domain (if applicable)

- [ ] Custom domain configured in Vercel
- [ ] DNS records correct (A/CNAME)
- [ ] HTTPS certificate active
- [ ] Redirects work (www → non-www or vice versa)

**Status:** [ ] ✅ [ ] ❌ [ ] ⏭️ (staging uses vercel.app domain)

---

## Summary

### QA Results

**Total Test Cases:** _______
**Passed:** _______
**Failed:** _______
**Partial/Warnings:** _______
**Skipped:** _______

**Pass Rate:** _______% (target: > 95%)

---

### Critical Issues Found

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

### Non-Critical Issues Found

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | | | |
| 2 | | | |

---

### Sign-Off

**QA Lead:** _______________________
**Date:** _______________________
**Approval:** [ ] ✅ Approved for Production [ ] ❌ Needs Fixes

---

**Next Steps:**
1. Fix all critical issues
2. Re-run affected tests
3. Get final sign-off
4. Proceed to Day 13: Production Deploy Preparation

---

🤖 **Generated with Claude Code**

Co-Authored-By: Claude <noreply@anthropic.com>
