# Database Backup & Restore Guide

**Why backups are critical:**
- Protect against accidental data deletion
- Enable disaster recovery
- Allow testing migrations safely
- Comply with data retention requirements

---

## Backup Methods

We provide **two backup methods**:

### Method 1: pg_dump (Universal)
✅ Works with any PostgreSQL database (Neon, Supabase, Railway, self-hosted)
✅ Creates portable .sql files
✅ Simple and reliable
❌ Slower for large databases

### Method 2: Neon Branches (Neon-specific)
✅ Instant backups (copy-on-write)
✅ Zero storage cost (within limits)
✅ Native Neon feature
❌ Only works with Neon databases

---

## Quick Start

### Create a Backup

**Using pg_dump (any database):**
```bash
npm run backup
```

**Using Neon branches (Neon only):**
```bash
npm run backup:neon
```

### Restore a Backup

```bash
npm run restore backups/backup_spotify_time_machine_20240315_143022.sql.gz
```

---

## Method 1: pg_dump Backups (Universal)

### Prerequisites

Install PostgreSQL client tools:

**macOS:**
```bash
brew install postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### Create Manual Backup

```bash
./scripts/backup-database.sh
```

**What this does:**
1. Reads `DATABASE_URL` from `.env`
2. Creates `backups/` directory
3. Runs `pg_dump` to export all data
4. Compresses the backup with gzip
5. Keeps only the last 7 backups (auto-cleanup)

**Output:**
```
backups/
  backup_spotify_time_machine_20240315_143022.sql.gz  (latest)
  backup_spotify_time_machine_20240314_120000.sql.gz
  backup_spotify_time_machine_20240313_120000.sql.gz
  ...
```

### Restore from Backup

```bash
./scripts/restore-database.sh backups/backup_spotify_time_machine_20240315_143022.sql.gz
```

**⚠️ WARNING:** This will **delete ALL current data** and replace it with the backup!

**What this does:**
1. Confirms you want to proceed (type "yes")
2. Decompresses the backup
3. Drops all existing tables
4. Restores all data from backup
5. Verifies restoration

### Automated Daily Backups (Production)

**Using cron (Linux/macOS):**

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 3 AM)
0 3 * * * cd /path/to/audiospective && ./scripts/backup-database.sh >> logs/backup.log 2>&1
```

**Using GitHub Actions:**

```yaml
# .github/workflows/backup.yml
name: Daily Database Backup

on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install PostgreSQL client
        run: sudo apt-get install postgresql-client

      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: ./scripts/backup-database.sh

      - name: Upload to AWS S3
        run: aws s3 cp backups/ s3://your-bucket/backups/ --recursive
```

**Using Vercel Cron:**

```typescript
// app/api/cron/backup/route.ts
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Run backup script
    await execAsync('./scripts/backup-database.sh');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Then configure in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/backup",
    "schedule": "0 3 * * *"
  }]
}
```

---

## Method 2: Neon Branch Backups (Neon-specific)

### Why Use Neon Branches?

**Advantages:**
- ⚡ **Instant** - Backups complete in <1 second
- 💰 **Free** - No storage cost (copy-on-write)
- 🎯 **Point-in-time** - Exact snapshot of database state
- 🔄 **Easy restore** - One-click restore in Neon dashboard

**Disadvantages:**
- Only works with Neon databases
- Requires Neon CLI setup
- Backups expire after 7 days (free tier)

### Setup Neon CLI

1. **Install neonctl:**
   ```bash
   npm install -g neonctl
   ```

2. **Get API key:**
   - Go to: https://console.neon.tech
   - Profile → Account Settings
   - Developer Settings → API Keys
   - Generate new key

3. **Add to .env:**
   ```bash
   NEON_API_KEY=your_api_key_here
   ```

### Create Neon Branch Backup

```bash
./scripts/backup-database-neon.sh
```

**What this does:**
1. Validates Neon CLI is installed
2. Checks NEON_API_KEY
3. Extracts project ID from DATABASE_URL
4. Creates a new branch: `backup_YYYYMMDD_HHMMSS`
5. Lists all backup branches

**Output:**
```
Branch "backup_20240315_143022" created successfully!
```

### Restore from Neon Branch

**Option 1: Via Neon Dashboard (Recommended)**
1. Go to: https://console.neon.tech
2. Select your project
3. Click "Branches" tab
4. Find your backup branch: `backup_20240315_143022`
5. Click "⋯" menu → "Set as Primary"
6. Confirm restoration

**Option 2: Via CLI**
```bash
neonctl branches set-primary backup_20240315_143022 --project-id YOUR_PROJECT_ID
```

### Delete Old Backups

```bash
# List all backups
neonctl branches list --project-id YOUR_PROJECT_ID | grep backup_

# Delete a specific backup
neonctl branches delete backup_20240310_120000 --project-id YOUR_PROJECT_ID
```

---

## Best Practices

