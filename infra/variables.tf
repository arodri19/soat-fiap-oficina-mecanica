# ── Projeto ───────────────────────────────────────────────────────────────────

variable "project_name" {
  description = "Nome do projeto — prefixo de todos os recursos AWS"
  type        = string
  default     = "oficina-mecanica"
}

variable "aws_region" {
  description = "Região AWS onde os recursos serão criados"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Ambiente de deployment: dev | staging | prod"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "O valor deve ser dev, staging ou prod."
  }
}

# ── EKS ───────────────────────────────────────────────────────────────────────

variable "cluster_version" {
  description = "Versão do Kubernetes no EKS"
  type        = string
  default     = "1.30"
}

variable "node_instance_type" {
  description = "Tipo de instância EC2 para os worker nodes"
  type        = string
  default     = "t3.medium"
}

variable "node_desired_size" {
  description = "Quantidade desejada de worker nodes"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Quantidade mínima de worker nodes"
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Quantidade máxima de worker nodes (teto do Cluster Autoscaler)"
  type        = number
  default     = 5
}

# ── RDS ───────────────────────────────────────────────────────────────────────

variable "db_name" {
  description = "Nome do banco de dados PostgreSQL"
  type        = string
  default     = "oficina"
}

variable "db_username" {
  description = "Usuário administrador do RDS"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Senha do RDS. Use TF_VAR_db_password ou terraform.tfvars (nunca commitar)"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "Classe de instância RDS"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Armazenamento inicial em GB"
  type        = number
  default     = 20
}
