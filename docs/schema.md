# Database Schema Design for ACCU Valuation & Classification Engine

## Overview
The database uses PostgreSQL on Google Cloud SQL for relational integrity, strict typing, and performance. All tables include `created_at` and `updated_at` timestamps. Primary keys are UUIDs for security. Enums ensure data consistency (e.g., classifications: 'inventory', 'intangible', 'fvtpl'). Indexes optimize queries on entity_id, dates, batch_number. Relationships use foreign keys with CASCADE/RESTRICT as appropriate. Multi-entity isolation via entity_id on all relevant tables. Audit logging captures all changes immutably.

Incorporating AASB 1060 taxonomy insights: XBRL tags map to Inventories (AASB 102), Intangibles (AASB 138), and FVTPL (AASB 9) for compliance. Gaps identified: No direct ACCU-specific tags; custom extensions needed for carbon credits (e.g., extend Inventories for NRV impairments).

## Core Tables

### 1. entities (Multi-Entity Management)
- **id**: UUID PRIMARY KEY
- **name**: VARCHAR(255) UNIQUE NOT NULL
- **legal_name**: VARCHAR(255) NOT NULL
- **address**: JSONB (structured address)
- **contact_info**: JSONB (phone, email)
- **status**: ENUM('active', 'inactive', 'archived') DEFAULT 'active'
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: UNIQUE on name; INDEX on status.
**Relationships**: One-to-Many with accu_batches, loans, etc. (entity_id FK).

### 2. accu_batches (Primary ACCU Entities)
- **id**: UUID PRIMARY KEY
- **batch_number**: VARCHAR(100) UNIQUE NOT NULL
- **quantity**: INTEGER NOT NULL CHECK (quantity > 0)
- **acquisition_cost**: DECIMAL(10,2) NOT NULL
- **classification**: ENUM('inventory', 'intangible', 'fvtpl') NOT NULL DEFAULT 'inventory'
- **acquisition_date**: DATE NOT NULL
- **entity_id**: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT
- **user_id**: VARCHAR(255) NOT NULL (creator)
- **notes**: TEXT
- **status**: ENUM('active', 'impaired', 'reclassified', 'sold', 'on_loan') DEFAULT 'active'
- **loan_status**: BOOLEAN DEFAULT FALSE
- **loan_details**: JSONB (linked loan info)
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: UNIQUE on batch_number; INDEX on entity_id, classification, acquisition_date, status.
**Relationships**: One-to-Many with valuation_logs, reclassification_requests, loans (batch_id FK); Many-to-One with entities.

### 3. valuation_logs (NRV Checks and Impairments)
- **id**: UUID PRIMARY KEY
- **batch_id**: UUID NOT NULL REFERENCES accu_batches(id) ON DELETE CASCADE
- **date**: DATE NOT NULL
- **market_price**: DECIMAL(10,2) NOT NULL
- **nrv**: DECIMAL(10,2) NOT NULL (calculated: MAX(0, acquisition_cost - (quantity * market_price)))
- **impairment**: DECIMAL(10,2) DEFAULT 0 (nrv adjustment for loans)
- **user_id**: VARCHAR(255)
- **entity_id**: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT
- **notes**: TEXT (manual override justification)
- **created_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: INDEX on batch_id, date, entity_id.
**Relationships**: Many-to-One with accu_batches, entities. Business Logic: Daily cron job populates; loan-adjusted NRV subtracts loaned quantity value.

### 4. audit_log_entries (Immutable Audit Trail)
- **id**: UUID PRIMARY KEY
- **action**: VARCHAR(50) NOT NULL (e.g., 'create', 'update', 'delete')
- **table_name**: VARCHAR(50) NOT NULL
- **record_id**: UUID NOT NULL
- **old_values**: JSONB
- **new_values**: JSONB
- **user_id**: VARCHAR(255) NOT NULL
- **timestamp**: TIMESTAMP DEFAULT NOW()
- **ip_address**: INET
- **entity_id**: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT

**Indexes**: INDEX on timestamp, user_id, entity_id, table_name.
**Relationships**: Many-to-One with entities. Trigger: Auto-log on INSERT/UPDATE/DELETE for auditable tables.

### 5. journal_entries (Xero-Compatible Accounting)
- **id**: UUID PRIMARY KEY
- **description**: TEXT NOT NULL
- **date**: DATE NOT NULL
- **user_id**: VARCHAR(255) NOT NULL
- **entity_id**: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT
- **status**: ENUM('draft', 'posted', 'approved') DEFAULT 'draft'
- **created_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: INDEX on date, entity_id, status.

### 6. journal_lines (Journal Entry Details)
- **id**: UUID PRIMARY KEY
- **entry_id**: UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE
- **account_code**: VARCHAR(50) NOT NULL (Xero-compatible)
- **debit**: DECIMAL(10,2) DEFAULT 0
- **credit**: DECIMAL(10,2) DEFAULT 0 CHECK (debit = 0 OR credit = 0)
- **description**: TEXT
- **entity_id**: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT
- **created_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: INDEX on entry_id, account_code, entity_id.
**Relationships**: Many-to-One with journal_entries, entities. Validation: Debits = Credits per entry.

