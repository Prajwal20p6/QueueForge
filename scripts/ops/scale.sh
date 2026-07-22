#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Worker Horizontal Scaling script
# ──────────────────────────────────────────────────────────────────────────────

COUNT="${1:-2}"

echo -e "\e[32m[Scale] Scaling worker cluster nodes count to: ${COUNT}...\e[0m"

# Scales compose application containers count
docker-compose -f docker-compose.yml up -d --scale queueforge="$COUNT"

echo -e "\e[32m[Scale] QueueForge worker pool successfully scaled to ${COUNT} active instances.\e[0m"
