#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Docker Environments Clean-up Script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[33m[Cleanup] Initiating total container stack teardown...\e[0m"

# 1. Stop all Compose environments
if [ -f docker/docker-compose.yml ]; then
  docker-compose -f docker/docker-compose.yml down --remove-orphans || true
fi
if [ -f docker/docker-compose.prod.yml ]; then
  docker-compose -f docker/docker-compose.prod.yml down --remove-orphans || true
fi
if [ -f docker/docker-compose.test.yml ]; then
  docker-compose -f docker/docker-compose.test.yml down --remove-orphans || true
fi

# 2. Prune orphaned volume storages
read -p "Would you like to purge persistent Docker volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "\e[33m[Cleanup] Purging all named volumes...\e[0m"
  docker volume prune -f
else
  echo -e "[Cleanup] Volume purge skipped."
fi

# 3. Clean up dangling images and build caches
echo -e "\e[32m[Cleanup] Purging dangling images, containers and system caches...\e[0m"
docker system prune -f --volumes

echo -e "\e[32m[Cleanup] System clean-up finalized successfully!\e[0m"
