# Architecture Decision Log (ADRs)

This log records the key architectural decisions, context, and consequences for QueueForge.

---

## 📄 ADR-001: Choice of Express.js for the API Layer

*   **Status**: Accepted
*   **Context**:
    We needed a lightweight, flexible, and well-supported Node.js web framework to build the API endpoints.
*   **Decision**:
    We chose Express.js because of its rich middleware ecosystem (e.g. rate-limit, helmet, cors) and simple routing setup.
*   **Consequences**:
    Provides fast request parsing but requires developers to handle async route errors explicitly (using `express-async-errors`).

---

## 📄 ADR-002: Choice of BullMQ for Queue Management

*   **Status**: Accepted
*   **Context**:
    We needed a robust, persistent message queue that supports retries, backoff, concurrency limits, and parent-child jobs.
*   **Decision**:
    We chose BullMQ because it is Redis-backed, fast, and handles distributed task management natively in Node.js.
*   **Consequences**:
    Requires a running Redis instance. Introduces a dependency on Redis memory management, but provides low latency and atomic operations via Lua scripts.

---

## 📄 ADR-003: Choice of PostgreSQL and Redis Shared Storage

*   **Status**: Accepted
*   **Context**:
    We needed a persistence layer for audit logs, historical task results, and configuration metadata, alongside a cache for real-time queues.
*   **Decision**:
    We chose PostgreSQL (using Prisma) as the primary relational database and Redis as the caching and queue broker.
*   **Consequences**:
    Ensures relational integrity and ACID compliance for audit trails, while offloading high-throughput queue operations to Redis.

---

## 📄 ADR-004: Ingestion Idempotency Key Strategy

*   **Status**: Accepted
*   **Context**:
    We needed to prevent duplicate task results from being ingested at the API edge.
*   **Decision**:
    We implemented a composite idempotency key computed as the SHA-256 hash of:
    ```
    emailId + ":" + agentId + ":" + JSON.stringify(resultPayload)
    ```
*   **Consequences**:
    Incoming duplicate requests return HTTP `202 Accepted` or `409 Conflict` instantly without creating duplicate database records or queue jobs.
