# Tenant-Scoped Data Management - Design

## Context
This capability builds on the identity and organization management foundation to provide organization-specific data isolation. It implements the core multi-tenant data model where each organization has its own private data space while maintaining strict security boundaries.

## Goals / Non-Goals
- **Goals:**
  - Enforce strict organization data isolation at database level
  - Implement role-based access control for data operations
  - Provide organization-specific data models for different org types
  - Ensure all data mutations validate organization membership
  
- **Non-Goals:**
  - Cross-organization data sharing (handled by global data capability)
  - Advanced permission systems (limited to basic role permissions)
  - Data analytics across organizations

## Decisions

### Data Isolation Strategy
- **Decision:** Use organizationId field in all tenant-scoped tables with database-level filtering
- **Rationale:** Provides guaranteed isolation at query level, preventing accidental data leakage
- **Alternatives considered:** Separate databases per organization, row-level security policies

### Phase 3 Permission Model
- **Decision:** Simple role-based permissions (Admin: CRUD, Manager: CRU, Operator: R) activated in Phase 3 Permissions State
- **Rationale:** Covers all use cases without excessive complexity, phased activation ensures clear separation from roles-as-data (Phase 2)
- **Alternatives considered:** Permission matrix, attribute-based access control, immediate permission activation

### Organization Type-Specific Tables
- **Decision:** Separate tables for each organization type (loads, shipments, escort_requests)
- **Rationale:** Clear separation of concerns and type-specific data models
- **Alternatives considered:** Generic data tables with type fields, polymorphic schemas

### Phase 3 Helper Function Pattern
- **Decision:** Centralized getOrgContext() and hasPermission() helper functions activated in Phase 3 Permissions State
- **Rationale:** Reduces code duplication and ensures consistent validation with deterministic permission map
- **Alternatives considered:** Middleware-only approach, inline validation in each function, immediate helper availability

## Data Model

### Loads Table (Shipper-specific)
```typescript
{
  _id: Id<"loads">,
  organizationId: Id<"organizations">,
  origin: string,
  destination: string,
  weight: number,
  status: "pending" | "assigned" | "in_transit" | "delivered",
  createdAt: number,
  createdBy: string,
}
```

### Shipments Table (Carrier-specific)
```typescript
{
  _id: Id<"shipments">,
  organizationId: Id<"organizations">,
  loadId: string, // Reference to global load (Phase 3)
  status: "pending" | "accepted" | "in_transit" | "delivered",
  createdAt: number,
}
```

### Escort Requests Table (Escort-specific)
```typescript
{
  _id: Id<"escort_requests">,
  organizationId: Id<"organizations">,
  requestedAt: number,
  location: string,
  status: "pending" | "accepted" | "completed",
  createdBy: string,
}
```

## Security Patterns

### Organization Context Validation
```typescript
export async function getOrgContext(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const membership = await ctx.db
    .query("organization_members")
    .withIndex("by_user", (q) => q.eq("userId", identity.subject))
    .first();

  if (!membership) throw new Error("Not a member of any organization");

  return {
    userId: identity.subject,
    organizationId: membership.organizationId,
    role: membership.role,
  };
}
```

### Phase 3 Permission Validation
```typescript
export function hasPermission(role: string, action: string): boolean {
  const permissions: Record<string, string[]> = {
    Admin: ["create_load", "edit_load", "delete_load", "manage_members"],
    Manager: ["create_load", "edit_load"],
    Operator: ["view_load"],
  };

  return permissions[role]?.includes(action) ?? false;
}

// Note: This function is only active in Phase 3 Permissions State
// In Phase 1 and Phase 2, role-based permissions are not enforced
```

### Phase 3 Query-Level Isolation
```typescript
export const getOrgLoads = query({
  args: {},
  handler: async (ctx) => {
    const { organizationId } = await getOrgContext(ctx);

    return await ctx.db
      .query("loads")
        .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
        .collect();
  },
});

// Note: Permission checks are added to all CRUD operations in Phase 3 Permissions State
```

## API Design

### Load Management (Shippers)
```typescript
// POST /api/loads
{
  origin: string,
  destination: string,
  weight: number,
}

// GET /api/loads
// Returns: Array<Load> filtered by organization

// PUT /api/loads/{loadId}
{
  status: "pending" | "assigned" | "in_transit" | "delivered",
}

// DELETE /api/loads/{loadId}
```

### Shipment Management (Carriers)
```typescript
// POST /api/shipments
{
  loadId: string,
}

// GET /api/shipments
// Returns: Array<Shipment> filtered by organization

// PUT /api/shipments/{shipmentId}
{
  status: "pending" | "accepted" | "in_transit" | "delivered",
}
```

### Escort Request Management (Escorts)
```typescript
// POST /api/escort-requests
{
  location: string,
}

// GET /api/escort-requests
// Returns: Array<EscortRequest> filtered by organization

// PUT /api/escort-requests/{requestId}
{
  status: "pending" | "accepted" | "completed",
}
```

## Database Indexes

### Organization Isolation Indexes
```typescript
loads: defineTable({
  // ... fields ...
})
  .index("by_organization", ["organizationId"])
  .index("by_status", ["organizationId", "status"]),

shipments: defineTable({
  // ... fields ...
})
  .index("by_organization", ["organizationId"]),

escort_requests: defineTable({
  // ... fields ...
})
  .index("by_organization", ["organizationId"]),
```

## Risks / Trade-offs

### Risks
- **Performance impact:** Organization filtering on every query may impact performance at scale
- **Data duplication:** Similar data structures across org types may lead to maintenance overhead
- **Simple permission model:** May not cover all edge cases for complex organizations
- **Phase complexity:** Three-phase implementation may increase development complexity

### Trade-offs
- **Security vs performance:** Chose query-level filtering over separate databases for better security guarantees
- **Simplicity vs flexibility:** Used simple role system over complex permission matrix
- **Normalization vs denormalization:** Chose normalized tables for better data integrity
- **Phased vs monolithic:** Chose phased DET STATE approach for clear validation criteria over single implementation

## Migration Plan

### Schema Migration
1. Add organization-scoped tables to Convex schema
2. Create database indexes for organization filtering
3. Implement helper functions for context validation
4. Update existing queries to use organization filtering
5. Implement permission map and hasPermission helper for Phase 3 Permissions State

### Data Migration
- No existing data to migrate for new implementation
- Future migrations will use Convex migration system with organization context validation
- Phase 3 activation will require permission enforcement to be added to all existing CRUD operations

## Open Questions
- How to handle data export/backup for organizations?
- Should we implement soft deletes for audit trails?
- How to handle bulk operations across organization data?
- What level of data analytics should be provided within organizations?
- How to ensure clear separation between roles-as-data (Phase 2) and permission enforcement (Phase 3)?
- How to validate that permission enforcement is only active in Phase 3 Permissions State?