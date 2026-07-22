#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Container Orchestration Bootstrapper script
# ──────────────────────────────────────────────────────────────────────────────

log_info() {
  echo -e "\e[32m[Entrypoint] [INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1\e[0m"
}

log_error() {
  echo -e "\e[31m[Entrypoint] [ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1\e[0m" >&2
}

log_info "Initializing QueueForge Bootstrap checks..."

# 1. Evaluate environment variables
if [ -z "$DATABASE_URL" ]; then
  log_error "DATABASE_URL environment variable is missing!"
  exit 1
fi

# Parse host and port from DATABASE_URL for pg_isready lookup
# Example: postgresql://postgres:postgres@postgres:5432/queueforge
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:]+).*/\1/')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's/.*:([0-9]+)\/.*/\1/' | sed -E 's/[^0-9]//g')
if [ -z "$DB_PORT" ]; then
  DB_PORT=5432
fi

log_info "Target Database host discovered: $DB_HOST on port $DB_PORT"

# 2. Wait for PostgreSQL Database connection
log_info "Awaiting Database connection readiness..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; do
  log_info "Database at $DB_HOST:$DB_PORT is not ready yet. Retrying in 2 seconds..."
  sleep 2
done
log_info "Database connection successfully verified!"

# 3. Wait for Redis connection
if [ -n "$REDIS_URL" ]; then
  # Parse host and port from REDIS_URL
  # Example: redis://redis:6379
  REDIS_HOST=$(echo "$REDIS_URL" | sed -E 's/redis:\/\///' | cut -d: -f1)
  REDIS_PORT=$(echo "$REDIS_URL" | sed -E 's/redis:\/\///' | cut -d: -f2 | cut -d/ -f1)
  if [ -z "$REDIS_PORT" ]; then
    REDIS_PORT=6379
  fi

  log_info "Awaiting Redis client readiness at $REDIS_HOST:$REDIS_PORT..."
  until nc -z "$REDIS_HOST" "$REDIS_PORT" >/dev/null 2>&1; do
    log_info "Redis at $REDIS_HOST:$REDIS_PORT is not ready. Retrying in 2 seconds..."
    sleep 2
  done
  log_info "Redis connection verified!"
fi

# 4. Deploy schema migrations
log_info "Deploying Database migrations schema changes..."
if ! npx prisma migrate deploy; then
  log_error "Prisma schema migrations deployment failed!"
  exit 1
fi
log_info "Database migrations applied successfully!"

# 5. Execute Command
log_info "Bootstrapping main application runtime engine..."
exec "$@"
