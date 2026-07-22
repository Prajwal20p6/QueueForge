module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "queueforge-postgres-db"

  engine               = "postgres"
  engine_version       = "16.1"
  family               = "postgres16"
  instance_class       = "db.r6g.xlarge"
  allocated_storage    = 100
  max_allocated_storage = 500

  db_name  = "queueforge"
  username = "postgres"
  password = var.db_password
  port     = 5432

  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
}

resource "aws_security_group" "rds_sg" {
  name   = "queueforge-rds-sg"
  vpc_id = module.vpc.vpc_id
}
