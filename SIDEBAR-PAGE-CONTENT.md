# 📱 Audiospective Navigation & Page Content Plan

## ✅ Current Sidebar Structure (Updated)

1. **Dashboard** → `/dashboard` ✅ (exists)
2. **Profile** → `/me` ✅ (exists)
3. **Library** → `/library` ⚠️ (needs creation)
4. **Analytics** → `/analytics` ⚠️ (needs creation)
5. **Settings** → `/settings` ⚠️ (needs creation)

---

## 📄 Page Content Breakdown

### 1. Dashboard (`/dashboard`) - ✅ EXISTS

**Purpose**: Quick overview and real-time activity

**Current Content**:
- Welcome header with user info
- Key stats grid (Total Plays, Unique Tracks, Artists, Hours)
- Activity charts (7d, 30d, all time tabs)
- Activity Heatmap (7x24 grid)
- Top Artists
- Top Tracks
- Recent Plays with Full Screen Player
- Genre distribution

**Status**: Already complete with cyberpunk design

---

### 2. Profile (`/me`) - ✅ EXISTS

**Purpose**: User profile and personal metrics

**Current Content**:
- Profile header (avatar, name, email, diversity badge)
- Stats overview (plays, tracks, artists, hours)
- Listening Streaks (current, longest, total active days)
- Diversity Score with interpretation
- Account Settings:
  - Spotify connection status
  - Last archival timestamp
  - Sign out button

**Status**: Already complete with cyberpunk design

---

### 3. Library (`/library`) - ⚠️ NEEDS CREATION

**Purpose**: Browse and search through ALL archived tracks

**Proposed Content**:

#### Header Section
- Title: "Your Music Library"
- Total tracks count: "X,XXX tracks archived"
- Date range: "Since [first archival date]"

#### Search & Filters
- Search bar: Search by track name, artist, or album
- Filters:
  - Date range picker (last 7d, 30d, 90d, all time, custom)
  - Artist filter (dropdown with all artists)
  - Play count range (most played, least played)
  - Sort by: Recent, Most Played, A-Z, Artist

#### Track List View
- Virtual scrolling table/grid (for performance with large datasets)
- Columns:
  - Album art thumbnail
  - Track name
  - Artist(s)
  - Album name
  - Play count
  - Last played date
  - Duration
- Click to play preview (if Spotify preview URL available)
- Ripple effect on hover

#### Stats Sidebar (optional)
- Total listening time in library view
- Most played artist in filtered view
- Average plays per track

**APIs Needed**:
- `GET /api/library` - Fetch all archived tracks with pagination
- Query params: `search`, `artist`, `dateFrom`, `dateTo`, `sort`, `limit`, `offset`

---

### 4. Analytics (`/analytics`) - ⚠️ NEEDS CREATION

**Purpose**: Deep dive analysis and advanced visualizations

**Proposed Content**:

#### Time-Based Analysis
- **Listening Patterns Over Time**
  - Line chart: Plays per day/week/month/year
  - Toggle between different time granularities

- **Time of Day Analysis**
  - Circular/radial chart showing listening by hour
  - Identify peak listening hours

- **Day of Week Breakdown**
  - Bar chart: Which days you listen most
  - Weekday vs Weekend comparison

#### Music Discovery
- **Discovery Timeline**
  - When did you first listen to your current favorites?
  - New artists discovered each month

- **Track Longevity**
  - How long tracks stay in rotation
  - One-hit wonders vs long-term favorites

- **Repeat Listening Behavior**
  - Average replays per track
  - Obsession score (tracks played >50 times)

#### Genre & Mood Analysis
- **Genre Evolution**
  - Stacked area chart showing genre distribution over time
  - Genre diversity score by month

- **Audio Features Analysis** (if using Spotify Audio Features API)
  - Energy, Danceability, Valence trends
  - Mood quadrant visualization

#### Comparison Views
- **This Month vs Last Month**
- **This Year vs Last Year**
- **Seasonal Listening Patterns**

