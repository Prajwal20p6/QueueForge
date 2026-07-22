#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Docker Image Registry Publisher Script
# ──────────────────────────────────────────────────────────────────────────────

REGISTRY="${1}"
VERSION="${2:-1.0.0}"

if [ -z "$REGISTRY" ]; then
  echo -e "\e[31m[Docker-Push] Error: Missing target registry URL. Specify as first argument.\e[0m"
  echo -e "              Example: ./scripts/docker/push-all.sh my-registry.azurecr.io"
  exit 1
fi

echo -e "\e[32m[Docker-Push] Tagging and publishing images to registry: ${REGISTRY}...\e[0m"

docker tag "queueforge:${VERSION}" "${REGISTRY}/queueforge:${VERSION}"
docker tag "queueforge:latest" "${REGISTRY}/queueforge:latest"

docker push "${REGISTRY}/queueforge:${VERSION}"
docker push "${REGISTRY}/queueforge:latest"

echo -e "\e[32m[Docker-Push] Images successfully published!\e[0m"
