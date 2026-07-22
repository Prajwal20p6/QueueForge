#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# K6 Load Test Runner script
# ──────────────────────────────────────────────────────────────────────────────

SCENARIO="${1:-ramp}"

echo -e "\e[32m[Load-Test] Running K6 load test script scenario: ${SCENARIO}...\e[0m"

# Execute K6 script if tool available, or print summary instructions
if command -v k6 >/dev/null 2>&1; then
  k6 run "tests/load/scenarios/${SCENARIO}.scenario.js"
else
  echo -e "\e[33m[Load-Test] Warning: K6 executable is not installed on host VM. Bypassing execution.\e[0m"
fi
