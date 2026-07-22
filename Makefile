# ──────────────────────────────────────────────────────────────────────────────
# QueueForge Container Automation Makefile
# ──────────────────────────────────────────────────────────────────────────────

.PHONY: help docker-build docker-run docker-stop docker-logs docker-clean docker-test

# Default target
help:
	@echo "QueueForge Container Makefile Actions:"
	@echo "  docker-build : Build production image using multi-stage docker rules"
	@echo "  docker-run   : Start the dev environment compose stack in background"
	@echo "  docker-stop  : Stop dev compose stack services"
	@echo "  docker-logs  : Follow dev compose logs outputs"
	@echo "  docker-clean : Stop services, purge volumes and remove cache files"
	@echo "  docker-test  : Build and run the integration test suite compose stack"

docker-build:
	@bash ./scripts/docker/build.sh

docker-run:
	@bash ./scripts/docker/run-local.sh

docker-stop:
	@docker-compose -f docker/docker-compose.yml down

docker-logs:
	@docker-compose -f docker/docker-compose.yml logs -f

docker-clean:
	@bash ./scripts/docker/cleanup.sh

docker-test:
	@echo "Starting test environment Docker Compose stack..."
	@docker-compose -f docker/docker-compose.test.yml up --build --exit-code-from queueforge-test
