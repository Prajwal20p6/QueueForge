#!/bin/sh
set -e

echo "[QueueForge Worker] Starting Worker Container..."
exec node dist/worker.js
