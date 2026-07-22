# Handoff Documentation

Design decisions and patterns handbook.

---

## 🏗️ Architecture Rationale
*   **Separation of Concerns**: Application logic sits inside Services layers detached from Express routing files.
*   **Guaranteed Delivery**: Retries queues use BullMQ with Redis persistence.

---

## 📈 Tech Debt
*   Upgrade to database sharding in future releases.
