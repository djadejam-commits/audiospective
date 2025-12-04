#!/bin/bash
# scripts/backup-database.sh
# PostgreSQL Database Backup Script

set -e # Exit on error

# Load environment variables from .env file
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

echo "🗄️  PostgreSQL Database Backup"
echo "==============================="
echo ""

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
  echo "Got: $DATABASE_URL"
  exit 1
fi

# Create backups directory if it doesn't exist
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

echo "📦 Creating backup..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "Output: $BACKUP_FILE_GZ"
echo ""

# Run pg_dump to create backup
# Note: PGPASSWORD environment variable is used for authentication
PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > "$BACKUP_FILE"

# Check if backup was created successfully
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ ERROR: Backup failed"
  exit 1
fi

# Get uncompressed size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup created: $BACKUP_SIZE"

# Compress the backup
echo "🗜️  Compressing backup..."
gzip "$BACKUP_FILE"

# Get compressed size
COMPRESSED_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
echo "✅ Compressed: $COMPRESSED_SIZE"

# List all backups
echo ""
echo "📂 All backups:"
ls -lh "$BACKUP_DIR" | tail -n +2

# Keep only the last 7 backups (delete older ones)
echo ""
echo "🧹 Cleaning old backups (keeping last 7)..."
cd "$BACKUP_DIR"
ls -t backup_*.sql.gz | tail -n +8 | xargs -I {} rm {} 2>/dev/null || true
cd ..

echo ""
echo "🎉 Backup complete!"
echo ""
echo "To restore this backup, run:"
echo "  ./scripts/restore-database.sh $BACKUP_FILE_GZ"
echo ""
