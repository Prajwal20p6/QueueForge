#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Local CI Simulation - Run Tests Script
# ──────────────────────────────────────────────────────────────────────────────

log_info() {
  echo -e "\e[32m[CI-Test] [INFO] $1\e[0m"
}

log_info "Starting compilation verify check..."
npm run typecheck

log_info "Running ESLint styles audit..."
npm run lint

log_info "Running Prettier checks..."
npm run format:check

log_info "Running local Unit Testing suite..."
npm run test:unit -- --coverage

log_info "All local CI checks completed successfully!"
