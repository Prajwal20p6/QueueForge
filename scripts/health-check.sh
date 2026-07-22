#!/bin/bash
set -eo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# System Services Health Monitor Probe
# ──────────────────────────────────────────────────────────────────────────────

TARGET_PORT="${PORT:-3000}"
HEALTH_URL="http://localhost:${TARGET_PORT}/health"

echo -e "\e[32m[Health-Check] Initiating system services health monitor audit...\e[0m"

# 1. Check API endpoint
echo -n "[Health-Check] Checking API engine status... "
if response=$(curl --fail --silent --show-error --max-time 5 "$HEALTH_URL"); then
  echo -e "\e[32mOK ✓\e[0m"
else
  echo -e "\e[31mFAILED ✗\e[0m"
  exit 1
fi

# 2. Check Postgres status
echo -n "[Health-Check] Checking PostgreSQL database connectivity... "
if pg_isready -h localhost -p 5432 -U postgres >/dev/null 2>&1; then
  echo -e "\e[32mOK ✓\e[0m"
else
  # If local failed, check if running in docker compose
  if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "\e[32mOK (Docker) ✓\e[0m"
  else
    echo -e "\e[31mFAILED ✗\e[0m"
    exit 1
  fi
fi

# 3. Check Redis status
echo -n "[Health-Check] Checking Redis broker connectivity... "
if nc -z localhost 6379 >/dev/null 2>&1; then
  echo -e "\e[32mOK ✓\e[0m"
else
  if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
    echo -e "\e[32mOK (Docker) ✓\e[0m"
  else
    echo -e "\e[31mFAILED ✗\e[0m"
    exit 1
  fi
fi

echo -e "\e[32m[Health-Check] All subsystems reported healthy status.\e[0m"
exit 0
