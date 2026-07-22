# Production Deployment Runbook

This document details guidelines for deploying QueueForge to staging and production container environments, including database configs, container orchestrations, and secrets management.

---

## 🏗️ Production System Checklist

Ensure the target runtime infrastructure conforms to the following specs:

*   **Host VMs**: Linux kernel >= 5.4 (Ubuntu 22.04 LTS recommended)
*   **Storage volumes**: Solid-state drives (SSD) with IOPS > 3000
*   **Ingress Proxy**: Nginx or AWS ALB providing SSL termination (TLS 1.3 only)
*   **Security Groups**: Internally bound PostgreSQL (5432) and Redis (6379) ports (no direct internet bindings)

---

## 🗄️ Production Database Configuration

### PostgreSQL 15+ Configuration Optimization
Update `postgresql.conf` parameters:
*   `max_connections = 200`
*   `shared_buffers = 1/4 of total RAM` (e.g. 4GB for a 16GB system)
*   `work_mem = 64MB`
*   `maintenance_work_mem = 512MB`
*   `effective_cache_size = 3/4 of total RAM`
*   `synchronous_commit = off` (for high throughput, at the risk of losing last transaction on power failure)

### Prisma Connection Pooling
Configure the database URL connection pool limits to prevent connection exhaustion:
```
DATABASE_URL="postgresql://user:pass@host:5432/dbname?connection_limit=50&pool_timeout=10"
```

---

## 💾 Redis 7+ Cache Configuration

Configure Redis parameters in `redis.conf`:
*   **Persistence**: Enable Append-Only File (AOF) with RDB snapshots:
    ```conf
    appendonly yes
    appendfsync everysec
    save 900 1
    save 300 10
    ```
*   **Memory Management**:
    ```conf
    maxmemory 2gb
    maxmemory-policy noeviction  # Reject writes on full to prevent losing queue items
    ```

---

## 🐳 Deployment via Docker Compose

Run the production compose file utilizing the published release tag:

```bash
# 1. Pull latest verified production image
docker-compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod pull

# 2. Run in background mode
docker-compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod up -d
```

---

## ☸️ Deployment via Kubernetes

Apply the deployment manifests:

### 1. Secret Configuration (`secrets.yaml`)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: queueforge-secrets
type: Opaque
data:
  DATABASE_URL: <base64-url>
  REDIS_URL: <base64-url>
  JWT_SECRET: <base64-secret>
```

### 2. Application Deployment (`deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: queueforge-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: queueforge
  template:
    metadata:
      labels:
        app: queueforge
    spec:
      containers:
      - name: queueforge
        image: queueforge:1.0.0
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: queueforge-secrets
        resources:
          limits:
            cpu: "1.5"
            memory: 1.5Gi
          requests:
            cpu: "500m"
            memory: 512Mi
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
```

---

## 🔄 Deployments Updates and Rollback Procedures

### Blue-Green Deployments
1.  Deploy the new version of containers into the "Green" namespace/vms.
2.  Run the verification post-deployment script to ensure `/health` reports `status: healthy` on Green endpoints.
3.  Modify Nginx config to update the upstream pointer to Green.
4.  Deprecate the "Blue" environment after 1 hour of zero traffic errors.

### Instant Rollback
In the event of an outage:
```bash
# Instantly revert upstream pointer
docker-compose -f docker/docker-compose.prod.yml rollback --to=previous
```
Or redeploy the previous image tag via CI:
```bash
./scripts/docker/run-prod.sh previous-git-sha
```
