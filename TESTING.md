# Testing Guide - Spotify Time Machine

## Current Status

All core functionality is **COMPLETE** and ready for testing:

✅ **Phase 1:** Authentication & Token Management
✅ **Phase 2:** Background Polling & Queue System
❌ **Phase 3:** Business Logic (Founding Member cap, etc.)
❌ **Phase 4:** Dashboard UI

---

## What You Can Test RIGHT NOW (Without Redis/QStash)

### 1. Manual Archive Test

I've created a test endpoint that works **without any external services**.

**Steps:**

1. Start the dev server:
```bash
npm run dev
```

2. Sign in with Spotify:
   - Go to http://localhost:3001
   - Click sign in
   - Authorize with Spotify

3. Test the archive system:
   - Go to http://localhost:3001/test
   - Click **"Run Archive Test"**
   - This will:
     - Fetch your recently played tracks from Spotify (up to 50)
     - Store them in the database
     - Show you the results

4. Check the results:
   - You'll see how many songs were archived
   - Your recent plays will be displayed
   - Stats like total play events, last polled time, etc.

### 2. Alternative: API Endpoint

You can also call the test endpoint directly:

```bash
# Make sure you're signed in first, then:
curl http://localhost:3001/api/test-archive \
  -H "Cookie: $(cat cookies.txt)"
```

### 3. Verify Database

Check that data was stored:

```bash
# Open SQLite database
sqlite3 prisma/dev.db

# Check tables
SELECT COUNT(*) FROM play_events;
SELECT COUNT(*) FROM tracks;
SELECT COUNT(*) FROM artists;
SELECT COUNT(*) FROM albums;

# See recent plays
SELECT
  pe.played_at,
  t.name as track_name,
  (SELECT GROUP_CONCAT(a.name, ', ')
   FROM artists a
   JOIN _TrackArtists ta ON ta.A = a.id
   WHERE ta.B = t.id) as artists
FROM play_events pe
JOIN tracks t ON pe.track_id = t.id
ORDER BY pe.played_at DESC
LIMIT 10;
```

---

## What Works Without Redis/QStash

✅ **Manual archival** - Works perfectly via `/test` page
✅ **Token refresh** - Proactive 5-minute buffer
✅ **Metadata storage** - Normalized schema (artists, albums, tracks)
✅ **Deduplication** - Prevents duplicate play events
✅ **Circuit breaker** - Failure tracking in database

⚠️ **Idempotency** - Disabled (will re-archive every time you click the button)
⚠️ **Rate limiting** - No tracking (uses database circuit breaker only)
❌ **Automatic cron** - Requires QStash
❌ **Batch processing** - Requires QStash

---

## When to Set Up Redis/QStash

You should set up external services when:

1. **You want automatic hourly polling**
   - QStash triggers `/api/cron/archive` every hour
   - Processes all active users in batches

2. **You want idempotency protection**
   - Prevents re-processing the same hour
   - Useful for production to avoid wasted API calls

3. **You want rate limit tracking**
   - Redis tracks Spotify 429 responses per user
   - Helps with monitoring and debugging

4. **You're ready to deploy to production**
   - Vercel deployment requires these services

---

## Next Steps (Choose Your Path)

### Option A: Test Locally First (Recommended)

1. ✅ Test manual archival at `/test` page
2. ✅ Verify data in database
3. ✅ Play some songs on Spotify, then re-run test
4. ✅ Confirm new songs appear
5. Then proceed to Option B or C

### Option B: Set Up Services for Full System

1. **Create Upstash Redis** (for idempotency)
   - Go to https://upstash.com
   - Create Redis database
   - Copy URL and token to `.env`

2. **Create Upstash QStash** (for cron jobs)
   - Go to https://upstash.com/qstash
   - Create QStash instance
   - Copy token and signing keys to `.env`
   - Configure cron schedule (hourly)

3. **Test full system**
   - Cron will automatically trigger every hour
   - Check logs to verify batches are processing

### Option C: Build Dashboard UI First

1. Create dashboard to display:
   - User's listening history timeline
   - Top tracks, artists, albums
   - Stats and visualizations

2. Benefits:
   - Visual feedback for manual testing
   - Better user experience
   - Can still use manual archival

---

## Environment Variables Summary

```bash
# Required for basic functionality
DATABASE_URL="file:./dev.db"
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
AUTH_SECRET=...
NEXTAUTH_URL=http://127.0.0.1:3001

# Optional (for manual testing without Redis/QStash)
# These are checked before use, so system works without them

# Required for automatic polling
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
VERCEL_URL=http://127.0.0.1:3001
CRON_SECRET=...
```

---

## Troubleshooting

### "Not authenticated" error
- Make sure you're signed in via Spotify OAuth
- Check that session is active

### "Token expired" error
- The 5-minute buffer should prevent this
- If it happens, check `tokenExpiresAt` in database
- System will auto-refresh on next request

### No tracks found
- Make sure you've played music on Spotify recently
- Spotify only returns ~50 most recent tracks
- Try playing a song, then running test again

### Duplicate play events
- This is prevented by database constraint
- If you see duplicates, there's a bug in deduplication logic

---

## Performance Benchmarks (Expected)

- **Manual archive (1 user):** ~2-5 seconds
- **50 tracks upserted:** ~3-8 seconds
- **Database size (1000 users, 6 months):** ~100-200 MB
- **API calls per user:** 1 per hour

---

## Questions?

Check these files for implementation details:
- `src/lib/archive-user.ts` - Core archival logic
- `src/lib/metadata-upsert.ts` - Database operations
- `src/lib/spotify-api.ts` - Spotify API client
- `src/app/api/test-archive/route.ts` - Manual test endpoint
- `PROGRESS.md` - High-level status
- `docs/phase-1-completion.md` - Phase 1 details
- `docs/phase-2-completion.md` - Phase 2 details
