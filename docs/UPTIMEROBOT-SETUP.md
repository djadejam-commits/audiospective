# UptimeRobot Setup Guide

**Purpose:** Configure 5-minute health check monitoring for Audiospective production

**Status:** Manual setup required (Step-by-step guide below)

---

## Quick Setup Instructions

### 1. Create UptimeRobot Account

1. Go to [UptimeRobot](https://uptimerobot.com/)
2. Sign up for a **Free account** (supports up to 50 monitors, 5-minute intervals)
3. Verify your email address

### 2. Add Health Check Monitor

1. Click "**Add New Monitor**" (top left)
2. Configure the monitor:

   **Monitor Type:** HTTP(s)

   **Friendly Name:** Audiospective Production Health Check

   **URL (or IP):** `https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app/api/health`

   **Monitoring Interval:** 5 minutes (free tier default)

   **Monitor Timeout:** 30 seconds

   **HTTP Method:** GET

3. Click "**Create Monitor**"

### 3. Configure Alerts

**Email Alerts (Recommended):**

1. Go to "**My Settings**" → "**Alert Contacts**"
2. Add your email address
3. Verify the email
4. Edit the monitor → "Alert Contacts" → Select your email

**Additional Alert Channels (Optional):**

- **Slack:** Integrate with Slack workspace for team notifications
- **Discord:** Add Discord webhook for instant alerts
- **Telegram:** Connect Telegram bot for mobile alerts
- **Webhook:** Send alerts to custom endpoint (e.g., PagerDuty, Datadog)

### 4. Set Up Keyword Monitoring (Advanced)

For additional reliability, monitor for specific response content:

1. Edit the monitor
2. Enable "**Keyword Monitoring**"
3. **Keyword Type:** "Keyword exists"
4. **Keyword:** `"status":"healthy"`
5. **Case Sensitivity:** Case sensitive
6. Save changes

This ensures not only that the endpoint responds (200 OK), but that it returns the expected health status.

---

## Monitoring Configuration Details

### Free Plan Limits

- **Monitors:** Up to 50
- **Interval:** 5 minutes
- **Alert Contacts:** 2
- **SSL Monitoring:** Yes
- **Logs Retention:** 60 days

### Recommended Settings

**Alert Thresholds:**
- Alert when monitor is down
- Alert when monitor is back up
- Send notification after: 1 down check (immediate)

**Notification Preferences:**
- Email: ✅ Enabled
- SMS: Optional (requires paid plan)
- Slack/Discord: ✅ Recommended for team visibility

---

## Expected Monitor Behavior

### Healthy State

**Status:** Up
**Response Time:** ~400-600ms
**Response Code:** 200 OK
**Response Body Contains:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 800
    },
    "spotify": {
      "status": "healthy",
      "responseTime": 120
    }
  }
}
```

### Unhealthy States to Alert On

1. **Status Code ≠ 200**
   - 500: Server error (application crash)
   - 502/503: Vercel deployment issue
   - 401: Deployment protection re-enabled (misconfiguration)

2. **Timeout (>30s)**
   - Database connection issue
   - Cold start delay (rare with Vercel)

3. **Missing Keyword**
   - Health endpoint returns error JSON
   - Database or Spotify service unhealthy

---

## Incident Response Workflow

### When Alert Triggered

**Step 1: Verify Alert (2 minutes)**
1. Open production URL in browser: `https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app`
2. Check health endpoint manually: `https://...vercel.app/api/health`
3. If accessible → Likely false positive (network blip)
4. If inaccessible → Proceed to Step 2

**Step 2: Check Infrastructure (5 minutes)**
1. **Vercel Dashboard:** https://vercel.com/djadejam-commits-projects/audiospective
   - Check deployment status (building, error, ready)
   - Review latest deployment logs
   - Check if deployment protection accidentally re-enabled

2. **Neon Database:** https://console.neon.tech
   - Verify database status (running, paused, error)
   - Check connection limits (<100 active)
   - Review query performance

