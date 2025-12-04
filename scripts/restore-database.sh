#!/bin/bash
# scripts/restore-database.sh
# PostgreSQL Database Restore Script

set -e # Exit on error

# Load environment variables from .env file
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

echo "🔄 PostgreSQL Database Restore"
echo "==============================="
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "❌ ERROR: No backup file specified"
  echo ""
  echo "Usage: ./scripts/restore-database.sh <backup_file>"
  echo ""
  echo "Available backups:"
  ls -lh backups/*.sql.gz 2>/dev/null | tail -n +2 || echo "  No backups found"
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  echo "Please set DATABASE_URL in your .env file"
  exit 1
fi

# Parse DATABASE_URL
# Format: postgresql://user:pass@host:port/dbname or postgresql://user:pass@host/dbname
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:/]+):?([0-9]*)/([^?]+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]:-5432}"  # Default to 5432 if not specified
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "❌ ERROR: Invalid DATABASE_URL format"
  echo "Expected: postgresql://user:pass@host:port/dbname"
  exit 1
fi

echo "⚠️  WARNING: This will replace ALL data in the database!"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "Backup: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 0
fi

# Create temporary directory for decompressed file
TEMP_FILE=$(mktemp)

echo ""
echo "📦 Decompressing backup..."
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

echo "🔄 Restoring database..."
echo "This may take several minutes..."
echo ""

# Restore the backup
PGPASSWORD="$DB_PASS" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  < "$TEMP_FILE"

# Clean up temporary file
rm "$TEMP_FILE"

echo ""
echo "🎉 Database restored successfully!"
echo ""
echo "Next steps:"
echo "1. Verify data: npx prisma studio"
echo "2. Test the application: npm run dev"
echo ""
