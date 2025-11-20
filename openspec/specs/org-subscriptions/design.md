# Organization Subscriptions - Design

## Context
This capability builds on global data discovery to implement subscription-based access control. It allows organizations to subscribe to specific global resources with defined access levels, providing fine-grained control over cross-organization data access while maintaining security boundaries, implemented as Phase 5 Subscription State of the DET STATE model building on the data-only foundation from Phase 4 Global Discovery.

## Goals / Non-Goals
- **Goals:**
  - Implement subscription-based access control for global data in Phase 5 Subscription State
  - Provide hierarchical access levels (view, bid, accept for loads; view, track, update for shipments)
  - Support time-limited subscriptions with expiration
  - Enable subscription management and analytics
  - Build on Phase 4 Global Discovery data-only foundation
  
- **Non-Goals:**
  - Automatic subscription management (requires manual organization action)
  - Complex permission inheritance beyond access levels
  - Real-time subscription notifications (handled separately)
  - ACL-based access control (handled in Phase 6)

## Decisions

### Phase 5 Subscription Model
- **Decision:** Separate subscription tables for loads and shipments with access levels in Phase 5 Subscription State
- **Rationale:** Clear separation of concerns and type-specific access patterns, phased approach builds on Phase 4 data-only foundation
- **Alternatives considered:** Generic subscription table with polymorphic references, immediate subscription implementation

### Phase 5 Access Level Hierarchy
- **Decision:** Hierarchical access levels (view < bid < accept for loads; view < track < update for shipments) in Phase 5 Subscription State
- **Rationale:** Simple, intuitive model that covers all use cases, phased implementation ensures clear progression from data-only discovery
- **Alternatives considered:** Permission matrix, role-based subscriptions, immediate implementation

### Phase 5 Time-Limited Subscriptions
- **Decision:** Support optional expiration timestamps for subscriptions in Phase 5 Subscription State
- **Rationale:** Enables temporary access scenarios and automated access revocation, phased approach builds on Phase 4 foundation
- **Alternatives considered:** Permanent subscriptions only, manual renewal only, immediate implementation

### Phase 5 Duplicate Prevention
- **Decision:** Prevent duplicate subscriptions to same resource by same organization in Phase 5 Subscription State
- **Rationale:** Prevents confusion and maintains data integrity, phased approach ensures clear access control
- **Alternatives considered:** Allow multiple subscriptions with different access levels, immediate implementation

## Data Model

### Load Subscriptions Table
```typescript
{
  _id: Id<"load_subscriptions">,
  organizationId: Id<"organizations">,
  loadId: Id<"global_loads">,
  accessLevel: "view" | "bid" | "accept",
  subscribedAt: number,
  expiresAt?: number,
}
```

### Shipment Subscriptions Table
```typescript
{
  _id: Id<"shipment_subscriptions">,
  organizationId: Id<"organizations">,
  shipmentId: Id<"global_shipments">,
  accessLevel: "view" | "track" | "update",
  subscribedAt: number,
  expiresAt?: number,
}
```

## Security Patterns

### Subscription Validation
```typescript
export const canAccessLoad = async (
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  loadId: Id<"global_loads">,
  requiredLevel: string
): Promise<boolean> => {
  const subscription = await ctx.db
    .query("load_subscriptions")
    .withIndex("by_org_and_load", (q) =>
      q.eq("organizationId", organizationId).eq("loadId", loadId)
    )
    .first();

  if (!subscription) return false;

  // Check expiration
  if (subscription.expiresAt && subscription.expiresAt < Date.now()) {
    return false;
  }

  // Check access level hierarchy
  const levels = ["view", "bid", "accept"];
  const subLevelIndex = levels.indexOf(subscription.accessLevel);
  const requiredLevelIndex = levels.indexOf(requiredLevel);

  return subLevelIndex >= requiredLevelIndex;
};
```

### Subscription Creation with Duplicate Prevention
```typescript
export const subscribeToLoad = mutation({
  args: {
    loadId: v.id("global_loads"),
    accessLevel: v.union(v.literal("view"), v.literal("bid"), v.literal("accept")),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await getOrgContext(ctx);

    // Check for existing subscription
    const existing = await ctx.db
      .query("load_subscriptions")
      .withIndex("by_org_and_load", (q) =>
        q.eq("organizationId", organizationId).eq("loadId", args.loadId)
      )
      .first();

    if (existing) {
      throw new Error("Already subscribed to this load");
    }

    return await ctx.db.insert("load_subscriptions", {
      organizationId,
      loadId: args.loadId,
      accessLevel: args.accessLevel,
      subscribedAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});
```