### 1. Backup Frequency

**Production:**
- Daily automatic backups (minimum)
- Before each deployment
- Before schema migrations
- After major data imports

**Development:**
- Before schema changes
- Before testing migrations
- After adding significant test data

### 2. Backup Retention

**Keep:**
- Last 7 daily backups (1 week)
- Last 4 weekly backups (1 month)
- Last 12 monthly backups (1 year)

**Example retention script:**
```bash
#!/bin/bash
# Keep: 7 daily, 4 weekly, 12 monthly

# Daily (last 7 days)
ls -t backups/backup_*.sql.gz | tail -n +8 | xargs rm -f

# Weekly (every Sunday, last 4)
# ... (implement weekly logic)

# Monthly (1st of month, last 12)
# ... (implement monthly logic)
```

### 3. Backup Storage

**Local Development:**
- Keep in `backups/` folder (gitignored)

**Production:**
- **AWS S3** - Recommended (cheap, reliable)
- **Backblaze B2** - Even cheaper
- **Google Cloud Storage** - Good integration with GCP
- **Neon Branches** - Best for Neon users (free)

**Never:**
- ❌ Commit backups to Git
- ❌ Store only locally in production
- ❌ Keep backups on same server as database

### 4. Test Restores Regularly

**Why:** Untested backups are useless backups!

**Monthly drill:**
1. Create a test database
2. Restore latest backup
3. Verify data integrity
4. Document any issues

```bash
# Create test database
createdb spotify_time_machine_test

# Restore to test DB
DATABASE_URL="postgresql://user:pass@localhost:5432/spotify_time_machine_test" \
  ./scripts/restore-database.sh backups/latest.sql.gz

# Verify
psql spotify_time_machine_test -c "SELECT COUNT(*) FROM users;"
```

### 5. Encrypt Sensitive Backups

If backups contain sensitive data:

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Decrypt backup
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

---

## Backup Checklist

Before going to production, verify:

- [ ] Backup script tested and working
- [ ] Daily automated backups configured
- [ ] Backups stored in secure location (S3, etc.)
- [ ] Restore process tested successfully
- [ ] Team knows how to restore from backup
- [ ] Backup monitoring/alerts configured
- [ ] Retention policy documented
- [ ] Disaster recovery plan written

---

## Troubleshooting

### Error: "pg_dump: command not found"

**Solution:** Install PostgreSQL client tools
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### Error: "Authentication failed"

**Solution:** Check DATABASE_URL credentials
```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Error: "Permission denied"

**Solution:** Make scripts executable
```bash
chmod +x scripts/backup-database.sh
chmod +x scripts/restore-database.sh
```

### Error: "Disk space full"

**Solution:** Clean old backups
```bash
# Delete backups older than 7 days
find backups/ -name "backup_*.sql.gz" -mtime +7 -delete
```

### Error: "Backup takes too long"

**Solutions:**
1. Use Neon branches (instant)
2. Compress aggressively: `gzip -9`
3. Backup only essential tables
4. Use incremental backups (advanced)

---

## Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

**Detection:** User reports missing data

**Response:**
1. Stop the application immediately
   ```bash
   vercel --prod --no-wait
   ```

2. Identify when data was deleted
   ```sql
   SELECT MAX(created_at) FROM play_events;
   ```

3. Find most recent backup before deletion
   ```bash
   ls -lt backups/
   ```

4. Restore to temporary database
   ```bash
   DATABASE_URL="postgresql://user:pass@host:5432/temp_db" \
     ./scripts/restore-database.sh backups/backup_YYYYMMDD_HHMMSS.sql.gz
   ```

5. Extract missing data
   ```sql
   \copy (SELECT * FROM play_events WHERE user_id = 'xxx') TO 'missing_data.csv' CSV HEADER
   ```

6. Import to production
   ```sql
   \copy play_events FROM 'missing_data.csv' CSV HEADER
   ```

7. Verify and restart application

### Scenario 2: Database Corruption

**Detection:** Database errors, query failures

**Response:**
1. Check Neon/Supabase status page
2. If corrupted, restore from latest backup
3. Notify users of potential data loss
4. Investigate root cause

### Scenario 3: Complete Database Loss

**Detection:** Database completely unreachable

**Response:**
1. Provision new database (Neon, Supabase)
2. Restore from latest backup
3. Update DATABASE_URL in production
4. Redeploy application
5. Verify all functionality works

---

## Resources

- [PostgreSQL Backup Guide](https://www.postgresql.org/docs/current/backup.html)
- [Neon Branching Docs](https://neon.tech/docs/introduction/branching)
- [AWS S3 for Backups](https://docs.aws.amazon.com/AmazonS3/latest/userguide/backup-and-restore.html)
- [Cron Job Syntax](https://crontab.guru/)

---

**Created:** Day 2 of 14-Day Plan
**Time to implement:** 1 hour
**Production value:** Critical - Don't skip this!
