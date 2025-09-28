# Frontend Component Structure Plan for ACCU Valuation & Classification Engine

## Overview
The frontend is built with React 18, TypeScript for type safety, Tailwind CSS for responsive styling, and Zustand for lightweight state management. Components are modular, reusable, and organized by feature. Routing uses React Router v6. API calls via Axios with interceptors for auth (JWT tokens). Mock data used initially for development; replace with backend calls post-schema implementation. Iterative build: Start with core layout and dashboard, then add batch management, NRV, etc. Real-time updates via polling or WebSockets later.

Key Principles:
- **Responsive Design**: Tailwind classes for mobile-first (sm, md, lg breakpoints).
- **State Management**: Zustand stores for global (auth, entities, user), local (forms, modals) state.
- **Forms**: React Hook Form + Zod for validation.
- **Charts**: Recharts for NRV history, portfolio metrics.
- **Multi-Entity**: Global store for current entity; dropdown switcher updates queries.
- **Offline**: Service Worker for critical views (e.g., batch list).
- **Integrations**: Mock CSV exports for Planful/Aspect; Axios for Xero sync.

## Folder Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/          # Buttons, Modals, Tables, Badges
│   ├── forms/           # Input forms, Validation wrappers
│   └── charts/          # Recharts wrappers
├── features/            # Feature-specific components/pages
│   ├── dashboard/       # Dashboard components
│   ├── batches/         # Batch management
│   ├── nrv/             # NRV checker
│   ├── reclass/         # Reclassification workflow
│   ├── audit/           # Audit viewer
│   ├── xbrl/            # XBRL reporting
│   ├── journals/        # Financial reporting
│   ├── entities/        # Multi-entity management
│   ├── loans/           # Loan management
│   └── import-export/   # Data import/export
├── stores/              # Zustand stores
├── hooks/               # Custom hooks (useApi, useAuth)
├── services/            # API services (axios instances)
├── utils/               # Helpers (formatters, validators)
├── types/               # TypeScript interfaces (from schema)
├── App.tsx              # Root with Router
├── main.tsx             # Entry point
└── index.css            # Tailwind imports
```

## Global State Management (Zustand)
- **authStore**: User profile, token, roles (RBAC checks).
- **entityStore**: List of entities, current entity, switcher logic.
- **batchStore**: Batches list, filters, current batch details.
- **nrvStore**: NRV history, current calculations, alerts.
- **loanStore**: Loans list, maturity alerts.
- **uiStore**: Modals, loading states, notifications.

Example Store (batchStore.ts):
```typescript
import { create } from 'zustand';
import { Batch } from '../types'; // From schema

interface BatchState {
  batches: Batch[];
  filters: { classification?: string; entityId?: string };
  setBatches: (batches: Batch[]) => void;
  setFilters: (filters: Partial<BatchState['filters']>) => void;
  addBatch: (batch: Batch) => void;
}

