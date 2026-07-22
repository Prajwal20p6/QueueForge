resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "queueforge-redis-${var.environment}"
  description                = "QueueForge Redis clusters caching"
  node_type                  = var.redis_node_type
  num_cache_clusters         = 2
  parameter_group_name       = "default.redis7"
  port                       = 6379
  multi_az_enabled          = true
  automatic_failover_enabled = true
}
