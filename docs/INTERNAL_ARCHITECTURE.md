# Technical Deep-Dive

This document provides a technical deep-dive into the internal modules, algorithms, and technical trade-offs of QueueForge.

---

## 🏗️ Module Design & Responsibilities

### 1. Ingestion Engine
*   **Location**: `src/api/controllers/result.controller.ts` & `src/application/use-cases/ingest-result.use-case.ts`
*   **Role**: Accepts incoming JSON payloads, validates parameters using Joi/Zod, and computes a composite idempotency key. It then persists the record in PostgreSQL and publishes a job to BullMQ.
*   **Algorithm**:
    ```
    Key = SHA-256(emailId + ":" + agentId + ":" + JSON.stringify(resultPayload))
    ```

### 2. Resilience Context
*   **Location**: `src/resilience/`
*   **Role**: Orchestrates circuit breakers, bulkhead concurrency limits, and backpressure monitors.
*   **Algorithm (Bulkhead)**:
    Uses a Redis-backed token bucket or ZSET window to track active requests per destination ID, limiting concurrency and queueing excess requests.

### 3. Outbound Worker Processor
*   **Location**: `src/worker/processor/`
*   **Role**: Subscribes to the BullMQ main queue. When a job is active, it reconstructs the trace context, checks the destination's circuit breaker, signs the payload, and sends the HTTP POST request.
*   **Error Classification**:
    *   **Transient Errors** (HTTP 500, 502, 503, 504, timeout): Trigger the retry loop.
    *   **Permanent Errors** (HTTP 400, 401, 403, 404): Instantly route the job to the Dead Letter Queue (DLQ).

---

## 📈 Scalability and Threading Analysis

*   **Concurrency**:
    Node.js runs single-threaded, but the BullMQ worker uses event-driven asynchronous I/O to handle hundreds of concurrent requests.
*   **Database Constraints**:
    PostgreSQL connection pooling prevents the Node event loop from exhausting database connections.
*   **Redis Workloads**:
    Redis is used for queue management and circuit breaker state tracking. It stores keys with appropriate TTLs to prevent memory issues.
