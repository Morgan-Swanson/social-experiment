# Local module - documents local infrastructure (Docker Compose)
# This module doesn't actually provision resources but documents the local setup

variable "project_name" {
  description = "Project name"
  type        = string
}

# Local infrastructure is managed by Docker Compose
# This module exists for consistency and documentation purposes

output "info" {
  value = {
    database = {
      type     = "PostgreSQL"
      host     = "localhost"
      port     = 5432
      database = var.project_name
      username = "postgres"
      managed_by = "docker-compose"
    }
    storage = {
      type       = "MinIO"
      endpoint   = "http://localhost:9000"
      console    = "http://localhost:9001"
      bucket     = var.project_name
      managed_by = "docker-compose"
    }
    instructions = "Run 'docker-compose up -d' to start local services"
  }
}

output "database_url" {
  value = "postgresql://postgres:postgres@localhost:5432/${var.project_name}"
}

output "storage_endpoint" {
  value = "http://localhost:9000"
}

output "storage_bucket" {
  value = var.project_name
}