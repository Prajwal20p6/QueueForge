resource "aws_eks_cluster" "eks" {
  name     = "queueforge-cluster-${var.environment}"
  role_arn = aws_iam_role.eks_role.arn

  vpc_config {
    subnet_ids = [
      aws_subnet.public_1.id,
      aws_subnet.private_1.id
    ]
  }
  depends_on = [
    aws_iam_role_policy_attachment.eks_policy
  ]
}

resource "aws_eks_node_group" "nodes" {
  cluster_name    = aws_eks_cluster.eks.name
  node_group_name = "queueforge-nodes"
  node_role_arn   = aws_iam_role.node_role.arn
  subnet_ids      = [aws_subnet.private_1.id]

  scaling_config {
    desired_size = var.environment == "production" ? 3 : 1
    max_size     = 10
    min_size     = 1
  }
}
