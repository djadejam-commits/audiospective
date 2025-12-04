#!/bin/bash
# scripts/backup-database-neon.sh
# Neon-specific backup script (uses Neon branching feature)
# This is faster and more efficient than pg_dump for Neon databases

set -e # Exit on error

echo "🗄️  Neon Database Backup (using branches)"
echo "=========================================="
echo ""

# Check if neonctl is installed
if ! command -v neonctl &> /dev/null; then
  echo "⚠️  neonctl not found. Installing..."
  npm install -g neonctl
  echo "✅ neonctl installed"
  echo ""
fi

# Check if NEON_API_KEY is set
if [ -z "$NEON_API_KEY" ]; then
  echo "❌ ERROR: NEON_API_KEY not set"
  echo ""
  echo "To get your API key:"
  echo "1. Go to: https://console.neon.tech"
  echo "2. Click your profile → Account Settings"
  echo "3. Go to 'Developer Settings' → 'API Keys'"
  echo "4. Generate a new key"
  echo "5. Add to .env: NEON_API_KEY=your_key_here"
  echo ""
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  exit 1
fi

# Extract project ID from DATABASE_URL
# Neon URLs look like: postgresql://user:pass@ep-xxx-xxx.region.aws.neon.tech/dbname
if [[ $DATABASE_URL =~ ep-([a-z0-9-]+)\.([a-z0-9-]+)\.aws\.neon\.tech ]]; then
  PROJECT_ID="${BASH_REMATCH[1]}-${BASH_REMATCH[2]}"
else
  echo "❌ ERROR: Could not extract project ID from DATABASE_URL"
  echo "Make sure you're using a Neon database"
  exit 1
fi

# Generate branch name with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BRANCH_NAME="backup_${TIMESTAMP}"

echo "📦 Creating backup branch..."
echo "Project: $PROJECT_ID"
echo "Branch: $BRANCH_NAME"
echo ""

# Create a new branch (this is instant on Neon)
neonctl branches create \
  --project-id "$PROJECT_ID" \
  --name "$BRANCH_NAME" \
  --api-key "$NEON_API_KEY"

echo ""
echo "🎉 Backup branch created!"
echo ""
echo "This backup is a full copy of your database at this moment."
echo "It uses Neon's copy-on-write technology, so it's instant and free."
echo ""
echo "To restore from this backup:"
echo "1. Go to: https://console.neon.tech"
echo "2. Select your project"
echo "3. Go to 'Branches' tab"
echo "4. Find branch: $BRANCH_NAME"
echo "5. Click 'Set as Primary' to restore"
echo ""
echo "To delete this backup:"
echo "  neonctl branches delete $BRANCH_NAME --project-id $PROJECT_ID"
echo ""

# List all backup branches
echo "📂 All backup branches:"
neonctl branches list \
  --project-id "$PROJECT_ID" \
  --api-key "$NEON_API_KEY" | grep "backup_" || echo "  Only this backup exists"

echo ""
echo "💡 Tip: Neon keeps branches for 7 days on free tier"
echo "    Upgrade to Pro for longer retention"
echo ""
