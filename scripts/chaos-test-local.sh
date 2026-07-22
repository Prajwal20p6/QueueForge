#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Local Chaos Tests Launcher
# ──────────────────────────────────────────────────────────────────────────────

SCENARIO="${1:-all}"

echo -e "\e[33m[Chaos] Running local chaos simulation scenario: ${SCENARIO}...\e[0m"

# Execute Jest chaos tests matching the target scenario
case "$SCENARIO" in
  all)
    npm run test:chaos
    ;;
  *)
    npx jest --config jest.config.chaos.js --testNamePattern="$SCENARIO"
    ;;
esac

echo -e "\e[32m[Chaos] Chaos test run complete!\e[0m"
