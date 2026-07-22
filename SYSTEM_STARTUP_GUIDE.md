# System Startup Guide

Instructions to boot QueueForge from scratch.

---

## 🏗️ Bootup Sequence
1.  **Boot Dependency Stack**:
    ```bash
    docker-compose -f docker/docker-compose.dev.yml up -d postgres redis
    ```
2.  **Verify DB and Redis logs connectivity**.
3.  **Run Migrations**:
    ```bash
    npx prisma migrate dev
    ```
4.  **Launch Core Workers & API services**:
    ```bash
    npm run dev
    ```
