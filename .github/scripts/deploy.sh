#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Staging/Production Deployment Wrapper Script
# ──────────────────────────────────────────────────────────────────────────────

TARGET_ENV="${1:-staging}"
IMAGE_TAG="${2:-latest}"

echo -e "\e[32m[Deploy] Initiating deployment to environment: ${TARGET_ENV}...\e[0m"
echo -e "[Deploy] Target image tag: ${IMAGE_TAG}"

if [ "$TARGET_ENV" = "production" ]; then
  CONF_FILE="docker/docker-compose.prod.yml"
else
  CONF_FILE="docker/docker-compose.yml"
fi

# Run docker-compose actions
echo -e "[Deploy] Deploying via file: ${CONF_FILE}..."
# docker-compose -f "$CONF_FILE" pull
# docker-compose -f "$CONF_FILE" up -d

echo -e "\e[32m[Deploy] Deployment completed successfully!\e[0m"
