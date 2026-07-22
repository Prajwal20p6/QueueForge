#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Production Environment Deployment Bootstrap script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[32m[Run Prod] Preparing production-like docker stack launch...\e[0m"

# 1. Validate environment configuration
if [ ! -f docker/.env.prod ]; then
  echo -e "\e[31m[Run Prod] Error: Production secrets file 'docker/.env.prod' is missing!\e[0m"
  echo -e "           Please configure 'docker/.env.prod' with database, redis, and session secrets."
  exit 1
fi

# 2. Build production image locally if not pulled from registry
echo -e "\e[32m[Run Prod] Rebuilding production container images...\e[0m"
docker-compose -f docker/docker-compose.prod.yml build

# 3. Boot production containers
echo -e "\e[32m[Run Prod] Starting Production docker-compose stack...\e[0m"
docker-compose -f docker/docker-compose.prod.yml up -d

echo -e "\e[32m[Run Prod] QueueForge production stack launched. Target Monitor endpoints:\e[0m"
echo -e "  - Public API Engine : http://localhost:3000"
echo -e "  - Health Endpoint   : http://localhost:3000/health"
echo -e "  - Grafana Dashboards: http://localhost:3001"
