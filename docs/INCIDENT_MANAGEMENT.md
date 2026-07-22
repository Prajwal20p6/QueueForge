# Incident Management Guidelines

QueueForge incident diagnostics runbook.

---

## 🚨 Classification
1.  **SEV-1 (Critical)**: SLO breached or database connection pool exhausted.
2.  **SEV-2 (Major)**: Latency spikes above 5s threshold, but ingestion continues.
3.  **SEV-3 (Minor)**: Isolated worker transient failures.

---

## 📞 On-Call Escalation
1.  **Level 1**: Trigger notification alert to current On-Call Engineer.
2.  **Level 2**: If unacknowledged within 15 minutes, escalate to Lead Engineer.
