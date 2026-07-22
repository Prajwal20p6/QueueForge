# QueueForge Disaster Recovery & Business Continuity

## Targets
- **Recovery Point Objective (RPO)**: <= 15 minutes.
- **Recovery Time Objective (RTO)**: <= 30 minutes.

## Failover Strategy
- Automated AWS RDS Multi-AZ failover for database.
- Automated ElastiCache Redis failover.
- EKS node group self-healing and pod auto-restarting.
