# Production Deployment Instructions

## Required: Database Migration

After the latest deployment, you **must** run the database migration to add the new `archiveRequested` fields.

### Option A: Automatic Migration (Recommended)

Run this command after the Vercel build completes:

```bash
npx prisma migrate deploy
```

**Where to run:**
- In Vercel's terminal (if available)
- OR locally with your production DATABASE_URL

### Option B: Manual SQL (Quick)

If you prefer, run this SQL directly in your Neon database console:

```sql
-- Add manual archive request fields
ALTER TABLE "users" ADD COLUMN "archive_requested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "archive_requested_at" TIMESTAMP;
```

## Verification

After running the migration, verify it worked:

```sql
-- Check that columns exist
SELECT archive_requested, archive_requested_at
FROM users
LIMIT 1;
```

Expected result: Query succeeds (even if returning no rows or NULL values)

## Next Steps After Migration

1. **Test Manual Archive**
   - Visit: `https://audiospective.vercel.app/test`
   - Click "Request Archive"
   - Should see: "Archive In Progress..." with progress bar
   - After 60-90 seconds: "Archive Completed!"

2. **Verify Cron Job**
   - Go to Vercel Dashboard → Settings → Cron Jobs
   - Should see: `/api/cron/simple-archive` running every hour
   - Check: Ensure `CRON_SECRET` is set in Environment Variables

3. **Monitor First Cron Run**
   - Wait for next hour mark (e.g., 3:00 PM, 4:00 PM)
   - Check: Vercel function logs for `/api/cron/simple-archive`
   - Expected: `"Starting simplified hourly archival job"`

## Troubleshooting

### Migration Fails

**Error**: `column "archive_requested" already exists`
- **Solution**: Migration already applied, skip it

**Error**: `permission denied`
- **Solution**: Ensure DATABASE_URL has write permissions

### Manual Archive Not Working

**Error**: `archiveRequested is not defined`
- **Solution**: Migration not run yet, see above

**Status stuck on "pending"**
- **Solution**: Cron job hasn't run yet, wait for next hour mark
- **OR**: Manually trigger cron (see VERCEL-CRON-SETUP.md)

## Related Documentation

- `VERCEL-CRON-SETUP.md` - Cron job configuration and monitoring
- `prisma/migrations/20251206221900_add_manual_archive_request_fields/migration.sql` - Migration file
