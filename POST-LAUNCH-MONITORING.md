# Post-Launch Monitoring Guide

**Application:** Audiospective
**Launch Date:** December 4, 2025 22:43 UTC
**Production URL:** https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app

---

## Overview

This guide provides monitoring procedures for the first 24 hours, first week, and ongoing operations after production launch.

**Monitoring Philosophy:**
- **First 24 hours:** Intensive (hourly checks)
- **First week:** Active (daily checks)
- **Ongoing:** Routine (weekly reviews)

---

## Critical Monitoring Dashboards

### 1. Vercel Dashboard
**URL:** https://vercel.com/djadejam-commits-projects/audiospective

**What to Monitor:**
- Deployment status (should be "Ready")
- Function invocations (API calls)
- Function errors (should be 0%)
- Function duration (p95 < 500ms)
- Bandwidth usage
- Build status

**Red Flags:**
- ❌ Deployment fails
- ❌ Error rate > 1%
- ❌ p95 duration > 1 second
- ❌ 5XX status codes

---

### 2. Sentry Dashboard
**URL:** https://sentry.io/organizations/[your-org]/projects/audiospective

**What to Monitor:**
- Error count (should be 0 initially)
- Issue types (new vs recurring)
- User impact (% of users affected)
- Error trends (increasing vs stable)
- Performance metrics

**Red Flags:**
- ❌ Critical errors (data loss, crashes)
- ❌ Error rate increasing
- ❌ > 5% of users affected
- ❌ Database connection errors
- ❌ Authentication errors

---

### 3. Neon Database Dashboard
**URL:** https://console.neon.tech

**What to Monitor:**
- Connection count (< 50% of max)
- Query performance (p95 < 1s)
- Database size (within free tier: 512MB)
- Active queries
- Connection errors

**Red Flags:**
- ❌ Connection pool exhausted
- ❌ Slow queries (> 2s)
- ❌ Database size approaching limit
- ❌ Connection errors

---

### 4. Upstash Redis Dashboard
**URL:** https://console.upstash.com/redis

**What to Monitor:**
- Command count (within free tier: 10K/day)
- Memory usage
- Hit rate (should be > 80%)
- Error rate (should be 0%)

**Red Flags:**
- ❌ Approaching daily command limit
- ❌ Hit rate < 50% (caching not effective)
- ❌ Connection errors

---

### 5. Upstash QStash Dashboard
**URL:** https://console.upstash.com/qstash

**What to Monitor:**
- Scheduled jobs (hourly archival)
- Job success rate (should be 100%)
- Job duration (< 30s expected)
- Messages sent (within free tier: 500/day)

**Red Flags:**
- ❌ Jobs failing
- ❌ Jobs taking > 60s
- ❌ Approaching message limit
- ❌ Authentication errors

---

## Monitoring Schedule

### First 24 Hours (Intensive)

#### Hourly Checks (Every hour)
```markdown
## [Date/Time] Hourly Check

### Vercel
- [ ] Deployment status: ___________
- [ ] Error rate: ___________
- [ ] Active users: ___________
- [ ] p95 duration: ___________

### Sentry
- [ ] Error count: ___________
- [ ] New issues: ___________
- [ ] User impact: ___________

### Database
- [ ] Connections: ___________
- [ ] Query performance: ___________
- [ ] Database size: ___________

### Background Jobs
- [ ] QStash job status: ___________
- [ ] Last run: ___________
- [ ] Duration: ___________

### Notes
[Any observations, issues, or anomalies]
```

**Expected Values:**
- Vercel errors: 0%
- Sentry errors: 0
- Database connections: < 10
- QStash jobs: 1 per hour (successful)

---

### First Week (Active)

#### Daily Checks (Once per day)

**Morning Check (9:00 AM):**
1. ✅ **Review overnight activity**
   - Check Sentry for any overnight errors
   - Review Vercel logs for anomalies
   - Verify all QStash jobs ran successfully

2. ✅ **Check key metrics**
   - Total users signed up
   - Total listening events archived
   - Error rate (target: < 0.1%)
   - Average response time (target: < 500ms)

3. ✅ **Database health**
   - Connection count
   - Slow query log
   - Database size growth

4. ✅ **User feedback**
   - Check support email
   - Monitor social media mentions
   - Review user-reported issues

**Evening Check (6:00 PM):**
1. ✅ **Daytime performance**
   - Peak traffic handling
   - Error spikes
   - User sign-ups

