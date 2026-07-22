# Changelog

All notable changes to QueueForge will be documented in this file. This project adheres to Semantic Versioning (SemVer) guidelines.

---

## [1.0.0] - 2026-07-18

### Added
*   **Initial Production-ready Release**: Core Clean Architecture implementation mapping the primary modules.
*   **Resilience Layer**: Added Opossum circuit breakers, bulkhead isolation limits, and backpressure monitors.
*   **Observability Layer**: Added OpenTelemetry trace propagators, Jaeger exporters, and Prometheus scrapers.
*   **Security Layer**: Installed JWT strategies, API Key validation gates, and HMAC webhook signing.
*   **Worker & Daemons Layer**: Dynamic worker loops and stale job recovery daemons.
*   **Testing Infrastructure**: Complete unit, integration, chaos and E2E test suites with Testcontainers integrations.
*   **Docker Containerization**: Prod and dev Dockerfiles, multi-stage optimized builds, Nginx proxies, and docker-compose templates.
*   **CI/CD Pipeline**: GitHub Actions workflows automations (Lint, Typecheck, Test suites, Security, and Auto-Release).

### Security
*   API credentials validation checking.
*   Webhook HMAC signature validation verification.
*   Log redaction middleware preventing secrets leaks.
