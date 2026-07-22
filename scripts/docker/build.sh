#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Production Docker Image Build Tool
# ──────────────────────────────────────────────────────────────────────────────

IMAGE_NAME="queueforge"
VERSION="1.0.0"

echo -e "\e[32m[Build] Starting Docker image build for ${IMAGE_NAME}:${VERSION}...\e[0m"

# Build production stage target
docker build \
  -f docker/Dockerfile \
  -t "${IMAGE_NAME}:${VERSION}" \
  -t "${IMAGE_NAME}:latest" \
  --build-arg NODE_ENV=production \
  .

echo -e "\e[32m[Build] Build complete! Registered tags:\e[0m"
echo -e "  - ${IMAGE_NAME}:${VERSION}"
echo -e "  - ${IMAGE_NAME}:latest"
