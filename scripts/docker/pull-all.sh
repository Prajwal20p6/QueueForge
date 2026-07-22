#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Docker Registry Puller Script
# ──────────────────────────────────────────────────────────────────────────────

REGISTRY="${1}"

if [ -z "$REGISTRY" ]; then
  echo -e "\e[31m[Docker-Pull] Error: Missing target registry URL. Specify as first argument.\e[0m"
  echo -e "              Example: ./scripts/docker/pull-all.sh my-registry.azurecr.io"
  exit 1
fi

echo -e "\e[32m[Docker-Pull] Pulling verified images from registry: ${REGISTRY}...\e[0m"

docker pull "${REGISTRY}/queueforge:latest"

echo -e "\e[32m[Docker-Pull] Images successfully pulled!\e[0m"
