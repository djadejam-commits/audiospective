# Raw SQL Best Practices

**Status**: Active
**Last Updated**: December 6, 2025
**Related Incident**: INC-2025-12-05-001

---

## Overview

This document provides guidelines for safely using raw SQL queries in Audiospective. Raw SQL should be avoided when possible in favor of Prisma's type-safe query methods.

**Critical Rule**: When raw SQL is unavoidable, always use snake_case table and column names matching the PostgreSQL schema, never PascalCase Prisma model names.

---

## Why Avoid Raw SQL?

### Risks

1. **Type Safety Lost** - No TypeScript type checking
2. **SQL Injection** - Vulnerable to injection attacks if not parameterized
3. **Database Coupling** - Tied to specific SQL dialect (PostgreSQL)
4. **Table Name Mismatches** - Prisma models use PascalCase, PostgreSQL uses snake_case
5. **Maintenance Burden** - Changes to schema require manual SQL updates
6. **Testing Difficulty** - Harder to mock and test than Prisma methods

### When Raw SQL IS Required

Use raw SQL only when:
- ✅ Complex aggregations not supported by Prisma
- ✅ Performance-critical queries requiring specific SQL optimizations
- ✅ Database-specific features (window functions, CTEs, etc.)
- ✅ Bulk operations more efficient in raw SQL

---

## The Golden Rule: snake_case vs PascalCase

### ❌ WRONG (INC-2025-12-05-001)

```typescript
// This will FAIL in PostgreSQL!
const result = await prisma.$queryRaw`
  SELECT *
  FROM "PlayEvent"
  INNER JOIN "Track" ON "PlayEvent"."trackId" = "Track"."id"
  WHERE "PlayEvent"."userId" = ${userId}
`;
```

**Why it fails**: PostgreSQL tables are named `play_events`, `tracks`, etc. (snake_case), not `PlayEvent`, `Track` (PascalCase).

### ✅ CORRECT

```typescript
// This works correctly
const result = await prisma.$queryRaw`
  SELECT *
  FROM "play_events"
  INNER JOIN "tracks" ON "play_events"."track_id" = "tracks"."id"
  WHERE "play_events"."user_id" = ${userId}
`;
```

---

## Table & Column Name Reference

Always use these **actual PostgreSQL names** in raw SQL:

### Tables

| Prisma Model | PostgreSQL Table | ✅ Use in SQL |
|--------------|------------------|---------------|
| `User` | `users` | `"users"` |
| `PlayEvent` | `play_events` | `"play_events"` |
| `Track` | `tracks` | `"tracks"` |
| `Artist` | `artists` | `"artists"` |
| `Album` | `albums` | `"albums"` |
| `_TrackArtists` | `_TrackArtists` | `"_TrackArtists"` (many-to-many) |

### Common Columns

| Prisma Field | PostgreSQL Column | ✅ Use in SQL |
|--------------|-------------------|---------------|
| `userId` | `user_id` | `"user_id"` |
| `trackId` | `track_id` | `"track_id"` |
| `artistId` | `artist_id` | `"artist_id"` |
| `albumId` | `album_id` | `"album_id"` |
| `spotifyId` | `spotify_id` | `"spotify_id"` |
| `playedAt` | `played_at` | `"played_at"` |
| `createdAt` | `created_at` | `"created_at"` |
| `updatedAt` | `updated_at` | `"updated_at"` |

**Tip**: Check `prisma/schema.prisma` for `@@map()` and `@map()` directives to find actual names.

---

## How to Find the Correct Table/Column Names

### Method 1: Check Prisma Schema

```prisma
model PlayEvent {
  id       Int      @id @default(autoincrement())
  userId   String   @map("user_id")  // ← Column is "user_id" in PostgreSQL
  trackId  String   @map("track_id") // ← Column is "track_id" in PostgreSQL
  playedAt DateTime @map("played_at")

  @@map("play_events") // ← Table is "play_events" in PostgreSQL
}
```

### Method 2: Use Prisma Studio or Database Client

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# List all tables
\dt

# Describe table structure
\d play_events
```

### Method 3: Run Migration and Check SQL

```bash
# Generate migration without applying
npx prisma migrate dev --create-only

