# Token Death Spiral: Visualization & Mitigation Strategy

## Document Purpose
This document visualizes the **Token Expiration Death Spiral** (Insight #1 from Edge Cases Analysis) to ensure correct implementation of the 5-minute proactive refresh buffer.

**Context:** Strategic decision from stakeholder review:
- Fix must be **Just-In-Time (JIT) inside the worker** before Spotify API call
- Most robust approach (handles both scheduled and manual jobs)

---

## The Death Spiral: Timeline Visualization

```
┌────────────────────────────────────────────────────────────────────────┐
│                    THE TOKEN DEATH SPIRAL                               │
│                 (Without Proactive Refresh)                             │
└────────────────────────────────────────────────────────────────────────┘

Time: 2:50 PM
┌─────────────────┐
│ NextAuth DB     │  Token stored: expiresAt = 2:58 PM (8 minutes from now)
└─────────────────┘
         │
         │ [User browses dashboard - all good]
         ▼
Time: 2:55 PM
┌─────────────────┐
│ Cron Trigger    │  Hourly cron fires: "Archive all active users"
└─────────────────┘
         │
         │ SELECT * FROM User WHERE isActive = true
         ▼
┌─────────────────┐
│ QStash Producer │  Batch 50 users, create queue messages
└─────────────────┘
         │
         │ Queue delay = 0ms (User A processed immediately)
         ▼
Time: 2:56 PM
┌─────────────────┐
│ Vercel Worker   │  Cold start: 2 seconds
│  (User A)       │
└─────────────────┘
         │
         │ Load token from DB: expiresAt = 2:58 PM
         │ Current time = 2:56 PM
         │ Check: 2:56 < 2:58 → Token still valid ✓
         ▼
┌─────────────────┐
│ Spotify API     │  GET /v1/me/player/recently-played
│  (First Call)   │  Response: 200 OK, returns 23 songs
└─────────────────┘
         │
         │ Process 23 songs...
         ▼
Time: 2:57 PM (30 seconds elapsed)
┌─────────────────┐
│ Database Write  │  Upsert 23 tracks, 15 artists, 8 albums
│  (Slow Write)   │  Network latency: 1.5 seconds
└─────────────────┘
         │
         ▼
Time: 2:58:30 PM ⚠️ TOKEN EXPIRED 30 SECONDS AGO
┌─────────────────┐
│ Second API Call │  Need to fetch artist metadata for Top Artists widget
└─────────────────┘
         │
         │ Use same token (still in memory): expiresAt = 2:58 PM
         │ ❌ Spotify validates: "Token expired"
         ▼
┌─────────────────┐
│ Response: 401   │  "The access token expired"
└─────────────────┘
         │
         │ Worker crashes (unhandled error)
         │ Job marked as FAILED
         ▼
Time: 2:59 PM
┌─────────────────┐
│ QStash Retry #1 │  Wait 5 seconds, retry job
└─────────────────┘
         │
         │ Load token from DB: expiresAt = 2:58 PM (1 minute ago)
         │ Current time = 2:59 PM
         │ Check: 2:59 < 2:58 → FALSE
         │ ❌ Token expired!
         ▼
┌─────────────────┐
│ NextAuth Auto   │  Attempt refresh token rotation
│  Refresh        │
└─────────────────┘
         │
         │ refreshToken sent to Spotify
         ▼
🎲 FORK IN THE ROAD:

Path A: Spotify Accepts Refresh (80% of cases)
┌─────────────────┐
│ New Token       │  accessToken: new_abc123
│ Received        │  refreshToken: ROTATED_xyz789 ⚠️
│                 │  expiresAt: 3:59 PM
└─────────────────┘
         │
         │ ✅ Job succeeds this time
         │ BUT: Old refreshToken stored in DB (not updated!)
         ▼
Time: 3:55 PM (Next hourly cron)
┌─────────────────┐
│ Next Job Fails  │  Uses OLD refreshToken: xyz789
│                 │  Spotify: "Invalid refresh token"
│                 │  ❌ 400 Bad Request
└─────────────────┘
         │
         ▼
🚨 USER PERMANENTLY BROKEN (requires manual re-auth)


Path B: Spotify Rejects Refresh (20% of cases)
┌─────────────────┐
│ Refresh Token   │  User changed Spotify password yesterday
│ Revoked         │  refreshToken is now INVALID
└─────────────────┘
         │
         │ 400 Bad Request: "Invalid refresh token"
         ▼
┌─────────────────┐
│ QStash Retry #2 │  Wait 10 seconds, retry again
└─────────────────┘
         │
         │ Same invalid refreshToken
         │ Same 400 error
         ▼
┌─────────────────┐
│ QStash Retry #3 │  Wait 20 seconds, retry again
└─────────────────┘
         │
         │ Same invalid refreshToken
         │ Same 400 error
         │ ❌ Max retries exceeded
         ▼
┌─────────────────┐
│ Job Permanently │  User marked as FAILED
│ Failed          │  isActive = true (still attempting!)
└─────────────────┘
         │
         ▼
Time: 4:55 PM, 5:55 PM, 6:55 PM... (Next 10 hourly crons)
┌─────────────────┐
│ Silent Failure  │  Every hour: Job fails with 400
│ Loop            │  User browses dashboard: "Last archived: Yesterday"
│                 │  User thinks: "Must be no new songs today"
│                 │  Reality: Token broken, archival stopped
└─────────────────┘
         │
         ▼
🚨 14 DAYS LATER: USER REALIZES DATA LOST
```

---

## Code-Level Death Spiral: Where The Break Happens

### ❌ BROKEN IMPLEMENTATION (Current Risk)

```typescript
// File: apps/worker/src/archive-user.ts
export async function archiveUser(userId: string) {
  // 1️⃣ Load token from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      accessToken: true,
      refreshToken: true,
      expiresAt: true
    }
  });

  // 2️⃣ Check if token is expired RIGHT NOW
  const isExpired = Date.now() >= (user.expiresAt * 1000);

  if (isExpired) {
    // Try to refresh
    const refreshed = await refreshAccessToken(user.refreshToken);
    user.accessToken = refreshed.accessToken;
    user.expiresAt = refreshed.expiresAt;

    // ⚠️ BUG #1: Did NOT update refreshToken if Spotify rotated it!
    // ⚠️ BUG #2: Did NOT save new tokens to database!
  }

  // 3️⃣ Fetch recently played (First API call)
  const recentlyPlayed = await fetchSpotifyAPI(
    '/v1/me/player/recently-played',
    user.accessToken
  );
  // ✅ Token valid at 2:56 PM, this succeeds

  // 4️⃣ Process songs (slow database writes - 90 seconds)
  for (const item of recentlyPlayed.items) {
    await upsertTrack(item.track);
    await upsertArtists(item.track.artists);
    await createPlayEvent(userId, item.track.id, item.played_at);
  }

  // 5️⃣ Fetch artist metadata (Second API call)
  // ❌ NOW IT'S 2:58:30 PM - TOKEN EXPIRED 30 SECONDS AGO!
  const topArtists = await fetchSpotifyAPI(
    '/v1/me/top/artists?limit=5',
    user.accessToken // ← Using EXPIRED token
  );

  // 💥 CRASH: 401 Unauthorized
  throw new SpotifyAPIError('The access token expired');
}
```

**Why This Breaks:**

1. **Time-of-Check Time-of-Use (TOCTOU) Bug**
   - Check at 2:56 PM: Token valid ✓
   - Use at 2:58:30 PM: Token expired ❌
   - 2.5 minutes elapsed between check and use

2. **Missing Refresh Token Update**
   - Spotify rotates refreshToken on refresh
   - Code doesn't update `user.refreshToken` variable
   - Code doesn't save new refreshToken to database
   - Next job uses OLD refreshToken → 400 error

3. **No Proactive Buffer**
   - Only refreshes if `Date.now() >= expiresAt`
   - Should refresh if `Date.now() >= expiresAt - 5 minutes`

---

### ✅ CORRECT IMPLEMENTATION (The Fix)

```typescript
// File: apps/worker/src/archive-user.ts
export async function archiveUser(userId: string) {
  // 1️⃣ Load token from database
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      accessToken: true,
      refreshToken: true,
      expiresAt: true
    }
  });

  // 2️⃣ Proactive refresh with 5-MINUTE BUFFER
  const BUFFER_SECONDS = 5 * 60; // 300 seconds
  const expirationTime = (user.expiresAt * 1000) - (BUFFER_SECONDS * 1000);
  const needsRefresh = Date.now() >= expirationTime;

  if (needsRefresh) {
    logger.info(`Token expires in <5min for user ${userId}, refreshing proactively`);

    try {
      // Refresh token
      const refreshed = await refreshAccessToken(user.refreshToken);

      // ✅ FIX #1: Update ALL token fields (including refreshToken)
      user.accessToken = refreshed.accessToken;
      user.refreshToken = refreshed.refreshToken; // ← CRITICAL: Spotify may rotate this
      user.expiresAt = refreshed.expiresAt;

      // ✅ FIX #2: Save new tokens to database IMMEDIATELY
      await prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken, // ← CRITICAL: Save rotated token
          expiresAt: refreshed.expiresAt
        }
      });

      logger.info(`Token refreshed for user ${userId}, new expiry: ${new Date(refreshed.expiresAt * 1000).toISOString()}`);
    } catch (refreshError) {
      // Refresh token invalid (user changed password, revoked access, etc.)
      logger.error(`Token refresh failed for user ${userId}:`, refreshError);

      // Mark user as needing re-authentication
      await handleUserFailure(userId, FailureType.AUTH, refreshError.message);

      // Don't proceed with archival
      throw new AuthError(`Token refresh failed: ${refreshError.message}`);
    }
  }

  // 3️⃣ Fetch recently played with FRESH token
  const recentlyPlayed = await fetchSpotifyAPI(
    '/v1/me/player/recently-played?limit=50',
    user.accessToken // ← Now guaranteed valid for 55+ minutes
  );

  // 4️⃣ Process songs (can take 90 seconds - no problem!)
  for (const item of recentlyPlayed.items) {
    await upsertTrack(item.track);
    await upsertArtists(item.track.artists);
    await createPlayEvent(userId, item.track.id, item.played_at);
  }

  // 5️⃣ Fetch artist metadata - token STILL valid (50+ min remaining)
  const topArtists = await fetchSpotifyAPI(
    '/v1/me/top/artists?limit=5',
    user.accessToken // ← Still valid!
  );

  return {
    songsArchived: recentlyPlayed.items.length,
    topArtists: topArtists.items
  };
}
```

**Why This Works:**

1. **5-Minute Safety Buffer**
   - At 2:53 PM: Token expires at 2:58 PM → refresh NOW (5 minutes early)
   - Job can take up to 5 minutes without hitting expiration

2. **Refresh Token Rotation Handled**
   - Captures new refreshToken from Spotify response
   - Saves to database immediately
   - Next job uses correct refreshToken

3. **Database Persistence**
   - New tokens saved BEFORE proceeding with archival
   - If job crashes mid-archival, next retry uses fresh token

4. **Graceful Auth Failure Handling**
   - If refresh fails (user revoked access), job stops cleanly
   - User marked as needing re-authentication
   - Circuit breaker prevents infinite retries

---

## Timeline Comparison: Before vs After Fix

### ❌ WITHOUT FIX (Death Spiral)

```
2:55 PM → Cron starts job
2:56 PM → Check token (valid) ✓
2:57 PM → First API call succeeds ✓
2:58 PM → Token expires ⏰
2:58:30 → Second API call FAILS ❌
2:59 PM → Retry #1 - refreshToken works BUT not saved
3:55 PM → Next job fails (stale refreshToken) ❌
4:55 PM → Next job fails ❌
5:55 PM → Next job fails ❌
...
14 days later → User notices data gap
```

**Result:** 🚨 Permanent failure after first refresh token rotation

---

### ✅ WITH FIX (Resilient System)

```
2:50 PM → Token expires at 2:58 PM (8 min remaining)
2:53 PM → Proactive refresh triggered (5 min before expiration)
2:53:05 → New token received: expiresAt = 3:53 PM ✓
2:53:06 → Saved to database ✓
2:55 PM → Cron starts job
2:56 PM → Check token (valid for 57 more minutes) ✓
2:57 PM → First API call succeeds ✓
2:58:30 PM → Second API call succeeds (token still valid) ✓
2:59 PM → Job completes successfully ✓
3:48 PM → Next job: Token expires at 3:53 PM
3:48 PM → Proactive refresh triggered (5 min before) ✓
...
Infinite loop → Tokens always fresh ✓
```

**Result:** ✅ System self-heals indefinitely

---

## Implementation Checklist

### Story #1: The Collector (Token Management)

- [ ] **Task 1.1:** Add `refreshAccessToken()` helper function
  ```typescript
  async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET!
      })
    });

    if (!response.ok) {
      throw new TokenRefreshError('Refresh token invalid or expired');
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Use new if rotated, else keep old
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in
    };
  }
  ```

- [ ] **Task 1.2:** Add proactive refresh logic to NextAuth callbacks
  ```typescript
  // File: src/app/api/auth/[...nextauth]/route.ts
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // Initial OAuth - store tokens
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }

      // 5-minute buffer check
      const BUFFER_SECONDS = 5 * 60;
      const expirationTime = (token.expiresAt as number) - BUFFER_SECONDS;

      if (Date.now() < expirationTime * 1000) {
        return token; // Still valid, no refresh needed
      }

      // Proactive refresh
      try {
        const refreshed = await refreshAccessToken(token.refreshToken as string);

        return {
          ...token,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken, // CRITICAL: Update if rotated
          expiresAt: refreshed.expiresAt
        };
      } catch (error) {
        // Refresh failed - force re-authentication
        return { ...token, error: 'RefreshAccessTokenError' };
      }
    }
  }
  ```

- [ ] **Task 1.3:** Add JIT refresh in worker (belt-and-suspenders)
  - Add 5-minute buffer check at start of archival job
  - Update database with new tokens before proceeding
  - Handle refresh failures gracefully (mark user as needing re-auth)

- [ ] **Task 1.4:** Add unit tests
  ```typescript
  describe('Token Refresh', () => {
    it('should refresh token 5 minutes before expiration', () => {
      const token = { expiresAt: Math.floor(Date.now() / 1000) + 240 }; // 4 min
      expect(needsRefresh(token)).toBe(true);
    });

    it('should NOT refresh token 6 minutes before expiration', () => {
      const token = { expiresAt: Math.floor(Date.now() / 1000) + 360 }; // 6 min
      expect(needsRefresh(token)).toBe(false);
    });

    it('should update refreshToken if Spotify rotates it', async () => {
      const oldRefreshToken = 'old_xyz';
      const response = { refresh_token: 'new_abc' };

      const result = await refreshAccessToken(oldRefreshToken);
      expect(result.refreshToken).toBe('new_abc');
    });
  });
  ```

---

## Monitoring & Alerts

### Metrics to Track

```typescript
// Prometheus metrics
const tokenRefreshSuccessCounter = new Counter({
  name: 'token_refresh_success_total',
  help: 'Number of successful token refreshes'
});

const tokenRefreshFailureCounter = new Counter({
  name: 'token_refresh_failure_total',
  help: 'Number of failed token refreshes',
  labelNames: ['error_type'] // 'invalid_refresh_token', 'network_error', etc.
});

const tokenExpiryHistogram = new Histogram({
  name: 'token_time_until_expiry_seconds',
  help: 'Distribution of how much time remains before token expiration when job starts',
  buckets: [60, 180, 300, 600, 1800, 3600] // 1min, 3min, 5min, 10min, 30min, 1hour
});
```

### Alerts to Configure

```yaml
- alert: HighTokenRefreshFailureRate
  expr: rate(token_refresh_failure_total[5m]) > 10
  for: 5m
  severity: critical
  annotations:
    summary: "Token refresh failures spiking"
    description: "{{ $value }} token refreshes failing per second"

- alert: TokenExpiringDuringJobs
  expr: histogram_quantile(0.5, token_time_until_expiry_seconds) < 300
  for: 10m
  severity: warning
  annotations:
    summary: "50% of jobs starting with <5min token validity"
    description: "Buffer may be insufficient - consider increasing to 10 minutes"
```

---

## Success Criteria

### ✅ Definition of Done

1. **Zero Token Expiration Errors in Production**
   - Monitor `401 Unauthorized` errors from Spotify API
   - Target: 0 errors due to expired tokens over 30 days

2. **Refresh Token Rotation Handled**
   - Track `token_refresh_success_total` metric
   - Verify database shows updated refreshToken after each refresh

3. **No User Re-Authentication Required (for valid tokens)**
   - Track "Reconnect Spotify" modal display rate
   - Target: <1% of users per month (only for legitimate revocations)

4. **Jobs Never Crash Mid-Execution Due to Token**
   - All archival jobs complete or fail gracefully
   - No unhandled 401 exceptions

---

## Conclusion

The **Token Death Spiral** is a cascading failure mode caused by three compounding issues:

1. **TOCTOU Bug:** Token valid at check time, expired at use time
2. **Missing Rotation Handling:** Refresh token rotates, old token stored
3. **No Proactive Buffer:** Reactive refresh (at expiration) instead of preventative

**The Fix:** Proactive refresh with 5-minute buffer + save rotated tokens immediately

**Implementation Priority:** 🔴 **P0 Launch Blocker** - Must implement before MVP launch

---

*Visualization created based on Edge Cases Analysis (EC-AUTH-001, EC-AUTH-002, EC-AUTH-008) and strategic decision for Just-In-Time worker-side refresh implementation.*
