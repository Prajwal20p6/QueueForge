#!/bin/sh
set -e

echo "[QueueForge API] Starting API Container..."
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[QueueForge API] Running database migrations..."
  npx prisma migrate deploy || true
fi

echo "[QueueForge API] Executing API process..."
exec node dist/index.js
