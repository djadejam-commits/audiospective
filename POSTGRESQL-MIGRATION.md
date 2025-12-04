# PostgreSQL Migration Guide
**From SQLite to PostgreSQL (Production Ready)**

---

## ⚠️ **Why This Is Critical**

Your current SQLite database will **fail in production** with these issues:
- 🔴 Crashes with concurrent users (>10 users)
- 🔴 File locking errors
- 🔴 No connection pooling
- 🔴 Cannot scale horizontally

**PostgreSQL fixes all of these issues and is production-ready.**

---

## 📋 **Prerequisites**

- [ ] Neon/Supabase/Railway account (all have free tiers)
- [ ] PostgreSQL connection string
- [ ] Backup of current SQLite data (if needed)

---

## 🚀 **Step-by-Step Migration**

### **Step 1: Get PostgreSQL Database (5 minutes)**

#### Option A: Neon (Recommended) ⭐
1. Visit: https://neon.tech
2. Click "Sign up" (free tier: 0.5GB storage)
3. Create new project: "spotify-time-machine"
4. Select region closest to your users
5. Copy connection string:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/spotify_time_machine
   ```

#### Option B: Supabase
1. Visit: https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy "Connection string" (URI mode)

#### Option C: Railway
1. Visit: https://railway.app
2. New Project → Add PostgreSQL
3. Copy `DATABASE_URL` from Variables tab

---

### **Step 2: Update Environment Variables (2 minutes)**

1. **Update your `.env` file:**
   ```bash
   # Replace with your actual PostgreSQL connection string
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```

2. **For production (Vercel):**
   ```bash
   vercel env add DATABASE_URL production
   # Paste your Neon/Supabase connection string
   ```

---

### **Step 3: Run Migration (5 minutes)**

**The schema has already been updated to PostgreSQL!**

Now run these commands:

```bash
# 1. Generate Prisma Client with PostgreSQL
npx prisma generate

# 2. Push schema to your new PostgreSQL database
npx prisma db push

# 3. Verify migration succeeded
npx prisma studio
```

**What this does:**
- Creates all tables in PostgreSQL
- Sets up indexes and constraints
- Generates updated Prisma Client

---

### **Step 4: Migrate Existing Data (Optional)**

**If you have important data in SQLite:**

```bash
# Export from SQLite
npx prisma db execute --stdin < export-sqlite.sql > data-export.sql

# Import to PostgreSQL
psql $DATABASE_URL < data-export.sql
```

**Or use this script:**

```typescript
// scripts/migrate-data.ts
import { PrismaClient as SQLiteClient } from '@prisma/client';
import { PrismaClient as PostgresClient } from '@prisma/client';

const sqlite = new SQLiteClient({
  datasources: { db: { url: 'file:./prisma/dev.db' } }
});

const postgres = new PostgresClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function migrate() {
  // Migrate users
  const users = await sqlite.user.findMany();
  for (const user of users) {
    await postgres.user.upsert({
      where: { spotifyId: user.spotifyId },
      create: user,
      update: user
    });
  }

  // Migrate play events, artists, etc.
  console.log('Migration complete!');
}

migrate();
```

**Run migration:**
```bash
npx ts-node scripts/migrate-data.ts
```

---

### **Step 5: Test PostgreSQL Connection (2 minutes)**

```bash
# Start dev server
npm run dev

# Visit http://localhost:3000
# Sign in with Spotify
# Verify dashboard loads
```

**Check for errors in terminal:**
- ✅ "Prisma Client ready"
- ✅ No "SQLITE_" errors
- ✅ Dashboard queries work

---

### **Step 6: Update Production (Vercel)**

```bash
# Set production DATABASE_URL
vercel env add DATABASE_URL production
# Paste Neon connection string

# Deploy
git add .
git commit -m "feat(db): migrate from SQLite to PostgreSQL"
git push origin main

# Vercel auto-deploys

# Run migrations on production
vercel exec -- npx prisma db push
```

---

## ✅ **Verification Checklist**

After migration, verify:

- [ ] Dev server starts without errors
- [ ] Can sign in with Spotify
- [ ] Dashboard loads
- [ ] Can run manual archival (`/test`)
- [ ] Play events are saved
- [ ] Genres tab shows data
- [ ] Export works
- [ ] Share works

---

## 🔄 **Rollback Plan (If Needed)**

If PostgreSQL migration fails:

1. **Revert schema.prisma:**
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Update .env:**
   ```bash
   DATABASE_URL="file:./dev.db"
   ```

3. **Regenerate client:**
   ```bash
   npx prisma generate
   npm run dev
   ```

---

## 📊 **Performance Comparison**

| Metric | SQLite | PostgreSQL |
|--------|--------|------------|
| **Concurrent users** | ~5 | Unlimited |
| **Connection pooling** | ❌ | ✅ |
| **Horizontal scaling** | ❌ | ✅ |
| **Automated backups** | ❌ | ✅ (Neon) |
| **Point-in-time recovery** | ❌ | ✅ (Neon) |
| **Production ready** | ❌ | ✅ |

---

## 🐛 **Troubleshooting**

### Error: "Can't reach database server"
**Solution:** Check your connection string format and network access

### Error: "SSL connection required"
**Solution:** Add `?sslmode=require` to connection string:
```
postgresql://user:pass@host:5432/db?sslmode=require
```

### Error: "Database does not exist"
**Solution:** Neon/Supabase create DB automatically. For local PostgreSQL:
```bash
createdb spotify_time_machine
```

### Error: "Migration conflicts"
**Solution:** Reset database (DEV ONLY):
```bash
npx prisma migrate reset
npx prisma db push
```

---

## 🎯 **Next Steps After Migration**

1. ✅ PostgreSQL migration complete
2. ⏭️ Set up automated backups (Day 2 Task 2)
3. ⏭️ Configure connection pooling (if needed)
4. ⏭️ Monitor query performance
5. ⏭️ Deploy to production

---

## 📚 **Resources**

- [Neon Docs](https://neon.tech/docs)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

---

**Migration created:** Day 2 of 14-Day Plan
**Estimated time:** 15-30 minutes
**Difficulty:** Easy (following steps)
