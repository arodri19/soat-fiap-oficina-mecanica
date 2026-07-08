locals {
  name = "${var.project_name}-${var.environment}"
}

# ── Security Group: RDS ───────────────────────────────────────────────────────
# Recurso: aws_security_group (rds)
# Libera a porta 5432 EXCLUSIVAMENTE para os worker nodes do EKS.
# O banco NÃO é acessível pela internet.

resource "aws_security_group" "rds" {
  name        = "${local.name}-rds-sg"
  description = "RDS PostgreSQL security group - access from EKS nodes only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EKS node SG (Terraform-managed)"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.eks_node_sg_id]
  }

  ingress {
    description     = "PostgreSQL from EKS cluster SG (AWS-managed, attached to nodes)"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.eks_cluster_sg_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name}-rds-sg"
  }
}

# ── Subnet Group ──────────────────────────────────────────────────────────────
# Recurso: aws_db_subnet_group
# Define em quais subnets o RDS pode ser provisionado.
# Usando as duas subnets privadas para compatibilidade com Multi-AZ.

resource "aws_db_subnet_group" "main" {
  name        = "${local.name}-db-subnet-group"
  description = "Subnets privadas para o RDS PostgreSQL"
  subnet_ids  = var.private_subnet_ids

  tags = {
    Name = "${local.name}-db-subnet-group"
  }
}

# ── Parameter Group ───────────────────────────────────────────────────────────
# Recurso: aws_db_parameter_group
# Configurações de banco que diferem dos defaults do PostgreSQL 16.
# log_connections facilita auditoria de quem conectou ao banco.

resource "aws_db_parameter_group" "postgres16" {
  name        = "${local.name}-postgres16"
  family      = "postgres16"
  description = "Custom parameters for PostgreSQL 16"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # loga queries acima de 1 segundo
  }

  tags = {
    Name = "${local.name}-pg-params"
  }
}

# ── RDS Instance ──────────────────────────────────────────────────────────────
# Recurso: aws_db_instance
# PostgreSQL 16 gerenciado pela AWS com:
#   - Backups automáticos de 7 dias (backup_window diário às 03h)
#   - Criptografia em repouso (storage_encrypted)
#   - Janela de manutenção semanal (segunda-feira às 04h)
#
# Flags de PRODUÇÃO (ajustar quando promover):
#   multi_az            = true   → standby em outra AZ (HA)
#   deletion_protection = true   → impede exclusão acidental
#   skip_final_snapshot = false  → snapshot final antes de destruir

resource "aws_db_instance" "postgres" {
  identifier        = "${local.name}-postgres"
  engine            = "postgres"
  engine_version    = "16.9"
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres16.name

  # Acessibilidade e disponibilidade
  publicly_accessible = false
  multi_az            = false  # true em prod (custo dobra)

  # Backup e manutenção
  backup_retention_period = var.db_backup_retention
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Controle de ciclo de vida
  deletion_protection = false  # true em prod
  skip_final_snapshot = true   # false em prod

  # Atualizações automáticas de patches menores (ex: 16.3 → 16.4)
  auto_minor_version_upgrade = true

  tags = {
    Name = "${local.name}-postgres"
  }
}
