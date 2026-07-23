# Changelog

All notable changes to QueueForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-22

### Added
- Event-Driven Pipeline with Guaranteed Delivery architecture.
- PostgreSQL persistence layer with Prisma ORM schema migrations.
- BullMQ queue processing engine with Dead Letter Queue (DLQ) support.
- Redis/Memurai sliding-window idempotency cache for duplicate payload rejection.
- Opossum circuit breaker per destination connector.
- Bulkhead concurrency isolation per destination type.
- Exponential backoff retry mechanism with configurable jitter.
- Background Recovery Daemon for stale job detection and leader election.
- OpenTelemetry distributed tracing & W3C context propagation.
- Prometheus metrics exporter (`GET /metrics`).
- Operations Admin Dashboard built with React 18, TypeScript, Tailwind CSS, and Recharts in `src/frontend/`.
- Containerization & Orchestration via Docker multi-stage builds, Docker Compose, Kubernetes manifests, and Terraform scripts.
- Render Blueprint deployment configuration (`render.yaml`).
- Comprehensive test suite (244 unit tests, integration tests, chaos resilience tests, and performance capacity benchmarks passing 100%).
- GitHub Actions CI/CD workflows (quality gates, Trivy container security scans, npm audit, and Codecov reporting).
- Enterprise Security Layer (JWT authentication, Master API Keys, HMAC SHA256 webhook signatures, Helmet security headers).

### Fixed
- OpenSSL and musl engine library compatibility for Prisma in Alpine Docker containers.
- Nixpacks client generation and startup resilience for Railway and Render cloud deployments.
- Cloud SSL termination support when running behind ingress proxies.
- Administrative subrouter context binding in Express middleware.

### Documentation
- Comprehensive 200+ line repository README with interactive Mermaid architecture diagrams.
- REST API OpenAPI 3.0 specification served interactively via Swagger UI at `/api/docs`.
- Deployment guides for local Node.js, Docker, Kubernetes, Railway, and Render platforms.

## [0.9.0] - 2026-07-15

### Initial Implementation
- Core Clean Architecture domain model and layer boundaries.
- Initial BullMQ queue handler implementations.
- REST API endpoint routes and validation schemas.
- Testing harness setup with Jest.
