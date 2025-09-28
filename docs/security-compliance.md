# Security and Compliance Plan for ACCU Valuation & Classification Engine

## Overview
Security ensures data protection, access control, and auditability; compliance focuses on AASB standards (102, 138, 9) for ACCU classification, NRV, XBRL. RBAC via roles/permissions; audit logging immutable. JWT auth with Google Identity; HTTPS everywhere. Validation/sanitization prevent injections. Monitoring for threats. Compliance: Automated NRV checks, taxonomy-mapped XBRL, immutable audits. Multi-entity isolation via RLS. Penetration testing recommended post-dev.

Key Principles:
- **CIA Triad**: Confidentiality (encryption, isolation), Integrity (audits, validation), Availability (auto-scaling, backups).
- **RBAC**: Roles define actions; granular permissions (e.g., view vs edit batch).
- **Compliance**: AASB validation in business logic (e.g., reclass only if NRV impaired); XBRL tags per taxonomy.
- **Threat Model**: Assume insider threats, API abuse; mitigate with rate limits, logging.

## Authentication & Authorization
- **Auth**: Google Identity Platform (OAuth/JWT); fallback email/password with bcrypt. Tokens: Access (15m), Refresh (7d).
- **RBAC Implementation**:
  - Roles: 'super_admin' (all), 'entity_admin' (own entity CRUD), 'manager' (read/write own), 'viewer' (read-only).
  - Permissions: Stored in user_settings.roles array; middleware checks e.g., canEditBatch(role, entity_id).
  - Endpoints: Protected with authMiddleware (verify JWT), rbacMiddleware (check permission).
- **Sessions**: Stateless JWT; entity_id in token claims for isolation.
- **Multi-Factor**: Enable via Google Identity.

## Data Protection & Isolation
- **Encryption**: DB at rest (Cloud SQL), in transit (TLS 1.3). Sensitive fields (e.g., contact_info) JSONB encrypted.
- **Multi-Entity Isolation**: RLS policies: USING (entity_id = current_setting('app.current_entity_id')); ENABLE RLS on tables.
- **Input Validation**: Joi/Zod for all inputs; sanitize with escape-html; no SQL injection via parameterized queries (Prisma/Knex).
- **File Uploads**: GCS with signed URLs; scan for malware (Cloud Security Scanner); entity-scoped buckets.

## Audit Logging
- **Immutable Trail**: Triggers on INSERT/UPDATE/DELETE for business tables → Insert to audit_log_entries (old/new_values JSON).
- **Fields**: action, table_name, record_id, old/new JSON, user_id (from JWT), timestamp, ip_address (req.ip), entity_id.
- **Retention**: 7 years (compliance); partition by year.
- **Viewer**: Filterable search; export PDF/CSV with attribution.
- **Security Events**: Log failed logins, unauthorized access.

## AASB Compliance Workflows
- **Classification Validation**: Enforce enum; reclass workflow required for changes (pending/approve/reject).
- **NRV Checks**: Daily cron: Calc NRV = MAX(0, cost - (qty * market_price)); impair if < cost; log justification for overrides.
- **XBRL Tagging**: Auto-map: inventory → aasb1060-cal-InventoriesItems, intangible → IntangibleAssetsOtherThanGoodwillItems, FVTPL → OtherFinancialAssetsItems. Custom extensions for ACCU (e.g., carbon-credit-impairment).
- **Journal Generation**: Double-entry for reclass/impair/buy-back; validate debits=credits; Xero sync.
- **Impairment**: Threshold 10% drop triggers alert/reclass suggestion.
- **Reporting**: Consolidated views validate totals; XBRL export with IFRS context (periods, entities).

## Security Controls
- **Rate Limiting**: express-rate-limit (100 req/min per IP).
- **Headers**: Helmet for CSP, X-Frame-Options, etc.
- **API Security**: CORS restricted to frontend domain; no exposed endpoints.
- **Secrets**: Google Secret Manager for API keys (Xero, etc.).
- **Monitoring**: Cloud Logging for audits/errors; alerts on anomalies (e.g., failed auth >10/min).
- **Backup**: Automated DB snapshots; test restores.

## Compliance Validation
- **Automated**: Pre-reclass check NRV vs cost; block invalid classifications.
- **Manual**: Override fields require approval/audit.
- **Testing**: Unit tests for NRV calc, XBRL mapping; compliance scenarios in E2E.
- **Documentation**: Map features to AASB sections (e.g., NRV → AASB 102.28-33).

## Threat Mitigation
- **Injection**: Parameterized queries, validation.
- **XSS/CSRF**: Sanitize outputs, CSRF tokens (if needed).
- **Access Control**: Deny by default; test with OWASP ZAP.
- **Data Leak**: No PII beyond necessary; anonymize logs.

This plan secures the system and ensures AASB compliance. Integrate RLS in DB setup.