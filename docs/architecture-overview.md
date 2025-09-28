# Comprehensive Architecture Document for ACCU Valuation & Classification Engine

## Project Summary
This document compiles the full plan for the Australian Carbon Credit Unit (ACCU) Valuation & Classification Engine. The system supports frontend (React/TS/Tailwind), backend (Node.js/Express), PostgreSQL DB, Google Cloud deployment, multi-entity (24+), loans, NRV, XBRL, and integrations (Xero mock CSV for Planful/Aspect). Hybrid approach: Schema first, then iterative frontend/backend. Compliance with AASB 102/138/9 via validation and taxonomy mapping. All designs ensure scalability, security, and auditability.

## 1. High-Level System Architecture
See [architecture.md](architecture.md) for Mermaid diagram of frontend-backend-DB-integrations flow. Key: React SPA → API Gateway (Cloud Run) → Services → Cloud SQL; Functions for schedules; GCS for static/files.

## 2. Database Schema
See [schema.md](schema.md): 13 tables (entities, accu_batches, valuation_logs, audit_log_entries, journal_entries/lines, xbrl_tags, reclassification_requests, market_prices, user_settings, loans, creditors, import_jobs). UUID PKs, enums (e.g., classification: 'inventory','intangible','fvtpl'), indexes (entity_id, dates), relationships (FKs with CASCADE/RESTRICT), RLS for isolation. AASB gaps: Custom XBRL extensions for ACCU.

## 3. Frontend Structure
See [frontend-plan.md](frontend-plan.md): React 18/TS/Tailwind/Zustand. Folders: components (common, forms, charts), features (dashboard, batches, nrv, reclass, audit, xbrl, journals, entities, loans, import-export). Stores for auth/entity/batch/nrv/loan/ui. Iteration: Layout/auth → Dashboard → Batches → NRV/Loans → Reports. Mock data; Axios for API.

## 4. Backend API
See [backend-api.md](backend-api.md): Node.js/Express v1 endpoints. Auth: JWT/Google Identity. Categories: Auth/Users, ACCU (CRUD batches, import/export), NRV (process/history), Reclass (submit/approve), Journals/XBRL, Dashboard, Entities, Loans, Import/Export, Integrations (Xero sync mock CSV for others). Middleware: Auth/RBAC/validation/audit. Validation: Joi; Errors: Standardized JSON.

## 5. Loan Management Logic
See [loan-logic.md](loan-logic.md): Creation (validate qty, journal debit/credit), tracking (daily cron alerts), buy-back (auto/manual, reverse journal), risk (LTV=loan_amount/collateral, default if overdue). NRV adjust: nrv * (1 - loaned_ratio) + collateral. Flows with Mermaid. Edge: Partial buy-back, re-loan.

## 6. Multi-Entity Support
See [multi-entity.md](multi-entity.md): Isolation via entity_id FK/RLS; switching updates frontend state/API params. Hierarchy: parent_id in entities. RBAC: accessible_entities array. Cross-reports: Admin aggregate (GROUP BY entity_id or recursive CTE). Frontend: Selector, tree view. Backend: Middleware sets entity_id filter.

## 7. Data Import/Export
See [import-export.md](import-export.md): CSV/Excel/JSON/PDF; templates download. Import: Upload GCS, validate (Zod), bulk insert, job tracking. Export: Filtered generate, signed URLs. Scheduled: Cloud Functions cron. Validation: Schema/business rules; rollback on fail. Integrations: CSV for Planful/Aspect.

## 8. Sample Data Strategy
See [sample-data.md](sample-data.md): Prisma seed for 24 entities (4 parents, 20 children), 200 batches (mix statuses/classifications), 60 loans (active/completed/default), 50 valuations (impairments), 30 reclass, 20 journals, 20 XBRL, 100 audits, 5 import jobs. Realism: AUD $20-35 prices, 2023-2025 dates, 20% impaired. Run: npm run seed.

## 9. Security & Compliance
See [security-compliance.md](security-compliance.md): JWT auth, RBAC (roles: super_admin/manager/viewer), RLS isolation, audit triggers (immutable logs), input validation (Joi), encryption (TLS/DB rest), rate limits (100/min). AASB: NRV calc MAX(0, cost - qty*market), reclass workflow, XBRL mapping (Inventories/Intangibles/FVTPL). Monitoring: Cloud Logging/Alerts.

## 10. Deployment Architecture
See [deployment.md](deployment.md): Terraform IaC. Frontend: GCS+CDN. Backend: Cloud Run (Docker). DB: Cloud SQL PostgreSQL (HA backups). Storage: GCS (exports). Schedules: Cloud Functions (NRV cron). Auth: Google Identity. Region: australia-southeast1. Rollout: Blue-green.

## 11. CI/CD Pipeline
See [cicd.md](cicd.md): Cloud Build on git push/PR. Steps: npm ci/lint/test/build/docker, deploy Run/GCS, migrate, seed (dev), smoke tests. Triggers: main→staging, tag v*→prod (approval). Tools: Jest/Vitest/Cypress, Trivy scans. Env: Dev/staging/prod; secrets in Secret Manager.

## Implementation Roadmap
1. **Setup (Week 1)**: GCP project, Terraform infra (DB, Run, GCS).
2. **DB (Week 2)**: Schema migrations, seed data.
3. **Backend (Weeks 3-5)**: Auth, core API (batches/NRV), services, mocks.
4. **Frontend (Weeks 6-8)**: Components, stores, connect API mocks.
5. **Integrations/Compliance (Week 9)**: Xero sync, XBRL gen, RLS/audits.
6. **Testing (Week 10)**: Unit/E2E, security scans.
7. **Deploy (Week 11)**: Staging/prod, CI/CD setup.
8. **Polish (Week 12)**: Monitoring, docs.

## Risks & Mitigations
- **Integrations**: Mock CSV for Planful/Aspect; real later.
- **Compliance**: Review by accountant post-MVP.
- **Scale**: Cloud auto-scale; test with load.

All artifacts in /docs/. Ready for implementation.