#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Code Formatter Prettier script
# ──────────────────────────────────────────────────────────────────────────────

if [ "$1" = "--check" ]; then
  echo -e "\e[32m[Format] Auditing formatting style configurations...\e[0m"
  npx prettier --check "src/**/*.ts" "tests/**/*.ts" "docs/**/*.md" "package.json"
else
  echo -e "\e[32m[Format] Formatting code structure, configs and documentation...\e[0m"
  npx prettier --write "src/**/*.ts" "tests/**/*.ts" "docs/**/*.md" "package.json"
fi

echo -e "\e[32m[Format] Formatter checks finalized!\e[0m"
