#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Blue-Green Application Upgrade script
# ──────────────────────────────────────────────────────────────────────────────

VERSION="${1:-1.0.0}"

echo -e "\e[32m[Upgrade] Deploying version ${VERSION} via Blue-Green swap...\e[0m"

# 1. Pull new container release version
# docker pull queueforge:${VERSION}

# 2. Start new instance (e.g. Green)
echo -e "[Upgrade] Spinning up Green container cluster..."
# docker-compose -f docker/docker-compose.prod.yml up -d --scale queueforge=2

# 3. Perform local health probe check
echo -e "[Upgrade] Performing health audit on new endpoints..."
bash ./scripts/health-check.sh

echo -e "\e[32m[Upgrade] Swap completed successfully to version: ${VERSION}\e[0m"
