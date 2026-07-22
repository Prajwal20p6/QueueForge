# ──────────────────────────────────────────────────────────────────────────────
# QueueForge Operational Makefile (alternative)
# ──────────────────────────────────────────────────────────────────────────────

.PHONY: setup dev test test-watch build lint format clean db-migrate db-seed db-backup health help

setup:
	@bash ./setup.sh

dev:
	@bash ./dev.sh

test:
	@bash ./test.sh all

test-watch:
	@bash ./test-watch.sh

build:
	@bash ./build.sh

lint:
	@bash ./lint.sh

format:
	@bash ./format.sh

clean:
	@bash ./clean.sh

db-migrate:
	@bash ./migrate.sh

db-seed:
	@bash ./seed.sh

db-backup:
	@bash ./db-backup.sh

health:
	@bash ./health-check.sh

help:
	@echo "QueueForge Scripts Makefile targets:"
	@echo "  make setup      - Setup workspace dependencies and configurations"
	@echo "  make dev        - Spin up docker services and start developer watch daemon"
	@echo "  make test       - Execute complete Jest test suite"
	@echo "  make test-watch - Execute tests in watch mode"
	@echo "  make build      - Compile TypeScript sources to target dist/"
	@echo "  make lint       - Run style checkers (ESLint)"
	@echo "  make format     - Automatically format code (Prettier)"
	@echo "  make clean      - Clear compilation caches and logs"
	@echo "  make db-migrate - Deploy prisma database migrations"
	@echo "  make db-seed    - Seed database with dev fixtures"
	@echo "  make db-backup  - Generate PostgreSQL SQL backup snapshot"
	@echo "  make health     - Run local health checker probes"
