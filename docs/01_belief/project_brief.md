# Project Brief: Audiospective

> **Version:** 2.0
> **Status:** In Development (Transitioning MAP → ACTION)
> **Last Updated:** 2025-11-26

---

## Executive Summary

**Audiospective** is an "Always-on Wrapped" web application that provides Spotify users with instant insights into their listening habits while continuously archiving their play history in the background to prevent data loss.

The product solves a critical gap in Spotify's ecosystem: users can only access their annual "Wrapped" summary once a year, and historical listening data older than 50 tracks is inaccessible through Spotify's standard interface. This creates anxiety about losing personal music history and eliminates opportunities for year-round self-discovery.

**Target Market:** Spotify power users, "Quantified Self" enthusiasts, and data archivists who value digital ownership and deep listening insights.

**Key Value Proposition:** Instant gratification through real-time "Current Vibe" analytics combined with silent, continuous archival of listening history—delivering both immediate insight and long-term data ownership.

---

## Problem Statement

### Current State & Pain Points

Spotify users face a fundamental tension between the ephemeral nature of streaming music and their desire to understand and preserve their listening journey.

**The 50-Track Wall:** Spotify's "Recently Played" endpoint only retains the last 50 songs. For an active listener playing 30-50 songs per day, this represents less than 48 hours of history. Beyond that window, personal listening data simply vanishes.

**The Race Condition:** The 50-track buffer creates a time-sensitive race condition. For short songs (2-minute punk tracks), 50 songs = only 100 minutes of history. Any archival solution must poll faster than the buffer turnover rate, making **automated, frequent polling a hard requirement**, not a feature.

**Visual Concept - The Sliding Window:**
_[Diagram would show: A continuous stream of songs flowing left-to-right, with a 50-track "window" box. As new songs enter from the right, old songs fall off the left edge into a void labeled "Inaccessible." Our polling cursor appears every 60 minutes to "catch" songs before they fall off.]_

**The Annual Wrapped Problem:** Users receive rich analytics exactly once per year in December. For the remaining 364 days, there is no way to answer simple questions like:
- "What was I listening to in March?"
- "How have my tastes evolved this quarter?"
- "When did I start getting into [genre/artist]?"

**The Silent Data Gating:** Spotify *has* your complete listening history—that's how they generate Wrapped each December. But they gatekeep access to it, only opening the vault once a year. For the other 364 days, your musical memories are locked away. There's no API, no export, no way to access what's rightfully yours.

### Impact (Quantified)

- **50+ songs/day** = Active listener threshold (data lost after ~24 hours)
- **~18,000 songs/year** = Typical power user listening volume (only 50 tracks retained at any given time = **99.7% data loss**)
- **365 days** = Gap between Wrapped summaries (zero historical insights available during this period)
- **100 minutes** = Worst-case buffer window (short songs × 50 tracks)

### Why Existing Solutions Fall Short

**Last.fm** - While it offers native Spotify integration, the connection is notoriously unreliable—it disconnects frequently without warning, and users often don't realize scrobbling has stopped until weeks of history are lost. The UX feels like a legacy database focused on "scrobbling" (data entry) rather than "remembering" (experience). **Our approach:** Server-side API polling works on ALL playback devices with zero user intervention, and we alert users immediately if archival stops.

**Stats for Spotify** - Read-only analytics of current state; doesn't archive history or protect against data loss. No time-travel capability.

**Spotify's Native Tools** - Wrapped (annual only), Recently Played (50-track limit), no middle ground exists. No API to access historical data beyond 50 tracks.

### Urgency & Importance

**Every day without an archival solution is a day of irreversible data loss.** For users who care about their digital footprint, this creates a pervasive anxiety—similar to the feeling of losing years of photos because you forgot to back up your phone.

The "Quantified Self" movement is growing, and music listening is one of the most intimate datasets people generate. Yet Spotify treats this data as disposable beyond 50 tracks. This is a solvable problem with immediate, tangible value.

---

## Proposed Solution

### Core Concept & Approach

**Audiospective** is a Next.js web application that operates on a **dual-mode architecture:**

1. **Instant Gratification Layer** (Frontend) - When users log in, they immediately see their "Current Vibe" dashboard pulling live data directly from Spotify's API (top artists, current listening trends, real-time stats).

2. **Silent Archivist Layer** (Background) - An automated cron job runs hourly, triggering a queue system that polls every user's recent listening history and archives it to a PostgreSQL database before it falls out of the 50-track window.

**System Architecture Overview:**
_[Diagram would show two parallel streams:_
- _Top Stream: User → Next.js Frontend → Spotify API (live data) → Dashboard (immediate display)_
- _Bottom Stream: Cron Trigger → Queue (fan-out) → Workers (per-user) → Spotify API (recent plays) → PostgreSQL → Timeline (historical data)_
- _The streams converge at the Dashboard, showing both live stats and archived timeline.]_

**The "Empty Box" Solution:** Most archival apps are boring on Day 1 because they have no data. Our Instant Gratification Layer shows live Spotify stats immediately, ensuring user retention while the archive builds in the background.

### Key Differentiators from Existing Solutions

| Feature | Audiospective | Last.fm | Stats for Spotify |
|---------|---------------------|---------|-------------------|
| **Zero-setup archival** | ✅ Automatic after OAuth | ❌ Requires per-device scrobbling | ❌ No archival |
| **Device-agnostic** | ✅ Server-side API polling | ❌ Client-side only | ✅ API-based |
| **Instant dashboard** | ✅ Live Spotify data | ❌ Delayed sync | ✅ Real-time stats |
| **Historical timeline** | ✅ Database archive | ✅ Long-term history | ❌ Current state only |
| **Data gap honesty** | ✅ Visualizes downtime | ❌ Silent gaps | N/A |

### Why This Solution Will Succeed

**1. Solves the "Set it and forget it" problem** - OAuth once, archival forever. No per-device setup, no manual intervention.

**2. Addresses the race condition** - Hourly polling ensures we capture data faster than typical buffer turnover. _MVP constraint: Accepts 10-minute data loss window for extreme edge cases (1-minute songs × 50 tracks = 50-min buffer vs. 60-min polling). Post-MVP could implement adaptive polling for high-frequency listeners._

**3. Hybrid data strategy** - Live API for instant gratification (dopamine hit), database for long-term ownership (asset preservation).

**4. Honest UX** - When tokens expire or users revoke access, we visualize the "Data Gap" rather than pretending the data exists. This builds trust.

**5. Scalable cloud architecture** - Uses managed background workers (Upstash QStash) to avoid serverless function timeouts, making this deployable on Vercel without complex infrastructure. This fan-out pattern handles thousands of concurrent users without manual scaling.

### High-Level Vision

**MVP:** A user connects their Spotify account and sees:
- **Dashboard:** Top 5 artists (live API), play history timeline (database)
- **Background:** Hourly archival running automatically
- **Repair Flow:** If token breaks, show "Reconnect Spotify" modal

**Post-MVP:**
- Shareable "Instagram Story" PNGs (generated via `@vercel/og`)
- Custom date range queries ("Show me March 2024")
- Genre evolution graphs
- Export to CSV/JSON (true data ownership)

---

## Target Users

### Primary User Segment: "The Music Archivist"

**Persona Card:**
_[Visual would show:_
- _Photo: 30-something with headphones at a coffee shop / working at desk_
- _Name: "Alex, 32, Software Engineer"_
- _Quote: "I want to own my data, not rent access to it"_
- _Frustration Meter: 9/10 when realizing they lost 6 months of listening history_
- _Tech Comfort: High | Music Passion: Very High]_

**Profile:**
- Active Spotify user (30+ songs/day, 10,000+ songs/year)
- Self-identifies as a "music person"—friends ask them for recommendations
- Likely maintains other personal data archives (photos in multiple cloud services, personal finance tracking, journaling apps)
- Age-agnostic (18-50+), skews toward knowledge workers and creatives

**Current Behaviors & Workflows:**
- Already uses Spotify daily, often has it playing while working
- Checks Spotify Wrapped immediately when it drops each December
- May have tried Last.fm in the past but found setup friction too high or forgot about it
- Takes screenshots of interesting Spotify stats to share with friends

**Specific Needs & Pain Points:**
- **"What was I listening to when X happened?"** - Wants to correlate music with life events (breakups, trips, project launches)
- **Anxiety about data loss** - Knows their listening history is disappearing but feels powerless to stop it
- **Year-round curiosity** - Doesn't want to wait until December to see patterns in their listening
- **Digital ownership** - Wants to feel like their data belongs to them, not just Spotify

