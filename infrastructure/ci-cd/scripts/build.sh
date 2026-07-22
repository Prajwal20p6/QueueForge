#!/bin/bash
set -e

echo "[CI Build] Running typecheck..."
npm run typecheck

echo "[CI Build] Running unit and integration tests..."
npm test

echo "[CI Build] Compiling TypeScript codebase..."
npm run build

echo "[CI Build] Completed successfully."
