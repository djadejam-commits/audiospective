# User Flow Test Checklist

**Test Date:** December 5, 2025
**Tester:** Manual testing required (Spotify OAuth)
**Production URL:** https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app

---

## Pre-Test Setup

**Requirements:**
- [ ] Valid Spotify account (Free or Premium)
- [ ] Browser with console open (to catch any errors)
- [ ] Clear browser cache (optional, for clean test)

---

## Test Flow 1: Sign Up & Authentication

### Step 1.1: Homepage Load
**URL:** `https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app/`

**Expected:**
- [ ] Page loads within 2 seconds
- [ ] "Audiospective" heading visible
- [ ] "Your complete Spotify listening history" tagline visible
- [ ] "Sign in with Spotify" button visible
- [ ] No console errors

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

**Screenshot:** (Optional)

---

### Step 1.2: Click "Sign in with Spotify"

**Action:** Click the "Sign in with Spotify" button

**Expected:**
- [ ] Redirects to Spotify OAuth page
- [ ] Shows "Audiospective would like to access your Spotify account"
- [ ] Lists permissions:
  - View your recently played tracks
  - View your email address
- [ ] Shows "Agree" button

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

**Screenshot:** (Optional)

---

### Step 1.3: Authorize Spotify Access

**Action:** Click "Agree" on Spotify OAuth page

**Expected:**
- [ ] Redirects back to Audiospective
- [ ] Shows loading state briefly
- [ ] Redirects to dashboard or profile page
- [ ] No console errors

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

**Screenshot:** (Optional)

---

## Test Flow 2: Dashboard Page

### Step 2.1: Navigate to Dashboard
**URL:** `https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app/dashboard`

**Expected:**
- [ ] Page loads within 2 seconds
- [ ] "Dashboard" heading visible
- [ ] User name displayed in header
- [ ] No console errors (check for /api/top-artists, /api/stats errors)

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

**Console Errors:** _________________

---

### Step 2.2: Check Stats Display

**Expected (if NO data yet):**
- [ ] Message: "No listening history yet"
- [ ] Prompt to trigger manual archival
- [ ] No crashes or 500 errors

**Expected (if data exists):**
- [ ] Total Plays count visible
- [ ] Unique Tracks count visible
- [ ] Unique Artists count visible
- [ ] Top tracks list (if available)
- [ ] Top artists list (if available)
- [ ] All numbers format with commas (e.g., "1,234")

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

### Step 2.3: Check API Calls in Network Tab

**Action:** Open DevTools → Network tab → Reload dashboard

**Expected API Calls:**
- [ ] `/api/stats` - Returns 200 OK (or 401 if session expired)
- [ ] `/api/top-artists?limit=10` - Returns 200 OK (or 401)
- [ ] `/api/top-tracks?limit=10` - Returns 200 OK (or 401)
- [ ] `/api/recent-plays?limit=50` - Returns 200 OK (or 401)

**No 500 errors should appear!**

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

## Test Flow 3: Profile Page

### Step 3.1: Navigate to Profile
**URL:** `https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app/me`

**Expected:**
- [ ] Page loads within 2 seconds
- [ ] "My Profile" heading visible
- [ ] User profile image or initials visible
- [ ] User email displayed
- [ ] No console errors

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

### Step 3.2: Check Stats Grid

**Expected (if NO data):**
- [ ] Shows 0 for all stats gracefully
- [ ] No crashes

**Expected (if data exists):**
- [ ] Total Plays: Shows number with .toLocaleString()
- [ ] Unique Tracks: Shows number
- [ ] Unique Artists: Shows number
- [ ] Listening Hours: Shows estimate
- [ ] No "Cannot read properties of undefined" errors

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

**Console Errors:** _________________

---

### Step 3.3: Check Streaks Section

**Expected:**
- [ ] "Listening Streaks" section visible
- [ ] Current Streak displays (0+ days)
- [ ] Longest Streak displays
- [ ] Total Active Days displays
- [ ] No errors

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

### Step 3.4: Check Diversity Score

**Expected:**
- [ ] "Listening Diversity" section visible
- [ ] Diversity score (0-100) displays
- [ ] Progress bar shows correctly
- [ ] Badge displays (e.g., "Newcomer", "Explorer")
- [ ] Interpretation text displays

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

## Test Flow 4: Manual Archival

### Step 4.1: Trigger Manual Archival
**URL:** `https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app/test`

**Expected:**
- [ ] "Test Archival" page loads
- [ ] Shows current user info
- [ ] Has "Run Archival Now" button
- [ ] No errors

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

