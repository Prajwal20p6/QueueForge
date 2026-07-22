#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Docker Image Builder Script
# ──────────────────────────────────────────────────────────────────────────────

VERSION="${1:-1.0.0}"
echo -e "\e[32m[Docker-Build] Compiling all Docker targets for version: ${VERSION}...\e[0m"

# 1. Build Production App
docker build -t "queueforge:${VERSION}" -t "queueforge:latest" -f docker/Dockerfile .

# 2. Build Development App
docker build -t "queueforge:dev-latest" -f docker/Dockerfile.dev .

# 3. Build Nginx Reverse Proxy
docker build -t "queueforge-nginx:latest" -f Dockerfile.nginx .

echo -e "\e[32m[Docker-Build] Built all images successfully!\e[0m"
