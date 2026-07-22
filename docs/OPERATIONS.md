# Operations Runbook

This document describes the tasks, checks, and recovery procedures required to run QueueForge reliably in production.

---

## 📅 Maintenance Checklists

### Daily Checklists
*   Verify API health status via `/health`.
*   Check queue lengths in the Grafana dashboard. An increasing DLQ count requires immediate investigation.
*   Monitor database CPU and RAM utilization.

### Weekly Checklists
*   Review logs for repeated warnings or connection drops.
*   Analyze latency percentiles (P95/P99).
*   Run the database backup script and verify the backup files.

---

## 💾 Database Backup & Restore Runbooks

### Automated PostgreSQL Backup Script
Run this script weekly to export database schemas and tables:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/queueforge"
BACKUP_FILE="${BACKUP_DIR}/db_backup_$(date +%F_%T).sql"
mkdir -p "$BACKUP_DIR"
pg_dump -U postgres -d queueforge_production -F c -b -v -f "$BACKUP_FILE"
```

### PostgreSQL Restoration Script
Restore the database from a backup file in the event of failure:
```bash
#!/bin/bash
BACKUP_FILE=$1
pg_restore -U postgres -d queueforge_production -v "$BACKUP_FILE"
```

---

## 📈 Scaling Guidelines

*   **Worker Horizontal Scaling**: If queue depth increases while CPU usage remains low, scale the worker service horizontally:
    ```bash
    docker-compose -f docker/docker-compose.prod.yml up -d --scale queueforge=4
    ```
*   **Database Vertical Scaling**: If query latencies exceed 200ms, increase DB instance specs or add database replicas.
