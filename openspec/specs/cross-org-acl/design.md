# Cross-Organization Access Control - Design

## Context
This capability implements Access Control Lists (ACLs) to complement the subscription model, providing fine-grained, explicit resource sharing between organizations. It allows resource owners to grant specific permissions to other organizations for their private tenant-scoped data.

## Goals / Non-Goals
- **Goals:**
  - Implement explicit cross-organization resource sharing
  - Provide hierarchical permission levels (view, edit, delete)
  - Support time-limited access with expiration
  - Enable comprehensive ACL management and analytics
  
- **Non-Goals:**
  - Automatic permission inheritance or cascading
  - Complex permission composition beyond hierarchy
  - Real-time ACL notifications (handled separately)

## Decisions

### Phase 6 ACL Model
- **Decision:** Centralized ACL table with resource type polymorphism in Phase 6 ACL State
- **Rationale:** Single source of truth for all cross-org permissions, easier to manage, phased approach builds on previous phases
- **Alternatives considered:** Separate ACL tables per resource type, embedded permissions in resource documents, immediate ACL implementation

### Phase 6 Permission Hierarchy
- **Decision:** Hierarchical permissions (view < edit < delete) in Phase 6 ACL State
- **Rationale:** Simple, intuitive model that covers all use cases, phased approach ensures clear progression from subscription-based access
- **Alternatives considered:** Permission matrix, role-based ACLs, immediate implementation

### Phase 6 Resource Type Polymorphism
- **Decision:** Single ACL table supporting multiple resource types in Phase 6 ACL State
- **Rationale:** Reduces schema complexity and enables consistent patterns, phased approach builds on previous phases
- **Alternatives considered:** Type-specific ACL tables, generic resource references, immediate implementation

### Phase 6 Ownership Validation
- **Decision:** Strict ownership validation before ACL creation in Phase 6 ACL State
- **Rationale:** Prevents unauthorized permission grants, phased approach ensures clear validation criteria
- **Alternatives considered:** Trust-based system, admin override capabilities, immediate implementation

## Data Model

### ACL Entries Table
```typescript
{
  _id: Id<"acl_entries">,
  resourceType: "load" | "shipment" | "escort_request",
  resourceId: string,
  grantorOrgId: Id<"organizations">,
  granteeOrgId: Id<"organizations">,
  permission: "view" | "edit" | "delete",
  expiresAt?: number,
  createdAt: number,
}
```

## Security Patterns

### ACL Validation Function
```typescript
export const checkACLAccess = async (
  ctx: QueryCtx | MutationCtx,
  resourceType: string,
  resourceId: string,
  granteeOrgId: Id<"organizations">,
  requiredPermission: string
): Promise<boolean> => {
  const entry = await ctx.db
    .query("acl_entries")
    .withIndex("by_resource", (q) =>
      q.eq("resourceType", resourceType as any).eq("resourceId", resourceId)
    )
    .filter((q) => q.eq(q.field("granteeOrgId"), granteeOrgId))
    .first();

  if (!entry) return false;

  // Check expiration
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    return false;
  }

  // Check permission hierarchy
  const permissions = ["view", "edit", "delete"];
  const entryPermIndex = permissions.indexOf(entry.permission);
  const requiredPermIndex = permissions.indexOf(requiredPermission);

  return entryPermIndex >= requiredPermIndex;
};
```

### ACL Creation with Ownership Validation
```typescript
export const grantAccess = mutation({
  args: {
    resourceType: v.union(
      v.literal("load"),
      v.literal("shipment"),
      v.literal("escort_request")
    ),
    resourceId: v.string(),
    granteeOrgId: v.id("organizations"),
    permission: v.union(v.literal("view"), v.literal("edit"), v.literal("delete")),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await getOrgContext(ctx);

    // Verify resource ownership
    const resource = await ctx.db.get(args.resourceId as any);
    if (!resource || resource.organizationId !== organizationId) {
      throw new Error("Not authorized to grant access to this resource");
    }

    // Prevent self-granting
    if (args.granteeOrgId === organizationId) {
      throw new Error("Cannot grant access to your own organization");
    }

    return await ctx.db.insert("acl_entries", {
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      grantorOrgId: organizationId,
      granteeOrgId: args.granteeOrgId,
      permission: args.permission,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});
```

### Combined Access Check (Ownership + ACL)
```typescript
export const canAccessResource = async (
  ctx: QueryCtx | MutationCtx,
  resourceType: string,
  resourceId: string,
  organizationId: Id<"organizations">,
  requiredPermission: string
): Promise<boolean> => {
  // Check direct ownership first
  const resource = await ctx.db.get(resourceId as any);
  if (resource && resource.organizationId === organizationId) {
    return true; // Full access for owners
  }

  // Check ACL access
  return await checkACLAccess(
    ctx, 
    resourceType, 
    resourceId, 
    organizationId, 
    requiredPermission
  );
};
```