## API Design

### Load Subscription Management
```typescript
// POST /api/subscriptions/loads
{
  loadId: Id<"global_loads">,
  accessLevel: "view" | "bid" | "accept",
  expiresAt?: number,
}

// GET /api/subscriptions/loads
// Response: Array<LoadSubscription> for organization

// DELETE /api/subscriptions/loads/{subscriptionId}
```

### Shipment Subscription Management
```typescript
// POST /api/subscriptions/shipments
{
  shipmentId: Id<"global_shipments">,
  accessLevel: "view" | "track" | "update",
  expiresAt?: number,
}

// GET /api/subscriptions/shipments
// Response: Array<ShipmentSubscription> for organization

// DELETE /api/subscriptions/shipments/{subscriptionId}
```

### Subscription Analytics
```typescript
// GET /api/subscriptions/analytics
// Query params: ?type=loads&period=month
// Response: {
//   totalSubscriptions: number,
//   accessLevelDistribution: Record<string, number>,
//   expirationTimeline: Array<{ date: string, count: number }>,
// }

// GET /api/subscriptions/popularity
// Query params: ?type=loads&limit=10
// Response: Array<{ resourceId: string, subscriptionCount: number }>
```

## Database Indexes

### Load Subscriptions Indexes
```typescript
load_subscriptions: defineTable({
  // ... fields ...
})
  .index("by_organization", ["organizationId"])
  .index("by_load", ["loadId"])
  .index("by_org_and_load", ["organizationId", "loadId"])
  .index("by_expiration", ["expiresAt"]),
```

### Shipment Subscriptions Indexes
```typescript
shipment_subscriptions: defineTable({
  // ... fields ...
})
  .index("by_organization", ["organizationId"])
  .index("by_shipment", ["shipmentId"])
  .index("by_expiration", ["expiresAt"]),
```

## Integration Points

### With Global Data Discovery
- Subscription filtering applied to global data queries
- Access level enforcement for global data operations
- Subscription status validation before data access

### With Tenant-Scoped Data
- Subscription information included in tenant data queries
- Cross-reference between tenant and global data via subscriptions
- Enhanced data context with subscription details

### With Cross-Org ACL (Phase 5)
- Subscription access combined with ACL permissions
- Enhanced access control beyond subscription model
- Fine-grained permissions for specific resources

## Performance Considerations

### Subscription Caching
- Cache active subscriptions per organization for fast validation
- Invalidate cache on subscription changes
- Optimize frequent access level checks

### Expiration Management
- Automated cleanup of expired subscriptions
- Efficient queries for active subscriptions only
- Background jobs for expiration processing

## Risks / Trade-offs

### Risks
- **Subscription complexity:** May become difficult to manage at scale in Phase 5 Subscription State
- **Performance impact:** Subscription validation on every data access in Phase 5 Subscription State
- **Data consistency:** Synchronization between subscriptions and global data
- **Phase complexity:** Five-phase implementation may increase development complexity

### Trade-offs
- **Security vs usability:** Chose explicit subscriptions over automatic access in Phase 5 Subscription State
- **Flexibility vs simplicity:** Used hierarchical access levels over complex permissions in Phase 5 Subscription State
- **Performance vs features:** Added validation overhead for better access control in Phase 5 Subscription State
- **Phased vs monolithic:** Chose phased DET STATE approach for clear validation criteria over single implementation

## Migration Plan

### Schema Migration
1. Add subscription tables to Convex schema for Phase 5 Subscription State
2. Create database indexes for subscription queries
3. Implement subscription validation functions
4. Create subscription management API endpoints
5. Ensure subscription-based access control is enforced before allowing non-owner operations on global resources

### Data Migration
- No existing data to migrate for new implementation
- Future migrations will use Convex migration system with subscription validation
- Prepare foundation for Phase 6 ACL implementation

## Open Questions
- How to handle subscription pricing and billing?
- Should we implement subscription tiers with different capabilities?
- How to handle subscription transfer between organizations?
- What level of automation should be provided for subscription renewal?
- How to handle subscription conflicts with ACL permissions?
- How to ensure clear separation between subscription-based access (Phase 5) and ACL-based access (Phase 6)?
- How to validate that subscription-based access control is only active in Phase 5?