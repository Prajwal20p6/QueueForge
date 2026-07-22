#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Styles and ESLint Auditing script
# ──────────────────────────────────────────────────────────────────────────────

FIX_FLAG=""
if [ "$1" = "--fix" ]; then
  FIX_FLAG="--fix"
  echo -e "\e[32m[Lint] Running styles audits in auto-fix configurations...\e[0m"
else
  echo -e "\e[32m[Lint] Running code styles checkups...\e[0m"
fi

npx eslint "src/**/*.ts" "tests/**/*.ts" $FIX_FLAG

if [ "$1" = "--fix" ]; then
  npx prettier --write "src/**/*.ts" "tests/**/*.ts"
else
  npx prettier --check "src/**/*.ts" "tests/**/*.ts"
fi

echo -e "\e[32m[Lint] Styles checks completed successfully!\e[0m"
