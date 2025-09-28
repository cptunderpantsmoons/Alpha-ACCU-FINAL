# Deployment Architecture Plan for ACCU Valuation & Classification Engine

## Overview
Deployment leverages Google Cloud for scalability, security, and managed services. Frontend as static site on GCS + CDN; backend containerized on Cloud Run; DB on Cloud SQL (PostgreSQL); schedules on Cloud Functions; storage on GCS. Environments: dev, staging, prod. IaC with Terraform for infra. Monitoring/Logging integrated. Cost: Auto-scaling minimizes; estimated $100-500/month for low traffic.

Key Components:
- **Frontend**: Build React to static files → GCS bucket + CDN for global delivery.
- **Backend**: Dockerized Node.js/Express → Cloud Run (auto-scale 0-100 instances).
- **Database**: Cloud SQL PostgreSQL (high availability, automated backups).
- **Storage**: GCS for exports, uploads (multi-region for AU focus).
- **Schedules**: Cloud Functions for NRV cron, alerts (Pub/Sub trigger).
- **Auth**: Google Identity Platform (managed users, JWT).
- **CI/CD**: Cloud Build for builds/deploys.
- **Monitoring**: Cloud Monitoring (dashboards, alerts), Logging (audit trails).

## Infrastructure Setup (Terraform)
- **Project**: Single GCP project; folders for env isolation.
- **VPC**: Default or custom for services.
- **Cloud SQL Instance**: PostgreSQL 15, 2 vCPU, 4GB RAM, private IP, automated backups (7 days), failover replica.
- **Cloud Run Service**: Backend container, env vars (DB_URL, JWT_SECRET from Secret Manager), min 1/max 10 instances, CPU 1Gi memory.
- **GCS Buckets**: frontend-bucket (public, CDN), exports/{entity_id}/ (private, signed URLs), imports/ (temp).
- **Cloud Functions**: nrv-processor (cron daily), loan-alerts (Pub/Sub), export-scheduler.
- **Identity Platform**: Enabled, OAuth config for Google login.

Terraform Structure:
```
terraform/
├── main.tf          # Providers, modules
├── variables.tf     # Env-specific (project_id, region='australia-southeast1')
├── cloud-sql.tf     # DB instance
├── cloud-run.tf     # Backend service
├── gcs.tf           # Buckets, CDN
├── functions.tf     # Cloud Functions
└── outputs.tf       # Endpoints, DB connection
```

Example (cloud-sql.tf):
```hcl
resource "google_sql_database_instance" "main" {
  name             = "accu-db"
  database_version = "POSTGRES_15"
  region           = var.region
  settings {
    tier = "db-f1-micro"  # Scale as needed
  }
}
```

## Deployment Flows
- **Frontend**:
  1. npm run build → Static files.
  2. gsutil rsync -d build/ gs://frontend-bucket.
  3. CDN invalidation on deploy.
- **Backend**:
  1. Docker build -t gcr.io/project/backend .
  2. gcloud run deploy backend --image gcr.io/project/backend --region australia-southeast1.
  3. Update Cloud Run service URL in frontend env.
- **Database**:
  1. Terraform apply for instance.
  2. Migrate schema (Prisma migrate deploy or flyway).
  3. Seed data (npm run seed).
- **Schedules**:
  1. Cloud Scheduler job: cron(0 0 * * *) → Pub/Sub topic → Function nrv-process.
- **Secrets**: Secret Manager for API keys (Xero, etc.); mount in Cloud Run/Functions.

## Environments
- **Dev**: Separate project; local DB possible (Docker Postgres).
- **Staging**: Mirror prod; test integrations.
- **Prod**: High availability; monitoring alerts to Slack/email.

## Monitoring & Logging
- **Cloud Logging**: Backend logs to stdout; DB audits; filter by entity_id.
- **Cloud Monitoring**: Uptime checks, CPU/memory alerts, custom metrics (e.g., NRV runs).
- **Error Reporting**: Integrate Sentry for frontend/backend.
- **Compliance**: Logs retained 7 years; access controls on buckets.

## Rollout Strategy
- Blue-green: Deploy to new revision, switch traffic.
- Testing: Post-deploy smoke tests (API health, frontend load).
- Cost Optimization: Cloud Run min-instances=0; SQL auto-stop idle.

This architecture ensures reliable, compliant deployment. Use Terraform for reproducibility.