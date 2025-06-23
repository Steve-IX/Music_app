# Terraform Variables for MusicStream Platform
# Author: CodeSmith-Maestro
# Created: 2024

# General Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "musicstream"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "availability_zones_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3
  validation {
    condition     = var.availability_zones_count >= 2 && var.availability_zones_count <= 6
    error_message = "Availability zones count must be between 2 and 6."
  }
}

# Networking Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

# EKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "List of CIDR blocks that can access the EKS cluster endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "node_group_instance_types" {
  description = "Instance types for the main node group"
  type        = list(string)
  default     = ["t3.large", "t3.xlarge"]
}

variable "node_group_min_size" {
  description = "Minimum size of the main node group"
  type        = number
  default     = 2
}

variable "node_group_max_size" {
  description = "Maximum size of the main node group"
  type        = number
  default     = 10
}

variable "node_group_desired_size" {
  description = "Desired size of the main node group"
  type        = number
  default     = 3
}

variable "spot_instance_types" {
  description = "Instance types for the spot node group"
  type        = list(string)
  default     = ["t3.large", "t3.xlarge", "t3a.large", "t3a.xlarge"]
}

variable "spot_max_size" {
  description = "Maximum size of the spot node group"
  type        = number
  default     = 20
}

variable "spot_desired_size" {
  description = "Desired size of the spot node group"
  type        = number
  default     = 2
}

# Database Configuration
variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15.4"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "rds_allocated_storage" {
  description = "Initial allocated storage for RDS (GB)"
  type        = number
  default     = 100
}

variable "rds_max_allocated_storage" {
  description = "Maximum allocated storage for RDS (GB)"
  type        = number
  default     = 1000
}

variable "database_name" {
  description = "Name of the initial database"
  type        = string
  default     = "musicstream"
}

variable "database_username" {
  description = "Master username for the database"
  type        = string
  default     = "musicstream_admin"
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r7g.large"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes in the Redis cluster"
  type        = number
  default     = 2
}

# S3 Configuration
variable "cors_allowed_origins" {
  description = "List of allowed origins for S3 CORS"
  type        = list(string)
  default     = ["https://musicstream.com", "https://app.musicstream.com", "http://localhost:3000"]
}

# CloudFront Configuration
variable "cloudfront_price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.cloudfront_price_class)
    error_message = "CloudFront price class must be one of: PriceClass_All, PriceClass_200, PriceClass_100."
  }
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

# Monitoring Configuration
variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be one of the valid CloudWatch retention periods."
  }
}

# Feature Flags
variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights for EKS"
  type        = bool
  default     = true
}

variable "enable_aws_load_balancer_controller" {
  description = "Enable AWS Load Balancer Controller"
  type        = bool
  default     = true
}

variable "enable_cluster_autoscaler" {
  description = "Enable Cluster Autoscaler"
  type        = bool
  default     = true
}

variable "enable_external_dns" {
  description = "Enable External DNS"
  type        = bool
  default     = false
}

variable "enable_cert_manager" {
  description = "Enable Cert Manager"
  type        = bool
  default     = false
}

# Security Configuration
variable "enable_waf" {
  description = "Enable AWS WAF for the load balancer"
  type        = bool
  default     = true
}

variable "enable_shield" {
  description = "Enable AWS Shield Advanced"
  type        = bool
  default     = false
}

# Cost Optimization
variable "enable_fargate" {
  description = "Enable Fargate profile for EKS"
  type        = bool
  default     = false
}

variable "enable_graviton" {
  description = "Use Graviton-based instances when possible"
  type        = bool
  default     = true
}

# Backup Configuration
variable "enable_automated_backups" {
  description = "Enable automated backups for databases"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
  validation {
    condition     = var.backup_retention_period >= 0 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 0 and 35 days."
  }
}

# ElasticSearch Configuration (Optional)
variable "enable_elasticsearch" {
  description = "Enable Amazon OpenSearch Service for search functionality"
  type        = bool
  default     = true
}

variable "elasticsearch_instance_type" {
  description = "Instance type for OpenSearch cluster"
  type        = string
  default     = "t3.small.search"
}

variable "elasticsearch_instance_count" {
  description = "Number of instances in the OpenSearch cluster"
  type        = number
  default     = 3
}

# Additional Features
variable "enable_xray" {
  description = "Enable AWS X-Ray tracing"
  type        = bool
  default     = true
}

variable "enable_secrets_manager" {
  description = "Enable AWS Secrets Manager for storing secrets"
  type        = bool
  default     = true
}

variable "enable_parameter_store" {
  description = "Enable AWS Systems Manager Parameter Store"
  type        = bool
  default     = true
}

# Development/Testing Configuration
variable "create_bastion_host" {
  description = "Create a bastion host for development access"
  type        = bool
  default     = false
}

variable "bastion_instance_type" {
  description = "Instance type for bastion host"
  type        = string
  default     = "t3.micro"
}

# Tagging
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Environment-specific overrides
variable "environment_config" {
  description = "Environment-specific configuration overrides"
  type = object({
    min_replicas = optional(number, 2)
    max_replicas = optional(number, 10)
    cpu_request  = optional(string, "100m")
    cpu_limit    = optional(string, "500m")
    memory_request = optional(string, "128Mi")
    memory_limit   = optional(string, "512Mi")
  })
  default = {}
}

# Multi-region Configuration
variable "enable_cross_region_backup" {
  description = "Enable cross-region backup for databases"
  type        = bool
  default     = false
}

variable "backup_region" {
  description = "Region for cross-region backups"
  type        = string
  default     = "us-west-2"
}

# Compliance Configuration
variable "enable_config" {
  description = "Enable AWS Config for compliance monitoring"
  type        = bool
  default     = false
}

variable "enable_cloudtrail" {
  description = "Enable AWS CloudTrail for audit logging"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable AWS GuardDuty for threat detection"
  type        = bool
  default     = false
}

# Performance Configuration
variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring for RDS"
  type        = bool
  default     = true
}

variable "enable_performance_insights" {
  description = "Enable Performance Insights for RDS"
  type        = bool
  default     = true
}

# Notification Configuration
variable "notification_email" {
  description = "Email address for infrastructure notifications"
  type        = string
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
  sensitive   = true
} 