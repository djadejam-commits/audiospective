# 📂 Master Project Documentation
## Spotify Time Machine (MVP)

> **Status:** Transitioning from MAP to ACTION
> **Version:** 1.0
> **Last Updated:** 2025-11-26

---

## 🎯 Vision

An **"Always-on Wrapped"** application that gives users instant gratification via a dashboard while silently archiving their listening history in the background to prevent data loss.

---

## 🗺️ Part 1: The Product Requirements (PRD)

### 1. Core User Flow

#### Onboarding
**User Connects Spotify → System fetches last 50 songs immediately (The "Backfill")**

#### Dashboard
**User sees:**
- **"Current Vibe"** (Live API data)
- **"Timeline"** (Database data)

#### The Engine (Hidden)
**Every hour, a Cron job triggers a Queue. The Queue wakes up a worker for every user to fetch new songs.**

#### The "Repair" Protocol
**If a user's token expires or they revoke access:**
- System flags user as inactive
- Next login shows a "Repair Connection" modal
- Timeline visualizes the downtime as a **"Data Gap"** (Honesty > Perfection)

---

### 2. Technical Constraints & Decisions

#### The Timeout Fix
We use **Upstash QStash** to "Fan-Out" requests. One Cron job triggers 1,000 individual queue events. This prevents Vercel timeouts.

#### The Data Strategy: Hybrid
- **Visuals:** Use Spotify API directly (Top Artists)
- **History:** Use our Database (Play History)
- **Sharing:** We generate static images (PNGs) using `@vercel/og` for Instagram Stories

---

## 🏗️ Part 2: The Architecture & Stack

### The Stack

| Layer | Technology |
|-------|------------|
| **Frontend/API** | Next.js 14 (App Router) |
| **Auth** | NextAuth.js v5 (Spotify Provider) |
| **Database** | PostgreSQL (via Neon or Supabase) |
| **ORM** | Prisma |
| **Queue/Cron** | Upstash QStash |
| **Styling** | Tailwind CSS |

---

### The Database Schema (schema.prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. THE USER
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?

  // Auth & State
  accounts      Account[]
  isActive      Boolean   @default(true) // "The Dead Canary" flag
  lastPolledAt  DateTime? // Cursor for the Cron Job

  playHistory   PlayHistory[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// 2. NEXTAUTH ACCOUNT (Standard)
model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String? @db.Text
  access_token       String? @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String? @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

// 3. NEXTAUTH SESSION (Standard)
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// 4. THE TIME MACHINE ARCHIVE
model PlayHistory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Track Data
  trackId    String
  trackName  String
  artistName String
  albumName  String?
  image      String?

  playedAt   DateTime

  // DEDUPLICATION LOCK: Prevents saving the same song twice
  @@unique([userId, playedAt])
  @@index([userId, playedAt])
}
```

---

## ⚡ Part 3: The Action Plan (Developer Stories)

To build this without getting overwhelmed, we will execute these three distinct "Stories."

### Story #1: The Foundation & Auth
**Goal:** User can click "Login with Spotify" and we see their record appear in our Database.

**Tasks:**
- Set up Next.js
- Configure NextAuth with Spotify
- Connect Prisma to Postgres

**Success Criteria:** A database table populated with user info.

---

### Story #2: The "Vibe Check" (Read-Only)
**Goal:** User sees their top data immediately.

**Tasks:**
- Create the Dashboard UI
- Fetch `/me/top/artists` from Spotify (no database history yet)

**Success Criteria:** A page showing "Top 5 Artists" styled nicely.

---

### Story #3: The Archivist (The Hard Part)
**Goal:** History starts saving automatically.

**Tasks:**
- Set up the API Route `/api/queue`
- Configure Upstash QStash
- Write the logic to save songs to `PlayHistory`

**Success Criteria:** You play a song on Spotify, wait 1 hour, and it appears in your app's database.

---

## 📌 Key Design Principles

1. **Instant Gratification** - Users see value immediately (Current Vibe)
2. **Honesty > Perfection** - Data gaps are visualized, not hidden
3. **Silent Archiving** - History collection happens in the background
4. **Deduplication by Design** - Unique constraints prevent duplicate entries
5. **Repair, Don't Punish** - Token expiration is treated as a recoverable state

---

## 🔐 Critical Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **QStash Fan-Out** | Prevents Vercel serverless timeouts when polling 1,000+ users |
| **Hybrid Data Strategy** | API for live data, DB for historical archive |
| **`lastPolledAt` Cursor** | Ensures we only fetch new plays since last check |
| **`isActive` Flag** | "Dead Canary" - marks users with broken tokens |
| **`@@unique([userId, playedAt])`** | Database-level deduplication guarantee |

---

## 🎨 User Experience Philosophy

**"Always-on Wrapped"** means:
- No waiting until December
- No complex setup flows
- No losing years of data because you forgot to connect an app
- Honest visualization of when data is available vs. when it's not

---

*This document serves as the single source of truth for the Spotify Time Machine project.*
