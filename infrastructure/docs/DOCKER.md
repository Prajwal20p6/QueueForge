# QueueForge Docker Documentation

## Container Images
QueueForge compiles multi-stage lightweight Alpine-based container images:
- `Dockerfile.base`: Node 20 LTS runtime base image.
- `Dockerfile.api`: HTTP server & API controllers image.
- `Dockerfile.worker`: BullMQ background job processing worker image.
- `Dockerfile.daemon`: Leader-elected recovery & maintenance daemon image.

## Local Running with Docker Compose
```bash
docker-compose -f infrastructure/docker-compose/docker-compose.yml up --build
```
