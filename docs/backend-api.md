# Backend API Structure Plan for ACCU Valuation & Classification Engine

## Overview
The backend uses Node.js/Express on Google Cloud Run, with PostgreSQL (Cloud SQL) for data persistence. Authentication via JWT with Google Identity Platform integration. All endpoints are RESTful, versioned (/api/v1/), with pagination (limit/offset), filtering (query params), and error handling (standard HTTP codes, JSON responses). Middleware: CORS, rate limiting, input validation (Joi/Zod), audit logging on mutations. Business logic in services (e.g., nrvService.calculate()). Integrations: Xero via official API (journals sync); Planful/Aspect via mock/CSV initially, later real APIs. Scheduled tasks (NRV, alerts) via Cloud Functions/Cron.

Key Principles:
- **Auth**: JWT in Authorization header; RBAC middleware checks roles/permissions.
- **Validation**: Request body/query params validated; responses typed with TypeScript.
- **Error Handling**: 400 for validation, 401 unauthorized, 403 forbidden, 404 not found, 500 internal.
- **Pagination**: Default limit 50, max 100; offset for pages.
- **Filtering/Sorting**: Query params e.g., ?entityId=uuid&status=active&sort=acquisition_date:desc.
- **Mock Data**: Seed DB with sample data for dev; use in-memory or JSON files for integrations.
- **Security**: HTTPS, helmet, input sanitization, row-level security in DB.

## Authentication & User Management Endpoints
- **POST /api/auth/login**: Login with email/password; returns JWT. (Integrate Google Identity for OAuth).
- **POST /api/auth/refresh**: Refresh token.
- **GET /api/users/profile**: Current user profile (requires auth).
- **PUT /api/users/profile**: Update profile.
- **GET /api/users/permissions**: User's roles and accessible entities.
- **POST /api/users/roles**: Assign roles (admin only).

## ACCU Management Endpoints
- **POST /api/batches**: Create batch {batch_number, quantity, acquisition_cost, classification, acquisition_date, entity_id, notes}. Returns created batch. Audit log auto.
- **GET /api/batches**: List batches ?entityId=uuid&classification=inventory&status=active&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&limit=50&offset=0&sort=field:asc. Returns paginated array.
- **GET /api/batches/:id**: Get batch details including history (valuations, loans).
- **PUT /api/batches/:id**: Update batch fields (validate classification change triggers reclass request).
- **DELETE /api/batches/:id**: Soft delete (status='deleted'); hard delete admin only.
- **POST /api/batches/import**: Upload CSV; processes via import_jobs table, returns job_id.
- **GET /api/batches/export**: Export filtered batches as CSV/JSON/Excel ?format=csv&filters=...

## NRV Processing Endpoints
- **POST /api/nrv/process**: Trigger daily NRV calc for all batches (admin/scheduled); updates valuation_logs.
- **GET /api/nrv/history**: Historical NRV ?batchId=uuid&entityId=uuid&dateFrom/to. Returns array with charts data.
- **GET /api/nrv/current**: Current NRV summary per batch/entity.
- **POST /api/nrv/manual**: Manual calc/override for batch {batch_id, market_price, justification}. Updates log.

## Reclassification Workflow Endpoints
- **POST /api/reclassifications**: Submit request {batch_id, from_class, to_class, reason, entity_id}.
- **GET /api/reclassifications**: List requests ?status=pending&entityId=... Returns paginated.
- **PUT /api/reclassifications/:id/approve**: Approve {approved_by}; updates batch classification, generates journal.
- **PUT /api/reclassifications/:id/reject**: Reject {reason}.
- **GET /api/reclassifications/:id**: Details with audit trail.

## Financial Reporting Endpoints
- **POST /api/journals/generate**: Generate from event {type: 'reclass', batch_id, entity_id}. Returns journal_entry.
- **GET /api/journals**: List ?dateFrom/to&status=posted&entityId=... Paginated.
- **GET /api/journals/:id**: Details with lines.
- **POST /api/integrations/xero/sync**: Sync journals to Xero (POST to Xero API); returns status.
- **GET /api/integrations/xero/status**: Connection status.

- **POST /api/xbrl/generate**: Generate tags {batch_ids[], period_start/end, entity_id}. Maps to taxonomy.
- **GET /api/xbrl/tags**: List tags ?entityId=...&period=...
- **GET /api/xbrl/export**: Export as XML ?tags=... Returns file download.

## Dashboard Analytics Endpoints
- **GET /api/dashboard/stats**: Portfolio metrics {total_value, impaired_count, pending_reclass, loan_balance} ?entityId=...
- **GET /api/dashboard/portfolio**: Breakdown by classification ?entityId=...
- **GET /api/dashboard/compliance**: Status metrics (compliant/impaired %).
- **GET /api/dashboard/trends**: Historical data for charts ?period=year&entityId=...
- **GET /api/dashboard/loan-summary**: Loan metrics (active, maturity soon).

## Multi-Entity Management Endpoints
- **GET /api/entities**: List accessible entities ?status=active.
- **POST /api/entities**: Create {name, legal_name, address, contact_info}.
- **GET /api/entities/:id**: Details.
- **PUT /api/entities/:id**: Update.
- **DELETE /api/entities/:id**: Archive (status='archived').

## Loan Management Endpoints
- **POST /api/loans**: Create {batch_id, creditor_id, quantity, loan_amount, buyback_rate, buyback_date, terms, entity_id}.
- **GET /api/loans**: List ?status=active&entityId=...&maturitySoon=true. Paginated.
- **GET /api/loans/:id**: Details with risk calc (LTV = loan_amount / collateral_value).
- **PUT /api/loans/:id**: Update terms/status.
- **DELETE /api/loans/:id**: Complete/expire.
- **POST /api/loans/:id/buyback**: Process buy-back; updates status, generates journal.
- **GET /api/loans/maturity**: Upcoming alerts ?days=30&entityId=...

## Data Import/Export Endpoints
- **POST /api/import**: Initiate {file, type: 'batches', entity_id}; returns job_id.
- **GET /api/import/:id/status**: Progress, errors.
- **GET /api/export**: Export data {type: 'batches', format: 'csv', filters: ...}; returns download URL (GCS).
- **GET /api/templates/download**: CSV template for import ?type=batches.

## Integrations Endpoints (Mock Initially)
- **POST /api/integrations/planful/sync**: Mock data push; later real API for reports.
- **GET /api/integrations/aspect/status**: Mock position/trade data fetch.
- **POST /api/integrations/aspect/sync**: Sync trades to batches.

## Implementation Notes
- **Services Layer**: Separate concerns (batchService.create(), nrvService.process()).
- **Controllers**: Handle requests, call services, respond.
- **Middleware**: authMiddleware.verifyToken(), rbacMiddleware.checkRole('admin'), auditMiddleware.logChange().
- **Error Responses**: {error: 'Message', code: 400, details: [...] }.
- **Swagger/OpenAPI**: Document endpoints for frontend/backend sync.
- **Testing**: Jest for units, Supertest for API.

This API covers all requirements. Proceed to backend implementation after frontend.