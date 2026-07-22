output "postgres_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "Connection endpoint of target database instance"
}

output "redis_endpoint" {
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
  description = "Redis endpoint configurations"
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.eks.endpoint
}
