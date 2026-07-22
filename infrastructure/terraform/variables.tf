variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for deployment"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Target environment (dev, staging, production)"
}

variable "cluster_name" {
  type        = string
  default     = "queueforge-cluster"
  description = "EKS Cluster name"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "RDS PostgreSQL master password"
}
