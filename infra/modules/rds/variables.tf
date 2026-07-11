variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "eks_node_sg_id" {
  description = "Security group dos worker nodes (Terraform-managed)"
  type        = string
}

variable "eks_cluster_sg_id" {
  description = "Security group gerenciado pelo EKS (AWS-managed, automaticamente anexado aos nodes)"
  type        = string
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_instance_class" {
  type = string
}

variable "db_allocated_storage" {
  type = number
}

variable "db_backup_retention" {
  type    = number
  default = 0
}
