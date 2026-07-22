# QueueForge Operational Runbooks

## Incident 1: High Delivery Error Rate (> 5%)
1. Check Grafana Delivery Overview dashboard.
2. Filter failed attempts by destination HTTP status codes.
3. If remote destination endpoint is failing, check if circuit breaker is OPEN.
4. Execute batch retry or DLQ recovery via Admin API once remote endpoint recovers.

## Incident 2: DLQ Explosion
1. Inspect DLQ items via Admin API (`GET /admin/dlq/analysis`).
2. Identify root cause category.
3. Trigger recovery daemon via `POST /admin/daemons/daemon-recovery/trigger`.
