# Observability and Monitoring Strategy

QueueForge provides native telemetry, including metrics exporters, tracing, and structured logging.

---

## 📊 Core Prometheus Telemetry Metrics

Prometheus scrapes metrics from the `/metrics` API route. The following gauges and counters are tracked:

| Metric Name | Type | Labels | Description |
|---|---|---|---|
| `queueforge_deliveries_total` | Counter | `status`, `destId` | Total webhook delivery attempts |
| `queueforge_delivery_duration_seconds` | Histogram | `destId` | Outgoing HTTP latency duration |
| `queueforge_queue_depth` | Gauge | `queue` | Main and delayed queue size |
| `queueforge_circuit_state` | Gauge | `destId` | Circuit Breaker state (0=closed, 1=open, 2=half_open) |
| `queueforge_active_workers` | Gauge | `workerId` | Concurrently executing worker nodes |

---

## 🚨 Prometheus Alert Rules Configuration

Add these rules to `prometheus.yml` to trigger PagerDuty/Slack alarms:

```yaml
groups:
  - name: QueueForgeAlerts
    rules:
      # Alert if queue exceeds 1000 items
      - alert: QueueCongestion
        expr: queueforge_queue_depth > 1000
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Queue backlog exceeds threshold: {{ $value }} jobs waiting"

      # Alert if circuit breaker stays open
      - alert: CircuitBreakerTripped
        expr: queueforge_circuit_state == 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Destination circuit breaker is stuck OPEN for 10 minutes"
```

---

## 🛡️ Distributed Tracing Configuration

Traces are collected and forwarded to Jaeger using OpenTelemetry:

*   **Trace Context Propagation**: W3C headers propagate context seamlessly from client ingest controllers to BullMQ worker jobs, and then onto outgoing HTTP calls.
*   **Sample Rate**: Configured via `OTEL_TRACE_SAMPLE_RATE`. Set to `1.0` in dev/staging, and `0.05` (5% sampling) in high-throughput production to optimize storage footprint.
