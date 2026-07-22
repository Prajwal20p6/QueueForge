#!/usr/bin/env bash
set -eo pipefail

echo "=== Running Pre-Production Automated Checklist ==="

# 1. Verify build
npm run typecheck

# 2. Verify all test suites pass
npm test

echo "[SUCCESS] Pre-production checks verified successfully."
exit 0
