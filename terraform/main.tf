terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# This is the main entry point that selects between local and cloud modules
variable "environment" {
  description = "Environment to deploy (local or cloud)"
  type        = string
  default     = "local"
}

variable "aws_region" {
  description = "AWS region for cloud deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "social-experiment"
}

# Local environment (using Docker Compose - this is more for documentation)
module "local" {
  source = "./modules/local"
  count  = var.environment == "local" ? 1 : 0
  
  project_name = var.project_name
}

# Cloud environment (AWS)
module "cloud" {
  source = "./modules/cloud"
  count  = var.environment == "cloud" ? 1 : 0
  
  project_name = var.project_name
  aws_region   = var.aws_region
}

output "environment" {
  value = var.environment
}

output "database_url" {
  value     = var.environment == "cloud" ? module.cloud[0].database_url : "postgresql://postgres:postgres@localhost:5432/social_experiment"
  sensitive = true
}

output "storage_endpoint" {
  value = var.environment == "cloud" ? module.cloud[0].storage_endpoint : "http://localhost:9000"
}

output "storage_bucket" {
  value = var.environment == "cloud" ? module.cloud[0].storage_bucket : "social-experiment"
}