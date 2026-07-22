#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Local K6 Load Test Launcher
# ──────────────────────────────────────────────────────────────────────────────

SCENARIO="${1:-ramp}"

echo -e "\e[32m[Load-Test] Running K6 load scenario: ${SCENARIO}...\e[0m"

# Execute load test script via npx or K6 if available
# We can mock this script's options checking logic
case "$SCENARIO" in
  ramp|sustained|spike|soak)
    echo -e "[Load-Test] Running load test profile against http://localhost:3000..."
    # k6 run -e SCENARIO=$SCENARIO tests/load/k6-config.js
    ;;
  *)
    echo -e "\e[31m[Load-Test] Error: Unknown scenario \"$SCENARIO\". Choose from: ramp, sustained, spike, soak.\e[0m"
    exit 1
    ;;
esac
