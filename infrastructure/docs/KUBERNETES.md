# QueueForge Kubernetes (K8s) Architecture

## Manifest Structure
- `deployments/`: Contains API, Worker, and Daemon deployment specifications.
- `services/`: ClusterIP internal services.
- `ingress/`: NGINX Ingress rules with TLS termination.
- `hpa/`: Horizontal Pod Autoscaler scaling API from 3 to 10 replicas on high CPU/memory.
- `pdb/`: Pod Disruption Budgets guaranteeing minimum 2 active API nodes during cluster upgrades.
