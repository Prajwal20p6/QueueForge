#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Local Development Stack Launch script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[32m[Dev] Booting local development services (docker + watcher)...\e[0m"

# 1. Start Postgres & Redis containers
docker-compose up -d postgres redis

# 2. Wait for db connections
until pg_isready -h localhost -p 5432 -U postgres >/dev/null 2>&1; do
  echo "[Dev] Waiting for PostgreSQL at localhost:5432 to become healthy..."
  sleep 1
done

# 3. Synchronize database tables
npx prisma db push

# 4. Start TypeScript watcher
echo -e "\e[32m[Dev] Starting API application dev compiler watch...\e[0m"
exec npm run dev
