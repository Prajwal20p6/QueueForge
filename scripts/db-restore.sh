#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# PostgreSQL Snapshot Restoration script
# ──────────────────────────────────────────────────────────────────────────────

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo -e "\e[31m[DB-Restore] Error: Please specify the SQL backup filepath as first argument.\e[0m"
  echo -e "             Example: ./scripts/db-restore.sh backups/db_snapshot_20260718.sql"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "\e[31m[DB-Restore] Error: Backup snapshot file \"$BACKUP_FILE\" not found!\e[0m"
  exit 1
fi

echo -e "\e[33m[DB-Restore] WARNING: This will drop tables in your target DB and overwrite with backup content!\e[0m"
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "[DB-Restore] Action aborted."
  exit 0
fi

echo -e "\e[32m[DB-Restore] Initiating pg_restore/psql ingestion of: ${BACKUP_FILE}...\e[0m"

# Execute psql to restore schema
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d queueforge -f "$BACKUP_FILE"

echo -e "\e[32m[DB-Restore] Database snapshot restored successfully!\e[0m"
