# Getting Started Guide

This document outlines workspace prerequisites and configuration instructions to set up QueueForge locally for development and validation testing.

---

## 📋 Prerequisites

Before proceeding, ensure your development machine has the following tools installed:

*   **Node.js**: `v20.x.x` (LTS) or higher
*   **Docker**: Engine version `24.0.0` or higher
*   **Docker Compose**: `v2.20.0` or higher
*   **PostgreSQL**: `v15.x` or higher (optional, if running database locally without Docker)
*   **Redis**: `v7.x` or higher (optional, if running cache locally without Docker)

---

## 🛠️ Step-by-Step Workspace Setup

### 1. Clone the Codebase
```bash
git clone https://github.com/oneinbox/queueforge.git
cd queueforge
```

### 2. Install Project Dependencies
Run `npm ci` to download exact module versions matching the lock file:
```bash
npm ci
```

### 3. Configure Environmental Variables
Copy the default template file and configure required secrets:
```bash
cp .env.example .env
```
Open `.env` in your editor and verify variables:
*   `DATABASE_URL`: Connection string mapping database endpoints (e.g., `postgresql://postgres:postgres@localhost:5432/queueforge?schema=public`).
*   `REDIS_URL`: Redis broker connection endpoint (e.g., `redis://localhost:6379`).
*   `JWT_SECRET`: JWT encryption key (must be at least 32 characters long).
*   `API_KEY_SECRET`: Secret key for authenticating incoming API Keys.
*   `HMAC_SECRET`: Key used for signing webhook requests.

---

## 🚀 Running Local Containers Stack

Boot up all services using Docker Compose:
```bash
# Start Postgres, Redis, Prometheus, Grafana, and Jaeger
docker-compose up -d
```

Apply database migrations using Prisma:
```bash
npx prisma migrate dev
```

Run compilation watch daemon:
```bash
npm run dev
```

---

## 🔗 Service Endpoint Access URLs

*   **QueueForge API Server**: `http://localhost:3000`
*   **API Health Endpoint**: `http://localhost:3000/health`
*   **Jaeger Distributed Tracing UI**: `http://localhost:16686`
*   **Prometheus Raw Metrics UI**: `http://localhost:9090`
*   **Grafana Dashboards Visualizer**: `http://localhost:3001` (Credentials: `admin` / `admin`)

---

## 🧪 Executing the Verification Testing Suite

QueueForge includes unit, integration, chaos and E2E tests:

```bash
# Execute entire suite
npm test

# Run unit tests only (fast)
npm run test:unit

# Run integration tests only (requires Postgres + Redis running)
npm run test:integration

# Run chaos tests (checks resilience degradation recovery)
npm run test:chaos
```

---

## 🛑 Stopping the Stack

To cleanly stop the application and database container stack:
```bash
docker-compose down
```
To also purge stored database and dashboard volume caches:
```bash
docker-compose down -v
```

---

## 🔧 Troubleshooting Common Setup Issues

### "Prisma engine binary missing"
Run the generation compiler explicitly:
```bash
npx prisma generate
```

### "Port 5432 or 6379 already in use"
An existing PostgreSQL or Redis service is running locally on your host. Stop it via systemctl or run compose on alternate ports.

---

## 💻 IDE Recommendations & VS Code Setup

We recommend **VS Code** with the following extensions for coding layout consistency:
1.  **Prisma** (by Prisma) - Syntax highlighting for `schema.prisma`.
2.  **ESLint** (by Microsoft) - Code style checks on save.
3.  **Prettier - Code formatter** (by Prettier) - Automatically formats file structures on save.
4.  **TypeScript Hero** - Import optimizations.

Ensure your settings contain:
```json
"editor.formatOnSave": true,
"editor.defaultFormatter": "esbenp.prettier-vscode"
```
