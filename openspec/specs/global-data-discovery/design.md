# Global Data Discovery - Design

## Context
This capability introduces the concept of global data that is visible across organizations but maintains ownership controls. It serves as the foundation for marketplace functionality where Shippers can publish loads and Carriers can discover and engage with them.

## Goals / Non-Goals
- **Goals:**
  - Enable cross-organization data discovery
  - Maintain ownership controls for global data
  - Provide foundation for marketplace functionality
  - Support load publishing and shipment creation
  
- **Non-Goals:**
  - Automatic matching between loads and shipments
  - Complex permission systems for global data
  - Real-time notifications for global data changes

## Decisions

### Phase 4 Global Data Architecture
- **Decision:** Separate global tables (global_loads, global_shipments) from tenant-scoped tables with data-only access in Phase 4
- **Rationale:** Clear separation of private vs shared data, enables different access patterns, phased approach ensures clear progression from data-only to subscription-based access
- **Alternatives considered:** Single tables with visibility flags, polymorphic data models, immediate subscription implementation

### Phase 4 Ownership Model
- **Decision:** Organization reference in global data with ownership validation in Phase 4 Global Discovery State
- **Rationale:** Simple and explicit ownership model, easy to validate and enforce, data-only access before subscription phases
- **Alternatives considered:** ACL-based ownership, role-based ownership delegation, immediate subscription implementation

### Phase 4 Read-Only Access for Non-Owners
- **Decision:** Allow all organizations to read global data but restrict writes to owners in Phase 4 Global Discovery State
- **Rationale:** Enables marketplace discovery while maintaining data integrity, data-only access before subscription phases
- **Alternatives considered:** Subscription-only access, approval-based access, immediate subscription implementation

### Status-Based Workflow
- **Decision:** Standard status progression (pending -> assigned -> in_transit -> delivered)
- **Rationale:** Matches industry standard for logistics workflows
- **Alternatives considered:** Custom status per organization type, event-based state machine

## Data Model

### Global Loads Table
```typescript
{
  _id: Id<"global_loads">,
  shipperId: Id<"organizations">,
  origin: string,
  destination: string,
  weight: number,
  status: "pending" | "assigned" | "in_transit" | "delivered",
  createdAt: number,
}
```

### Global Shipments Table
```typescript
{
  _id: Id<"global_shipments">,
  carrierId: Id<"organizations">,
  loadId: Id<"global_loads">,
  status: "pending" | "accepted" | "in_transit" | "delivered",
  createdAt: number,
}
```

## Security Patterns

### Phase 4 Ownership Validation
```typescript
export const validateGlobalDataOwnership = async (
  ctx: MutationCtx,
  table: string,
  recordId: string,
  organizationId: Id<"organizations">
): Promise<boolean> => {
  const record = await ctx.db.get(recordId as any);
  if (!record) return false;

  const ownerField = table === "global_loads" ? "shipperId" : "carrierId";
  return record[ownerField] === organizationId;
};
// Note: Ownership validation is active in Phase 4 Global Discovery State
```

### Phase 4 Global Data Access Control
```typescript
export const getGlobalLoads = query({
  args: {},
  handler: async (ctx) => {
    // All organizations can read global loads in Phase 4
    return await ctx.db.query("global_loads").collect();
  },
});

export const updateGlobalLoad = mutation({
  args: {
    loadId: v.id("global_loads"),
    updates: v.object({
      status: v.optional(v.union(
        v.literal("pending"),
        v.literal("assigned"),
        v.literal("in_transit"),
        v.literal("delivered")
      )),
    }),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await getOrgContext(ctx);
    
    // Validate ownership
    const isOwner = await validateGlobalDataOwnership(
      ctx,
      "global_loads",
      args.loadId,
      organizationId
    );
    
    if (!isOwner) {
      throw new Error("Not authorized to modify this load");
    }

    // Update the load
    return await ctx.db.patch(args.loadId, args.updates);
  },
});
// Note: Data-only access without subscription or ACL logic in Phase 4
```

