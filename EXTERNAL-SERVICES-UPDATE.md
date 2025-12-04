# External Services Update Guide

**Updated:** December 4, 2025
**App Name Changed:** "Spotify Time Machine" → **"Audiospective"**
**Priority:** Critical items must be done before launch

---

## Summary

After renaming your app to **Audiospective**, here's what needs updating in external services:

### ✅ Codebase (COMPLETE)
- All 199 occurrences renamed to "Audiospective"
- package.json updated
- All documentation updated

### 🚨 MUST UPDATE (Before Launch)

**Only 1 service requires updating to avoid conflicts:**

| Service | Must Update? | Reason |
|---------|-------------|---------|
| **Spotify Developer App** | **YES** | Users will see the name during OAuth login |

### ✅ OPTIONAL (No Conflicts)

**These services can keep old names or be renamed at your leisure:**

| Service | Must Update? | Reason |
|---------|-------------|---------|
| Vercel Project | No | Internal only, won't cause conflicts |
| Neon Database | No | Internal only, won't cause conflicts |
| Upstash Redis | No | Internal only, won't cause conflicts |
| Upstash QStash | No | Internal only, won't cause conflicts |
| Sentry Project | No | Internal only, won't cause conflicts |
| UptimeRobot | No | Internal only, won't cause conflicts |

---

## Critical: Spotify Developer App (MUST UPDATE)

### Why This Matters

When users sign in to your app, they see **Spotify's OAuth consent screen** which displays:
```
[Your App Name] wants to access your Spotify account

This app will be able to:
- View your Spotify account data
- View your recently played tracks
...

[AUTHORIZE] [CANCEL]
```

**If your app name contains "Spotify"**, this could:
- ❌ Confuse users (looks like official Spotify app)
- ❌ Violate Spotify's trademark policy
- ❌ Risk app suspension by Spotify
- ❌ Potential legal issues

### How to Update (Required Before Launch)

**When:** Now (before you add the production app)

**Option 1: Create New App (Recommended)**

Since you haven't created the production Spotify app yet:

1. [ ] Go to https://developer.spotify.com/dashboard
2. [ ] Click "Create App"
3. [ ] Use new name:
   - **App Name:** `Audiospective` (or `Audiospective - Production`)
   - **App Description:** `Archive your Spotify listening history automatically`
   - **Website:** Leave blank (add after deploying)
   - **Redirect URIs:** Add after deploying to Vercel
4. [ ] Save Client ID and Client Secret
5. [ ] Use these in your Vercel environment variables

**Done!** You never created a production app with the old name, so nothing to update.

---

**Option 2: Rename Existing App (If Already Created)**

If you already created a Spotify app with the old name:

1. [ ] Go to https://developer.spotify.com/dashboard
2. [ ] Select your app
3. [ ] Click "Settings"
4. [ ] Click "Edit Settings"
5. [ ] Change:
   - **App Name:** `Audiospective` (or `Audiospective - Production`)
   - **App Description:** Update if mentions old name
6. [ ] Click "Save"

**Note:** Client ID and Secret remain the same, no need to update environment variables.

---

## Optional: Other Services (No Conflicts)

### Vercel Project Name

**Current Impact:** Internal only, not visible to users

**Should I update?**
- ❌ **No need** - Vercel project name doesn't affect:
  - User-facing app name
  - Domain/URL
  - Functionality

**If you want to update anyway:**
1. Go to Vercel project settings
2. Navigate to "General"
3. Change "Project Name" to `audiospective`
4. Click "Save"

**Recommendation:** ✅ Keep as-is or rename at leisure

---

### Neon Database Project Name

**Current Impact:** Internal only, not visible to users

**Should I update?**
- ❌ **No need** - Database project name doesn't affect:
  - Connection string (stays the same)
  - Application functionality
  - User experience

**If you want to update anyway:**
- **Note:** Neon doesn't allow renaming projects
- You would need to:
  1. Create new project with new name
  2. Migrate data
  3. Update DATABASE_URL
  - **Not recommended** - too much work for cosmetic change

**Recommendation:** ✅ Keep as-is (avoid unnecessary migration)

---

### Upstash Redis Database Name

**Current Impact:** Internal only, not visible to users

