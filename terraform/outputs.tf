# Terraform Outputs for MusicStream Platform
# Author: CodeSmith-Maestro
# Created: 2024

# General Information
output "project_name" {
  description = "Name of the project"
  value       = var.project_name
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "List of IDs of database subnets"
  value       = module.vpc.database_subnets
}

output "nat_gateway_ips" {
  description = "List of public Elastic IPs for NAT Gateways"
  value       = module.vpc.nat_public_ips
}

# EKS Outputs
output "cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.eks.cluster_arn
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "cluster_version" {
  description = "EKS cluster version"
  value       = module.eks.cluster_version
}

output "cluster_platform_version" {
  description = "Platform version for the EKS cluster"
  value       = module.eks.cluster_platform_version
}

output "cluster_status" {
  description = "Status of the EKS cluster"
  value       = module.eks.cluster_status
}

output "cluster_primary_security_group_id" {
  description = "Cluster security group that was created by Amazon EKS for the cluster"
  value       = module.eks.cluster_primary_security_group_id
}

output "oidc_provider_arn" {
  description = "The ARN of the OIDC Provider for EKS"
  value       = module.eks.oidc_provider_arn
}

output "node_groups" {
  description = "EKS managed node groups"
  value       = module.eks.eks_managed_node_groups
  sensitive   = true
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_instance_endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.rds.db_instance_port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_instance_name
}

output "rds_username" {
  description = "RDS database username"
  value       = module.rds.db_instance_username
  sensitive   = true
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = module.rds.db_instance_id
}

output "rds_resource_id" {
  description = "RDS instance resource ID"
  value       = module.rds.db_instance_resource_id
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_auth_token" {
  description = "Redis auth token"
  value       = aws_elasticache_replication_group.redis.auth_token
  sensitive   = true
}

# S3 Outputs
output "audio_content_bucket_name" {
  description = "Name of the S3 bucket for audio content"
  value       = aws_s3_bucket.audio_content.id
}

output "audio_content_bucket_arn" {
  description = "ARN of the S3 bucket for audio content"
  value       = aws_s3_bucket.audio_content.arn
}

output "audio_content_bucket_domain_name" {
  description = "Domain name of the S3 bucket for audio content"
  value       = aws_s3_bucket.audio_content.bucket_domain_name
}

output "user_uploads_bucket_name" {
  description = "Name of the S3 bucket for user uploads"
  value       = aws_s3_bucket.user_uploads.id
}

output "user_uploads_bucket_arn" {
  description = "ARN of the S3 bucket for user uploads"
  value       = aws_s3_bucket.user_uploads.arn
}

output "alb_logs_bucket_name" {
  description = "Name of the S3 bucket for ALB logs"
  value       = aws_s3_bucket.alb_logs.id
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.audio_cdn.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.audio_cdn.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.audio_cdn.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.audio_cdn.hosted_zone_id
}

# Load Balancer Outputs
output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_security_group_id" {
  description = "Security group ID of the Application Load Balancer"
  value       = aws_security_group.alb.id
}

# Security Outputs
output "database_security_group_id" {
  description = "Security group ID for databases"
  value       = aws_security_group.database.id
}

output "eks_cluster_security_group_id" {
  description = "Security group ID for EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

# KMS Outputs
output "eks_kms_key_id" {
  description = "KMS key ID for EKS"
  value       = aws_kms_key.eks.key_id
}

output "eks_kms_key_arn" {
  description = "KMS key ARN for EKS"
  value       = aws_kms_key.eks.arn
}

output "rds_kms_key_id" {
  description = "KMS key ID for RDS"
  value       = aws_kms_key.rds.key_id
}

output "rds_kms_key_arn" {
  description = "KMS key ARN for RDS"
  value       = aws_kms_key.rds.arn
}

output "s3_kms_key_id" {
  description = "KMS key ID for S3"
  value       = aws_kms_key.s3.key_id
}

output "s3_kms_key_arn" {
  description = "KMS key ARN for S3"
  value       = aws_kms_key.s3.arn
}

# Secrets Manager Outputs
output "database_credentials_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.database_credentials.arn
}

output "database_credentials_secret_name" {
  description = "Name of the database credentials secret"
  value       = aws_secretsmanager_secret.database_credentials.name
}

# CloudWatch Outputs
output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application.name
}

output "application_log_group_arn" {
  description = "ARN of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application.arn
}

output "nginx_log_group_name" {
  description = "Name of the nginx CloudWatch log group"
  value       = aws_cloudwatch_log_group.nginx.name
}

