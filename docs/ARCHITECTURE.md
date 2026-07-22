# System Architecture and Flow Design

QueueForge is structured around Clean Architecture principles, ensuring separation of concerns, high testability, and decoupling from database systems and external service frameworks.

---

## 📐 Layers Design

The codebase is organized into five distinct abstraction boundaries:

```
                  ┌───────────────────────────────┐
                  │          Observability        │
                  │   (Telemetry, Logging, Audit) │
                  └───────┬───────────────┬───────┘
                          │               │
┌─────────────────────────▼─┐       ┌─────▼──────────────────┐
│      API & Presentation   │       │   Worker & Daemon      │
│  (Controllers, Middlewares)│       │ (Processors, Recovery) │
└───────────┬───────────────┘       └─────┬──────────────────┘
            │                             │
┌───────────▼─────────────────────────────▼──────────────────┐
│                    Application Use Cases                   │
│         (IngestResults, RebuildQueue, DeliverResults)      │
└───────────┬────────────────────────────────────────────────┘
            │
┌───────────▼────────────────────────────────────────────────┐
│                        Domain Layer                        │
│            (Entities, Aggregate Roots, Value Objects)      │
└───────────▲────────────────────────────────────────────────┘
            │
┌───────────┴────────────────────────────────────────────────┐
│                    Infrastructure Layer                    │
│                 (PrismaClient, ioredis, BullMQ)            │
└────────────────────────────────────────────────────────────┘
```

1.  **Domain Layer**: Inner-most core layer containing business entities (`AiTaskResult`, `Delivery`, `Destination`), domain exceptions, and value objects (`EmailId`, `ConfidenceScore`). Free of dependencies on database or routing frameworks.
2.  **Application Layer**: Contains use cases and service interfaces coordinates pipelines data mapping, dependency container interfaces, and domain event dispatchers.
3.  **Interface & API Layer**: Express HTTP controllers, authentication strategies, validation constraints middleware, and custom request mappers.
4.  **Infrastructure Layer**: Implements core persistence repository abstractions (`PrismaClient` PostgreSQL connectors), BullMQ client queueing adapters, and Redis cache integrations.
5.  **Cross-Cutting Layer**: System-wide telemetry decorators (OpenTelemetry tracers, Prometheus client registries, Pino/Winston log formats).

---

## 🔄 Data Flows and State Machines

### 1. Ingestion Flow (Happy Path)
```
[Client App] ──(API Key/JWT)──► [Ingest Controller]
                                       │
                              (Composite Key Verification)
                                       │
                                [Prisma PostgreSQL] ─(Save Result)
                                       │
                              (Emit Received Event)
                                       │
                               [BullMQ Main Queue] ──(Enqueue Job)
```

### 2. Delivery Flow (Transients Retries Path)
```
[BullMQ Worker] ──(Process Job)──► [Destination Webhook]
                                           │
                                  (HTTP 503 Transient Error)
                                           │
                                  (Exponential Backoff)
                                           │
                                [Prisma db Update Retry]
                                           │
                            [BullMQ Delayed Queue] ─(Re-enqueue)
```

### 3. Permanent Failure (DLQ Path)
```
[BullMQ Worker] ──(Attempt 3 Fails)──► [Prisma db Status Update]
                                                │
                                        (Set FAILED_DLQ status)
                                                │
                                        [BullMQ DLQ Queue]
```

### 4. Recovery Path (Worker Crashed)
```
[Stale Job Detector (Daemon)] ──(Scans Prisma for PROCESSING state > 5 min)
                                                │
                                    (Checks Worker Heartbeat in Redis)
                                                │
                                    (Worker Heartbeat Expired ✗)
                                                │
                                     [BullMQ Main Queue]
                                      (Re-enqueue Job)
```

---

## 🛡️ Resilience Design Patterns

*   **Circuit Breaker**: Outbound webhook calls flow through Opossum-based breakers. If a destination fails repeatedly (e.g. 50% failures over 5 requests), the circuit trips to `OPEN`, failing fast locally and immediately enqueuing retry jobs without contacting the client.
*   **Bulkhead Isolation**: Isolates concurrent outgoing executions per destination. Slow destinations consuming concurrency queues will not trigger starvation on healthy destinations.
*   **Backpressure Alarms**: If the BullMQ depth exceeds 80% occupancy threshold capacity, QueueForge starts shedding non-critical logging events and throttles ingest API pipelines, raising alerts.

---

## 📊 Telemetry and Trace Propagation

OpenTelemetry Context is propagated across all asynchronous boundaries:
*   Incoming HTTP Header: `traceparent` (W3C standard).
*   BullMQ Job Metadata: The trace context is serialized into the job payload.
*   Worker Execution: Spans are reconstructed from job payloads, ensuring trace lineage spans across server, queue, and outgoing webhooks calls.
