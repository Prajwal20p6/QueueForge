# QueueForge Production Deployment Guide

## Architecture Summary
QueueForge is deployed as a microservices topology consisting of:
- **API Nodes**: Stateless REST controllers serving ingestion & management endpoints.
- **Worker Engine Nodes**: Distributed BullMQ job processors executing outbound webhook/database/queue deliveries.
- **Background Daemons**: Distributed leader-elected background maintenance processes.
- **PostgreSQL**: Primary transactional persistence layer (AWS RDS Multi-AZ).
- **Redis**: Distributed queue engine and cache coordinator (AWS ElastiCache Cluster).

## Deployment Steps
1. **Infrastructure Provisioning**: Run Terraform under `infrastructure/terraform` (`terraform apply`).
2. **Kubernetes Deployment**: Deploy manifests via `kubectl apply -k infrastructure/kubernetes/`.
3. **Smoke Verification**: Run `./infrastructure/ci-cd/scripts/verify-deployment.sh`.
