# QueueForge Infrastructure as Code (Terraform)

## AWS Infrastructure Provisioned
- **VPC**: 3 Availability Zones, private and public subnets, NAT gateways.
- **EKS**: Managed Kubernetes cluster (version 1.28) with auto-scaling node groups.
- **RDS**: Multi-AZ PostgreSQL 16 instance.
- **ElastiCache**: Redis 7 cluster mode enabled.
- **ALB**: Application Load Balancer with ACM SSL certificates.