2. ✅ **Resource usage**
   - Vercel bandwidth
   - Redis command count
   - QStash message count
   - Database size

---

### Ongoing (Routine)

#### Weekly Reviews (Every Monday)

**Weekly Metrics Report:**
```markdown
# Week of [Date]

## User Growth
- New sign-ups: _____
- Total active users: _____
- Retention rate: _____

## Technical Health
- Uptime: _____% (target: 99.9%)
- Error rate: _____% (target: < 0.1%)
- Average response time: _____ms (target: < 500ms)

## Infrastructure Usage
- Vercel function invocations: _____ (check pricing tier)
- Database size: _____MB (limit: 512MB free tier)
- Redis commands: _____ (limit: 10K/day free tier)
- QStash messages: _____ (limit: 500/day free tier)

## Issues
- Critical: _____
- High: _____
- Medium: _____
- Low: _____

## Actions Needed
- [ ] Action 1
- [ ] Action 2
```

#### Monthly Tasks (First Monday of Month)

1. ✅ **Security audit**
   - Run `npm audit`
   - Check for dependency updates
   - Review security headers
   - Verify rate limiting effectiveness

2. ✅ **Performance review**
   - Analyze slow queries
   - Review caching hit rates
   - Check bundle size
   - Run Lighthouse audit

3. ✅ **Cost review**
   - Vercel usage vs limits
   - Database size vs limits
   - Redis commands vs limits
   - QStash messages vs limits
   - Plan for scaling if approaching limits

4. ✅ **Backup verification**
   - Test database restore procedure
   - Verify Neon backups are running
   - Document any data recovery needs

---

## Health Check Endpoint

