#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Comprehensive PostgreSQL + Redis Backup Generator script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[32m[Backup-All] Starting comprehensive stack backup...\e[0m"

# 1. Backup PostgreSQL
bash ./scripts/db-backup.sh

# 2. Trigger Redis SAVE command
echo -e "\e[32m[Backup-All] Creating Redis database snapshot save (BGSAVE)...\e[0m"
docker-compose exec -T redis redis-cli BGSAVE || true

echo -e "\e[32m[Backup-All] Backup completed successfully!\e[0m"
