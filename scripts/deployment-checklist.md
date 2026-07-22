# Pre-Deployment Operational Checklist

Verify that the target release candidate conforms to the following checks before switching production traffic routes.

---

## 🏗️ 1. Code & Compilation Checks
- [ ] Code compiles cleanly without warning output (`npm run typecheck`).
- [ ] Styles audit verification ESLint checks pass (`npm run lint`).
- [ ] The full Jest testing suite passes with 100% success (`npm test`).

## 📁 2. Database & Data Isolation Checks
- [ ] Database backup has been created and verified (`./scripts/db-backup.sh`).
- [ ] Prisma schema migrations have been applied cleanly to staging database copy (`npx prisma migrate deploy`).
- [ ] Connections limits are within the database pool sizing capacities.

## 🐳 3. Container Configurations & Orchestration Checks
- [ ] Docker build is successful on production targets (`./scripts/docker/build-all.sh`).
- [ ] The production compose configurations contain resource boundaries cpulimit/memory limit.
- [ ] Non-root execution is validated inside the runner container user context.

## 📡 4. Networking & Routing Checks
- [ ] Firewall security rules isolate Postgres and Redis ports from direct internet ingress queries.
- [ ] Nginx proxies rate limiting zones are set up.
- [ ] SSL cert binds support TLS 1.3 only.

## 📊 5. Telemetry & Alerts Checks
- [ ] Prometheus metrics target exposes active gauges `/metrics`.
- [ ] Jaeger traces collector is reachable via OTLP.
- [ ] Slack notification webhooks are active.
