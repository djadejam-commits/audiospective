#!/bin/bash
# scripts/setup-postgresql.sh
# PostgreSQL Migration Setup Script

set -e # Exit on error

echo "🚀 PostgreSQL Migration Setup"
echo "=============================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  echo ""
  echo "Please follow these steps:"
  echo "1. Sign up at https://neon.tech (free tier)"
  echo "2. Create a project: 'spotify-time-machine'"
  echo "3. Copy the connection string"
  echo "4. Update your .env file:"
  echo "   DATABASE_URL=\"postgresql://user:pass@host:5432/dbname\""
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Step 1: Generate Prisma Client
echo "📦 Step 1/3: Generating Prisma Client..."
npx prisma generate

# Step 2: Push schema to PostgreSQL
echo "🗄️  Step 2/3: Pushing schema to PostgreSQL..."
npx prisma db push

# Step 3: Verify connection
echo "✅ Step 3/3: Verifying connection..."
npx prisma db execute --stdin <<EOF
SELECT 'PostgreSQL connection successful!' AS message;
EOF

echo ""
echo "🎉 PostgreSQL migration complete!"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Test sign-in and dashboard"
echo "3. Run manual archival to test DB"
echo ""
echo "To open Prisma Studio: npx prisma studio"