**URL:** https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app/api/health

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-04T22:43:09.113Z",
  "uptime": 4.709668005,
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 844
    },
    "spotify": {
      "status": "healthy",
      "responseTime": 120
    }
  }
}
```

**Quick Check Command:**
```bash
curl -s https://audiospective-etxcojlzi-djadejam-commits-projects.vercel.app/api/health | jq .
```

**What to Look For:**
- ✅ `status: "healthy"`
- ✅ Database response time < 1000ms
- ✅ Spotify API response time < 200ms
- ❌ Any service with `status: "unhealthy"`

---

## Alert Response Procedures

### Error Alerts (Sentry)

**When:** New error detected in Sentry

**Priority Levels:**
- **SEV-1 (Critical):** Data loss, complete outage
- **SEV-2 (High):** Feature broken, affecting > 20% users
- **SEV-3 (Medium):** Minor feature issue, < 20% users
- **SEV-4 (Low):** Cosmetic issue, no user impact

**Response Steps:**

#### SEV-1 (Critical)
1. ⚠️ **Immediate:** Check if rollback needed
2. ⚠️ **5 min:** Post incident status update
3. ⚠️ **15 min:** If not resolved, initiate rollback
4. ⚠️ **30 min:** Post user communication
5. ⚠️ **24h:** Conduct post-mortem

#### SEV-2 (High)
1. 🟡 **15 min:** Assess impact and scope
2. 🟡 **30 min:** Develop fix or workaround
3. 🟡 **1h:** Deploy hotfix
4. 🟡 **2h:** Verify fix in production
5. 🟡 **24h:** Post-mortem if needed

#### SEV-3 (Medium)
1. 🔵 **1h:** Create ticket
2. 🔵 **4h:** Assess and prioritize
3. 🔵 **24h:** Schedule fix for next sprint
4. 🔵 **3 days:** Deploy fix

#### SEV-4 (Low)
1. ⚪ **24h:** Create ticket
2. ⚪ **1 week:** Fix in next release

---

### Performance Degradation

**When:** Response times > 1 second (p95)

**Response Steps:**

1. ✅ **Check database performance**
   ```sql
   -- In Neon SQL Editor
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```
   - Look for slow queries
   - Check connection count

2. ✅ **Check Vercel metrics**
   - Function cold starts
   - Function memory usage
   - Region performance

3. ✅ **Check external services**
   - Spotify API latency
   - Redis latency

4. ✅ **Optimize if needed**
   - Add database indexes
   - Implement caching
   - Increase function memory

---

### High Error Rate

**When:** Error rate > 1% of requests

**Response Steps:**

1. ✅ **Identify error type** (Sentry)
   - Authentication errors?
   - Database errors?
   - Spotify API errors?
   - Validation errors?

2. ✅ **Assess user impact**
   - % of users affected
   - Critical features broken?
   - Workaround available?

3. ✅ **Decide response**
   - If > 20% users: Consider rollback
   - If < 20% users: Deploy hotfix
   - If < 5% users: Can wait for next release

4. ✅ **Implement fix**
   - Test in staging
   - Deploy to production
   - Monitor for 1 hour

---

### Resource Limit Approaching

**When:** Approaching free tier limits

**Vercel (100GB bandwidth/month):**
- Warning: 80GB used (80%)
- Action: Review function optimization, consider paid plan

**Database (512MB):**
- Warning: 400MB used (78%)
- Action: Archive old data, consider paid plan

**Redis (10K commands/day):**
- Warning: 8K commands (80%)
- Action: Reduce cache operations, consider paid plan

**QStash (500 messages/day):**
- Warning: 400 messages (80%)
- Action: Optimize job scheduling, consider paid plan

---

## User Sign-Up Monitoring

### First User Checklist

**When:** First user signs up successfully

1. ✅ **Verify full flow worked**
   - Check database: User record created
   - Check database: PlayEvent records created
   - Check logs: No errors during archival
   - Check dashboard: User can see their data

2. ✅ **Gather feedback**
   - Email user asking for feedback
   - Monitor for support requests
   - Check for any error reports

3. ✅ **Celebrate** 🎉
   - First production user is a milestone!

---

### First 10 Users Checklist

**When:** 10 users signed up

1. ✅ **Performance under load**
   - Response times still < 500ms?
   - Database connections reasonable?
   - No error rate increase?

2. ✅ **Common issues**
   - Any recurring error patterns?
   - Any user complaints?
   - Any feature confusion?

3. ✅ **Resource usage trends**
   - Database size growth rate
   - Redis command patterns
   - QStash job success rate

---

## Background Job Monitoring

### QStash Hourly Archival

**Expected Behavior:**
- Runs every hour at minute :00
- Completes in < 30 seconds (per user)
- Success rate: 100%

**Verification:**
```bash
# Check latest job in QStash dashboard
# Or check Vercel function logs for /api/cron/archive
```

**Red Flags:**
- ❌ Job failed (check logs for reason)
- ❌ Job took > 60 seconds (performance issue)
- ❌ Job not running (schedule misconfigured)

**Common Issues:**

**Issue 1: Spotify Token Expired**
- Symptom: 401 errors in archival logs
- Fix: User needs to re-authenticate
- Action: Implement automatic token refresh (Week 3 task)

**Issue 2: Rate Limited by Spotify**
- Symptom: 429 errors in archival logs
- Fix: Implement exponential backoff
- Action: Update archival logic to respect rate limits

**Issue 3: Database Connection Timeout**
- Symptom: Database connection errors
- Fix: Check Neon database status, verify connection pool
- Action: May need to upgrade database plan

---

## Metrics to Track

### Technical Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Uptime | 99.9% | ___% | ___ |
| Error Rate | < 0.1% | ___% | ___ |
| p95 Response Time | < 500ms | ___ms | ___ |
| p99 Response Time | < 1000ms | ___ms | ___ |
| Database Query Time | < 1000ms | ___ms | ___ |
| Background Job Success | 100% | ___% | ___ |

### User Metrics

| Metric | Target (Week 1) | Current | Status |
|--------|-----------------|---------|--------|
| Total Users | 10+ | ___ | ___ |
| Active Users (DAU) | 5+ | ___ | ___ |
| Retention (D1) | > 50% | ___% | ___ |
| Archival Success | > 95% | ___% | ___ |
| Dashboard Load Success | > 99% | ___% | ___ |

### Infrastructure Metrics

| Metric | Free Tier Limit | Current Usage | % Used |
|--------|----------------|---------------|--------|
| Vercel Bandwidth | 100GB/month | ___GB | ___% |
| Database Size | 512MB | ___MB | ___% |
| Redis Commands | 10K/day | ___ | ___% |
| QStash Messages | 500/day | ___ | ___% |

---

## Rollback Procedure

**When to Rollback:**
- Critical errors affecting > 20% of users
- Data loss or corruption
- Complete feature breakdown
- Security vulnerability discovered

**How to Rollback:**

### Method 1: Vercel Dashboard (Fastest)
1. Go to: https://vercel.com/djadejam-commits-projects/audiospective
2. Click "Deployments" tab
3. Find previous successful deployment
4. Click "..." menu → "Promote to Production"
5. Confirm rollback

**Time:** ~2 minutes

### Method 2: Vercel CLI
```bash
vercel rollback
```

**Time:** ~3 minutes

### Method 3: Git Revert + Redeploy
```bash
git revert HEAD
git push origin main
# CI/CD auto-deploys
```

**Time:** ~5 minutes

**Post-Rollback:**
1. Verify health endpoint returns healthy
2. Run smoke tests
3. Post user communication
4. Investigate root cause
5. Fix issue in staging
6. Redeploy when ready

---

## Communication Templates

### Incident Status Update (Internal)

**Subject:** [SEV-X] Incident: [Brief Description]

**Status:** INVESTIGATING | IDENTIFIED | FIXING | MONITORING | RESOLVED

**Impact:**
- Users affected: ___
- Features affected: ___
- Severity: SEV-1 | SEV-2 | SEV-3 | SEV-4

**Timeline:**
- Detected: [Time]
- Response started: [Time]
- Fix deployed: [Time]
- Resolution verified: [Time]

**Next Steps:**
- [ ] Action 1
- [ ] Action 2

---

### User Communication (External)

**Minor Issue:**
> We're currently experiencing minor issues with [feature]. We're working on a fix and expect resolution within [timeframe]. Your data is safe.

**Major Issue:**
> We're aware of an issue affecting [feature/service]. Some users may experience [symptoms]. We're investigating and will provide updates every [frequency]. We apologize for the inconvenience.

**Resolved:**
> The issue affecting [feature] has been resolved. All services are now operating normally. Thank you for your patience.

---

## Success Criteria (First Week)

### Technical Success ✅
- [ ] Uptime > 99.9% (< 1 hour downtime)
- [ ] Error rate < 0.1%
- [ ] p95 response time < 500ms
- [ ] 100% background job success
- [ ] 0 data loss incidents
- [ ] 0 security incidents

### User Success ✅
- [ ] 10+ users signed up
- [ ] 5+ daily active users
- [ ] > 95% archival success rate
- [ ] > 99% dashboard load success
- [ ] Positive user feedback (>4/5 stars)
- [ ] < 5 critical support tickets

### Operational Success ✅
- [ ] All monitoring dashboards operational
- [ ] All alerts configured and working
- [ ] Rollback procedure tested
- [ ] Team comfortable with operations
- [ ] Documentation up to date

---

## Review Schedule

### Daily Review (First Week)
**When:** End of each day
**Duration:** 15 minutes
**Participants:** Dev team

**Agenda:**
1. Review metrics vs targets
2. Discuss any issues encountered
3. Adjust monitoring if needed
4. Plan next day's priorities

---

### Weekly Review (Ongoing)
**When:** Every Monday 10:00 AM
**Duration:** 30 minutes
**Participants:** Dev team + PM

**Agenda:**
1. Review weekly metrics
2. Discuss user feedback
3. Review infrastructure costs
4. Plan optimizations/features
5. Update roadmap

---

### Monthly Review (Ongoing)
**When:** First Monday of month
**Duration:** 1 hour
**Participants:** Full team

**Agenda:**
1. Review monthly metrics
2. Security audit results
3. Performance optimization opportunities
4. Cost analysis and projections
5. Feature prioritization
6. Team retrospective

---

## Emergency Contacts

**On-Call Engineer:** [Your contact info]
**Backup Engineer:** [Backup contact]
**Project Manager:** [PM contact]

**Service Providers:**
- **Vercel Support:** https://vercel.com/help
- **Neon Support:** support@neon.tech
- **Upstash Support:** support@upstash.com
- **Sentry Support:** https://sentry.io/support/

---

## Conclusion

This monitoring guide ensures **proactive detection and response** to production issues. Follow the schedules, track the metrics, and respond quickly to alerts.

**Remember:**
- ✅ First 24 hours are critical - check hourly
- ✅ First week sets the tone - check daily
- ✅ Ongoing success requires routine - review weekly
- ✅ When in doubt, check the health endpoint
- ✅ Always communicate during incidents

**Good luck! 🚀**

---

🤖 **Generated with Claude Code**

Co-Authored-By: Claude <noreply@anthropic.com>