export const useBatchStore = create<BatchState>((set) => ({
  batches: [],
  filters: {},
  setBatches: (batches) => set({ batches }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  addBatch: (batch) => set((state) => ({ batches: [...state.batches, batch] })),
}));
```

## Core Components Outline

### 1. Layout & Navigation
- **AppLayout.tsx**: Sidebar with entity selector, nav links (Dashboard, Batches, NRV, Loans, Reports, Audit). Tailwind: flex layout, responsive collapse.
- **EntitySelector.tsx**: Dropdown with status badges (active/inactive). On change: Update entityStore, refetch data.
- **Header.tsx**: User profile, logout, notifications bell.

### 2. Dashboard Component
- **DashboardPage.tsx**: Grid layout with metrics cards (total value, impaired, pending reclass, loan balances).
- **MetricsCard.tsx**: Reusable card with icon, value, change % (green/red Tailwind classes).
- **PnLChart.tsx**: Recharts line/bar chart for P&L by entity (data from backend /dashboard/trends).
- **QuickActions.tsx**: Buttons for "Add Batch", "Process NRV", "View Reports", "Manage Loans".
- **ComplianceBadges.tsx**: Color-coded badges (green: compliant, yellow: warning, red: impaired).

### 3. Batch Management System
- **BatchesPage.tsx**: Table with sorting/filtering (TanStack Table or custom).
- **BatchTable.tsx**: Columns: batch_number, quantity, cost, classification (dropdown filter), date, entity, status, loan status. Actions: Edit/Delete.
- **BatchForm.tsx**: Modal form for create/edit. Fields: batch_number (unique), quantity (number input), acquisition_cost (currency), classification (select), date (datepicker), entity (select), notes (textarea), loan_status (checkbox).
- **BatchDetailModal.tsx**: Full view with history (valuations, reclass, loans), audit logs.

### 4. NRV Checker Interface
- **NrvPage.tsx**: Current NRV summary table, impairment alerts (toast notifications).
- **NrvTable.tsx**: Columns: batch, date, market_price, nrv, impairment. Filter by entity/date.
- **NrvChart.tsx**: Recharts area/line for historical NRV vs acquisition cost.
- **ManualOverrideForm.tsx**: Form for override with justification; updates valuation_logs.
- **LoanAdjustedView.tsx**: Toggle for loan-impacted NRV.

### 5. Reclassification Workflow
- **ReclassPage.tsx**: List of requests (table: batch, from/to class, status, reason).
- **ReclassForm.tsx**: Submit form: select batch, from/to class, reason textarea.
- **ApprovalModal.tsx**: For approvers: approve/reject buttons, impact preview (financial calc).
- **TimelineView.tsx**: Vertical timeline (using react-vertical-timeline-component) for history.

### 6. Audit History Viewer
- **AuditPage.tsx**: Searchable table (date range, action, user, entity, batch).
- **AuditTable.tsx**: Columns: timestamp, action, table, record_id, user, changes (diff view).
- **ExportButton.tsx**: Download CSV/Excel/PDF (using libraries like PapaParse, jsPDF).

### 7. XBRL Reporting Module
- **XbrlPage.tsx**: Wizard steps: select batches/entities, generate tags, preview, export.
- **TagGenerator.tsx**: Auto-map classifications to taxonomy (e.g., inventory → InventoriesItems); manual tag editor.
- **XbrlPreview.tsx**: Formatted XML view with validation errors.
- **ExportWizard.tsx**: Stepper component for report generation.

### 8. Financial Reporting Section
- **JournalsPage.tsx**: List journals, generate new from events (reclass/impairment).
- **JournalForm.tsx**: Auto-populate double-entry (debit/credit balance check).
- **XeroSyncButton.tsx**: Mock sync (CSV export); later Axios POST to Xero API.
- **AccountMapping.tsx**: Table for code mappings (editable).

### 9. Multi-Entity Management
- **EntitiesPage.tsx**: CRUD table for entities (name, legal, address JSON editor).
- **EntityForm.tsx**: Form with JSON editors for address/contact.
- **HierarchyView.tsx**: Tree view for parent-child relationships (react-arborist).

### 10. Loan Management System
- **LoansPage.tsx**: Dashboard with active loans, maturity alerts (countdown timers).
- **LoanForm.tsx**: Fields: creditor select, batch select, quantity, amount, buyback_rate/date, terms JSON.
- **LoanDetailModal.tsx**: Status tracking, buy-back button (updates status).
- **RiskAssessment.tsx**: Table with LTV ratios, default probs (calculated).

### 11. Data Import/Export Features
- **ImportPage.tsx**: File upload (CSV), template download button, progress bar, error report.
- **ExportPage.tsx**: Select data type/format (CSV/Excel/JSON/PDF), filters, download.
- **ValidationSummary.tsx**: Errors list post-import.

## Integration Points
- **Xero**: journalStore sync via /integrations/xero/sync (mock CSV for now).
- **Planful/Aspect**: Mock endpoints returning sample data; CSV import for trades/prices.
- **Auth**: Protected routes with role checks (e.g., admin-only for entities).

## Development Iteration Plan
1. Setup: Create boilerplate with Vite, install deps (React, TS, Tailwind, Zustand, Axios, Recharts, React Hook Form, Zod).
2. Core Layout + Auth: Implement AppLayout, authStore, login page.
3. Dashboard: Build metrics, charts with mock data.
4. Batches: Table, form, CRUD with batchStore.
5. NRV + Loans: Calculations, charts, modals.
6. Reports/Audit: Tables, exports.
7. Integrations: Mock services, replace with real APIs.
8. Styling/Polish: Tailwind themes, responsive tests.
9. Testing: Unit (Jest), E2E (Cypress) for key flows.

This structure ensures scalability and maintainability. Proceed to code mode after approval.