### 7. xbrl_tags (XBRL Reporting Compliance)
- **id**: UUID PRIMARY KEY
- **tag_name**: VARCHAR(255) NOT NULL (from AASB taxonomy, e.g., 'ifrs-gaap:Inventories')
- **value**: DECIMAL(10,2) OR TEXT NOT NULL
- **context**: VARCHAR(255) NOT NULL (e.g., 'current_year', 'entity_specific')
- **period_start**: DATE
- **period_end**: DATE
- **batch_id**: UUID REFERENCES accu_batches(id) ON DELETE SET NULL
- **user_id**: VARCHAR(255)
- **entity_id**: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT
- **created_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: INDEX on tag_name, entity_id, period_start.
**Relationships**: Many-to-One with accu_batches, entities. Generation: Auto-map classifications to taxonomy (e.g., inventory → aasb1060-cal-InventoriesItems).

### 8. reclassification_requests (Workflow Tracking)
- **id**: UUID PRIMARY KEY
- **batch_id**: UUID NOT NULL REFERENCES accu_batches(id) ON DELETE CASCADE
- **from_class**: ENUM('inventory', 'intangible', 'fvtpl') NOT NULL
- **to_class**: ENUM('inventory', 'intangible', 'fvtpl') NOT NULL
- **reason**: TEXT NOT NULL
- **status**: ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
- **submitted_by**: VARCHAR(255) NOT NULL
- **approved_by**: VARCHAR(255)
- **timestamp**: TIMESTAMP DEFAULT NOW()
- **approved_at**: TIMESTAMP
- **entity_id**: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT

**Indexes**: INDEX on batch_id, status, entity_id.
**Relationships**: Many-to-One with accu_batches, entities. Workflow: Approval updates batch classification and logs journal.

### 9. market_prices (Historical Pricing)
- **id**: UUID PRIMARY KEY
- **date**: DATE NOT NULL
- **commodity_type**: VARCHAR(50) DEFAULT 'ACCU' (e.g., carbon credit type)
- **price**: DECIMAL(10,2) NOT NULL
- **source**: VARCHAR(255) NOT NULL (e.g., 'Aspect API')
- **entity_id**: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT
- **created_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: UNIQUE on date, commodity_type; INDEX on entity_id.
**Relationships**: Many-to-One with entities. Source: Integrated from Aspect or external feeds.

### 10. user_settings (RBAC and Preferences)
- **id**: UUID PRIMARY KEY
- **user_id**: VARCHAR(255) UNIQUE NOT NULL
- **roles**: TEXT[] NOT NULL (e.g., {'admin', 'entity_manager', 'viewer'})
- **preferences**: JSONB (e.g., theme, notifications)
- **accessible_entities**: UUID[] REFERENCES entities(id)
- **entity_id**: UUID REFERENCES entities(id) ON DELETE SET NULL (default entity)
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: INDEX on user_id, roles.
**Relationships**: Many-to-Many with entities via accessible_entities.

### 11. loans (Loan Management)
- **id**: UUID PRIMARY KEY
- **batch_id**: UUID NOT NULL REFERENCES accu_batches(id) ON DELETE RESTRICT
- **creditor_id**: UUID NOT NULL REFERENCES creditors(id) ON DELETE RESTRICT
- **quantity**: INTEGER NOT NULL CHECK (quantity > 0)
- **loan_amount**: DECIMAL(10,2) NOT NULL
- **buyback_rate**: DECIMAL(10,2) NOT NULL
- **buyback_date**: DATE NOT NULL
- **loan_status**: ENUM('active', 'completed', 'expired', 'default') DEFAULT 'active'
- **collateral_value**: DECIMAL(10,2)
- **terms**: JSONB (interest, duration)
- **entity_id**: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: INDEX on batch_id, creditor_id, buyback_date, entity_id, loan_status.
**Relationships**: Many-to-One with accu_batches, creditors, entities. Logic: Adjust NRV by loaned quantity; auto-update status on buyback_date.

### 12. creditors (Creditor Info)
- **id**: UUID PRIMARY KEY
- **name**: VARCHAR(255) UNIQUE NOT NULL
- **contact_info**: JSONB
- **terms**: JSONB (standard loan terms)
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: UNIQUE on name.
**Relationships**: One-to-Many with loans.

### 13. import_jobs (Data Import Tracking)
- **id**: UUID PRIMARY KEY
- **file_name**: VARCHAR(255) NOT NULL
- **status**: ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending'
- **processed_rows**: INTEGER DEFAULT 0
- **error_count**: INTEGER DEFAULT 0
- **errors**: JSONB (error details)
- **user_id**: VARCHAR(255) NOT NULL
- **entity_id**: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT
- **created_at**: TIMESTAMP DEFAULT NOW()
- **completed_at**: TIMESTAMP

**Indexes**: INDEX on status, user_id, entity_id, created_at.
**Relationships**: Many-to-One with entities. Validation: CSV schema matching for batches.

## Relationships Summary
- **Entities** central: All tables reference entity_id for isolation.
- **Batches** link to valuations, reclass, loans.
- **Loans** link batches to creditors; affect valuations.
- **Journals** generated from reclass/impairments.
- **XBRL** links to batches for tagging.
- **Audit** logs all.

## Enums
- Classifications: 'inventory', 'intangible', 'fvtpl' (AASB compliant).
- Statuses: Tailored per table (e.g., loan statuses include 'default' for risk).

## Indexes & Performance
- Composite: entity_id + date on logs/valuations.
- Full-text on notes/reasons if needed.
- Partitioning: By entity_id or date for large tables (e.g., audit_logs).

## Security
- Row-Level Security (RLS): Policies enforce entity_id = current_user's accessible_entities.
- Triggers: Auto-audit on changes.

This schema supports all requirements: NRV (valuations), loans (adjustments), multi-entity (isolation), XBRL (tagging), imports (jobs). Next: Implement in migrations.