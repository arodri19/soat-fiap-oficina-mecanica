output "cluster_name" {
  description = "Nome do cluster EKS"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "URL da API do cluster EKS"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_ca_certificate" {
  description = "Certificado CA do cluster (base64)"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_version" {
  description = "Versão do Kubernetes provisionada"
  value       = aws_eks_cluster.main.version
}

output "node_security_group_id" {
  description = "ID do security group dos worker nodes (usado pelo módulo RDS)"
  value       = aws_security_group.eks_nodes.id
}

output "node_role_arn" {
  description = "ARN do IAM Role dos worker nodes"
  value       = aws_iam_role.eks_node.arn
}
