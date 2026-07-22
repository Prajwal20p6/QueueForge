#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Baselines Re-establishment update script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[33m[Baseline] WARNING: This will overwrite baseline parameters configurations!\e[0m"
read -p "Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "[Baseline] Action cancelled."
  exit 0
fi

# Run baseline updates
npx ts-node tests/benchmarks/baseline.ts

echo -e "\e[32m[Baseline] Benchmark baseline.json has been updated!\e[0m"
