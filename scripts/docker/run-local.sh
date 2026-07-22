#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Local Development Launch Script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[32m[Run Local] Booting development stack via Docker Compose...\e[0m"

# Validate that the local environment configuration exists
if [ ! -f .env.docker ]; then
  echo -e "\e[33m[Run Local] Warning: .env.docker not found. Creating a default configuration...\e[0m"
  cp .env.example .env.docker || true
fi

# Run docker-compose up
docker-compose -f docker/docker-compose.yml --env-file .env.docker up --build -d

echo -e "\e[32m[Run Local] QueueForge dev stack running! Access URLs:\e[0m"
echo -e "  - API Server : http://localhost:3000"
echo -e "  - Health Check: http://localhost:3000/health"
echo -e "  - Jaeger UI  : http://localhost:16686"
echo -e "  - Prometheus : http://localhost:9090"
echo -e "  - Grafana UI : http://localhost:3001 (Credentials: admin / admin)"
echo -e "  - Postgres   : localhost:5432"
echo -e "  - Redis      : localhost:6379"
