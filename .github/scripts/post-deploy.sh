#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Post-Deployment Health Check Verification
# ──────────────────────────────────────────────────────────────────────────────

TARGET_URL="${1:-http://localhost:3000}"
MAX_ATTEMPTS=5
SLEEP_INTERVAL=3

echo -e "\e[32m[Post-Deploy] Auditing API Health checks at: ${TARGET_URL}/health...\e[0m"

for ((attempt=1; attempt<=MAX_ATTEMPTS; attempt++)); do
  echo -e "[Post-Deploy] Query attempt ${attempt}/${MAX_ATTEMPTS}..."
  if response=$(curl --fail --silent --show-error --max-time 3 "${TARGET_URL}/health"); then
    if echo "$response" | grep -q '"status":'; then
      echo -e "\e[32m[Post-Deploy] Server health check PASSED ✓\e[0m"
      echo -e "              Server response: $response"
      exit 0
    else
      echo -e "\e[33m[Post-Deploy] Warning: Request returned HTTP 200 but payload missing status!\e[0m"
    fi
  else
    echo -e "\e[33m[Post-Deploy] Health check query failed. Retrying in ${SLEEP_INTERVAL}s...\e[0m"
  fi
  sleep "$SLEEP_INTERVAL"
done

echo -e "\e[31m[Post-Deploy] Error: Health checks failed after ${MAX_ATTEMPTS} attempts!\e[0m"
exit 1
