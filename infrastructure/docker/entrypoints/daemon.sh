#!/bin/sh
set -e

echo "[QueueForge Daemon] Starting Daemon Container..."
exec node dist/daemon.js
