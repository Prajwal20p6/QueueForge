output "eks_cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  description = "Endpoint for EKS control plane"
}

output "rds_endpoint" {
  value       = module.rds.db_instance_endpoint
  description = "PostgreSQL RDS connection endpoint"
}

output "redis_endpoint" {
  value       = module.elasticache.primary_endpoint_address
  description = "Redis ElastiCache primary endpoint"
}
