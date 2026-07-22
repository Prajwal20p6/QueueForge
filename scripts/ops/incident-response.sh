#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Interactive Incident Response Tool
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[31m╔══════════════════════════════════════════════════╗"
echo -e "║          QueueForge Incident Resolver            ║"
echo -e "╚══════════════════════════════════════════════════╝\e[0m\n"

echo -e "\e[33m1. Checking Core Service health statuses...\e[0m"
bash ./scripts/health-check.sh || true

echo -e "\n\e[33m2. Recent Error logs (last 5 entries):\e[0m"
if [ -f logs/app.log ]; then
  tail -n 50 logs/app.log | grep -i "error" | tail -n 5 || echo "No recent errors found in logs/app.log"
else
  echo "No active logs file found under logs/app.log"
fi

echo -e "\n\e[32mSuggested Recovery Actions:\e[0m"
echo -e "  [A] Reset Database to clean state (Drops data)"
echo -e "  [B] Rebuild BullMQ queues from Postgres pending deliveries"
echo -e "  [C] Clear open Circuit Breakers in Redis"
echo -e "  [D] Exit"

read -p "Select recovery action [A-D]: " -n 1 -r
echo
case "$REPLY" in
  [Aa])
    bash ./scripts/db-reset.sh
    ;;
  [Bb])
    echo "Rebuilding queues from database..."
    npx ts-node -e "require('./src/daemon/recovery/delayed-queue-processor')" || true
    ;;
  [Cc])
    echo "Clearing circuit breakers..."
    docker-compose exec -T redis redis-cli KEYS "cb:state:*" | xargs -r docker-compose exec -T redis redis-cli DEL || echo "No open circuit breakers found."
    ;;
  *)
    echo "Exiting incident resolver."
    ;;
esac
