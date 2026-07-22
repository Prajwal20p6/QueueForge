# System Architecture Diagrams

This document contains Mermaid and ASCII diagrams visualizing database structures, layer interactions, and pipeline execution flows.

---

## 💾 Database ER Diagram (Prisma Schema)

```mermaid
erDiagram
    AiTaskResult ||--o{ TaskResultDelivery : "has"
    Destination ||--o{ TaskResultDelivery : "receives"
    TaskResultDelivery ||--o{ AttemptLog : "records"
    
    AiTaskResult {
        string id PK
        string emailId
        string agentId
        string agentVersion
        json resultPayload
        float confidenceScore
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    
    Destination {
        string id PK
        string endpointUrl
        string destinationType
        json eventFilters
        boolean enabled
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    
    TaskResultDelivery {
        string id PK
        string taskResultId FK
        string destinationId FK
        string status
        int retryCount
        datetime nextRetryAt
        datetime createdAt
        datetime updatedAt
    }
    
    AttemptLog {
        string id PK
        string deliveryId FK
        int responseCode
        string responseBody
        float durationMs
        datetime createdAt
    }
```

---

## 🔄 Delivery Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING : Ingestion Successful
    PENDING --> PROCESSING : Worker Picks Up Job
    PROCESSING --> COMPLETED : Webhook HTTP 2xx
    PROCESSING --> SCHEDULED_RETRY : Webhook HTTP 5xx (Transient)
    SCHEDULED_RETRY --> PROCESSING : Retry Delay Elapsed
    PROCESSING --> FAILED_DLQ : Max Retries Exceeded or Permanent Error
    FAILED_DLQ --> [*]
    COMPLETED --> [*]
```

---

## ⚡ Happy Path Data Flow

```
[Ingest API] ──► (Verify Idempotency)
      │
      ├──► Save to Postgres (AiTaskResult)
      │
      ├──► Publish to Redis (BullMQ main-queue)
            │
            ▼
      [Worker Node] ──► Query matching active Webhooks
            │
            ▼
      [Opossum Breaker] ──(CLOSED)──► POST payload to Destination URL
                                             │
                                             ▼
                                     Response HTTP 200 OK
                                             │
                                             ▼
                                     Mark completed in DB
```
