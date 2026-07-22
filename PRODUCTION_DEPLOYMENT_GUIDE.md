# Production Deployment Guide

Steps for Kubernetes deployments.

---

## 🏗️ Pre-deployment Checks
*   Verify migrations are backward-compatible.
*   Confirm environment variables are updated.

---

## 🚀 Execution Steps
1.  **Run migrations**:
    ```bash
    npx prisma migrate deploy
    ```
2.  **Apply Helm changes**:
    ```bash
    helm upgrade --install queueforge ./k8s/charts/queueforge
    ```
3.  **Run smoke tests checks**.
