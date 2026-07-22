# Emergency Procedures

Triage steps during active outages.

---

## 🚨 Database Outage Recovery
1.  Verify DB connection pooling logs.
2.  If DB has crashed, execute recovery restore scripts.

---

## 🚨 Redis Outage Recovery
1.  Check Redis memory consumption limits.
2.  Restart Redis cluster and clear orphaned queues if necessary.
