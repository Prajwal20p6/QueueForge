#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Interactive Demo Environment Resetter script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[33m[Reset-Demo] Purging local volumes, stopping containers and resetting DB...\e[0m"

# 1. Teardown dev containers and volume directories
docker-compose down -v --remove-orphans || true

# 2. Re-create directories
mkdir -p logs tmp data backups

# 3. Boot fresh service databases
docker-compose up -d postgres redis

# 4. Wait for database readiness
until pg_isready -h localhost -p 5432 -U postgres >/dev/null 2>&1; do
  echo "[Reset-Demo] Awaiting database readiness..."
  sleep 1
done

# 5. Populate tables fixtures
echo -e "\e[32m[Reset-Demo] Syncing Prisma schema and generating dev fixtures...\e[0m"
npx prisma db push
npx ts-node scripts/dev/generate-fixtures.ts

echo -e "\e[32m[Reset-Demo] Fresh demo environment ready for use!\e[0m"
