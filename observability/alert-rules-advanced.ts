export const AdvancedAlertRulesYaml = `
groups:
  - name: QueueForgeSLOAlerts
    rules:
      - alert: IngestionSLOBreach
        expr: ingestion_latency_p95 > 3500
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "API Ingestion Latency SLO breached (>3.5s)"
`;