output "nginx_log_group_arn" {
  description = "ARN of the nginx CloudWatch log group"
  value       = aws_cloudwatch_log_group.nginx.arn
}

output "redis_log_group_name" {
  description = "Name of the Redis CloudWatch log group"
  value       = aws_cloudwatch_log_group.redis.name
}

# Route53 Outputs (conditional)
output "health_check_id" {
  description = "Route53 health check ID"
  value       = var.domain_name != "" ? aws_route53_health_check.main[0].id : null
}

# Kubernetes Configuration
output "kubectl_config" {
  description = "kubectl config as generated by the module"
  value = {
    cluster_name             = module.eks.cluster_id
    cluster_endpoint         = module.eks.cluster_endpoint
    cluster_ca_certificate   = module.eks.cluster_certificate_authority_data
    cluster_security_group_id = module.eks.cluster_security_group_id
    aws_region              = var.aws_region
    oidc_provider_arn       = module.eks.oidc_provider_arn
  }
  sensitive = true
}

# Useful connection strings and endpoints
output "connection_info" {
  description = "Connection information for services"
  value = {
    postgres_connection_string = "postgresql://${var.database_username}@${module.rds.db_instance_endpoint}:${module.rds.db_instance_port}/${var.database_name}"
    redis_connection_string    = "redis://${aws_elasticache_replication_group.redis.primary_endpoint_address}:${aws_elasticache_replication_group.redis.port}"
    cluster_endpoint          = module.eks.cluster_endpoint
    load_balancer_dns         = aws_lb.main.dns_name
    cdn_domain               = aws_cloudfront_distribution.audio_cdn.domain_name
  }
  sensitive = true
}

# IAM Role ARNs for service accounts
output "service_account_role_arns" {
  description = "IAM role ARNs that can be used by Kubernetes service accounts"
  value = {
    cluster_autoscaler = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-cluster-autoscaler"
    aws_load_balancer_controller = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-aws-load-balancer-controller"
    external_dns = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-external-dns"
    cert_manager = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-cert-manager"
  }
}

# Monitoring and Observability
output "monitoring_endpoints" {
  description = "Monitoring and observability endpoints"
  value = {
    prometheus_workspace_id = var.enable_container_insights ? "default" : null
    grafana_workspace_url   = var.enable_container_insights ? "https://grafana.aws.amazon.com" : null
    cloudwatch_dashboard_url = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${local.name_prefix}"
  }
}

# Cost Optimization Information
output "cost_optimization_info" {
  description = "Information for cost optimization"
  value = {
    spot_instances_enabled = var.spot_desired_size > 0
    graviton_enabled      = var.enable_graviton
    fargate_enabled       = var.enable_fargate
    single_nat_gateway    = var.environment == "development"
  }
}

# Security Information
output "security_info" {
  description = "Security configuration information"
  value = {
    encryption_at_rest_enabled = true
    encryption_in_transit_enabled = true
    secrets_manager_enabled = var.enable_secrets_manager
    waf_enabled = var.enable_waf
    cloudtrail_enabled = var.enable_cloudtrail
    guardduty_enabled = var.enable_guardduty
  }
}

# Backup Information
output "backup_info" {
  description = "Backup configuration information"
  value = {
    rds_backup_retention_days = var.environment == "production" ? 30 : 7
    cross_region_backup_enabled = var.enable_cross_region_backup
    backup_region = var.backup_region
    automated_backups_enabled = var.enable_automated_backups
  }
}

# Network Configuration Summary
output "network_summary" {
  description = "Network configuration summary"
  value = {
    availability_zones = local.azs
    nat_gateways_count = var.environment == "development" ? 1 : length(local.azs)
    vpc_flow_logs_enabled = true
    private_subnets_count = length(var.private_subnet_cidrs)
    public_subnets_count = length(var.public_subnet_cidrs)
    database_subnets_count = length(var.database_subnet_cidrs)
  }
}

# Application URLs (when domain is configured)
output "application_urls" {
  description = "Application URLs"
  value = var.domain_name != "" ? {
    main_app_url = "https://${var.domain_name}"
    api_url = "https://api.${var.domain_name}"
    admin_url = "https://admin.${var.domain_name}"
    cdn_url = "https://${aws_cloudfront_distribution.audio_cdn.domain_name}"
  } : {
    load_balancer_url = "https://${aws_lb.main.dns_name}"
    cdn_url = "https://${aws_cloudfront_distribution.audio_cdn.domain_name}"
  }
} 