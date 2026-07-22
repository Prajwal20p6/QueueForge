# Admin Management REST API

API endpoints references mounted under `/admin/api/v1`.

---

## 📈 Endpoints

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/dashboard` | Overall statistics overview | admin |
| `POST` | `/queue/pause` | Pauses BullMQ queue | admin |
| `POST` | `/queue/resume` | Resumes BullMQ queue | admin |
| `POST` | `/queue/clear` | Purges BullMQ queue | admin |
| `POST` | `/deliveries/retry` | Re-enqueues DLQ delivery ID | admin |
| `GET` | `/audit-logs` | Query security audit database | admin |