### Step 4.2: Click "Run Archival Now"

**Action:** Click the archival button

**Expected:**
- [ ] Button shows loading state
- [ ] Fetches recent plays from Spotify
- [ ] Stores plays in database
- [ ] Shows success message
- [ ] Displays number of tracks archived
- [ ] No errors

**Actual Result:** _________________

**Tracks Archived:** _________________

**Status:** ☐ Pass ☐ Fail

---

### Step 4.3: Verify Data Appears in Dashboard

**Action:** Navigate back to `/dashboard`

**Expected:**
- [ ] Dashboard now shows data (if Step 4.2 archived tracks)
- [ ] Total plays increases
- [ ] Top tracks appear
- [ ] Top artists appear
- [ ] Stats update correctly

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

## Test Flow 5: Export Functionality

### Step 5.1: Navigate to Export
**URL:** Dashboard → Click "Export" button (if visible)
OR directly: `https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app/api/export`

**Expected:**
- [ ] Download starts automatically
- [ ] File downloads as `audiospective-export-[date].json` or `.csv`
- [ ] File contains user's play history
- [ ] No errors

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

### Step 5.2: Verify Export Contents

**Action:** Open downloaded file

**Expected (JSON format):**
```json
{
  "user": { ... },
  "playHistory": [ ... ],
  "exportedAt": "..."
}
```

**Expected (CSV format):**
```
Track,Artist,Album,Played At
...
```

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

## Test Flow 6: Share Functionality

### Step 6.1: Create Shareable Report
**URL:** Dashboard → Click "Share" button (if implemented)

**Expected:**
- [ ] Opens share dialog
- [ ] Allows selecting date range (7d, 30d, all)
- [ ] Generates shareable link
- [ ] Shows preview of report

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

### Step 6.2: Access Shared Report

**Action:** Copy share link → Open in incognito/private window

**Expected:**
- [ ] Shared report loads without authentication
- [ ] Shows public stats (no sensitive data)
- [ ] Displays top tracks, artists
- [ ] Has nice visual design
- [ ] No "Not authenticated" errors

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

## Test Flow 7: Sign Out

### Step 7.1: Sign Out from Profile Page

**Action:** Click "Sign Out" button on `/me` page

**Expected:**
- [ ] Confirms sign out (optional)
- [ ] Redirects to homepage
- [ ] Session cleared
- [ ] Dashboard/Profile pages now require auth

**Actual Result:** _________________

**Status:** ☐ Pass ☐ Fail

---

## Critical Error Monitoring

### Console Errors to Watch For

**❌ CRITICAL (Should NOT appear):**
- [ ] `Failed to load resource: the server responded with a status of 500`
- [ ] `TypeError: Cannot read properties of undefined (reading 'toLocaleString')`
- [ ] `/api/top-artists` - 500 error
- [ ] `/api/stats` - 500 error

**✅ ACCEPTABLE (Expected for unauthenticated):**
- [ ] 401 Unauthorized (when not signed in)
- [ ] 403 Forbidden (for protected resources)

**Actual Console Errors:** _________________

---

## Performance Metrics

### Page Load Times (Target: <2 seconds)

- Homepage: _________ seconds
- Dashboard: _________ seconds
- Profile: _________ seconds

### API Response Times (Target: <500ms)

- `/api/health`: _________ ms
- `/api/stats`: _________ ms
- `/api/top-artists`: _________ ms
- `/api/recent-plays`: _________ ms

---

## Overall Test Results

### Summary

**Total Tests:** 28 checkpoints

**Passed:** _____ / 28

**Failed:** _____ / 28

**Blocked:** _____ / 28 (if authentication failed, etc.)

---

### Critical Issues Found

1. _______________________________
2. _______________________________
3. _______________________________

---

### Non-Critical Issues Found

1. _______________________________
2. _______________________________
3. _______________________________

---

### Notes / Observations

_______________________________
_______________________________
_______________________________

---

## Sign-off

**Tester:** _______________________________

**Date:** December 5, 2025

**Overall Status:** ☐ Pass ☐ Fail ☐ Pass with Minor Issues

**Production Ready:** ☐ Yes ☐ No

---

## Next Actions (if issues found)

- [ ] Create GitHub issues for bugs
- [ ] Update incident report
- [ ] Deploy hotfixes if critical
- [ ] Update monitoring dashboards

---

🤖 **Generated with Claude Code**

Co-Authored-By: Claude <noreply@anthropic.com>
