# Sample Data Strategy for ACCU Valuation & Classification Engine

## Overview
Sample data simulates realistic ACCU scenarios for 24 entities, demonstrating multi-entity, loans, impairments, reclassifications, and compliance. Use Prisma/Sequelize seeders or SQL scripts to populate DB on init. Data covers 2023-2025, AUD currency, varied classifications (inventory 60%, intangible 30%, FVTPL 10%). Total: 200 batches, 60 loans, 50 valuations, 30 reclass requests, 100 audit logs, 20 journals. Hierarchy: 4 parent entities, 20 children. Ensure data isolation per entity; include impairments (market drop scenarios), loans (active/completed/default), XBRL tags.

Principles:
- **Realism**: ACCU prices ~$20-35/unit; quantities 100-5000; costs $25-30.
- **Variety**: Mix statuses, dates, risks (e.g., overdue loans).
- **Compliance**: Sample reclass from inventory to intangible on impairment; journals for events.
- **Seeding**: Run on dev DB; anonymized (no real names); 10% impaired batches.
- **Tools**: Faker.js for random, manual for key scenarios.

## Data Generation Plan

### 1. Entities (24 Total)
- **Parents (4)**: ID1: "Parent Corp A" (active), ID2: "Parent Corp B" (active), ID3: "Subsidiary Group" (active), ID4: "Archived Group" (archived).
- **Children (20)**: 5 under A (e.g., "Entity A1" active, "A2" inactive), 5 under B, 5 under C, 5 under D (mix statuses).
- **Fields**: name, legal_name (e.g., "ACME Pty Ltd"), address JSON {street: "123 Sydney St", city: "Sydney"}, contact {email: "info@entity.com"}.
- **Seeding**: Hierarchical; parent_id links children.

### 2. ACCU Batches (200 Total)
- **Distribution**: 8-10 per entity; 120 inventory, 60 intangible, 20 FVTPL.
- **Scenarios**:
  - Active: 140 batches (quantity 100-1000, cost $25-30, date 2023-01 to 2024-12).
  - Impaired: 40 (status='impaired', acquisition_date early 2023, low NRV).
  - On Loan: 20 (loan_status=true).
  - Reclassified: 20 (classification changed, notes "Impairment trigger").
- **Fields**: batch_number "ACCU-YYYYMM-###" unique, quantity, acquisition_cost, classification, acquisition_date, entity_id, status='active', notes (e.g., "From Aspect trade").
- **Seeding**: Random dates/prices; ensure unique numbers per entity.

### 3. Loans (60 Total)
- **Distribution**: 2-3 per entity; 30 active, 20 completed, 10 default/expired.
- **Scenarios**:
  - Active: buyback_date future (2025), LTV 50-80%.
  - Completed: buyback_date past, status='completed'.
  - Default: overdue >30 days, impaired collateral.
  - Same-day re-loan: Pair with completed loan on same batch.
- **Fields**: batch_id (link to batch), creditor_id, quantity (partial), loan_amount ($10k-50k), buyback_rate (5-10%), buyback_date, status, collateral_value (quantity * market_price), terms JSON {interest: 2%, duration: 90}.
- **Seeding**: Link to batches; random creditors.

### 4. Creditors (10 Total)
- **Names**: "Creditor Bank X", "Finance Co Y", etc.
- **Fields**: name, contact {phone: "+61..."}, terms {max_loan: 100k, rate: 5%}.
- **Seeding**: Static list; assign randomly to loans.

### 5. Valuation Logs (50 Entries)
- **Per Batch**: 2-3 logs; daily for recent.
- **Scenarios**: Normal NRV, impairment (market_price drop to $15), loan-adjusted (reduced nrv).
- **Fields**: batch_id, date (2024-01 to now), market_price ($20-35), nrv (calc), impairment ($0-5k), entity_id, notes (e.g., "Manual override").
- **Seeding**: Historical prices trending down for impairments.

### 6. Reclassification Requests (30 Total)
- **Scenarios**: 15 pending, 10 approved (inventory→intangible), 5 rejected.
- **Fields**: batch_id, from/to_class, reason ("NRV below cost"), status, submitted_by (user_id), approved_by, entity_id.
- **Seeding**: Link to impaired batches; random dates.

### 7. Journal Entries & Lines (20 Entries, 40 Lines)
- **From Events**: 10 from reclass, 5 from buy-back, 5 manual.
- **Fields**: description ("Reclass ACCU-202301-001"), date, entity_id, lines {account_code: "1200" (Inventory), debit/credit}.
- **Seeding**: Double-entry balanced; Xero-compatible codes.

### 8. XBRL Tags (20)
- **Mapping**: Inventory → "aasb1060-cal-InventoriesItems", value from batch total.
- **Fields**: tag_name, value (sum), context ("current_period"), batch_id, entity_id.
- **Seeding**: For sample batches; periods Q1-Q4 2024.

### 9. Audit Logs (100)
- **Actions**: 40 create_batch, 20 update, 10 delete, 10 approve_reclass, 20 loan_create/buyback.
- **Fields**: action, table_name, record_id, old/new_values JSON, user_id, entity_id.
- **Seeding**: Random timestamps, users.

### 10. Import Jobs (5 Sample)
- **Statuses**: 2 completed, 2 failed (errors JSON), 1 processing.
- **Fields**: file_name "sample-batches.csv", processed_rows 100, errors 5.
- **Seeding**: For testing import UI.

## Seeding Script Outline (Prisma Example)
```prisma
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Seed entities (24 with hierarchy)
  const parents = await prisma.entity.createMany({ data: [...] });
  // Seed children with parent_id
  // Seed creditors (10)
  // Seed batches (200, assign entity_id)
  // Seed loans (60, link batch/creditor)
  // Seed valuations (50, calc NRV)
  // ... other tables
  // Ensure relationships valid
}

main().then(() => prisma.$disconnect());
```

## Testing & Realism
- **Impairments**: 20% batches with market_price < cost/quantity.
- **Loans**: 10% default (overdue), 20% high LTV.
- **Reclass**: Triggered by impairments.
- **Run Seed**: npm run seed; verify with queries (e.g., COUNT(*) per entity).

This strategy provides comprehensive test data. Integrate into DB migrations.