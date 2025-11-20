## MODIFIED Requirements
### Requirement: Phase-Based Implementation
The system SHALL implement multi-tenancy in six sequential phases aligned with deterministic state (DET STATE) checkpoints.

#### Scenario: Phase 1 Identity + Org State
- **WHEN** implementing Phase 1 (Identity + Org State)
- **THEN** system SHALL establish user identity and organization context
- **AND** ensure Clerk authentication is configured and functional with organization context
- **AND** ensure orgId and orgType are attached to the authenticated user context
- **AND** ensure userProfile records are created or upserted with minimal identity and organization fields
- **AND** ensure JWTs contain only necessary identity and organization claims
- **AND** ensure no role-based permissions or RBAC enforcement are active in this phase
- **AND** ensure only organization CRUD and context switching are available as org-scoped operations

#### Scenario: Phase 2 Roles State
- **WHEN** implementing Phase 2 (Roles State)
- **THEN** system SHALL introduce membership roles as data attached to user/organization membership or userProfile
- **AND** allow listing, storing, and updating roles for organization members
- **AND** ensure the system supports a defined role vocabulary (e.g., Admin, Manager, Operator)
- **AND** ensure roles exist purely as data in this phase and DO NOT affect access control or permissions
- **AND** ensure there is no RBAC enforcement or permission checks based on role before Phase 3

#### Scenario: Phase 3 Permissions State
- **WHEN** implementing Phase 3 (Permissions State)
- **THEN** system SHALL introduce a deterministic permission map that defines capabilities for each role
- **AND** map all relevant application actions to permissions derived from this permission map
- **AND** provide backend helpers (e.g., hasPermission) for enforcing permissions in Convex functions and other server logic
- **AND** ensure tenant-scoped CRUD operations for loads, shipments, and escort requests enforce role-based permissions
- **AND** ensure UI flows gate actions based on permissions and surface clear errors for RBAC violations

#### Scenario: Phase 4 Global Discovery State
- **WHEN** implementing Phase 4 (Global Discovery State)
- **THEN** system SHALL introduce global tables (e.g., global_loads, global_shipments) for cross-organization discovery
- **AND** ensure each global record is linked to its owning organization via deterministic identifiers
- **AND** allow publishing tenant-scoped resources into global discovery tables
- **AND** allow browsing and querying global records across organizations
- **AND** ensure no subscription-based or ACL-based dynamic access logic is enforced yet beyond basic read-only guarantees

#### Scenario: Phase 5 Subscription State
- **WHEN** implementing Phase 5 (Subscription State)
- **THEN** system SHALL introduce subscription tables for global resources (e.g., loads, shipments)
- **AND** define explicit access levels for subscriptions (such as view, bid, accept, track, update)
- **AND** allow organizations to subscribe and unsubscribe to specific global resources
- **AND** allow checking current subscription state and viewing subscribed resources
- **AND** ensure subscription-based access control is enforced before allowing non-owner operations on global resources
- **AND** ensure ACL logic is not yet required for access in this phase

#### Scenario: Phase 6 ACL State
- **WHEN** implementing Phase 6 (ACL State)
- **THEN** system SHALL introduce ACL data models for explicit cross-organization sharing of tenant-scoped resources
- **AND** define permission levels for ACL entries and a deterministic expiration model
- **AND** allow granting and revoking ACL-based access between organizations
- **AND** allow listing ACL entries granted by and granted to an organization
- **AND** ensure ACL checks are evaluated in Convex and other backend logic before data access when applicable
- **AND** ensure ACL semantics complement, and do not replace, subscription-based access control from Phase 5