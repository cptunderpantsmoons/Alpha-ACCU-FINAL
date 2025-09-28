# Data Import/Export Plan for ACCU Valuation & Classification Engine

## Overview
Data import/export supports bulk operations for batches, entities, loans, etc., with validation, error handling, and tracking. Formats: CSV (primary), Excel, JSON, PDF (reports). Imports use wizard with templates; exports customizable. Validation: Schema matching (Zod/Joi), business rules (e.g., unique batch_number, valid entity_id). Tracked via import_jobs table for progress/rollback. Scheduled exports via Cloud Functions (e.g., daily CSV to GCS). Mock for integrations (Planful/Aspect via CSV upload). Security: File uploads to GCS with entity-scoped buckets; exports filtered by user permissions.

Key Principles:
- **Validation**: Pre-import scan for errors (e.g., invalid dates, duplicates); partial success with error report.
- **Tracking**: Job ID for status polling; rollback on failure.
- **Formats**: CSV for bulk; JSON for API; PDF for audits/reports (using pdf-lib).
- **Limits**: Max 10k rows per import; chunk processing for large files.
- **Templates**: Downloadable CSV with headers matching schema (e.g., batch_number, quantity).

## Database Support (From Schema)
- **import_jobs Table**: Tracks uploads {file_name, status, processed_rows, error_count, errors: JSONB[]}.
- **GCS Integration**: Upload files to entity-specific buckets (e.g., gs://accu-exports/{entity_id}/imports/).

## Backend Implementation
- **Services**: importService.processCSV(file, type='batches', entity_id); exportService.generateCSV(data, filters, format).
- **Validation Rules**:
  - Batches: batch_number unique per entity, quantity > 0, classification enum, acquisition_date valid, entity_id exists.
  - Loans: quantity ≤ batch.quantity, buyback_date future, loan_amount > 0.
  - Errors: Collect in array {row: 5, field: 'quantity', message: 'Must be positive'}.
- **Endpoints**:
  - **POST /api/import**: {file: multipart, type: 'batches', entity_id}. Uploads to GCS, creates job, processes async. Returns job_id.
  - **GET /api/import/:id/status**: {status, processed_rows, errors: []}. Poll for completion.
  - **GET /api/templates/download**: ?type=batches → Returns CSV template with sample rows.
  - **GET /api/export**: ?type=batches&format=csv&entity_id=...&filters={status: 'active'} → Generates file, uploads to GCS, returns signed URL (expires 1h).
  - **POST /api/export/schedule**: {type, format, cron: '0 0 * * *', entity_id} → Creates Cloud Function cron job.
- **Processing Flow**:
  1. Upload file to GCS.
  2. Parse (csv-parser for CSV, xlsx for Excel).
  3. Validate each row; collect successes/errors.
  4. Bulk insert valid rows (transactions for atomicity).
  5. Update job: completed_at, error_count.
  6. Rollback: On failure, delete inserted rows.
- **Scheduled**: Cloud Scheduler → Function calls export endpoint, emails GCS link.

## Frontend Implementation
- **ImportWizard.tsx**: Stepper: 1. Upload file (drag-drop), 2. Select type/entity, 3. Download template if needed, 4. Preview validation errors, 5. Confirm import, 6. Progress bar + status poll.
- **ExportPage.tsx**: Form: Select type, format, filters (date range, status), entity. Button triggers download (fetch signed URL).
- **ValidationPreview.tsx**: Table highlighting errors (red rows), editable fixes before import.
- **JobStatusModal.tsx**: Poll /status, show progress/errors; download error report CSV.
- **TemplateButton.tsx**: Download link for type-specific template.

## Formats & Templates
- **CSV Import Template (Batches)**:
  ```
  batch_number,quantity,acquisition_cost,classification,acquisition_date,notes
  BATCH001,1000,25.50,inventory,2023-01-01,Initial purchase
  ```
  - Headers match schema; date format YYYY-MM-DD; decimal with dot.
- **Export Examples**:
  - CSV: Standard with all fields.
  - Excel: Styled with formulas (e.g., total value = quantity * cost).
  - JSON: API-like array of objects.
  - PDF: For audits, formatted report with tables/charts (using charts from Recharts to PDF).

## Error Handling & Rollback
- **Validation Errors**: 400 with {errors: [{row, field, message}]}; don't process.
- **Processing Errors**: Update job status='failed', errors JSON; partial rollback (delete successful inserts).
- **Large Files**: Stream parse, batch insert (100 rows/transaction).

## Integration Points
- **Planful**: Export reports as CSV → Manual upload (mock API push later).
- **Aspect**: Import trades as CSV to update batches/prices.
- **Xero**: Export journals CSV for import.
- **GCS**: Signed URLs for secure downloads; lifecycle rules for cleanup.

## Edge Cases
- Duplicate batch_number: Skip or error per row.
- Invalid entity_id: Map to current or error.
- Large Import: Timeout handling, resume from job.
- Scheduled Export: Handle failures with retries (3x).

This plan enables robust bulk data handling. Implement CSV parsers first.