# Disaster Recovery Plan

This plan details recovery procedures, recovery targets, and restoration processes in the event of an infrastructure outage or data corruption.

---

## 🎯 Recovery Objectives (RTO & RPO)

*   **Recovery Time Objective (RTO)**: < 30 minutes (maximum allowable duration to restore the service).
*   **Recovery Point Objective (RPO)**: < 5 minutes (maximum allowable duration of data loss from database or queue).

---

## 💾 Backup Retention Schedule

| Resource | Backup Method | Frequency | Retention | Storage Location |
|---|---|---|---|---|
| PostgreSQL | `pg_dump` snapshot | Hourly (incremental) | 30 days | S3 bucket (with versioning) |
| Redis | AOF + RDB | Continuous | N/A | Local persistent volume |
| Configuration | Parameter Store | On modification | Active | HashiCorp Vault / Cloud SSM |

---

## 🔄 Emergency Restoration Runbooks

### 1. Rebuilding Database State
In the event of database corruption:
1.  Provision a new PostgreSQL 15 database instance.
2.  Pull the latest database snapshot from S3.
3.  Deploy the schema and restore the data:
    ```bash
    pg_restore -U postgres -d queueforge_production -v /tmp/latest_snapshot.dump
    ```
4.  Re-synchronize the migrations:
    ```bash
    npx prisma migrate resolve --applied "0_init"
    ```

### 2. Recovering Queue State from Database
If the Redis cache instance fails and queue data is lost, QueueForge can reconstruct the queue state from the database:
1.  Confirm that Postgres is online and healthy.
2.  Start a fresh Redis container.
3.  Invoke the administrative queue rebuild script:
    ```bash
    npm run ts-node scripts/rebuild-queue.ts
    ```
    This script queries the database for `PENDING`, `PROCESSING`, and `SCHEDULED_RETRY` deliveries and enqueues them back into BullMQ.