## API Design

### Load Publishing
```typescript
// POST /api/global/loads
{
  origin: string,
  destination: string,
  weight: number,
}

// Response: { loadId: Id<"global_loads"> }
```

### Global Load Discovery
```typescript
// GET /api/global/loads
// Query params: ?status=pending&page=1&limit=20
// Response: Array<GlobalLoad> with pagination

// GET /api/global/loads/search
// Query params: ?origin=City&destination=City&minWeight=1000
// Response: Array<GlobalLoad> matching criteria
```

### Shipment Creation
```typescript
// POST /api/global/shipments
{
  loadId: Id<"global_loads">,
}

// Response: { shipmentId: Id<"global_shipments"> }
```

### Global Shipment Discovery
```typescript
// GET /api/global/shipments
// Query params: ?carrierId={orgId}&page=1&limit=20
// Response: Array<GlobalShipment> with pagination
```

## Database Indexes

### Global Loads Indexes
```typescript
global_loads: defineTable({
  // ... fields ...
})
  .index("by_shipper", ["shipperId"])
  .index("by_status", ["status"])
  .index("by_route", ["origin", "destination"]),
```

### Global Shipments Indexes
```typescript
global_shipments: defineTable({
  // ... fields ...
})
  .index("by_carrier", ["carrierId"])
  .index("by_load", ["loadId"])
  .index("by_status", ["status"]),
```

## Integration Points

### With Tenant-Scoped Data
- Global loads created from tenant loads when published
- Shipments in tenant scope linked to global shipments
- Status synchronization between global and tenant data

### With Subscriptions (Phase 5)
- Subscription filtering will be applied to global data queries in Phase 5
- Notification triggers for subscribed organizations will be active in Phase 5
- Access level enforcement for subscribed data will be active in Phase 5
- Phase 4 provides data-only foundation for Phase 5 subscription implementation

### With ACL (Phase 6)
- ACL checks for explicit cross-org access will be active in Phase 6
- Enhanced permissions beyond subscription model will be active in Phase 6
- Fine-grained access control for specific resources will be active in Phase 6
- Phase 4 provides data-only foundation for Phase 6 ACL implementation

## Performance Considerations

### Pagination Strategy
- Implement cursor-based pagination for large datasets
- Default page sizes to prevent excessive data transfer
- Index optimization for common query patterns

### Query Optimization
- Efficient filtering by status and route
- Minimal data transfer for discovery queries
- Caching for frequently accessed global data

## Risks / Trade-offs

### Risks
- **Data exposure:** All global data visible to all organizations by default in Phase 4
- **Performance impact:** Global queries may become expensive at scale
- **Data consistency:** Synchronization between global and tenant data
- **Phase complexity:** Four-phase implementation may increase development complexity

### Trade-offs
- **Discovery vs privacy:** Chose open discovery over restricted access in Phase 4
- **Simplicity vs features:** Used basic status model over complex workflow in Phase 4
- **Performance vs functionality:** Global queries prioritized over real-time updates in Phase 4
- **Data-only vs subscription:** Chose data-only access in Phase 4 before subscription implementation in Phase 5

## Migration Plan

### Schema Migration
1. Add global tables to Convex schema for Phase 4 Global Discovery State
2. Create database indexes for global data queries
3. Implement ownership validation functions
4. Create global data API endpoints with data-only access
5. Ensure no subscription or ACL logic is implemented in Phase 4

### Data Migration
- Migrate existing tenant loads to global loads for publishing
- Create bidirectional links between tenant and global data
- Implement data synchronization mechanisms
- Prepare foundation for Phase 5 subscription implementation

## Open Questions
- How to handle data retention for global loads?
- Should we implement search indexing for better discovery?
- How to handle duplicate loads across organizations?
- What level of analytics should be provided for global data?
- How to handle data conflicts between global and tenant scopes?
- How to ensure clear separation between data-only access (Phase 4) and subscription-based access (Phase 5)?
- How to validate that no subscription or ACL logic is implemented during Phase 4?