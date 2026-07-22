#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Stacking Restore script
# ──────────────────────────────────────────────────────────────────────────────

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo -e "\e[31m[Restore-All] Error: Missing backup SQL file parameter.\e[0m"
  echo -e "              Example: ./scripts/ops/restore-all.sh backups/db_snapshot.sql"
  exit 1
fi

echo -e "\e[32m[Restore-All] Restoring SQL schema from backup: ${BACKUP_FILE}...\e[0m"
bash ./scripts/db-restore.sh "$BACKUP_FILE"

echo -e "\e[32m[Restore-All] Database restoration completed successfully!\e[0m"
