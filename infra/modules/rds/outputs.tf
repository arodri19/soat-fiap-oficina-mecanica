output "db_endpoint" {
  description = "Endpoint do RDS no formato host:porta"
  value       = aws_db_instance.postgres.endpoint
}

output "db_host" {
  description = "Hostname do RDS (sem porta)"
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "Porta do PostgreSQL"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Nome do banco de dados criado"
  value       = aws_db_instance.postgres.db_name
}

output "rds_security_group_id" {
  description = "ID do security group do RDS"
  value       = aws_security_group.rds.id
}
