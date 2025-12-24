# Cloud module - AWS infrastructure for beta production deployment

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "github_repo" {
  description = "GitHub repository for Amplify deployment (format: username/repo)"
  type        = string
  default     = "Morgan-Swanson/social-experiment"
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}

variable "nextauth_secret" {
  description = "NextAuth secret for session encryption (generate with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-a"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-b"
  }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "${var.project_name}-private-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "${var.project_name}-private-b"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "db" {
  name        = "${var.project_name}-db-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-db-sg"
  }
}

# RDS PostgreSQL Database
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "${var.project_name}-db-subnet"
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_db_instance" "postgres" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  db_name  = replace(var.project_name, "-", "_")
  username = "dbadmin"
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  # Single-AZ for beta cost optimization
  multi_az = false

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  skip_final_snapshot = true
  publicly_accessible = true  # Allow Amplify to connect

  tags = {
    Name        = "${var.project_name}-db"
    Environment = "beta"
  }
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "storage" {
  bucket = "${var.project_name}-storage-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-storage"
  }
}

resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "storage" {
  bucket = aws_s3_bucket.storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM role for application access
resource "aws_iam_role" "app" {
  name = "${var.project_name}-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "app_s3" {
  name = "${var.project_name}-s3-policy"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.storage.arn,
          "${aws_s3_bucket.storage.arn}/*"
        ]
      }
    ]
  })
}

# AWS Secrets Manager - Store all credentials securely
resource "aws_secretsmanager_secret" "database_url" {
  name        = "${var.project_name}/database-url"
  description = "PostgreSQL database connection string"

  tags = {
    Name = "${var.project_name}-database-url"
  }
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = "postgresql://${aws_db_instance.postgres.username}:${random_password.db_password.result}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
}

resource "aws_secretsmanager_secret" "nextauth_secret" {
  name        = "${var.project_name}/nextauth-secret"
  description = "NextAuth secret for session encryption"

  tags = {
    Name = "${var.project_name}-nextauth-secret"
  }
}

resource "aws_secretsmanager_secret_version" "nextauth_secret" {
  secret_id     = aws_secretsmanager_secret.nextauth_secret.id
  secret_string = var.nextauth_secret
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/amplify/${var.project_name}"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-logs"
  }
}

# CloudWatch Alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "${var.project_name}-db-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Database CPU usage is too high"
  alarm_actions       = []  # Add SNS topic ARN here for email notifications

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
}

resource "aws_cloudwatch_metric_alarm" "db_storage" {
  alarm_name          = "${var.project_name}-db-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000"  # 2GB in bytes
  alarm_description   = "Database storage is running low"
  alarm_actions       = []  # Add SNS topic ARN here for email notifications

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
}

# IAM role for Amplify
resource "aws_iam_role" "amplify" {
  name = "${var.project_name}-amplify-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "amplify.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "amplify_backend" {
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
  role       = aws_iam_role.amplify.name
}

resource "aws_iam_role_policy" "amplify_secrets" {
  name = "${var.project_name}-amplify-secrets"
  role = aws_iam_role.amplify.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.database_url.arn,
          aws_secretsmanager_secret.nextauth_secret.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.storage.arn,
          "${aws_s3_bucket.storage.arn}/*"
        ]
      }
    ]
  })
}

# AWS Amplify App
resource "aws_amplify_app" "main" {
  name       = var.project_name
  repository = "https://github.com/${var.github_repo}"

  # Build settings for Next.js
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
    EOT

  # Environment variables (add NEXTAUTH_URL, DATABASE_URL, and NEXTAUTH_SECRET manually in console)
  environment_variables = {
    AWS_REGION            = var.aws_region
    AWS_S3_BUCKET         = aws_s3_bucket.storage.id
    AWS_S3_REGION         = var.aws_region
  }

  # Custom rules for Next.js routing
  custom_rule {
    source = "/<*>"
    status = "404"
    target = "/index.html"
  }

  iam_service_role_arn = aws_iam_role.amplify.arn

  tags = {
    Name        = var.project_name
    Environment = "beta"
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = var.github_branch

  framework = "Next.js - SSR"
  stage     = "PRODUCTION"

  enable_auto_build = true

  tags = {
    Name = "${var.project_name}-${var.github_branch}"
  }
}

# Data sources
data "aws_caller_identity" "current" {}

# Outputs
output "database_url" {
  value     = "postgresql://${aws_db_instance.postgres.username}:${random_password.db_password.result}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
  sensitive = true
}

output "database_secret_arn" {
  value       = aws_secretsmanager_secret.database_url.arn
  description = "ARN of the database URL secret in Secrets Manager"
}

output "storage_endpoint" {
  value = "https://s3.${var.aws_region}.amazonaws.com"
}

output "storage_bucket" {
  value = aws_s3_bucket.storage.id
}

output "amplify_app_id" {
  value       = aws_amplify_app.main.id
  description = "Amplify App ID"
}

output "amplify_default_domain" {
  value       = "https://main.${aws_amplify_app.main.default_domain}"
  description = "Amplify default domain URL"
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "db_instance_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "deployment_instructions" {
  value = <<-EOT
    
    AWS Infrastructure Deployed Successfully!
    
    Next Steps:
    1. Connect GitHub to Amplify (manual step in AWS Console):
       - Go to: https://console.aws.amazon.com/amplify/home?region=${var.aws_region}#/${aws_amplify_app.main.id}
       - Click "Connect GitHub" and authorize access
       - Select repository: ${var.github_repo}
       - Branch: ${var.github_branch}
    
    2. Add Amplify environment variables in AWS Console:
       - NEXTAUTH_URL: https://main.${aws_amplify_app.main.default_domain}
       - DATABASE_URL: (retrieve from Secrets Manager: ${aws_secretsmanager_secret.database_url.name})
       - NEXTAUTH_SECRET: (retrieve from Secrets Manager: ${aws_secretsmanager_secret.nextauth_secret.name})
       
       (Users provide their own OpenAI API keys through the application)
    
    3. Deploy the application:
       - Amplify will auto-deploy on push to ${var.github_branch}
       - Or manually trigger deployment in Amplify Console
    
    4. Access your application:
       - URL: https://main.${aws_amplify_app.main.default_domain}
    
    Monthly Cost Estimate: $20-30 (excluding OpenAI API usage)
  EOT
}