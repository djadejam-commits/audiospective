# Product Requirement Document: Audiospective MVP

## 1. Summary
A Next.js web application that serves as an "Always-on Wrapped." It uses a **Hybrid Data Strategy**: immediate "Top Items" for instant gratification, and a background "Resilient Poller" for long-term history archiving.

## 2. Architecture: The Resilient Poller (Option B)
* **Trigger:** Vercel Cron runs hourly.
* **Logic:**
    1.  Select `N` users where `last_polled_at` is older than 60 mins.
    2.  For each user:
        * Refresh Spotify Token (if expired).
        * Fetch `recently-played`.
        * Upsert tracks to DB.
        * Update `last_polled_at`.
    3.  **Recursion:** If users remain in the queue, the API route calls itself (or queues the next batch) to bypass Serverless timeouts.

## 3. Core Tech Stack
* **Frontend:** Next.js 14 (App Router), Tailwind CSS.
* **Backend:** Next.js API Routes (Serverless).
* **Database:** PostgreSQL (Supabase/Neon) with `pgcrypto`.
* **Auth:** NextAuth.js v5 (Spotify Provider).

## 4. User Stories
* **Story 1 (Foundation):** User can log in with Spotify; DB User created; Tokens stored securely.
* **Story 2 (Dashboard):** User sees "Top Artists" immediately upon login.
* **Story 3 (The Machine):** Background Cron successfully archives history for a batch of users.