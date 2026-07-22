#!/bin/bash
set -e

echo "[Rollback Script] Undoing deployments in namespace queueforge..."
kubectl rollout undo deployment/queueforge-api -n queueforge
kubectl rollout undo deployment/queueforge-worker -n queueforge
kubectl rollout undo deployment/queueforge-daemon -n queueforge

echo "[Rollback Script] Rollback command issued successfully."
