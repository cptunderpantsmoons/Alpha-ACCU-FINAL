# CI/CD Pipeline Plan for ACCU Valuation & Classification Engine

## Overview
CI/CD uses Google Cloud Build for automated builds, tests, and deployments on git push/PR. GitHub repo as source. Pipeline ensures code quality, security scans, and zero-downtime deploys. Environments: dev (local-like), staging (mirror prod), prod (gated). Triggers: Push to main (deploy staging), tag v*.*.* (deploy prod). Integrates with schema migrations, seeders. Tools: Node for backend tests (Jest), React tests (Vitest), linting (ESLint), security (Trivy for container scans).

Pipeline Goals:
- **CI**: Lint, unit tests, integration tests on every commit/PR.
- **CD**: Build Docker image, run migrations, deploy to Cloud Run/GCS.
- **Security**: Scan code/container for vulnerabilities.
- **Compliance**: Run compliance checks (e.g., NRV calc tests) on staging.

## Pipeline Structure (Cloud Build)
- **Repo**: GitHub (main, staging branches).
- **Triggers**: Cloud Build trigger on push/PR to main (staging deploy), tags (prod deploy).
- **Steps** (cloudbuild.yaml):
  1. Checkout code.
  2. Install deps (npm ci).
  3. Lint: npm run lint.
  4. Unit Tests: npm run test (coverage >80%).
  5. Build: npm run build (frontend), docker build backend.
  6. Security Scan: Trivy scan image.
  7. Deploy: To dev/staging/prod based on trigger.
  8. Migrate: Prisma migrate deploy.
  9. Seed: npm run seed (dev only).
  10. Smoke Test: curl API health endpoints.
  11. Notify: Slack/email on success/fail.

Example cloudbuild.yaml:
```yaml
steps:
  - name: 'gcr.io/cloud-builders/npm'
    args: ['ci']
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'lint']
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'test']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/backend', '.']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', 'backend', '--image', 'gcr.io/$PROJECT_ID/backend', '--region', 'australia-southeast1']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'services', 'update', 'backend', '--set-env-vars', 'DB_URL=$DB_URL']
  - name: 'gcr.io/cloud-builders/gsutil'
    args: ['rsync', '-d', 'frontend/build', 'gs://frontend-bucket']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', 'migrate', '--image', 'gcr.io/$PROJECT_ID/migrate', '--args', 'deploy']
```

## Environment-Specific Config
- **Dev**: Trigger on main branch; deploy to dev Cloud Run/GCS; local overrides.
- **Staging**: Manual approval for deploy; mirror prod data (subset).
- **Prod**: Tag v1.* → deploy; manual approval gate.
- **Secrets**: Use Cloud Build substitutions or Secret Manager in steps.

## Testing in Pipeline
- **Unit/Integration**: Jest/Vitest for backend (API, services), React Testing Library for frontend.
- **E2E**: Cypress in staging; run subset in CI.
- **Security**: OWASP dependency check, Trivy for Docker.
- **Compliance**: Custom step: Run AASB validation tests (e.g., NRV calc accuracy).

## Rollback & Monitoring
- **Rollback**: Cloud Build rollback to previous revision on failure.
- **Monitoring**: Cloud Build logs to Cloud Logging; alerts on failed builds.
- **Approval**: Manual gates for prod (Cloud Build allow/deny).

## Tools & Setup
- **Cloud Build**: Connected to GitHub; service account with Run/Artifact Registry perms.
- **Artifact Registry**: Docker images (backend, migrate).
- **Post-Deploy**: Health checks via Cloud Monitoring.

This pipeline automates safe deployments. Configure in GCP console.