# Check generated SQL in prisma/migrations/[timestamp]/migration.sql
```

---

## Safe Raw SQL Patterns

### 1. Always Use Parameterized Queries

❌ **NEVER** concatenate user input:

```typescript
// SQL INJECTION VULNERABILITY!
const userId = req.query.userId;
const result = await prisma.$queryRawUnsafe(`
  SELECT * FROM users WHERE id = '${userId}'
`);
```

✅ **ALWAYS** use parameterized queries:

```typescript
const userId = req.query.userId;
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE id = ${userId}
`;
```

### 2. Use TypeScript Type Annotations

```typescript
type ArtistCount = {
  artistId: number;
  spotifyId: string;
  name: string;
  playCount: bigint; // PostgreSQL COUNT returns bigint
};

const topArtists = await prisma.$queryRaw<ArtistCount[]>`
  SELECT
    "artists"."id" as "artistId",
    "artists"."spotify_id" as "spotifyId",
    "artists"."name",
    COUNT(*) as "playCount"
  FROM "play_events"
  INNER JOIN "tracks" ON "play_events"."track_id" = "tracks"."id"
  INNER JOIN "_TrackArtists" ON "tracks"."id" = "_TrackArtists"."B"
  INNER JOIN "artists" ON "_TrackArtists"."A" = "artists"."id"
  WHERE "play_events"."user_id" = ${userId}
  GROUP BY "artists"."id", "artists"."spotify_id", "artists"."name"
  ORDER BY "playCount" DESC
  LIMIT 50
`;

// Convert BigInt to number for JSON serialization
const serializable = topArtists.map(artist => ({
  ...artist,
  playCount: Number(artist.playCount)
}));
```

### 3. Quote Table and Column Names

Always quote identifiers to avoid reserved word conflicts:

```sql
-- ✅ GOOD: Quoted identifiers
SELECT "name" FROM "users" WHERE "id" = 1

-- ❌ RISKY: Unquoted (fails if name is reserved word)
SELECT name FROM users WHERE id = 1
```

### 4. Test with Both SQLite and PostgreSQL

```typescript
// Add environment check for dev vs prod
if (process.env.DATABASE_URL?.startsWith('file:')) {
  console.warn('⚠️ Using SQLite in development - SQL may behave differently in production PostgreSQL');
}
```

---

## ESLint Warnings

This project has ESLint rules (eslint.config.mjs:41-59) that warn when raw SQL is used:

```javascript
// ⚠️ Triggers warning
prisma.$queryRaw`SELECT ...`;

// ❌ Triggers error
prisma.$queryRawUnsafe('SELECT ...');
```

**When you see this warning**:
1. Check if Prisma method can achieve the same result
2. If raw SQL is necessary, add comment explaining why
3. Follow this guide for safe implementation
4. Add integration tests verifying correct table names

---

## Prefer Prisma Methods

### Example 1: Counting Records

❌ **Avoid**:
```typescript
const count = await prisma.$queryRaw<[{ count: bigint }]>`
  SELECT COUNT(*) as count FROM "play_events" WHERE "user_id" = ${userId}
`;
return Number(count[0].count);
```

✅ **Better**:
```typescript
const count = await prisma.playEvent.count({
  where: { userId }
});
return count;
```

### Example 2: Finding Unique Values

❌ **Avoid**:
```typescript
const uniqueTracks = await prisma.$queryRaw`
  SELECT DISTINCT "track_id" FROM "play_events" WHERE "user_id" = ${userId}
`;
```

✅ **Better**:
```typescript
const uniqueTracks = await prisma.playEvent.findMany({
  where: { userId },
  select: { trackId: true },
  distinct: ['trackId']
});
```

### Example 3: Aggregations

❌ **Avoid** (unless performance critical):
```typescript
const stats = await prisma.$queryRaw`
  SELECT
    COUNT(*) as total,
    COUNT(DISTINCT "track_id") as tracks
  FROM "play_events"
  WHERE "user_id" = ${userId}
`;
```

✅ **Better**:
```typescript
const [total, tracks] = await Promise.all([
  prisma.playEvent.count({ where: { userId } }),
  prisma.playEvent.findMany({
    where: { userId },
    select: { trackId: true },
    distinct: ['trackId']
  }).then(result => result.length)
]);
```

---

## When Raw SQL Is Justified

### Complex Aggregations with Joins

