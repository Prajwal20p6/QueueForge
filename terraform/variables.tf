variable "aws_region" {
  type        = string
  description = "AWS deployment region target"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Target deployment environment (staging, production)"
  default     = "staging"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}