#### Export & Sharing
- Export analytics as PDF
- Share specific insights to social media
- Create shareable report (similar to Spotify Wrapped)

**APIs Needed**:
- `GET /api/analytics/timeline` - Historical play data
- `GET /api/analytics/time-patterns` - Time-of-day/day-of-week data
- `GET /api/analytics/discovery` - New artist/track discovery data
- `GET /api/analytics/audio-features` - Spotify audio features aggregation

---

### 5. Settings (`/settings`) - ⚠️ NEEDS CREATION

**Purpose**: Account configuration and preferences

**Proposed Content**:

#### Account Settings
- **Profile Information**
  - Display name (editable)
  - Email address (read-only, from Spotify)
  - Profile picture (from Spotify)

- **Connected Accounts**
  - Spotify account status
  - Last token refresh timestamp
  - Reconnect button if needed
  - Disconnect & Delete Account (danger zone)

#### Archival Preferences
- **Automatic Archival**
  - Status: Enabled/Disabled toggle
  - Frequency: Every hour (default)
  - Last successful archival timestamp
  - Next scheduled archival time

- **Manual Archive**
  - "Run Archive Now" button → redirects to `/test`
  - Archive history log (last 10 runs)

#### Privacy & Data
- **Data Retention**
  - How long to keep archived data
  - Option to delete data older than X months

- **Sharing Settings**
  - Default privacy for shared reports (public/private)
  - Allow search engines to index shared reports (yes/no)

#### Notifications (Future Feature)
- **Email Notifications**
  - Weekly listening summary
  - Monthly stats report
  - Archive failures/warnings

- **Web Push Notifications**
  - New milestone achievements
  - Spotify Wrapped-style year-end report

#### Appearance
- **Theme Preference**
  - Dark Mode (default)
  - Light Mode
  - Auto (system preference)
  - Theme preview

#### Danger Zone
- **Delete All Data**
  - Permanent deletion of all archived tracks
  - Cannot be undone warning
  - Requires confirmation

- **Delete Account**
  - Remove account and all associated data
  - Revoke Spotify access
  - Requires confirmation + password

**APIs Needed**:
- `GET /api/settings` - Fetch current settings
- `PATCH /api/settings` - Update settings
- `POST /api/settings/archive/manual` - Trigger manual archive
- `DELETE /api/settings/data` - Delete old data
- `DELETE /api/settings/account` - Delete account

---

## 🎨 Design Consistency

All new pages should follow the same Deep Space Cyberpunk design:
- Glass panels with backdrop blur
- Neon glows (cyan, purple, green, orange)
- Particle effects backgrounds
- Ripple microinteractions
- Gradient buttons and text
- Mobile responsive with sidebar
- Light/dark theme support

---

## 🚀 Implementation Priority

**Phase 1** (Do Now):
1. ✅ Fix sidebar navigation (just completed)
2. Create placeholder pages for Library, Analytics, Settings

**Phase 2** (Next):
1. Implement Library page (most requested feature)
2. Build core APIs for library filtering/search

**Phase 3** (Future):
1. Implement Analytics page with advanced charts
2. Complete Settings page with all preferences

**Phase 4** (Polish):
1. Add export/sharing features
2. Implement notifications
3. Build Wrapped-style annual reports

---

## 📊 Current Status Summary

| Page | Status | Cyberpunk Design | Content | APIs |
|------|--------|------------------|---------|------|
| Dashboard | ✅ Complete | ✅ Yes | ✅ Yes | ✅ Yes |
| Profile | ✅ Complete | ✅ Yes | ✅ Yes | ✅ Yes |
| Library | ❌ Not Created | ❌ No | ❌ No | ❌ No |
| Analytics | ❌ Not Created | ❌ No | ❌ No | ❌ No |
| Settings | ❌ Not Created | ❌ No | ❌ No | ❌ No |

---

**Next Steps**:
1. Review this plan
2. Decide which page to build first
3. Start with placeholder pages or full implementation?
