# Identity and Organization Management - Design

## Context
This capability forms the foundation of the multi-tenant architecture, establishing user identity, organization boundaries, and membership relationships. It must ensure strict data isolation while enabling secure collaboration patterns.

## Goals / Non-Goals
- **Goals:**
  - Establish secure user authentication with organization context
  - Enforce strict organization boundaries
  - Enable atomic organization creation with initial membership
  - Support role-based access control within organizations
  
- **Non-Goals:**
  - Cross-organization data sharing (handled by subscriptions and ACLs)
  - Complex permission hierarchies (limited to three roles)
  - Organization type modification after creation

## Decisions

### Authentication Strategy
- **Decision:** Use Clerk for authentication and organization management
- **Rationale:** Clerk provides built-in organization support, reducing implementation complexity and security risks
- **Alternatives considered:** Custom auth with JWT, Auth0 with custom org metadata

### Data Model Design
- **Decision:** Separate tables for organizations and organization_members
- **Rationale:** Normalized design allows flexible membership management and clear separation of concerns
- **Alternatives considered:** Embedded membership array in organizations document

### Phased Implementation Approach
- **Decision:** Implement identity features across three DET STATE phases
- **Rationale:** Provides clear separation of concerns and deterministic progression from identity-only to roles-as-data to RBAC activation
- **Alternatives considered:** Single-phase implementation, feature-based implementation

### Role-Based Access Control
- **Decision:** Three-tier role system (Admin, Manager, Operator) with phased activation
- **Rationale:** Simple hierarchy covers all use cases without excessive complexity, phased approach allows clear testing and validation
- **Alternatives considered:** Permission-based system, role hierarchy with inheritance

### Atomic Organization Creation
- **Decision:** Use database transaction to ensure org + member creation succeeds or fails together
- **Rationale:** Prevents orphaned organizations and maintains data integrity
- **Alternatives considered:** Two-step creation with cleanup on failure

## Data Model

### Organizations Table
```typescript
{
  _id: Id<"organizations">,
  name: string,
  type: "Shipper" | "Carrier" | "Escort",
  createdAt: number,
  createdBy: string, // Clerk user ID
}
```

### Organization Members Table
```typescript
{
  _id: Id<"organization_members">,
  organizationId: Id<"organizations">,
  userId: string, // Clerk user ID
  role: "Admin" | "Manager" | "Operator",
  joinedAt: number,
}
```

## Security Patterns

### Phase 1 Authentication Middleware
- All protected routes require valid Clerk session
- Organization context extracted from membership relationship
- Middleware validates user-org relationship before request processing
- No role-based permissions or RBAC enforcement active in this phase
- JWT tokens contain only necessary identity and organization claims

### Phase 2 Role Data Management
- Role data is stored and managed without affecting access control
- Organization membership validated before role operations
- Cross-org access prevented by default
- Role data exists purely as data without permission enforcement

### Phase 3 Permission Validation
- Role-based permissions checked in all mutations using deterministic permission map
- Organization membership validated before data access
- Cross-org access prevented by default
- Backend helpers (hasPermission) available for permission enforcement

## API Design

### Organization Creation
```typescript
// POST /api/organizations
{
  name: string,
  type: "Shipper" | "Carrier" | "Escort"
}
```

### Organization Listing
```typescript
// GET /api/organizations
// Returns: Array<{ organization, role }>
```

### Membership Management
```typescript
// POST /api/organizations/{orgId}/members
{
  userId: string,
  role: "Admin" | "Manager" | "Operator"
}

// DELETE /api/organizations/{orgId}/members/{userId}
```

## Risks / Trade-offs

### Risks
- **Single org per user constraint:** May limit flexibility for users working with multiple organizations
- **Immutable org type:** Could require data migration if business needs change
- **Simple role system:** May not cover all edge cases for complex organizations
- **Phase complexity:** Three-phase implementation may increase development complexity

### Trade-offs
- **Simplicity vs flexibility:** Chose simple 3-role system over complex permission matrix
- **Security vs usability:** Strict isolation prioritized over convenience features
- **Performance vs consistency:** Used normalized tables requiring joins for better data integrity
- **Phased vs monolithic:** Chose phased DET STATE approach for clear validation criteria over single implementation

## Migration Plan

### Initial Setup
1. Configure Clerk with organization support
2. Create Convex schema for organizations and members
3. Implement authentication middleware
4. Create organization management API endpoints

### Data Migration
- No existing data to migrate for new implementation
- Future migrations will use Convex migration system

## Open Questions
- How to handle organization deletion (cascade vs soft delete)?
- Should we support organization invitations or require admin to add members directly?
- How to handle user account transfer between organizations?
- How to ensure clear separation between roles-as-data (Phase 2) and permission enforcement (Phase 3)?
- How to validate that no RBAC enforcement occurs during Phase 1 and Phase 2?
- How to manage JWT token structure changes between phases (minimal claims in Phase 1, expanded in Phase 3)?