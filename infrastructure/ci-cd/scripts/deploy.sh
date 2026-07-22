#!/bin/bash
set -e

ENV=${1:-staging}

echo "[Deploy Script] Deploying QueueForge to environment: $ENV"
kubectl apply -k infrastructure/kubernetes/

echo "[Deploy Script] Waiting for deployment rollout..."
kubectl rollout status deployment/queueforge-api -n queueforge --timeout=120s
kubectl rollout status deployment/queueforge-worker -n queueforge --timeout=120s
kubectl rollout status deployment/queueforge-daemon -n queueforge --timeout=120s

echo "[Deploy Script] Deployment completed successfully."
