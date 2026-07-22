resource "aws_db_instance" "postgres" {
  identifier             = "queueforge-db-${var.environment}"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = var.db_instance_class
  db_name                = "queueforge"
  username               = "postgres"
  password               = "productionpass123"
  skip_final_snapshot    = true
  multi_az               = var.environment == "production" ? true : false
  backup_retention_period = 30
}
