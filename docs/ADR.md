# Architecture Decision Records (ADR)

This document records architectural decisions made for QueueForge, detailing rationale, alternatives considered, and trade-offs accepted.

---

## ADR-001: Event-Driven Architecture with BullMQ & Redis

**Status**: Accepted  
**Date**: 2026-07-22

### Problem
Needed guaranteed delivery of AI agent task results to multiple asynchronous destination endpoints (Webhooks, Databases, SQS Queues) with:
- Zero message loss under network partitions or downstream outages
- Horizontal worker scaling capability
- Resilience to destination failure cascades

### Decision
Implemented an event-driven architecture using:
- **BullMQ**: Distributed job queue built on Redis streams and Lua scripts
- **PostgreSQL**: Append-only persistent storage for task result payloads and delivery attempts
- **Redis**: Distributed state management, leader election for recovery daemons, and sliding-window idempotency cache

### Rationale
- BullMQ provides a mature job queue with native retry backoff strategies and Dead Letter Queue (DLQ) support.
- PostgreSQL guarantees durability and ACID compliance for audit trails.
- Redis enables sub-millisecond distributed lock acquisition and high-throughput cache lookups.
- Decoupling API ingestion from destination dispatch prevents slow webhooks from blocking client HTTP responses.

### Consequences
- Requires operating 3 stateful infrastructure components (PostgreSQL, Redis, BullMQ).
- Requires operational queue depth monitoring and alerting.

---

## ADR-002: Circuit Breaker Pattern (Opossum Integration)

**Status**: Accepted  
**Date**: 2026-07-22

### Problem
Downstream webhook target failures or network timeouts could cause cascading worker thread exhaustion and retry storms.

### Decision
Implemented per-destination circuit breakers using the Opossum library with a 3-state machine:
- **CLOSED**: Normal operation. Requests flow to downstream connectors.
- **OPEN**: Rejects requests immediately after 5 consecutive failures, preserving worker resources.
- **HALF_OPEN**: Probes downstream recovery with a single canary request after a 30-second reset window.

### Rationale
- Prevents worker thread saturation during downstream system outages.
- Gives failing external endpoints time to recover without receiving overload traffic.
- Opossum is lightweight, event-driven, and provides real-time state metrics.

### Consequences
- In-flight requests during `OPEN` state are immediately dead-lettered or queued for delayed evaluation.

---

## ADR-003: Idempotency via Redis Sliding Window

**Status**: Accepted  
**Date**: 2026-07-22

### Problem
Network retries and duplicate HTTP requests could cause duplicate payload dispatches to external systems.

### Decision
Implemented a sliding-window idempotency cache in Redis using a composite key:
- **Key Structure**: `idempotency:hash({taskResultId}:{destinationId})`
- **Value**: Encoded delivery result and dispatch timestamp
- **TTL**: 24 hours (86,400 seconds)

### Rationale
- Sub-millisecond Redis `GET` lookups prevent duplicate processing before database insertion.
- Composite key ensures granular duplicate detection per task result and target destination.
- 24-hour TTL matches the maximum retry window of external delivery attempts.

### Consequences
- Redis memory usage scales with daily delivery volume (managed via `allkeys-lru` eviction policy).
