# Migration and Upgrades Guide

This document describes the process for upgrading QueueForge, deploying database schema updates, and handling rollbacks.

---

## 🔄 Schema Migration Workflow

Prisma handles database schema migrations in QueueForge. Follow these steps to apply schema updates:

### 1. Development Schema Update
1.  Modify `prisma/schema.prisma`.
2.  Generate a new migration file:
    ```bash
    npx prisma migrate dev --name add_new_column
    ```
3.  Prisma applies the migration to your local database and updates the client definition files.

### 2. Production Deployment
Production database migrations are executed by the container's entrypoint script (`entrypoint.sh`) using:
```bash
npx prisma migrate deploy
```
This applies any pending migrations safely without modifying data or deleting columns.

---

## 🔙 Rollback Guidelines

If a migration fails or causes issues in production, follow these steps to roll back:

1.  Identify the last known stable migration tag (e.g. `20240718000000_init`).
2.  Deploy the previous container image version.
3.  Roll back the database schema if necessary. (Avoid rolling back schema changes in production if they drop columns or tables; instead, deploy a forward-migrating fix).
