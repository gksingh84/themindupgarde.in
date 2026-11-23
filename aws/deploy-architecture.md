# The Mind Upgrade — Production AWS Architecture & Deployment Guide

This document outlines the complete production deployment specification for **THE MIND UPGRADE** (`themindupgrade.in`) on Amazon Web Services (AWS).

---

## 1. High-Level AWS Architecture Diagram

```
                 [ Route 53 / DNS ]
                         │
                         ▼
             [ Amazon CloudFront CDN ]
             (Global Edge SSL Caching)
              │                     │
              ▼                     ▼
   [ S3 Media Bucket ]      [ Application Load Balancer ]
   (Compressed WebP/AVIF)              │
                                       ▼
                            [ AWS ECS Fargate ]
                            (Next.js 16 Web App)
                                       │
                                       ▼
                       [ Amazon RDS PostgreSQL 16 ]
                         (Multi-AZ Private Subnet)
                                       │
                                       ▼
                             [ AWS Backup Vault ]
                            (Automated Snapshots)
```

---

## 2. Infrastructure Specifications

| AWS Resource | Specification | Sizing & Target |
|---|---|---|
| **Compute** | AWS ECS Fargate | 0.5 vCPU, 1 GB RAM (Auto-scaling 1–4 tasks) |
| **Load Balancer** | Application Load Balancer (ALB) | Dual-AZ with ACM SSL Certificate |
| **CDN / Caching** | Amazon CloudFront | Default TTL: 86400s, S3 media distribution |
| **Database** | Amazon RDS PostgreSQL | `db.t4g.micro` or `db.t4g.small` (gp3 20GB) |
| **Object Storage**| Amazon S3 | Private bucket with OAC (Origin Access Control) |
| **Secrets** | AWS Secrets Manager | Manages `DATABASE_URL`, API credentials |
| **Logging** | Amazon CloudWatch | `/ecs/themindupgrade-production` |
| **SSL/TLS** | AWS Certificate Manager (ACM) | Wildcard `*.themindupgrade.in` & apex |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: ECR Repository & Docker Image Build
```bash
# 1. Authenticate Docker with Amazon ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# 2. Build production Docker image
docker build -t themindupgrade:latest .

# 3. Tag and push to Amazon ECR
docker tag themindupgrade:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/themindupgrade:latest
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/themindupgrade:latest
```

### Step 2: Amazon RDS PostgreSQL Setup
1. Create a PostgreSQL 16 instance in private VPC subnets.
2. Store the database connection string in AWS Secrets Manager:
   `postgresql://admin_user:secret_password@db-endpoint.ap-south-1.rds.amazonaws.com:5432/themindupgrade?schema=public`
3. Run migrations:
   ```bash
   DATABASE_URL="your-production-url" npx prisma db push
   DATABASE_URL="your-production-url" npx prisma db seed
   ```

### Step 3: S3 Bucket & CloudFront CDN
1. Create an S3 bucket named `themindupgrade-media-production`.
2. Enable versioning and default SSE-S3 encryption.
3. Attach CloudFront distribution with Origin Access Control (OAC) to prevent public S3 direct access.

### Step 4: ECS Fargate Task & Service
1. Register `aws/ecs-task-definition.json` with AWS ECS:
   ```bash
   aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json
   ```
2. Create an ECS Service connected to your Application Load Balancer target group on port 3000.

### Step 5: Domain Mapping & SSL
1. In ACM (us-east-1 for CloudFront, ap-south-1 for ALB), request an SSL certificate for `themindupgrade.in` and `*.themindupgrade.in`.
2. In Route 53 or your existing DNS provider:
   - Add an A Record (Alias) pointing `themindupgrade.in` to the CloudFront distribution domain.
   - Add a CNAME for `www.themindupgrade.in` pointing to `themindupgrade.in`.

---

## 4. Disaster Recovery & Backup Strategy
1. **Automated RDS Backups:** Enabled with a 7-day retention period and Point-in-Time Recovery (PITR).
2. **S3 Versioning:** Protects against accidental deletion of media files.
3. **Database Snapshot Restore:**
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier themindupgrade-production \
     --target-db-instance-identifier themindupgrade-restored \
     --restore-time 2026-11-13T12:00:00.000Z
   ```
