#!/bin/bash
set -e

API_URL=${1:-http://localhost:3000}

echo "[Verify Deployment] Checking API health endpoint at $API_URL/health..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "[Verify Deployment] Health check PASSED (200 OK)."
  exit 0
else
  echo "[Verify Deployment] Health check FAILED with status: $HTTP_STATUS"
  exit 1
fi