**Goals They're Trying to Achieve:**
- Preserve personal music history as a form of life journaling
- Discover patterns in their own behavior ("I listen to metal when stressed")
- Share interesting insights with friends ("Look, I listened to 200 hours of Radiohead this year")
- Build a permanent archive they can export and own forever

**Estimated Market Size:** ~5-10% of active Spotify users (500M users × 5% = 25M potential users globally)

---

### Secondary User Segment: "The Wrapped Addict"

**Persona Card:**
_[Visual would show:_
- _Photo: 20-something scrolling Instagram Stories, posting content_
- _Name: "Jamie, 24, Marketing Coordinator"_
- _Quote: "If I can't share it on Stories, did it even happen?"_
- _Excitement Meter: 10/10 every December when Wrapped drops_
- _Tech Comfort: Medium | Social Media Engagement: Very High]_

**Profile:**
- Casual to moderate Spotify user (10-30 songs/day)
- Lives for Spotify Wrapped each December, shares it on all social platforms
- Interested in self-quantification but doesn't maintain detailed tracking systems
- Age: Primarily 18-30, social media native

**Current Behaviors & Workflows:**
- Uses Spotify regularly but doesn't think deeply about music data until Wrapped drops
- Actively engages with Instagram/TikTok trends around music sharing
- Enjoys personality quizzes, astrology, and other self-discovery content

**Specific Needs & Pain Points:**
- **"I want Wrapped all year"** - Genuinely enjoys the dopamine hit of seeing their stats
- **Shareable content** - Wants pretty graphics to post on Instagram Stories
- **Low effort** - Won't sign up if it requires complex setup or maintenance

**Goals They're Trying to Achieve:**
- Get more shareable music stats content for social media
- Feel like they're "winning" at Spotify (leaderboard mentality)
- Participate in music-related social trends year-round

**Estimated Market Size:** ~15-20% of active Spotify users (75M-100M potential users globally)

---

### Anti-Persona: "The Privacy Paranoid"

**Who they are:** Users deeply concerned about data collection, prefer minimal app permissions, don't trust third-party OAuth

**Why they're not our target:** The product fundamentally requires OAuth access to Spotify data and continuous background polling. Trying to serve this segment would compromise the core value proposition.

**How to address:** Clear privacy policy, option to delete all data, transparency about what data is collected and why.

---

## Goals & Success Metrics

> **Philosophy Note:** This is an "insurance product" (peace of mind) not an "engagement product" (daily usage). Success means the Silent Archivist works so well that users can "set it and forget it." Metrics reflect passive retention and archival health, not dashboard engagement.

### Business Objectives

- **Launch MVP within 3 months** - Get core archival functionality live to start preventing data loss for early users
- **Achieve 1,000 active archival users within 6 months of launch** - Validate product-market fit with "Music Archivist" segment
- **Maintain 60%+ 30-day passive retention rate** - Users' archival continues running (even if they don't visit dashboard)
- **Build sustainable infrastructure** - Achieve <$0.10 cost per user per month to stay viable on free/minimal tier
- **Generate user testimonials** - Document stories of users recovering "lost" listening history or discovering patterns years later

### User Success Metrics

- **Time to first value < 30 seconds** - User sees their "Current Vibe" dashboard immediately after OAuth
- **First archive within 1 hour** - Background job successfully saves user's first batch of listening history
- **Zero system-caused data loss** - No gaps in archival due to our infrastructure failures (token expiration gaps are expected and visualized)
- **Export functionality usage** - Track how many users download their data (validates "ownership" value prop)
- **"Data Gap" transparency** - Users understand when/why archival stopped (measured via reduced support tickets about missing data)

### Key Performance Indicators (KPIs)

#### Primary Metrics (Archival Health)

- **Active Archival Users (AAU):** Users with valid Spotify token and successful cron job execution in last 7 days
  - **Target:** 70%+ of total registered users (measures "set it and forget it" success)
  - **Why this matters:** This is true product success—silent, automatic, reliable

- **Archival Success Rate:** Percentage of hourly cron jobs that successfully poll and save data per user
  - **Target:** 99%+ (allows for occasional Spotify API downtime)
  - **Alert threshold:** <95% triggers investigation

- **30-Day Passive Retention:** Percentage of users still actively archiving after 30 days (regardless of dashboard visits)
  - **Target:** 60%+ (high bar validating sticky utility)
  - **Failure mode:** Users revoked OAuth or abandoned product

#### Secondary Metrics (User Engagement - Optional)

- **Monthly Active Dashboard Users (MAU):** Users who check dashboard at least once per month
  - **Target:** 40%+ (curiosity-driven check-ins)
  - **Note:** Low MAU with high AAU = ideal state (archival working silently)

- **Dashboard Load Time:** P95 latency for dashboard page load
  - **Target:** <2 seconds (instant gratification requires speed)

#### Infrastructure Sustainability Metrics (Critical)

- **Cost Per User Per Month (CPUPM):** Total infrastructure cost (database, serverless, queue) ÷ active archival users
  - **Target:** <$0.10/user/month to remain viable on free tier
  - **Break-even threshold:** Know exact user count where free tier ends

- **Database Storage Efficiency:** Average storage per 1,000 archived songs
  - **Target:** <50KB per 1,000 songs (achievable through artist/album normalization)
  - **Schema optimization:** Store artist/album metadata once, reference by ID in PlayHistory table

- **Database Growth Rate:** Average songs archived per user per week
  - **Expected range:** 100-350 songs/user/week (validates active listening behavior)
  - **Cost projection:** Use this to forecast when database tier upgrades are needed

#### Post-MVP Metrics (Future)

- **Viral Coefficient:** When Instagram Story sharing launches, track referrals per sharing user
  - **Target:** 0.3+ (each sharing user brings 0.3 new signups = exponential growth)
  - **Segment:** "Wrapped Addict" persona drives this metric

---

### North Star Metric

**Active Archival Users (AAU) with 30+ days of continuous history**

