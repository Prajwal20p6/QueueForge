#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Compilation and Packaging Builder script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[32m[Build] Verifying TypeScript types stability...\e[0m"
npm run typecheck

echo -e "\e[32m[Build] Purging previous dist directory output folders...\e[0m"
rm -rf dist build

echo -e "\e[32m[Build] Executing compiler compilation target output dist/...\e[0m"
npx tsc -p tsconfig.build.json

# Copy additional static configs to target
cp package.json package-lock.json dist/ || true
if [ -d prisma ]; then
  cp -r prisma dist/ || true
fi

echo -e "\e[32m[Build] Build package completed successfully!\e[0m"
