# QueueForge Observability & Monitoring Setup

## Prometheus & Grafana Integration
- **Metrics Endpoint**: `/metrics` (Prometheus text format).
- **Alert Rules**: Triggers alerts on error rates exceeding 5%, DLQ backlog over 1000 items, and node failures.
- **AlertManager**: Routes critical production alerts to Slack and PagerDuty.
