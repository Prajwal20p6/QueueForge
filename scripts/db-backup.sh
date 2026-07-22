#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# PostgreSQL Schema & Tables Backup Generator script
# ──────────────────────────────────────────────────────────────────────────────

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/db_snapshot_${TIMESTAMP}.sql"

echo -e "\e[32m[DB-Backup] Commencing database snapshot export to: ${BACKUP_FILE}...\e[0m"

# Parse URL params to format pg_dump command or use default local connection parameters
# Example URL: postgresql://postgres:postgres@localhost:5432/queueforge?schema=public
PGPASSWORD=postgres pg_dump -h localhost -p 5432 -U postgres -d queueforge -F p -f "$BACKUP_FILE"

echo -e "\e[32m[DB-Backup] Snapshot backup generated successfully!\e[0m"
echo -e "             Location: ${BACKUP_FILE}"