## API Design

### ACL Management
```typescript
// POST /api/acl/grant
{
  resourceType: "load" | "shipment" | "escort_request",
  resourceId: string,
  granteeOrgId: Id<"organizations">,
  permission: "view" | "edit" | "delete",
  expiresAt?: number,
}

// GET /api/acl/granted
// Response: Array<ACLEntry> granted by organization

// GET /api/acl/received
// Response: Array<ACLEntry> granted to organization

// PUT /api/acl/{aclId}
{
  permission?: "view" | "edit" | "delete",
  expiresAt?: number,
}

// DELETE /api/acl/{aclId}
```

### ACL Analytics
```typescript
// GET /api/acl/analytics
// Response: {
//   grantedCount: number,
//   receivedCount: number,
//   permissionDistribution: Record<string, number>,
//   expirationTimeline: Array<{ date: string, count: number }>,
// }

// GET /api/acl/sharing-patterns
// Query params: ?period=month&limit=10
// Response: Array<{
//   resourceType: string,
//   resourceId: string,
//   shareCount: number,
//   topGrantees: Array<{ orgId: string, count: number }>
// }>
```

## Database Indexes

### ACL Entries Indexes
```typescript
acl_entries: defineTable({
  // ... fields ...
})
  .index("by_grantor", ["grantorOrgId"])
  .index("by_grantee", ["granteeOrgId"])
  .index("by_resource", ["resourceType", "resourceId"])
  .index("by_expiration", ["expiresAt"]),
```

## Integration Points

### With Tenant-Scoped Data
- ACL checks applied to all tenant-scoped data operations in Phase 6 ACL State
- Combined access validation (ownership + ACL) in Phase 6 ACL State
- Enhanced data context with ACL permissions in Phase 6 ACL State

### With Global Data Discovery
- ACL permissions complement global data access in Phase 6 ACL State
- Fine-grained control beyond subscription model in Phase 6 ACL State
- Cross-reference between global and tenant data via ACL in Phase 6 ACL State
- Phase 6 ACL State builds on Phase 4 Global Discovery foundation

### With Organization Subscriptions
- Subscription access combined with ACL permissions in Phase 6 ACL State
- Enhanced access control for subscribed resources in Phase 6 ACL State
- Dual permission model for comprehensive coverage in Phase 6 ACL State
- Phase 6 ACL State builds on Phase 5 Subscription State foundation

## Performance Considerations

### ACL Caching
- Cache active ACL entries per organization for fast validation
- Invalidate cache on ACL changes
- Optimize frequent permission checks

### Expiration Management
- Automated cleanup of expired ACL entries
- Efficient queries for active ACLs only
- Background jobs for expiration processing

## Risks / Trade-offs

### Risks
- **Permission complexity:** Multiple access models (subscriptions + ACL) may confuse users in Phase 6 ACL State
- **Performance impact:** ACL validation on every cross-org data access in Phase 6 ACL State
- **Data consistency:** Synchronization between ACL and resource ownership
- **Phase complexity:** Six-phase implementation may increase development complexity

### Trade-offs
- **Security vs usability:** Chose explicit ACL over automatic sharing in Phase 6 ACL State
- **Flexibility vs simplicity:** Used hierarchical permissions over complex matrix in Phase 6 ACL State
- **Performance vs features:** Added validation overhead for better access control in Phase 6 ACL State
- **Phased vs monolithic:** Chose phased DET STATE approach for clear validation criteria over single implementation

## Migration Plan

### Schema Migration
1. Add ACL table to Convex schema for Phase 6 ACL State
2. Create database indexes for ACL queries
3. Implement ACL validation functions
4. Create ACL management API endpoints
5. Update existing data access functions to include ACL checks
6. Ensure ACL checks are evaluated in Convex and other backend logic before data access when applicable

### Data Migration
- No existing data to migrate for new implementation
- Future migrations will use Convex migration system with ACL validation
- Prepare foundation for Phase 6 ACL implementation building on previous phases

## Open Questions
- How to handle ACL conflicts with subscription permissions?
- Should we implement ACL inheritance (organization to user level)?
- How to handle ACL transfer between organizations?
- What level of automation should be provided for ACL renewal?
- How to handle ACL audit trails and compliance reporting?
- Should we implement ACL templates for common sharing patterns?
- How to ensure clear separation between subscription-based access (Phase 5) and ACL-based access (Phase 6)?
- How to validate that ACL-based access control is only active in Phase 6?
- How to manage the interaction between subscription permissions and ACL permissions in Phase 6?