This single metric captures:
- Product works reliably (technical success)
- Users trust it enough to keep OAuth connected (retention)
- Database is growing (value accumulation)
- Infrastructure is sustainable (cost doesn't scale linearly)

---

## MVP Scope

> **MVP Philosophy:** The MVP must prove the core value proposition: "Set it and forget it" archival that works silently and reliably. Everything else is noise.

### Core Features (Must Have)

#### 1. **Authentication & Onboarding** (Story #1: Foundation & Auth)
- **OAuth with Spotify** - User clicks "Login with Spotify," grants permissions, and is redirected to dashboard
- **Initial Backfill** - System immediately fetches last 50 songs from Spotify API to seed the database
- **User Record Creation** - User, Account, and Session records created in PostgreSQL via Prisma
- **Success Criteria:** User clicks login, sees their name/profile image, and the database has their user record

**Why this is must-have:** Without auth and backfill, there's no product. The backfill solves the "Empty Box" problem on Day 1.

---

#### 2. **Dashboard - "Current Vibe" (Live Data)** (Story #2: Vibe Check)
- **Top 5 Artists** - Fetch and display `/me/top/artists` from Spotify API (live data, not database)
- **Basic Styling** - Clean, readable UI using Tailwind CSS
- **Responsive Design** - Works on mobile and desktop
- **Success Criteria:** User sees their Top 5 Artists displayed attractively within 2 seconds of page load

**Why this is must-have:** This is the "Instant Gratification Layer." Users need to see value immediately, even while the archive builds.

---

#### 3. **Dashboard - "Timeline" (Historical Data)** (Story #2: Vibe Check)
- **Play History Display** - Show songs from `PlayHistory` table in reverse chronological order
- **Basic Song Card** - Track name, artist, album art thumbnail, "played at" timestamp
- **Simple Pagination or Infinite Scroll** - Handle displaying hundreds of songs
- **Success Criteria:** User can see the last 50+ songs they've listened to (from backfill and subsequent archival)

**Why this is must-have:** This proves the database is working and data is being preserved. Visual proof of the archive.

---

#### 4. **Background Archival - "The Silent Archivist"** (Story #3: The Archivist)
- **Cron Job Setup** - Vercel Cron or Upstash QStash triggers every hour
- **Queue Fan-Out** - One trigger creates individual queue jobs for each active user
- **Worker Logic** - Each worker:
  - Fetches user's Spotify access token from database
  - Calls `/me/player/recently-played?after={lastPolledAt}` endpoint
  - Saves new songs to `PlayHistory` table (deduplication via `@@unique([userId, playedAt])`)
  - Updates `user.lastPolledAt` timestamp
  - Handles token expiry (see Token Repair Flow below)
- **Success Criteria:** User plays a song on Spotify, waits 1 hour, sees it appear in their Timeline

**Silent Archivist Flow - Sequence Diagram:**
_[Diagram would show:_
1. _Vercel Cron (every hour) → Triggers /api/cron/trigger-archival_
2. _/api/cron/trigger-archival → Queries DB for all active users (isActive=true)_
3. _For each user → QStash.publishJSON(/api/queue/archive-user, {userId})_
4. _QStash → Invokes /api/queue/archive-user (one per user)_
5. _/api/queue/archive-user → Fetches user's access_token from DB_
6. _Worker → Spotify API: GET /me/player/recently-played?after={lastPolledAt}_
7. _Spotify API → Returns array of recently played tracks_
8. _Worker → Saves to PlayHistory table (deduplication via unique constraint)_
9. _Worker → Updates user.lastPolledAt = now()_
10. _If 401 Unauthorized → Attempt token refresh (see Repair Protocol)]_

**Why this is must-have:** This is the entire product. Without reliable background archival, we're just another Spotify stats dashboard.

---

#### 5. **Token Repair Flow - "The Repair Protocol"**

**Critical OAuth Token Handling:**

| Token State | Cause | Solution | User Action Required? |
|-------------|-------|----------|----------------------|
| **Expired Access Token** | Normal expiry (1 hour TTL) | Auto-refresh via Refresh Token | ❌ No (silent) |
| **Invalid Refresh Token** | User revoked app access | Re-authenticate via OAuth | ✅ Yes (Repair Modal) |

**Implementation Logic:**
1. **Worker gets 401 from Spotify API** → Attempt token refresh using `refresh_token` from Account table
2. **Refresh succeeds** → Update `access_token` and `expires_at` in database, retry archival
3. **Refresh fails (400/401)** → Set `user.isActive = false`, log the failure
4. **Next dashboard visit** → If `isActive = false`, show "Reconnect Spotify" modal
5. **User re-authenticates** → Set `isActive = true`, archival resumes from `lastPolledAt` cursor

**Data Gap Visualization:**
- Timeline shows visual indicator: "No data available from [date] to [date] - Connection was disconnected"
- Honest UX: We show the gap, not hide it

**Success Criteria:** User revokes Spotify access, archival stops gracefully, user visits app 2 days later, sees modal, reconnects, archival resumes with visible 2-day gap

**Why this is must-have:** Without proper token refresh logic, every user would see false alarms every hour. Without repair flow, we silently fail and lose user trust.

---

#### 6. **Data Export - "True Ownership"**
- **Simple JSON Download** - Button on dashboard: "Download My Data"
- **API Endpoint** - `GET /api/export` returns user's complete `PlayHistory` as JSON
- **Format:**
  ```json
  {
    "user": { "name": "...", "email": "..." },
    "exported_at": "2025-11-26T10:00:00Z",
    "total_tracks": 1547,
    "history": [
      {
        "track_name": "...",
        "artist_name": "...",
        "album_name": "...",
        "played_at": "2025-11-25T14:32:00Z"
      }
    ]
  }
  ```
- **Success Criteria:** User clicks "Download My Data," receives JSON file with their complete listening history

**Why this is must-have:** Without export, we've moved user data from Spotify's walled garden to *our* walled garden. Export validates the "ownership" value proposition for the Music Archivist persona. **Implementation time: ~2 hours.**

---

### Out of Scope for MVP

The following features are valuable but NOT required to validate the core value proposition:

- ❌ **Instagram Story / Social Sharing** - Requires `@vercel/og`, image generation, complex UX (Post-MVP for "Wrapped Addict" persona)
- ❌ **Custom Date Range Queries** - "Show me March 2024" filtering (nice-to-have, not core archival proof)
- ❌ **Genre Evolution Graphs** - Requires genre classification, charting library, complex analytics
- ❌ **Advanced Export Formats** - CSV, PDF, or formatted reports (JSON export is Must-Have, fancy formats are Post-MVP)
- ❌ **User Settings Page** - Account deletion, email preferences, timezone settings (can handle via support for MVP)
- ❌ **Advanced Analytics** - "Most played song," "listening streaks," leaderboards (engagement features contradict "set it and forget it")
- ❌ **Multi-language Support** - Start with English only
- ❌ **Onboarding Tutorial** - If OAuth and dashboard aren't self-explanatory, we have a UX problem
- ❌ **Email Notifications** - "Your weekly summary" emails would violate passive retention philosophy

---

### MVP Success Criteria

The MVP is successful when:

1. ✅ **A user can authenticate via Spotify OAuth** and see their profile
2. ✅ **The dashboard loads in <2 seconds** showing Top 5 Artists (live) + Timeline (database)
3. ✅ **The hourly cron job runs** and successfully archives new songs for 99%+ of users
4. ✅ **Token refresh works automatically** without user intervention for expired access tokens
5. ✅ **Token repair modal appears** only when refresh token is revoked, not on normal expiry
6. ✅ **Users can download their data** as JSON, validating ownership promise
7. ✅ **The database grows** at an average rate of 100-350 songs/user/week
8. ✅ **Infrastructure costs remain <$0.10/user/month** on free or minimal tier
9. ✅ **10 beta users report** "I forgot about the app and came back to see 2 months of history saved"

**Final validation:** The product works so well that users don't *need* to think about it, but they *can* export their data anytime they want.

---

### Mapping to Developer Stories

| Story | Scope | Deliverable |
|-------|-------|-------------|
| **Story #1: Foundation & Auth** | Must-Have Feature #1 | User authentication + database setup + initial backfill |
| **Story #2: Vibe Check** | Must-Have Features #2 & #3 | Dashboard showing live Top Artists + historical Timeline |
| **Story #3: Archivist** | Must-Have Features #4, #5, #6 | Hourly cron + worker logic + token repair flow + JSON export |

**Timeline estimate:** 3 months for one full-stack developer working part-time (10-15 hrs/week) or 1 month full-time.

---

## Post-MVP Vision

> **Guiding Principle:** Post-MVP features should serve one of two goals: (1) Deepen retention for "Music Archivists" or (2) Enable virality for "Wrapped Addicts." Avoid feature bloat that serves neither persona.

### Phase 2 Features (Next 6 Months After MVP Launch)

**Roadmap Timeline Visualization:**
_[Gantt chart would show:_
- _Month 1-3: MVP Development (all hands on core features)_
- _Month 4-6: Parallel tracks begin:_
  - _Track A (Retention): Date range queries → Advanced export → Insights_
  - _Track B (Virality): Instagram sharing → Mini-Wrapped emails → Playlist generator_
- _Month 7-12: Technical spikes (Apple Music API investigation) + Scale optimization_
- _Year 2: Premium tier launch + Cross-platform (if technically viable)]_

---

#### For "Music Archivist" Persona (Retention & Utility)

**1. Custom Date Range Queries**
- **Feature:** "Show me March 2024" filtering on Timeline
- **Why:** Enables life journaling use case ("What was I listening to during my trip to Japan?")
- **Implementation:** Add date picker UI + Prisma query with date filters
- **Effort:** 1-2 weeks

**2. Advanced Export Formats**
- **Feature:** Download data as CSV (for Excel analysis) or formatted PDF report
- **Why:** Power users want to analyze data in their own tools
- **Implementation:** CSV serialization + PDF generation via @vercel/og
- **Effort:** 1 week

**3. Artist/Album/Genre Insights**
- **Feature:** "Your Top 10 Artists of All Time" (based on database, not Spotify API)
- **Why:** Validates the archive has accumulated enough data to show patterns
- **Implementation:** Aggregate queries + simple charts
- **Effort:** 2-3 weeks

**4. Listening Pattern Detection**
- **Feature:** "You listen to metal when stressed" (correlate genre with time-of-day/day-of-week)
- **Why:** Self-discovery through data
- **Implementation:** Basic ML or heuristics + genre classification
- **Effort:** 3-4 weeks (complex)

---

#### For "Wrapped Addict" Persona (Virality & Growth)

**1. Instagram Story Sharing**
- **Feature:** Generate shareable PNG graphics via @vercel/og
- **Why:** Drives acquisition through social proof
- **Implementation:** Image templates + dynamic data injection + share modal
- **Effort:** 2-3 weeks
- **Viral Coefficient Target:** 0.3+ (each sharing user brings 0.3 new signups)

**2. Monthly "Mini-Wrapped" Emails**
- **Feature:** Optional monthly email with "Your Top 5 Artists This Month"
- **Why:** Re-engages passive users, creates sharing moments
- **Caution:** Must be opt-in to preserve "set it and forget it" philosophy
- **Effort:** 1-2 weeks

**3. Playlist Generator**
- **Feature:** "Create a Spotify playlist from your top 50 songs this month"
- **Why:** Closes the loop back to Spotify, creates utility + shareability
- **Implementation:** Use Spotify API to create playlists programmatically
- **Effort:** 1 week

---

### Long-Term Vision (Year 2+)

**"The Music Memory Bank"**

In 2-3 years, Audiospective becomes the definitive personal music archive platform:

**1. Cross-Platform Expansion (Contingent on Technical Validation)**
- **Phase 2 Technical Spike:** Investigate Apple Music Kit API capabilities for historical data access
- **Goal:** Support for Apple Music, YouTube Music, Tidal (multi-service archival)
- **Unified timeline** across all streaming platforms
- **Market expansion:** 3x TAM by supporting non-Spotify users
- **Risk:** Apple Music API is restrictive; this feature is contingent on API availability

**2. Social Features (Carefully Scoped)**
- Friend connections: "Compare your music taste with friends"
- Public profiles (opt-in): Share your music journey
- **Caution:** Avoid becoming a social network; focus on data sharing, not social graph

**3. AI-Powered Journaling**
- **Feature:** "On this day in 2023, you discovered [artist]"
- **Feature:** Auto-generate music-based life timeline
- **Why:** Emotional resonance increases perceived value

**4. Premium Tier (Monetization)**

> **Critical Principle:** We NEVER hold user data hostage. Free users keep their data forever and can export anytime. Premium charges for interface convenience and compute power, not data access.

| Tier | Storage | Visual Timeline Access | Export | Analytics | Price |
|------|---------|------------------------|--------|-----------|-------|
| **Free** | ✅ Unlimited archival (forever) | 🔒 Last 1 year interactive timeline | ✅ Full JSON export (all history) | ❌ Basic only | $0 |
| **Premium** | ✅ Unlimited archival (forever) | ✅ Full 10-year interactive timeline | ✅ JSON + CSV + PDF | ✅ Advanced pattern detection | $5/mo |
| **Enterprise** | ✅ Unlimited archival (forever) | ✅ Unlimited timeline + API access | ✅ All formats + bulk export | ✅ Custom dashboards | Custom |

**What Premium buys:**
- ✅ Interface to explore 10+ years of data visually
- ✅ Compute power to run complex analytics queries
- ✅ Advanced features (pattern detection, genre evolution)
- ✅ Priority support and faster export processing

**What Premium does NOT buy:**
- ❌ Your data (you always own it, even on free tier)
- ❌ Archival service (free users are archived forever)
- ❌ Export capability (JSON export always free)

**Why this works:** We charge for convenience and features, not data ownership. This preserves our brand promise while creating sustainable revenue.

**5. API for Developers**
- Let third-party devs build on top of user's music data (with permission)
- **Example use cases:** Music recommendation engines, mood tracking apps, productivity correlations

---

### Expansion Opportunities

**Adjacent Markets:**
- **Podcast listening history** - Same archival concept, different content type
- **Gaming history** - Steam/PlayStation play history archival
- **Reading history** - Kindle/Goodreads integration

**Geographic Expansion:**
- Localize to Spanish, French, German, Japanese
- Target markets where Spotify is growing (India, Brazil)

**B2B Pivot Potential:**
- Music journalist tools (track industry trends via aggregated listening data)
- Playlist curator analytics (understand listener behavior)
- Record label A&R tools (discover emerging artists through listening patterns)

---

### What We Will NOT Build (Anti-Roadmap)

To protect the product vision, we commit to **never** building:

- ❌ **In-app music playback** - We are not competing with Spotify, we complement it
- ❌ **Music recommendations** - Spotify's algorithm is better; we focus on preservation, not discovery
- ❌ **Social feed/timeline** - We are not a social network
- ❌ **Gamification** - No "streaks," "badges," or "levels" that create engagement addiction
- ❌ **Ads** - Monetize via premium tier, not attention extraction
- ❌ **Data deletion for free users** - We NEVER hold data hostage or delete archived history

---

### Success Metrics for Post-MVP Phases

**Phase 2 Success:**
- 10,000+ active archival users
- 40%+ adoption of Instagram Story sharing feature (among users who visit dashboard monthly)
- Viral coefficient reaches 0.3+
- Maintain <$0.15 CPUPM with increased feature complexity

**Year 2 Success:**
- 100,000+ active archival users
- Premium tier conversion rate: 5-10%
- Cross-platform support launched (if Apple Music API is viable)
- Featured in major tech press (TechCrunch, The Verge)

**North Star remains unchanged:** Active Archival Users with continuous history.

---

## Technical Considerations

> **Note:** These are architectural decisions informed by MVP constraints. The choices prioritize speed-to-market, cost efficiency, and proven reliability over cutting-edge technology.

### Platform Requirements

**Target Platforms:**
- **Web application** (desktop + mobile responsive)
- Accessible via modern browsers (Chrome, Firefox, Safari, Edge)
- No native mobile apps for MVP (web-first approach reduces development complexity)

**Browser/OS Support:**
- **Desktop:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS Safari 14+, Chrome Mobile 90+
- No Internet Explorer support (end-of-life)

**Performance Requirements:**
- **Dashboard load time:** <2 seconds (P95)
- **API response time:** <500ms for timeline queries
- **Cron job execution:** <10 seconds per user for archival worker
- **Database query latency:** <100ms for most-recent-50-songs query

---

### Technology Stack

#### Frontend
- **Framework:** Next.js 14 (App Router)
  - **Why:** Server components reduce client-side JavaScript, built-in API routes, excellent Vercel integration
  - **Alternative considered:** Remix (rejected due to smaller ecosystem)

- **Styling:** Tailwind CSS
  - **Why:** Rapid prototyping, small bundle size, utility-first approach
  - **Alternative considered:** Styled-components (rejected due to runtime cost)

- **UI Components:** Headless UI (for modals, dropdowns)
  - **Why:** Accessibility built-in, small footprint, pairs well with Tailwind

#### Backend

- **API Framework:** Next.js API Routes
  - **Why:** Collocated with frontend, serverless-ready, TypeScript support
  - **Alternative considered:** Separate Express.js API (rejected for MVP simplicity)

- **Authentication:** NextAuth.js v5
  - **Why:** Built-in Spotify OAuth provider, session management, TypeScript support
  - **Alternative considered:** Auth0 (rejected due to cost at scale)

- **Database:** PostgreSQL (via Neon or Supabase)
  - **Why:** Relational data model fits our schema, excellent Prisma support, generous free tier
  - **Alternative considered:** MongoDB (rejected - relational queries needed for timeline/analytics)

- **ORM:** Prisma
  - **Why:** Type-safe queries, schema migrations, excellent DX
  - **Alternative considered:** Drizzle (too new, smaller ecosystem)

#### Infrastructure

- **Hosting:** Vercel
  - **Why:** Zero-config Next.js deployment, serverless functions, generous free tier
  - **Limitations:** 10-second function timeout (solved via QStash fan-out)

- **Queue/Cron:** Upstash QStash
  - **Why:** Fan-out pattern avoids Vercel timeout limits, HTTP-based (no long-lived connections)
  - **Alternative considered:** BullMQ + Redis (rejected - requires persistent server)

- **Database Hosting:** Neon (preferred) or Supabase
  - **Why Neon:** Serverless Postgres, auto-scaling, generous free tier (512MB storage)
  - **Why Supabase (fallback):** More features (auth, storage), but higher complexity

---

### Database Schema Design (CRITICAL)

> **Storage Optimization:** Normalizing the schema reduces storage by 5-6x, allowing the free tier to support 5x more users.

**The Storage Problem:**

Denormalized schema (storing full track/artist/album data in every PlayHistory row):
- Row size: ~250 bytes
- 10M rows = 2.5 GB ❌ (exceeds 512MB free tier at ~200 users)

**The Solution: Normalize Artist/Album/Track Data**

Store metadata ONCE in dedicated tables, reference by ID in PlayHistory:

```prisma
// Track metadata (stored once per unique song)
model Track {
  id         String  @id // Spotify Track ID
  name       String
  artistId   String
  artist     Artist  @relation(fields: [artistId], references: [id])
  albumId    String?
  album      Album?  @relation(fields: [albumId], references: [id])

  playHistory PlayHistory[]
}

// Artist metadata (stored once per artist)
model Artist {
  id     String  @id // Spotify Artist ID
  name   String
  image  String?
  tracks Track[]
}

// Album metadata (stored once per album)
model Album {
  id     String  @id // Spotify Album ID
  name   String
  image  String?
  tracks Track[]
}

// Play history (lean - only IDs and timestamp)
model PlayHistory {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  trackId  String   // Reference to Track table
  track    Track    @relation(fields: [trackId], references: [id])

  playedAt DateTime

  @@unique([userId, playedAt])
  @@index([userId, playedAt])
  @@index([trackId]) // For track popularity queries
}
```

**Storage Impact:**
- Normalized PlayHistory row: ~40 bytes (IDs + timestamp)
- 10M rows = 400MB ✅ (fits in 512MB free tier)
- **Result:** Can support 1,000+ users instead of 200

**Entity Relationship Diagram (ERD):**
_[Diagram would show:_
- _User (1) ←→ (Many) PlayHistory_
- _PlayHistory (Many) ←→ (1) Track_
- _Track (Many) ←→ (1) Artist_
- _Track (Many) ←→ (1) Album_
- _Key insight: Track/Artist/Album data stored ONCE, referenced by ID in PlayHistory]_

---

### Architecture Considerations

#### Repository Structure
- **Monorepo:** Single Next.js project containing frontend + API routes
- **Directory structure:**
  ```
  /src
    /app              # Next.js 14 App Router pages
    /components       # React components
    /lib              # Utility functions, Prisma client
    /api              # API route handlers (cron, queue, export)
  /prisma
    schema.prisma     # Database schema
  ```

#### Service Architecture
- **Serverless functions** for all API routes (no long-lived server)
- **Database connection pooling** via Prisma (prevents connection exhaustion)
- **Stateless workers** - Each queue job is independent, no shared state

#### The "Thundering Herd" Problem & Mitigation

**Problem:** 1,000 users → 1,000 simultaneous webhook invocations at 2:00 PM:
- Risk: Hit Vercel concurrent function limits
- Risk: Burst traffic triggers Spotify application rate limits

**Solution: Batching + Jitter**

```typescript
// Spread load over 10 minutes instead of 1 second spike
const batchSize = 100; // Process 100 users at a time
const batchDelayMs = 5000; // 5-second pause between batches

for (let i = 0; i < users.length; i += batchSize) {
  const batch = users.slice(i, i + batchSize);

  for (const user of batch) {
    // Add random 0-60 second jitter to each job
    const jitter = Math.floor(Math.random() * 60);

    await qstash.publishJSON('/api/queue/archive-user',
      { userId: user.id },
      { delay: jitter } // QStash delay parameter
    );
  }

  // Pause between batches
  if (i + batchSize < users.length) {
    await new Promise(resolve => setTimeout(resolve, batchDelayMs));
  }
}
```

**Result:** Load distributed over ~10 minutes, preventing concurrent function spikes

#### Integration Requirements

**Spotify API:**
- **OAuth 2.0 flow** (authorization code grant)
- **Required scopes:**
  - `user-read-recently-played` - Access to 50-track recent history
  - `user-top-read` - Access to top artists/tracks
  - `user-read-email` - User email for account creation
- **Rate limits:**
  - User-level: 180 requests/minute per user
  - Application-level: Monitor for burst limits
  - Our usage: 1 request/hour/user (well within user limits, jitter prevents app-level bursts)
- **Token refresh strategy:** Automatic refresh via NextAuth.js

**Third-party Services:**
- **Upstash QStash** - Queue management, cron triggering
- **Vercel Analytics** (optional) - Page view tracking, performance monitoring

#### Security & Compliance

**Data Security:**
- **Encryption at rest:** PostgreSQL database encrypted (default on Neon/Supabase)
- **Encryption in transit:** HTTPS only, enforced via Vercel
- **Secrets management:** Environment variables via Vercel dashboard
- **No API keys in code:** All sensitive credentials in `.env.local` (gitignored)

**OAuth Security:**
- **State parameter** - CSRF protection in OAuth flow
- **Token storage** - Refresh tokens encrypted in database (NextAuth.js handles this)
- **Token rotation** - Access tokens refreshed automatically, refresh tokens rotated on use

**User Data Privacy:**
- **GDPR compliance:** User can delete account + all data via support (MVP), self-service (Post-MVP)
- **Data retention:** Unlimited for active users, deleted on account deletion
- **Third-party sharing:** Zero - we never share user data with third parties
- **Cookie policy:** Session cookies only (no tracking/advertising cookies)

**Vulnerability Protection:**
- **SQL injection:** Prevented via Prisma parameterized queries
- **XSS:** React escapes output by default
- **CSRF:** NextAuth.js includes CSRF tokens
- **Rate limiting:** Implemented on export endpoint (prevent abuse)

---

### Technical Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Spotify API changes** | High | Medium | Monitor Spotify developer changelog, build abstraction layer around API calls |
| **Vercel free tier limits exceeded** | High | Low (for MVP) | Monitor usage, have migration plan to Railway/Fly.io |
| **Database storage costs spiral** | High | Medium | **CRITICAL:** Normalized schema reduces storage 5x, monitor via Neon dashboard |
| **Thundering herd (concurrent spike)** | High | High | **CRITICAL:** Batching + jitter spreads load over 10 minutes |
| **QStash downtime** | Medium | Low | Implement retry logic, fallback to manual trigger endpoint |
| **Token refresh failures** | Medium | High | Robust error handling, user-facing repair modal, logging for debugging |

---

### Development Environment

**Required Tools:**
- Node.js 18+ (LTS)
- pnpm (package manager - faster than npm)
- PostgreSQL client (for local development via Docker)
- Git (version control)
- VS Code (recommended) with Prisma extension

**Local Development Setup:**
1. Clone repository
2. Run `pnpm install`
3. Set up local Postgres via Docker: `docker-compose up -d`
4. Copy `.env.example` to `.env.local`, add Spotify OAuth credentials
5. Run `pnpm prisma migrate dev` to set up database
6. Run `pnpm dev` to start Next.js dev server
7. Visit `localhost:3000` to see app

**Testing Strategy (MVP):**
- **Manual testing** for MVP (no automated tests initially to ship faster)
- **Post-MVP:** Add Playwright for E2E tests, Vitest for unit tests
- **Critical path testing:** Auth flow, archival job, token refresh, export

---

### Deployment Pipeline

**CI/CD:**
- **Git workflow:** Main branch deploys to production automatically via Vercel
- **Preview deployments:** Every PR gets a preview URL
- **Environment variables:** Managed in Vercel dashboard (separate prod/preview)

**Database Migrations:**
- **Strategy:** Prisma Migrate (schema changes tracked in Git)
- **Deployment:** Run migrations manually via Vercel CLI before deploying code changes
- **Rollback:** Git revert + reverse migration if needed

**Monitoring & Observability:**
- **Error tracking:** Vercel logs (MVP), Sentry (Post-MVP)
- **Performance monitoring:** Vercel Analytics
- **Database metrics:** Neon/Supabase dashboard (connection count, query latency, **storage usage**)
- **Cron job success rate:** Custom logging to database (`JobLog` table - Post-MVP)

---

## Constraints & Assumptions

> **Purpose:** Explicitly state limitations and assumptions to set realistic expectations and identify risks early.

### Constraints

#### Budget Constraints
- **MVP Budget:** $0 (free tiers only)
  - Vercel: Free tier (100GB bandwidth, serverless functions)
  - Neon: Free tier (512MB storage, 3 compute hours/day)
  - Upstash QStash: Free tier (500 messages/day)
  - **Break-even threshold:** ~200-500 users before needing paid tier
  - **Mitigation:** Normalized schema extends free tier runway

- **Post-MVP Budget:** <$50/month until 1,000+ users
  - Neon Pro: $19/month (3GB storage)
  - Vercel Pro: $20/month (1TB bandwidth, better functions)
  - Upstash Pro: $10/month (10K messages/day)

#### Timeline Constraints
- **MVP Delivery:** 3 months (part-time) or 1 month (full-time)
- **Launch Target:** Ship MVP before attempting any marketing/growth
- **No hard deadline:** Quality over speed (better to ship late than ship broken)

#### Resource Constraints
- **Team Size:** 1 full-stack developer (solo founder)
- **Time Availability:** 10-15 hours/week (part-time) or 40 hours/week (full-time)
- **Skill Requirements:**
  - Must know: TypeScript, React, Next.js, PostgreSQL
  - Nice to have: Prisma, OAuth, serverless architecture
  - Can learn: QStash, NextAuth.js (good documentation available)

#### Technical Constraints

**Spotify API Limitations:**
- **50-track window:** Cannot access history beyond last 50 songs
- **No historical data:** API doesn't provide pre-connection listening history
- **Rate limits:** 180 requests/min per user (not a constraint for our 1 req/hour usage)
- **Token expiry:** Access tokens expire in 1 hour (requires refresh logic)

**Spotify API Compliance (CRITICAL):**
- **Terms of Service Risk:** Spotify ToS Section IV prohibits "creating a database of metadata" that competes with them
- **Compliance Strategy:**
  - **User-owned cache framing:** Data is strictly siloed per user (no cross-user aggregation)
  - **No competing features:** No in-app playback, no recommendation engine, no features that replace Spotify
  - **User control:** Users can export and delete their data at any time
  - **Legal review required:** Have attorney review Spotify Developer ToS (Section IV) before launch
  - **Transparent positioning:** Market as "personal archive" not "Spotify alternative"

**Vercel Limitations:**
- **Function timeout:** 10 seconds max (solved via QStash fan-out for cron, requires pagination for export)
- **Cold starts:** 1-2 second latency on first request (acceptable for MVP)
- **Concurrent functions:** Limited on free tier (solved via batching + jitter)

**Export Timeout Constraint (CRITICAL):**
- **Problem:** Users with 50K+ songs cannot export in single request (>10 second timeout)
- **Solution (MVP):** Paginated export - `/api/export?page=1&limit=10000` (multiple files)
- **Solution (Post-MVP):** Background job + email download link (best UX)
- **Implementation:** Must paginate or stream to avoid Vercel timeout

**Database Limitations:**
- **Free tier storage:** 512MB (supports ~1,000 users with normalized schema)
- **Connection limits:** Must use connection pooling (Prisma handles this)
- **Query performance:** No full-text search on free tier (use basic LIKE queries for MVP)

**Browser Support Constraints:**
- **No IE11:** Modern browsers only (reduces dev complexity)
- **Mobile web only:** No native apps for MVP (reduces platform complexity)

---

### Key Assumptions

#### User Assumptions

**Assumption 1: Users Will Grant OAuth Permissions**
- **Assumption:** "Music Archivists" will trust us with Spotify OAuth access
- **Risk:** Privacy-concerned users may reject OAuth
- **Validation:** Anti-persona ("Privacy Paranoid") explicitly excludes this segment
- **Mitigation:** Clear privacy policy, transparent data usage, export always available

**Assumption 2: Users Will Tolerate 1-Hour Polling Delay**
- **Assumption:** Users accept seeing new songs in timeline 1 hour after listening (not real-time)
- **Risk:** Users expect instant updates
- **Validation:** "Set it and forget it" philosophy means users don't actively monitor timeline
- **Mitigation:** Set expectations during onboarding ("Checks every hour")

**Assumption 3: "Data Ownership" Resonates as Value Prop**
- **Assumption:** Users care about owning their data vs. Spotify's gatekeeping
- **Risk:** Most users don't think about data ownership
- **Validation:** Target "Quantified Self" enthusiasts who DO care about data
- **Mitigation:** Test messaging in MVP landing page, A/B test value props

**Assumption 4: Users Have Active Spotify Accounts**
- **Assumption:** Target users are current Spotify subscribers (Free or Premium)
- **Risk:** Focusing only on Spotify limits TAM
- **Validation:** Spotify has 500M+ users globally (sufficient TAM for MVP)
- **Mitigation:** Post-MVP can expand to Apple Music, YouTube Music

---

#### Technical Assumptions

**Assumption 5: Spotify API Remains Stable**
- **Assumption:** `/me/player/recently-played` endpoint won't be deprecated or significantly changed
- **Risk:** Spotify changes API without warning (has happened before)
- **Validation:** This is a public, documented endpoint used by many apps
- **Mitigation:** Build abstraction layer around Spotify API calls, monitor developer changelog

**Assumption 6: Normalized Schema Handles 10K+ Users**
- **Assumption:** Database can handle 10K users × 10K songs/year = 100M rows without performance degradation
- **Risk:** Query latency increases with table size
- **Validation:** PostgreSQL handles 100M+ rows with proper indexing
- **Mitigation:** Indexes on `[userId, playedAt]` and `[trackId]`, partition table if needed (Post-MVP)

**Assumption 7: QStash Delay Parameter Works Reliably**
- **Assumption:** QStash's `delay` parameter accurately spreads load over time
- **Risk:** All delayed jobs fire simultaneously due to QStash bug
- **Validation:** QStash is production-ready, used by thousands of apps
- **Mitigation:** Monitor concurrent function metrics, have manual fallback trigger

**Assumption 8: Free Tiers Remain Available**
- **Assumption:** Vercel, Neon, and Upstash won't eliminate free tiers
- **Risk:** Vendors change pricing, eliminate free tier
- **Validation:** Free tiers are marketing tools for these companies
- **Mitigation:** Architecture is portable (can migrate to Railway, Fly.io, PlanetScale if needed)

---

#### Market Assumptions

**Assumption 9: "Always-on Wrapped" Positioning is Unique**
- **Assumption:** No major competitor offers continuous Spotify archival + instant dashboard
- **Risk:** Spotify launches official archival feature
- **Validation:** Spotify has no business incentive to give users data ownership
- **Mitigation:** We can pivot to multi-platform (Spotify + Apple Music) if needed
- **Compliance note:** Our "user-owned cache" model doesn't compete with Spotify's core business

**Assumption 10: 5-10% of Spotify Users Care About Archival**
- **Assumption:** 25M-50M users globally would use this product (5-10% of 500M Spotify users)
- **Risk:** Actual TAM is much smaller (<1%)
- **Validation:** Last.fm has millions of users despite poor UX (proves demand exists)
- **Mitigation:** Start with niche (Quantified Self enthusiasts), expand messaging if needed

**Assumption 11: Premium Tier Will Convert at 5-10%**
- **Assumption:** 5-10% of free users will pay $5/month for unlimited timeline + analytics
- **Risk:** Users expect everything free, conversion is <1%
- **Validation:** Standard SaaS freemium conversion rates are 2-5%
- **Mitigation:** Free tier is generous enough to retain users even without conversion

---

### Assumptions That Could Break the Product

**Critical Assumption #1: Spotify Doesn't Block Our App**
- **What happens if wrong:** Spotify revokes our OAuth app credentials for ToS violation
- **Likelihood:** Medium (depends on how strictly they enforce "database creation" clause)
- **Impact:** Fatal (entire product breaks)
- **Mitigation:**
  - **CRITICAL:** Strictly silo data per user (no aggregation across users)
  - No competing features (playback, recommendations)
  - Legal review of Spotify Developer ToS before launch
  - Frame as "personal cache" not "service database"
  - Be prepared to pivot to Apple Music if blocked

**Critical Assumption #2: Database Storage Costs Stay Linear**
- **What happens if wrong:** Storage costs grow faster than revenue
- **Likelihood:** Low (normalized schema reduces storage 5x)
- **Impact:** High (unit economics become unsustainable)
- **Mitigation:** **CRITICAL:** Normalized schema, monitor CPUPM closely, have paid tier ready

**Critical Assumption #3: Export Feature Doesn't Timeout**
- **What happens if wrong:** Users with large datasets cannot export (10s Vercel timeout)
- **Likelihood:** High (power users will have 50K+ songs eventually)
- **Impact:** Medium (breaks "ownership" promise for power users)
- **Mitigation:** **CRITICAL:** Implement paginated export for MVP, background job export for Post-MVP

---

### Validation Plan

**Pre-Launch Validation:**
1. **Landing page test** - Gauge interest via email signup (target: 100 signups before building)
2. **Tech prototype** - Build auth + single user archival to validate Spotify API assumptions
3. **Storage test** - Simulate 10K users' data to validate normalized schema storage estimates
4. **Legal review** - Attorney reviews Spotify Developer ToS for compliance

**Post-Launch Validation:**
1. **Beta cohort** - Launch to 10 users, monitor for 30 days
2. **Metrics tracking** - Validate assumptions about AAU, retention, CPUPM
3. **User interviews** - Talk to 5 users to validate value prop resonance
4. **Export stress test** - Test with user who has 50K+ songs to validate pagination

**Assumption Review Cadence:**
- Review assumptions every 2 weeks during MVP development
- Update this document when assumptions are invalidated
- Track which assumptions were wrong in retrospective

---

### Risk Matrix (Probability vs. Impact)

**Prioritization Framework:**

_[2x2 matrix would show:_

**🔴 High Impact + High Probability (Address Immediately):**
- _Thundering herd concurrent spike (solved: batching + jitter)_
- _Database storage costs spiral (solved: normalized schema)_
- _Export timeout on large datasets (needs: pagination implementation)_

**🟠 High Impact + Medium Probability (Mitigate Before Launch):**
- _Spotify revokes app for ToS violation (needs: legal review + compliance strategy)_
- _Spotify API changes breaking endpoint (needs: abstraction layer + monitoring)_

**🟡 Medium Impact + High Probability (Monitor Closely):**
- _Token refresh failures (solved: robust error handling + repair modal)_
- _Free tier limits exceeded (needs: usage monitoring + migration plan)_

**🟢 Low Impact or Low Probability (Accept Risk):**
- _QStash downtime (acceptable: 99.9% uptime SLA)_
- _Browser compatibility issues (acceptable: modern browsers only)_
]_

---

## Risks & Open Questions

> **Note:** Most technical and business risks have been identified in the Constraints & Assumptions section. This section summarizes critical risks and documents unresolved questions requiring research.

### Critical Risks Summary

**See Risk Matrix in Constraints section for full prioritization.**

**🔴 Immediate Action Required:**
1. **Export pagination implementation** - Must handle 50K+ song datasets without timeout
2. **Legal review of Spotify ToS** - Ensure compliance with Section IV before launch
3. **Normalized schema implementation** - Critical for staying within free tier limits

**🟠 Pre-Launch Mitigation:**
4. **Spotify API abstraction layer** - Protect against API changes
5. **Token refresh error handling** - Prevent silent archival failures

---

### Open Questions Requiring Research

#### Product Questions

**Q1: What is the optimal polling frequency?**
- **Current plan:** 1 hour
- **Trade-off:** Faster polling = higher costs + more API calls vs. slower = more data loss risk
- **Research needed:** Survey beta users on tolerance for delay (30 min vs. 1 hour vs. 2 hours)
- **Decision timeline:** Before MVP launch

**Q2: Should we show "estimated next check" time in UI?**
- **Pro:** Transparency builds trust ("Next update in 23 minutes")
- **Con:** Creates expectation of monitoring, contradicts "set it and forget it"
- **Research needed:** User testing with/without this feature
- **Decision timeline:** Post-MVP (not blocking)

**Q3: How do we handle users who listen to 100+ songs/day?**
- **Current plan:** Hourly polling captures them (100 songs/24 hours = 4 songs/hour, well within 50-track buffer)
- **Edge case:** User binges 50+ songs in 30 minutes, then stops
- **Research needed:** Analyze Spotify listening patterns dataset (if publicly available)
- **Decision timeline:** Post-MVP (edge case, low priority)

---

#### Technical Questions

**Q4: What is the actual database storage per user at scale?**
- **Current estimate:** ~40 bytes/row × 10K songs/year = 400KB/user/year
- **Unknown:** Index overhead, metadata table growth, actual compression ratios
- **Research needed:** Run simulation with 100K fake rows, measure actual storage
- **Decision timeline:** Before launch (critical for cost projections)

**Q5: Should we implement database partitioning?**
- **Current plan:** Single `PlayHistory` table for MVP
- **At scale:** 100M+ rows might benefit from partitioning by `playedAt` (yearly partitions)
- **Research needed:** PostgreSQL partitioning performance benchmarks
- **Decision timeline:** Post-MVP, when table reaches 10M+ rows

**Q6: Can we use Spotify's album art CDN directly, or must we proxy?**
- **Current plan:** Store Spotify CDN URLs directly (`image: String?`)
- **Risk:** Spotify might rotate URLs, breaking our references
- **Alternative:** Download and re-host images (expensive storage cost)
- **Research needed:** Test longevity of Spotify image URLs
- **Decision timeline:** MVP (affects schema design)

---

#### Market & GTM Questions

**Q7: What acquisition channels will work for Music Archivists?**
- **Hypothesis:** Reddit (r/datahoarder, r/spotify), Product Hunt, Hacker News
- **Unknown:** Which channels have highest conversion rates
- **Research needed:** Competitor analysis (where did Last.fm/Stats for Spotify get users?)
- **Decision timeline:** Post-MVP (need product to test channels)

**Q8: Will users pay $5/month for premium features?**
- **Current assumption:** 5-10% freemium conversion
- **Unknown:** Price elasticity ($3 vs. $5 vs. $10)
- **Research needed:** User interviews on willingness to pay, competitor pricing analysis
- **Decision timeline:** Before launching paid tier (Year 2)

**Q9: Is there a B2B market for aggregated (anonymized) data?**
- **Hypothesis:** Music journalists, labels, playlist curators might pay for insights
- **Conflict:** Violates "no aggregation" Spotify ToS compliance strategy
- **Research needed:** Legal review - can we aggregate if users opt-in separately?
- **Decision timeline:** Post-MVP (not core business model)

---

#### Legal & Compliance Questions

**Q10: Do we need GDPR data processing agreements with Vercel/Neon/Upstash?**
- **Current plan:** Rely on vendor GDPR compliance (all are GDPR-compliant services)
- **Unknown:** Are we a "data controller" or "data processor" under GDPR?
- **Research needed:** Consult with attorney specializing in GDPR
- **Decision timeline:** Before EU launch (not blocking US MVP)

**Q11: Does Spotify Developer ToS permit "personal cache" framing?**
- **Current plan:** Frame as "user-owned personal cache" to comply with ToS
- **Unknown:** Will Spotify accept this interpretation?
- **Research needed:** Legal review + potentially direct communication with Spotify Developer Relations
- **Decision timeline:** **CRITICAL** - Before public launch

---

### Risks We're Explicitly Accepting

**Risk: Last.fm or Spotify could launch competing feature**
- **Likelihood:** Low (Last.fm lacks resources, Spotify lacks incentive)
- **Impact:** High (would commoditize our product)
- **Why accepting:** Can't control competitor actions, focus on execution speed

**Risk: Solo founder burnout**
- **Likelihood:** Medium (10-15 hrs/week for 3 months is sustainable)
- **Impact:** High (project stalls)
- **Why accepting:** Part-time pace reduces burnout risk, quality > speed

**Risk: MVP attracts <100 users**
- **Likelihood:** Medium (unproven product-market fit)
- **Impact:** Medium (doesn't invalidate concept, just means more iteration needed)
- **Why accepting:** MVP is learning vehicle, not launch product

---

### Research Priorities

**Before starting development:**
1. ✅ Legal review of Spotify Developer ToS (Critical Assumption #1)
2. ✅ Database storage simulation (Q4 - critical for cost model)
3. ✅ Spotify image URL longevity test (Q6 - affects schema)

**During MVP development:**
4. User interview prep (questions about polling delay, value props)
5. Competitor acquisition channel analysis (Q7)

**Before launch:**
6. Export pagination stress test (50K+ songs)
7. Beta user cohort recruitment (10 users)

---

## Next Steps

> **Purpose:** Actionable roadmap to move from planning to execution. These steps assume approval of this Project Brief and commitment to build the MVP.

### Phase 1: Pre-Development Setup (Week 1)

**Objective:** Validate critical assumptions and set up infrastructure before writing code.

#### Legal & Compliance
- [ ] **Hire attorney for Spotify ToS review** (Budget: $500-1,000)
  - Focus on Section IV ("database creation" clause)
  - Get written opinion on "personal cache" framing
  - **Blocker:** Cannot launch without this

#### Technical Validation
- [ ] **Run database storage simulation**
  - Generate 100K fake `PlayHistory` rows with normalized schema
  - Measure actual storage (target: <10MB for 100K rows)
  - Validate 40 bytes/row estimate

- [ ] **Test Spotify image URL longevity**
  - Store 10 Spotify album art URLs
  - Check daily for 2 weeks to see if URLs remain valid
  - Decision: Direct CDN links vs. re-hosting

- [ ] **Create Spotify Developer App**
  - Register at developer.spotify.com
  - Configure OAuth redirect URLs
  - Note Client ID and Client Secret for `.env`

#### Project Setup
- [ ] **Initialize Next.js project**
  ```bash
  npx create-next-app@latest audiospective --typescript --tailwind --app
  ```

- [ ] **Set up GitHub repository**
  - Create private repo
  - Add `.gitignore` (include `.env.local`)
  - Initial commit with Next.js scaffold

- [ ] **Configure development environment**
  - Install dependencies: `prisma`, `next-auth`, `@upstash/qstash`
  - Set up Docker Compose for local PostgreSQL
  - Create `.env.example` template

---

### Phase 2: Story #1 - Foundation & Auth (Weeks 2-4)

**Objective:** User can log in with Spotify OAuth and see their profile.

#### Week 2: Database & Auth Setup
- [ ] **Set up Neon PostgreSQL database**
  - Create free tier account
  - Note connection string for `.env.local`

- [ ] **Define Prisma schema** (use normalized schema from Technical Considerations section)
  - User, Account, Session, Track, Artist, Album, PlayHistory models
  - Run `prisma migrate dev` to create tables

- [ ] **Configure NextAuth.js v5**
  - Add Spotify provider
  - Configure session strategy (database)
  - Test OAuth flow locally

#### Week 3: Initial Backfill Logic
- [ ] **Create Spotify API client wrapper**
  - Abstract `/me/player/recently-played` endpoint
  - Handle token refresh automatically
  - Error handling for rate limits

- [ ] **Implement backfill on first login**
  - Fetch last 50 songs
  - Normalize and save to Track/Artist/Album tables
  - Create PlayHistory records
  - Handle deduplication via unique constraint

#### Week 4: Testing & Bug Fixes
- [ ] **Manual testing checklist**
  - OAuth flow works end-to-end
  - User record created in database
  - 50 songs saved to PlayHistory
  - Token refresh works after 1 hour

- [ ] **Deploy to Vercel (preview)**
  - Connect GitHub repo
  - Add environment variables
  - Test OAuth with production Spotify app

**✅ Story #1 Success Criteria Met:** User can log in and database has their data

---

### Phase 3: Story #2 - Dashboard "Vibe Check" (Weeks 5-7)

**Objective:** User sees beautiful dashboard with live data + historical timeline.

#### Week 5: Dashboard UI - Live Data
- [ ] **Design dashboard layout** (Figma or hand-sketch)
  - Top section: "Current Vibe" (Top 5 Artists)
  - Bottom section: "Timeline" (scrollable history)

- [ ] **Implement Top Artists component**
  - Fetch `/me/top/artists` from Spotify API
  - Display with album art, artist name
  - Style with Tailwind CSS

- [ ] **Add responsive design**
  - Mobile-first approach
  - Test on iOS Safari, Chrome Mobile

#### Week 6: Dashboard UI - Historical Timeline
- [ ] **Implement Timeline component**
  - Query `PlayHistory` with joins to Track/Artist/Album
  - Display in reverse chronological order
  - Show: track name, artist, album art, timestamp

- [ ] **Add pagination or infinite scroll**
  - Start with simple pagination (50 songs/page)
  - Later: infinite scroll with Intersection Observer

#### Week 7: Polish & Performance
- [ ] **Optimize dashboard load time**
  - Server-side rendering for initial data
  - Image optimization (`next/image`)
  - Target: <2 second P95 load time

- [ ] **Add loading states**
  - Skeleton screens while fetching data
  - Error states for API failures

**✅ Story #2 Success Criteria Met:** Dashboard shows live + historical data beautifully

---

### Phase 4: Story #3 - The Archivist (Weeks 8-12)

**Objective:** Background archival works automatically every hour.

#### Week 8-9: Cron & Queue Setup
- [ ] **Set up Upstash QStash**
  - Create free tier account
  - Note API keys for `.env`

- [ ] **Create `/api/cron/trigger-archival` endpoint**
  - Query all active users (`isActive = true`)
  - Batch into groups of 100
  - Publish to QStash with jitter (0-60s delay)

- [ ] **Create `/api/queue/archive-user` endpoint**
  - Receive `{ userId }` from QStash
  - Fetch user's Spotify token
  - Call `/me/player/recently-played?after={lastPolledAt}`
  - Save new songs to database
  - Update `user.lastPolledAt`

- [ ] **Configure Vercel Cron**
  - Add to `vercel.json`: trigger `/api/cron/trigger-archival` hourly
  - Or use Upstash QStash native cron

#### Week 10: Token Repair Flow
- [ ] **Implement token refresh logic**
  - On 401, attempt refresh using `refresh_token`
  - Update `access_token` in database
  - Retry archival

- [ ] **Implement repair modal**
  - Detect `isActive = false` on dashboard load
  - Show "Reconnect Spotify" modal
  - Re-authenticate via OAuth

- [ ] **Add Data Gap visualization**
  - Timeline shows gap: "No data from [date] to [date]"
  - Honest UX messaging

#### Week 11: Export Feature
- [ ] **Create `/api/export` endpoint**
  - Query user's full `PlayHistory`
  - Join with Track/Artist/Album
  - Return JSON (paginated if >10K songs)

- [ ] **Add "Download My Data" button to dashboard**
  - Simple button, downloads JSON file
  - Rate limit: 1 export per 5 minutes

#### Week 12: Integration Testing & Bug Fixes
- [ ] **End-to-end testing**
  - User logs in, plays song on Spotify
  - Wait 1 hour, verify song appears in timeline
  - Revoke Spotify access, verify repair modal
  - Test export with large dataset

- [ ] **Monitor cron job success rate**
  - Check Vercel logs for errors
  - Aim for 99%+ success rate

**✅ Story #3 Success Criteria Met:** Archival runs automatically, token repair works, export succeeds

---

### Phase 5: Pre-Launch Prep (Week 13)

#### Beta Testing
- [ ] **Recruit 10 beta testers**
  - Friends, family, Reddit (r/datahoarder)
  - Provide beta access link

- [ ] **Monitor for 1 week**
  - Track AAU (Active Archival Users)
  - Check for errors in logs
  - Collect qualitative feedback

#### Legal & Privacy
- [ ] **Write Privacy Policy**
  - Explain what data we collect (Spotify listening history)
  - How we use it (personal archive only)
  - How to delete (contact support for MVP)

- [ ] **Write Terms of Service**
  - Use template (Termly.io or similar)
  - Customize for our use case

- [ ] **Final legal review**
  - Attorney reviews Privacy Policy + ToS
  - Confirms Spotify ToS compliance

#### Marketing Prep
- [ ] **Create landing page**
  - Hero: "Your Spotify History, Owned by You"
  - Features: Instant dashboard, automatic archival, data export
  - CTA: "Start Archiving" (OAuth button)

- [ ] **Prepare Product Hunt launch**
  - Write product description
  - Create screenshots/demo video
  - Schedule launch date

---

### Phase 6: Launch (Week 14)

- [ ] **Soft launch to beta cohort**
  - Send email to beta testers
  - Monitor for issues

- [ ] **Public launch**
  - Post to Product Hunt
  - Share on Reddit (r/spotify, r/datahoarder)
  - Share on Hacker News (Show HN)
  - Tweet launch announcement

- [ ] **Monitor metrics**
  - Track signups, AAU, retention
  - Watch for errors/crashes
  - Respond to user feedback

**🎉 MVP SHIPPED**

---

### Post-Launch: First 30 Days

#### Week 15-16: Stabilization
- [ ] **Fix critical bugs** as they're reported
- [ ] **Monitor infrastructure costs** (watch for free tier limits)
- [ ] **User interviews** - Talk to 5 active users

#### Week 17-18: Iteration
- [ ] **Implement top user requests** (if aligned with roadmap)
- [ ] **Optimize based on metrics** (improve retention, reduce churn)
- [ ] **Plan Phase 2 features** (refer to Post-MVP Vision section)

---

### Success Metrics to Track

**Week 1-4 (Story #1):**
- ✅ OAuth flow completion rate: >90%
- ✅ Backfill success rate: >95%

**Week 5-7 (Story #2):**
- ✅ Dashboard load time: <2 seconds (P95)
- ✅ User returns to check dashboard: >40% within first week

**Week 8-12 (Story #3):**
- ✅ Cron job success rate: >99%
- ✅ Token refresh success rate: >95%
- ✅ Export feature usage: >10% of users try it

**Week 14+ (Post-Launch):**
- ✅ 100 signups in first 30 days
- ✅ 60%+ 30-day retention (AAU)
- ✅ Zero Spotify ToS violations

---

### Contingency Planning

**If Spotify blocks us (Critical Risk):**
1. Immediately pivot to Apple Music (requires research from Phase 1)
2. Or build multi-platform support (Spotify + Apple Music + YouTube Music)
3. Or shut down gracefully, allow users to export data

**If free tier limits exceeded:**
1. Migrate to Neon Pro ($19/mo) + Vercel Pro ($20/mo)
2. Or migrate to Railway/Fly.io for better pricing
3. Or introduce paid tier early to cover costs

**If solo founder burns out:**
1. Reduce scope (cut Post-MVP features)
2. Extend timeline (quality > speed)
3. Or pause project, return when refreshed

---

**End of Project Brief**

---

*This document serves as the definitive guide for building Audiospective MVP. Refer to `docs/MASTER.md` for the consolidated technical architecture and `docs/02_map/` for detailed PRD/architecture specifications.*

