terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# AWS Provider - configured at root level to work with module count
provider "aws" {
  region = var.aws_region
  
  # Skip provider validation for local environment
  skip_credentials_validation = var.environment == "local"
  skip_requesting_account_id  = var.environment == "local"
  skip_metadata_api_check     = var.environment == "local"
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

variable "github_repo" {
  description = "GitHub repository for Amplify deployment"
  type        = string
  default     = "Morgan-Swanson/social-experiment"
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}

variable "nextauth_secret" {
  description = "NextAuth secret for session encryption"
  type        = string
  sensitive   = true
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
  
  project_name     = var.project_name
  aws_region       = var.aws_region
  github_repo      = var.github_repo
  github_branch    = var.github_branch
  nextauth_secret  = var.nextauth_secret
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