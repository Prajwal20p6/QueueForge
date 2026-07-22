# Product Roadmap

## Q3 2026: Core Resilience (Completed)
*   Clean Architecture foundation.
*   Prisma + PostgreSQL audit logging persistence.
*   BullMQ + Redis async task queue execution.
*   Opossum Circuit Breakers and Bulkhead isolation.
*   Prometheus metrics collection and Jaeger span tracking.

## Q4 2026: Multi-Tenant Expansion
*   Support tenant namespace isolation in database and queues.
*   Define custom rate limiting policies per tenant endpoint.
*   Implement webhook payload encryption at rest.

## H1 2027: Administration Dashboard
*   Interactive dashboard to view queue state graphs in real-time.
*   Manual retry triggering for failed DLQ items.
*   Configurable alert thresholds configuration via UI.
