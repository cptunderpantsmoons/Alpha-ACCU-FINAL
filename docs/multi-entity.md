# Multi-Entity Support Plan for ACCU Valuation & Classification Engine

## Overview
Multi-entity support enables data isolation for multiple organizations (e.g., 24 entities) while allowing cross-entity reporting for admins. Each entity has its own data scope (batches, loans, valuations scoped to entity_id). Frontend switches entities via selector, updating queries. Backend enforces isolation via entity_id filters in all queries/services. Hierarchy: Support parent-child relationships for consolidated views. Permissions: Users access specific entities via roles (e.g., entity_manager sees only assigned). Compliance: Audit logs include entity_id for traceability.

Key Principles:
- **Isolation**: All tables have entity_id FK (non-null for business data); queries always filter by current_entity_id.
- **Switching**: Frontend entity selector updates global state; API calls include entity_id param/header.
- **Hierarchy**: entities table with parent_id FK for tree structure; recursive queries for consolidations.
- **RBAC**: user_settings.accessible_entities array; middleware checks if current_entity in user's list.
- **Cross-Reporting**: Admin-only endpoints aggregate across entities (e.g., /dashboard/stats?all_entities=true).
- **Data Seeding**: Sample data for 24 entities with varied structures (some hierarchical).

## Database Design (From Schema)
- **entities Table**: Add parent_id: UUID REFERENCES entities(id) ON DELETE SET NULL for hierarchy.
- **All Business Tables**: entity_id: UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT.
- **user_settings**: accessible_entities: UUID[] (array of entity_ids user can access).
- **RLS Policy**: CREATE POLICY entity_isolation ON accu_batches USING (entity_id = current_setting('app.current_entity_id')).
- **Indexes**: entity_id on all tables for fast filtering.

## Backend Implementation
- **Middleware**: entityMiddleware - Extracts entity_id from param/header/state; sets session var for queries.
- **Services**: All services (batchService, loanService) take entity_id; queries use WHERE entity_id = ?.
- **Endpoints**:
  - GET /api/entities: List all (admin) or accessible (user).
  - POST /api/entities: Create with optional parent_id.
  - GET /api/entities/:id/hierarchy: Recursive children/parents.
  - All business endpoints: ?entityId=uuid (overrides current if admin).
  - Cross-entity: /api/reports/consolidated?entities[]=uuid1,uuid2 (admin only).
- **Query Builder**: Use Knex/Prisma with entity_id scope; for cross, bypass filter with permission check.
- **Audit**: entity_id in all logs.

## Frontend Implementation
- **entityStore (Zustand)**: {entities: Entity[], currentEntity: Entity | null, setCurrent: (id) => void}.
- **EntitySelector.tsx**: Load entities on app init; dropdown with name, status badge. On select: setCurrent, refetch global data (batches, dashboard).
- **Protected Routes**: useEntityGuard hook - If !currentEntity or !accessible, redirect to selector.
- **Data Fetching**: All API calls include currentEntity.id; optimistic updates scoped to entity.
- **Hierarchy View**: Tree component (react-dnd-treeview) for entity management; drag-drop for parent-child.
- **Cross-Reporting**: Admin dashboard toggle "View All Entities"; API call with all_entities=true.

## Business Logic Flows

### 1. Entity Switching
- User selects entity → Update store → Clear/refetch stores (batches, loans) with new entity_id.
- Cache: Use localStorage for last entity per user.

### 2. Data Isolation
- Queries: SELECT * FROM accu_batches WHERE entity_id = current_entity_id AND status = 'active'.
- Mutations: INSERT INTO accu_batches (..., entity_id) VALUES (..., current_entity_id).
- Validation: Prevent cross-entity ops (e.g., can't assign batch to wrong entity).

### 3. Cross-Entity Reporting
- Admin aggregates: SUM(value) GROUP BY entity_id; or UNION across entities.
- Consolidated P&L: Recursive sum for hierarchy (e.g., parent totals include children).
- Permissions: If user roles include 'super_admin', allow all_entities=true.

### 4. Hierarchy Management
- Create Entity: Optional parent_id; prevent cycles (validation in service).
- View Hierarchy: API returns tree JSON; frontend renders tree.
- Consolidated Views: Query with recursive CTE (PostgreSQL) for totals up the tree.

## Integration Points
- **User Auth**: On login, fetch accessible_entities from /users/permissions; populate store.
- **Dashboard**: Default to user's default_entity; switch updates metrics.
- **Exports**: Include entity_id in CSV; cross-export for admins.
- **Audit**: Filter audits by entity_id in viewer.

## Edge Cases
- Orphaned Child: If parent archived, child status unchanged but warn.
- User Access Change: Revoke entity → Refetch accessible list, redirect if current invalid.
- Performance: For 24 entities, pagination + indexes ensure fast queries; caching (Redis) for frequent reads.

## Sample Data
- 24 entities: 4 top-level, others as children (e.g., Entity1 has 5 subs).
- Varied: Some active with batches/loans, some inactive.

This design ensures secure, scalable multi-entity ops. Implement RLS first in DB.