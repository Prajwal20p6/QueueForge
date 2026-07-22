#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Interactive Setup Script for QueueForge dev workspace
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[32m[Setup] Initiating QueueForge project setup...\e[0m"

# 1. Install NPM modules
echo -e "\e[32m[Setup] Installing Node dependencies...\e[0m"
npm ci

# 2. Setup env variables
if [ ! -f .env ]; then
  echo -e "\e[32m[Setup] Initializing .env configuration from example...\e[0m"
  cp .env.example .env
fi

# 3. Create required system directories
echo -e "\e[32m[Setup] Creating directories (logs, tmp, data)...\e[0m"
mkdir -p logs tmp data backups

# 4. Synchronize databases
echo -e "\e[32m[Setup] Setting up database schema and running migrations...\e[0m"
npx prisma generate
npx prisma db push --skip-generate || true

echo -e "\e[32m[Setup] QueueForge workspace setup completed successfully!\e[0m"