3. **Sentry Dashboard:** https://sentry.io/organizations/ade-tokuta/projects/audiospective
   - Check for error spikes
   - Review recent error traces

**Step 3: Investigate Root Cause (10 minutes)**
- Review Vercel logs for errors
- Check Sentry for exceptions
- Verify environment variables (Database URL, API keys)
- Test individual services (database, Spotify API)

**Step 4: Remediate (15-30 minutes)**

**Option A: Quick Rollback (5 minutes)**
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Verify health endpoint recovers

**Option B: Hotfix Deployment (15-30 minutes)**
1. Fix the issue locally
2. Test locally (`npm run dev`)
3. Commit and push to main
4. Vercel auto-deploys
5. Verify health endpoint

**Step 5: Post-Incident (30 minutes)**
1. Document incident in `docs/INCIDENTS.md`
2. Update monitoring if needed
3. Notify stakeholders (if user-facing)

---

## Dashboard URLs

**Primary Monitoring:**
- **UptimeRobot Dashboard:** https://uptimerobot.com/dashboard (after setup)

**Supporting Dashboards:**
- **Vercel:** https://vercel.com/djadejam-commits-projects/audiospective
- **Sentry:** https://sentry.io/organizations/ade-tokuta/projects/audiospective
- **Neon:** https://console.neon.tech
- **Upstash Redis:** https://console.upstash.com/redis
- **Upstash QStash:** https://console.upstash.com/qstash

---

## Status Page (Optional Enhancement)

UptimeRobot offers **public status pages** (free):

1. Go to "**My Settings**" → "**Public Status Pages**"
2. Click "**Add Public Status Page**"
3. Configure:
   - **Page URL:** `audiospective-status` (becomes `stats.uptimerobot.com/audiospective-status`)
   - **Page Title:** Audiospective Status
   - **Monitors:** Select Audiospective monitor
   - **Show Uptime:** Yes
   - **Show Response Times:** Yes
4. Share URL with users for transparency

---

## Maintenance Mode

To prevent false alerts during planned maintenance:

1. Go to monitor settings
2. Click "**Pause Monitoring**"
3. Perform maintenance
4. Re-enable monitoring
5. Verify first check passes

---

## Cost Analysis

### Free Plan (Recommended)

**Cost:** $0/month

**Features:**
- 50 monitors
- 5-minute intervals
- 2 alert contacts
- 60-day logs
- Public status pages

**Limitations:**
- Cannot detect issues <5 minutes
- Limited alert contacts

### Pro Plan (Optional Upgrade)

**Cost:** $7/month

**Features:**
- 50 monitors
- **1-minute intervals** (5x faster detection)
- 10 alert contacts
- 1-year logs
- SMS alerts (50 credits)
- Priority support

**When to Upgrade:**
- After first 1,000 users
- When 5-minute detection is too slow
- When team needs more alert contacts

---

## Next Steps

1. **Immediate:** Create UptimeRobot account and add health check monitor
2. **Week 1:** Configure email alerts
3. **Week 2:** Add Slack/Discord webhooks for team visibility
4. **Month 1:** Review incident response workflow
5. **Month 3:** Consider upgrading to Pro for 1-minute intervals

---

## Resources

- [UptimeRobot Official Docs](https://uptimerobot.com/api/)
- [Ultimate Guide to Uptime Monitoring Types](https://uptimerobot.com/knowledge-hub/monitoring/ultimate-guide-to-uptime-monitoring-types/)
- [Network Monitoring Guide](https://uptimerobot.com/knowledge-hub/monitoring/network-monitoring-guide/)
- [UptimeRobot Setup Guide (Spike.sh)](https://spike.sh/blog/a-guide-to-uptime-monitoring-with-uptimerobot/)

---

**Status:** ⏭️ **Manual setup required** - Follow instructions above

**Time Required:** 10-15 minutes

**Maintenance:** None (automated after setup)
