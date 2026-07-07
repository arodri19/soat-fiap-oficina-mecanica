# ── VPC ───────────────────────────────────────────────────────────────────────

output "vpc_id" {
  description = "ID da VPC criada"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "IDs das subnets privadas (EKS nodes + RDS)"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs das subnets públicas (load balancers)"
  value       = module.vpc.public_subnet_ids
}

# ── EKS ───────────────────────────────────────────────────────────────────────

output "cluster_name" {
  description = "Nome do cluster EKS"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint da API do cluster EKS"
  value       = module.eks.cluster_endpoint
}

output "kubeconfig_command" {
  description = "Comando para configurar kubectl apontando para este cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "apply_k8s_manifests" {
  description = "Comando para aplicar os manifestos Kubernetes após configurar o kubeconfig"
  value       = "kubectl apply -f ../k8s/"
}

# ── RDS ───────────────────────────────────────────────────────────────────────

output "db_endpoint" {
  description = "Endpoint do RDS PostgreSQL (host:porta)"
  value       = module.rds.db_endpoint
}

output "db_connection_string" {
  description = "DATABASE_URL completa para uso na aplicação"
  value       = "postgresql://${var.db_username}:${var.db_password}@${module.rds.db_endpoint}/${var.db_name}?schema=public"
  sensitive   = true
}

# ── ECR ───────────────────────────────────────────────────────────────────────

output "ecr_repository_url" {
  description = "URL do repositório ECR — usar como prefixo nas tags das imagens"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_login_command" {
  description = "Comando para autenticar o Docker no ECR"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}"
}

output "db_secret_patch_command" {
  description = "Comando para atualizar o Secret do Kubernetes com o endpoint RDS real"
  value       = "kubectl patch secret oficina-secrets -n oficina-mecanica -p '{\"stringData\":{\"DATABASE_URL\":\"postgresql://${var.db_username}:<SENHA>@${module.rds.db_endpoint}/${var.db_name}?schema=public\"}}'"
}
