#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Database Initial Seeding runner script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[32m[Seed] Database seeding runner started...\e[0m"

# Validate that we are not running blindly in production env
if [ "$NODE_ENV" = "production" ]; then
  echo -e "\e[31m[Seed] Error: Seeding commands cannot be executed in production environment!\e[0m"
  exit 1
fi

# Run seed utility ts code or prisma db seed
# Assuming there is a seed script in package.json or prisma seed config
npx prisma db seed || ts-node scripts/dev/generate-fixtures.ts

echo -e "\e[32m[Seed] Database seed completed successfully!\e[0m"
