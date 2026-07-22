# Monitoring and Alerts Setup

Prometheus and Alertmanager configurations parameters.

---

## 📈 Metric Mappings
*   `queueforge_ingest_total`: Accumulates results ingestion volume.
*   `queueforge_delivery_success`: Successful dispatches count.
*   `queueforge_latency_seconds`: Attempt execution latency.

---

## 🚨 Alerts Rules
*   **SLO Breached**: Alert if P95 latency is > 5 seconds.
*   **High Error Rate**: Alert if error rate exceeds 2% in rolling 5m window.
