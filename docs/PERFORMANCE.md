# Performance Tuning and Benchmarks

QueueForge is engineered for high throughput, low latency, and efficient memory utilization.

---

## ⚡ Performance SLO Metrics

The pipeline targets the following service level objectives under standard operating profiles:

*   **Ingestion Latency**: P95 < 200ms
*   **Delivery Latency**: P95 < 3.5s, P99 < 8.0s (excluding downstream server latency)
*   **Throughput Capacity**: > 100 sustained result dispatches per second on single Node server

---

## 📈 Concurrency & Sizing Configuration

Configure container CPU allocation ratios matching environment needs:

```env
# Concurrency allocations per node worker instance
WORKER_CONCURRENCY=4
WORKER_POLL_INTERVAL_MS=50

# Connection limits per container instance
DB_POOL_MIN=5
DB_POOL_MAX=20
REDIS_POOL_MAX=20
```

---

## 🗄️ Database Optimizations

### PostgreSQL Indexes
The database uses composite indexes to optimize read queries:
*   `CREATE INDEX idx_results_email_agent ON ai_task_results(email_id, agent_id, created_at DESC)`
*   `CREATE INDEX idx_deliveries_dest_status ON TaskResultDelivery(destination_id, status)`

### Autovacuum Settings
Configure aggressive table vacuums in Postgres to prevent bloat on high-write attempt logs:
```sql
ALTER TABLE "AttemptLog" SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE "AttemptLog" SET (autovacuum_analyze_scale_factor = 0.02);
```
