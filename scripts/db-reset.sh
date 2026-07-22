#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Destructive Database Reset controller script
# ──────────────────────────────────────────────────────────────────────────────

if [ "$1" != "--force" ]; then
  echo -e "\e[31m[DB-Reset] CAUTION: This command will drop all tables and purge all data!\e[0m"
  read -p "Are you absolutely sure you want to proceed? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "[DB-Reset] Action aborted."
    exit 0
  fi
fi

echo -e "\e[33m[DB-Reset] Purging all database tables and schema migrations history...\e[0m"
npx prisma migrate reset --force

echo -e "\e[32m[DB-Reset] Database reset completed successfully!\e[0m"
