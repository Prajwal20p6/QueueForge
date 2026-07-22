#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Interactive Jest Watch Mode script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[32m[Test Watch] Starting Jest watch daemon...\e[0m"
exec npx jest --watch
