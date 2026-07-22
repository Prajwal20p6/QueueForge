#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Prisma Migration Deployment Controller script
# ──────────────────────────────────────────────────────────────────────────────

TARGET_ENV="${1:-dev}"

echo -e "\e[32m[Migrate] Running Prisma db migrations deploy on target environment: ${TARGET_ENV}...\e[0m"

# Validate configuration URL exists
if [ -z "$DATABASE_URL" ]; then
  echo -e "\e[31m[Migrate] Error: DATABASE_URL is not configured in current session environment.\e[0m"
  exit 1
fi

npx prisma migrate deploy

echo -e "\e[32m[Migrate] Migration applied successfully!\e[0m"
