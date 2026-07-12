# ── Módulo VPC ────────────────────────────────────────────────────────────────
# Cria a rede completa: VPC, subnets públicas/privadas,
# Internet Gateway, NAT Gateway e route tables.
module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
}

# ── Módulo EKS ────────────────────────────────────────────────────────────────
# Cria o cluster Kubernetes gerenciado (control plane + node group)
# com roles IAM, security groups e configuração de rede.
module "eks" {
  source = "./modules/eks"

  project_name       = var.project_name
  environment        = var.environment
  cluster_version    = var.cluster_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_instance_type = var.node_instance_type
  node_desired_size  = var.node_desired_size
  node_min_size      = var.node_min_size
  node_max_size      = var.node_max_size
}

# ── Módulo RDS ────────────────────────────────────────────────────────────────
# Cria o PostgreSQL 16 gerenciado (RDS) em subnets privadas,
# acessível apenas pelos worker nodes do EKS.
module "rds" {
  source = "./modules/rds"

  project_name         = var.project_name
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  eks_node_sg_id       = module.eks.node_security_group_id
  eks_cluster_sg_id    = module.eks.cluster_security_group_id
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_backup_retention  = var.db_backup_retention
}