```typescript
// This is acceptable - Prisma doesn't support this aggregation pattern
const topArtists = await prisma.$queryRaw<ArtistCount[]>`
  SELECT
    "artists"."id" as "artistId",
    "artists"."spotify_id" as "spotifyId",
    "artists"."name",
    COUNT(*) as "playCount"
  FROM "play_events"
  INNER JOIN "tracks" ON "play_events"."track_id" = "tracks"."id"
  INNER JOIN "_TrackArtists" ON "tracks"."id" = "_TrackArtists"."B"
  INNER JOIN "artists" ON "_TrackArtists"."A" = "artists"."id"
  WHERE "play_events"."user_id" = ${userId}
    ${dateRangeClause}
  GROUP BY "artists"."id", "artists"."spotify_id", "artists"."name"
  ORDER BY "playCount" DESC
  LIMIT ${limit}
`;
```

**Why justified**:
- Requires complex JOIN across many-to-many relationship
- Aggregation with GROUP BY not easily done in Prisma
- Performance-critical query (top artists)

**Requirements when using**:
- ✅ Add comment explaining why Prisma can't do this
- ✅ Use typed result with `prisma.$queryRaw<Type[]>`
- ✅ Parameterize all user inputs
- ✅ Add integration test verifying table names
- ✅ Document in code review

---

## Testing Raw SQL

### Integration Tests Must Verify Table Names

```typescript
// tests/integration/api/top-artists.test.ts
it('should use correct PostgreSQL table names in raw SQL', async () => {
  // ... setup mocks ...

  await GET(req);

  // Verify query contains correct table names
  const queryCall = (prisma.$queryRaw as any).mock.calls[0];
  const sqlQuery = queryCall[0].toString();

  // CRITICAL: Must use snake_case (INC-2025-12-05-001 prevention)
  expect(sqlQuery).toContain('play_events');
  expect(sqlQuery).toContain('tracks');
  expect(sqlQuery).toContain('artists');
  expect(sqlQuery).toContain('_TrackArtists');
  expect(sqlQuery).toContain('track_id');
  expect(sqlQuery).toContain('user_id');

  // Should NOT contain PascalCase
  expect(sqlQuery).not.toContain('"PlayEvent"');
  expect(sqlQuery).not.toContain('"Track"');
  expect(sqlQuery).not.toContain('"Artist"');
});
```

---

## Migration from SQLite to PostgreSQL

### Key Differences

| Feature | SQLite | PostgreSQL | Impact |
|---------|--------|------------|--------|
| Case sensitivity | Case-insensitive | Case-sensitive | Table names must match exactly |
| `@@map()` directive | Often ignored | Always respected | Must use mapped names |
| BigInt | Returns number | Returns `bigint` | Must convert to number for JSON |
| Quotes | Optional | Recommended | Always quote identifiers |

### Before Deploying

1. **Test with PostgreSQL locally**:
   ```bash
   # Use docker-compose or local PostgreSQL
   docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres

   # Update DATABASE_URL to point to PostgreSQL
   DATABASE_URL="postgresql://postgres:password@localhost:5432/audiospective_dev"

   # Run migrations
   npx prisma migrate dev

   # Run integration tests
   npm run test:integration
   ```

2. **Verify all raw SQL queries**:
   ```bash
   # Find all raw SQL usage
   grep -r "\$queryRaw\|\$executeRaw" src/

   # Check each one against this guide
   ```

3. **Run deployment verification checklist** (docs/DEPLOYMENT-VERIFICATION-CHECKLIST.md)

---

## Checklist for Raw SQL PRs

Before merging code with raw SQL, verify:

- [ ] Raw SQL is necessary (can't be done with Prisma)
- [ ] Justification comment explaining why
- [ ] Uses `prisma.$queryRaw` (not `$queryRawUnsafe`)
- [ ] All table names are snake_case
- [ ] All column names are snake_case
- [ ] Table/column names checked against `prisma/schema.prisma`
- [ ] TypeScript type annotation provided
- [ ] All user inputs are parameterized
- [ ] Integration test verifies correct table names
- [ ] Integration test verifies correct output type
- [ ] Handles BigInt → number conversion if needed
- [ ] Tested with actual PostgreSQL database
- [ ] ESLint warning acknowledged and justified
- [ ] Code review includes SQL review

---

## References

- [Incident Report: INC-2025-12-05-001](./INCIDENTS/2025-12-05-sql-table-names.md)
- [Prisma Raw Database Access](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)
- [Prisma Schema Naming Conventions](https://www.prisma.io/docs/concepts/components/prisma-schema/names-in-underlying-database)
- [PostgreSQL Identifier Syntax](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

**Last Updated**: December 6, 2025
**Maintained By**: Development Team
**Related Incidents**: INC-2025-12-05-001
