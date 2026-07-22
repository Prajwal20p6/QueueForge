#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# System Workspace Clean-up script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[33m[Clean] Purging cache files, compilation builds and log outputs...\e[0m"

# 1. Clean dist and build outputs
rm -rf dist build coverage tmp

# 2. Clean pino and attempt log files
rm -rf logs/*.log logs/*.json data/*

# 3. Optional node_modules wipe
if [ "$1" = "--all" ]; then
  echo -e "\e[33m[Clean] Purging node_modules directory...\e[0m"
  rm -rf node_modules package-lock.json
fi

echo -e "\e[32m[Clean] Clean task finalized successfully!\e[0m"
