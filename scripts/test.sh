#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Testing Suite Router script
# ──────────────────────────────────────────────────────────────────────────────

TEST_TYPE="${1:-all}"

echo -e "\e[32m[Test] Running target test suite: ${TEST_TYPE}...\e[0m"

case "$TEST_TYPE" in
  unit)
    exec npm run test:unit
    ;;
  integration)
    exec npm run test:integration
    ;;
  chaos)
    exec npm run test:chaos
    ;;
  e2e)
    exec npm run test:e2e
    ;;
  all)
    exec npm test
    ;;
  *)
    echo -e "\e[31m[Test] Error: Unknown test type \"$TEST_TYPE\". Choose from: unit, integration, chaos, e2e, all.\e[0m"
    exit 1
    ;;
esac
