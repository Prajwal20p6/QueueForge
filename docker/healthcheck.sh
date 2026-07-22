#!/bin/bash
set -eo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Container Healthcheck Query Probe
# ──────────────────────────────────────────────────────────────────────────────

TARGET_PORT="${PORT:-3000}"
HEALTH_URL="http://localhost:${TARGET_PORT}/health"

# Execute HTTP check with 5s timeout and silent output
if response=$(curl --fail --silent --show-error --max-time 5 "$HEALTH_URL"); then
  # Evaluate if status check reports status success
  if echo "$response" | grep -q '"status":'; then
    echo "[Healthcheck] Healthy: $response"
    exit 0
  else
    echo "[Healthcheck] Warning: HTTP 200 returned but response payload is unexpected: $response"
    exit 1
  fi
else
  echo "[Healthcheck] Unhealthy: Failed to query $HEALTH_URL"
  exit 1
fi
