# Admin Dashboard & Management Console Guide

Operating manual for QueueForge admin panel.

---

## 🖥️ Overview
The Admin Management Console allows operations teams to:
*   Pause, resume, or clear processing queues.
*   Retry failed dead-lettered dispatches.
*   Update runtime settings environment configurations.
*   Inspect security event log trails.

---

## 🛠️ Operational Tasks
### Pause Queue
```bash
curl -X POST http://localhost:3000/admin/api/v1/queue/pause \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "task-results"}'
```
