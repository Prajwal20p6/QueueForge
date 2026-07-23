# QueueForge 🚀

**QueueForge** is an enterprise-grade, event-driven task result delivery pipeline built with **TypeScript**, **Node.js**, **BullMQ**, **PostgreSQL**, and **Redis**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Redis Setup](#redis-setup)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

QueueForge is engineered to reliably deliver AI agent task execution results across multiple downstream destinations (webhooks, databases, message queues, audit logs) with guaranteed delivery semantics, built-in resilience, and production-grade observability.

### Problem Statement
AI agents generate task execution results that must be delivered to heterogeneous destinations with:
- ✅ **Exactly-once delivery semantics** (sliding-window idempotency cache)
- ✅ **Automatic retry with exponential backoff** and randomized jitter
- ✅ **Circuit breaker per destination** (preventing cascading failures)
- ✅ **Bulkhead resource pool isolation** per destination type
- ✅ **Dead Letter Queue (DLQ)** for inspection of unresolvable failures
- ✅ **Immutable Audit Log Trail** for regulatory compliance
- ✅ **OpenTelemetry & Prometheus Observability**

### Solution
QueueForge provides a scalable, resilient pipeline handling ingestion, queuing, delivery execution, and real-time monitoring with zero message loss.

---

## Features

### Core Functionality
- 📦 **Task Result Ingestion**: Ingest AI task execution results via high-performance REST API.
- 🎯 **Multi-Destination Delivery**: Route results to Webhooks, Databases, Queues, or Audit logs.
- 🔄 **Automatic Retries**: Exponential backoff with jitter (up to 5 retries by default).
- 🛡️ **Circuit Breaker Pattern**: Per-destination isolation preventing cascading downstream failures.
- 🔗 **Bulkhead Isolation**: Concurrency resource pool isolation per destination tier.
- ⏱️ **Backpressure Handling**: Real-time queue occupancy monitoring and job shedding.
- 📊 **Sliding-Window Idempotency**: Duplicate detection and bypass using Redis sliding window cache.
- 🗑️ **Dead Letter Queue (DLQ)**: Failed deliveries moved to DLQ for manual inspection and replay.
- 📝 **Audit Trail**: Append-only immutable database event audit logging.
- 🔐 **Security & Auth**: JWT authentication, API Key validation, and HMAC Webhook signature headers.
- ⚡ **Rate Limiting**: Sliding window rate limiter supporting Free, Pro, and Enterprise quota tiers.
- 📈 **Observability**: OpenTelemetry tracing, Prometheus scrapers (`/metrics`), and Pino structured JSON logging.
- 🏥 **Health Checks**: Real-time health probes (`/health`) verifying PostgreSQL, Redis, and BullMQ connectivity.

---

## Architecture

### System Flow Diagram

```
┌────────────────────────────────────────────────────────┐
│ REST API Layer (Express)                               │
│ • POST /api/v1/results (ingestion)                     │
│ • GET /api/v1/results/:id (result retrieval)           │
│ • GET /health & GET /metrics (observability probes)    │
│ • GET /api/docs (interactive Swagger UI web interface) │
└────────────┬─────────────────────────────────┬─────────┘
             │                                 │
        ┌────▼─────────────────┐       ┌──────▼──────────────┐
        │ PostgreSQL (RDS)     │       │ Redis (ElastiCache) │
        │ • Task Results       │       │ • Job Queue         │
        │ • Deliveries         │       │ • Cache Layer       │
        │ • Attempts           │       │ • Leader Election   │
        │ • Audit Log          │       │ • Distributed State │
        └────┬─────────────────┘       └──────┬──────────────┘
             │                                 │
        ┌────▼─────────────────────────────────▼─────────────┐
        │ Worker Layer (BullMQ Job Processor)                │
        │ • Dequeue jobs from BullMQ queue                   │
        │ • Apply resilience patterns (Circuit, Retry)       │
        │ • Execute delivery to target destination           │
        │ • Record execution attempt & status                │
        └────┬──────────────────────────────────────────────┘
             │
        ┌────▼──────────────────────────────────────────┐
        │ Daemon Layer                                   │
        │ • RecoveryDaemon: Stale job recovery           │
        │ • HealthDaemon: System health monitoring       │
        │ • MetricsCollector: Telemetry aggregation      │
        └────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime Core** | Node.js 20+ LTS |
| **Language** | TypeScript 5.5 (Strict Mode) |
| **Framework** | Express.js |
| **Database** | PostgreSQL 15+ with Prisma ORM |
| **Message Queue** | BullMQ (Redis-backed job queue) |
| **Cache & State** | Redis 7.0+ / Memurai |
| **Authentication** | JWT + API Keys |
| **Resilience** | Circuit Breaker, Bulkhead, Retry Policy |
| **Observability** | OpenTelemetry, Prometheus, Pino, Winston |
| **Testing** | Jest (244 Unit Test Suites, 680 Tests) |
| **Documentation**| OpenAPI 3.0, Interactive Swagger UI |

---

## Project Structure

```
QueueForge/
├── src/
│   ├── index.ts                          # Entry point
│   ├── main.ts                           # Bootstrap entry point
│   ├── shared/                           # Types, schemas, errors, utilities
│   ├── config/                           # Configuration definitions & env loading
│   ├── infrastructure/                   # PostgreSQL (Prisma), Redis, BullMQ
│   ├── domain/                           # Domain entities & value objects
│   ├── application/                      # Application use cases & services
│   ├── security/                         # Authentication & rate limiting
│   ├── resilience/                       # Circuit breakers & bulkheads
│   ├── worker/                           # BullMQ job processor & connectors
│   ├── daemon/                           # Background health & recovery daemons
│   ├── api/                              # REST Controllers, routes, Swagger UI
│   ├── observability/                    # OpenTelemetry, Prometheus, Pino
│   └── bootstrap/                        # DI Container & initializers
├── tests/
│   ├── unit/                             # Unit tests (244 test suites)
│   ├── integration/                      # Integration tests
│   ├── chaos/                            # Chaos resilience tests
│   └── performance/                      # k6 load tests
├── prisma/
│   ├── schema.prisma                     # Database schema definition
│   └── migrations/                       # Database migration history
├── docs/                                 # 33 comprehensive Markdown documents
├── .env.example                          # Environment variables template
├── package.json                          # Package scripts & dependencies
├── tsconfig.json                         # TypeScript configuration
├── jest.config.js                        # Jest test runner configuration
├── README.md                             # Repository showcase documentation
└── LICENSE                               # MIT License
```

---

## Installation

### Prerequisites
- **Node.js**: `v20.x` LTS or higher
- **PostgreSQL**: `v15.0` or higher
- **Redis**: `v7.0` or higher (or Memurai on Windows)

```bash
# Clone the repository
git clone https://github.com/Prajwal20p6/QueueForge.git
cd QueueForge

# Install dependencies
npm install
```

---

## Local Development

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Ensure `.env.local` includes valid connection settings:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/queueforge?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-secret-key-minimum-32-chars-long-for-local-testing"
API_KEY="qf_secret_api_key_12345"
```

### 2. Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial database records
npm run seed
```

### 3. Start Application
```bash
# Run in development mode
npm run dev
```

Expected startup output:
```text
✓ Connected to PostgreSQL pool (localhost:5432)
✓ Connected to Redis client (localhost:6379)
✓ BullMQ queues initialized (delivery-queue, delivery-queue-delayed, delivery-queue-dlq)
✓ Background daemons started (HealthDaemon, MetricsCollector, StateSync)
✓ REST API listening on http://localhost:3000
```

---

## API Documentation

QueueForge features interactive Swagger UI documentation directly accessible at:
👉 **`http://localhost:3000/api/docs`**

### Sample API Requests

#### 1. Ingest AI Task Result
```bash
curl -X POST "http://localhost:3000/api/v1/results" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: qf_secret_api_key_12345" \
  -d '{
    "emailId": "user@example.com",
    "agentId": "agent-001",
    "agentVersion": "1.0.0",
    "confidenceScore": 0.95,
    "resultPayload": {
      "summary": "AI classification complete"
    }
  }'
```

**Response (`202 Accepted`)**:
```json
{
  "message": "Task result successfully accepted and queued as 551ce6b2-0acb-4eb1-b0ae-11edaff71d55",
  "status": "ACCEPTED",
  "timestamp": "2026-07-22T11:32:34.016Z",
  "traceId": "req-bd6153f7-6231-4f26-8f1b-d30b72e40eb5"
}
```

#### 2. Query Result by ID
```bash
curl -X GET "http://localhost:3000/api/v1/results/551ce6b2-0acb-4eb1-b0ae-11edaff71d55" \
  -H "X-API-Key: qf_secret_api_key_12345"
```

#### 3. Health Diagnostics Check
```bash
curl http://localhost:3000/health
```

---

## Testing

QueueForge comes with extensive test coverage:
```bash
# Run all unit tests
npm run test:unit

# Run TypeScript type check
npm run typecheck

# Run production build
npm run build
```

---

## Documentation & Engineering Specs

- 📖 [Architecture Decision Records (ADR)](docs/ADR.md) - Rationale behind key technical decisions (BullMQ, Opossum Circuit Breakers, Redis Idempotency).
- ⚡ [Performance Benchmarks & Sizing](docs/PERFORMANCE.md) - Latency profiles, throughput limits, and database indexing optimizations.
- 🔒 [Security Model & Protection](docs/SECURITY.md) - Authentication mechanisms, HMAC payload signing, rate limiting, and compliance.
- 🛠️ [Operations & Runbooks](docs/OPERATIONS.md) - Incident handling, recovery procedures, and cluster monitoring.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
