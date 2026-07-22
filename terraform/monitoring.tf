resource "aws_cloudwatch_log_group" "logs" {
  name              = "/aws/eks/queueforge-${var.environment}/cluster"
  retention_in_days = 7
}

resource "aws_sns_topic" "alerts" {
  name = "queueforge-alerts-topic-${var.environment}"
}