**Should I update?**
- ❌ **No need** - Redis database name doesn't affect:
  - Connection URL (stays the same)
  - Rate limiting functionality
  - User experience

**If you want to update anyway:**
1. Go to Upstash console
2. Select your Redis database
3. Click "Settings" → "Rename Database"
4. Enter new name: `audiospective-production`
5. Click "Save"
- **Note:** URL and token remain the same, no env var changes needed

**Recommendation:** ✅ Keep as-is or rename at leisure

---

### Upstash QStash Schedule Name

**Current Impact:** Internal only, not visible to users

**Should I update?**
- ❌ **No need** - Schedule name doesn't affect:
  - QStash functionality
  - Background job execution
  - User experience

**If you want to update anyway:**
1. Go to Upstash QStash console
2. Select your schedule
3. Click "Edit"
4. Change name: `hourly-archive-audiospective`
5. Click "Save"

**Recommendation:** ✅ Keep as-is or rename at leisure

---

### Sentry Project Name

**Current Impact:** Internal only, not visible to users

**Should I update?**
- ❌ **No need** - Sentry project name doesn't affect:
  - Error monitoring
  - DSN (stays the same)
  - User experience

**If you want to update anyway:**
1. Go to Sentry project settings
2. Navigate to "General Settings"
3. Change "Project Name" to `audiospective-production`
4. Update `SENTRY_PROJECT` environment variable in Vercel
5. Click "Save"
- **Note:** Requires updating 1 environment variable

**Recommendation:** ✅ Keep as-is (avoid env var update)

---

### UptimeRobot Monitor Name

**Current Impact:** Internal only, not visible to users

**Should I update?**
- ❌ **No need** - Monitor name doesn't affect:
  - Uptime monitoring
  - Alerts
  - User experience

**If you want to update anyway:**
1. Go to UptimeRobot dashboard
2. Select your monitor
3. Click "Edit"
4. Change "Friendly Name" to `Audiospective - Health Check`
5. Click "Save"

**Recommendation:** ✅ Keep as-is or rename at leisure

---

## Master Checklist

### Before Launch (Required)

- [x] Rename codebase to "Audiospective" ✅ **COMPLETE**
- [ ] Create/rename Spotify Developer app to "Audiospective" 🚨 **REQUIRED**

### After Launch (Optional)

- [ ] Rename Vercel project (optional)
- [ ] Rename Upstash Redis database (optional)
- [ ] Rename Upstash QStash schedule (optional)
- [ ] Rename Sentry project (optional)
- [ ] Rename UptimeRobot monitor (optional)

**Total Required Actions:** 1 (Spotify Developer app)

---

## Risk Assessment

### If You Don't Update Spotify App Name

**Risks:**
- 🔴 **High:** Trademark violation
- 🔴 **High:** App suspension by Spotify
- 🟡 **Medium:** User confusion
- 🟡 **Medium:** Potential legal issues

**Impact:** Could prevent launch or force takedown

**Recommendation:** ✅ **UPDATE BEFORE LAUNCH**

---

### If You Don't Update Other Services

**Risks:**
- 🟢 **None:** No trademark violations
- 🟢 **None:** No functionality issues
- 🟢 **None:** Not user-facing

**Impact:** Zero (purely cosmetic internal names)

**Recommendation:** ✅ **Keep as-is** (save time)

---

## Conclusion

**Summary:**
- ✅ **Codebase:** Already renamed to "Audiospective"
- 🚨 **Spotify Developer:** MUST update before launch (user-facing)
- ✅ **Everything else:** Optional, no conflicts

**Time Required:**
- Critical updates: 5 minutes (Spotify app name)
- Optional updates: 15-30 minutes (if you want to rename everything)

**Recommendation:**
1. Update Spotify Developer app name to "Audiospective" (required)
2. Leave everything else as-is (no conflicts)
3. Optionally rename other services later if desired (cosmetic only)

---

## Next Steps

1. **Now:** Update Spotify Developer app name (see instructions above)
2. **Then:** Continue with PRE-LAUNCH-ACTION-CHECKLIST.md
3. **Launch:** Proceed with Day 14 deployment

---

**Document Version:** 1.0
**Last Updated:** December 4, 2025

---

🤖 **Generated with Claude Code**

Co-Authored-By: Claude <noreply@anthropic.com>
