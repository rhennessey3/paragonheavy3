# Multi-Tenant Implementation Roadmap

## Purpose
This capability defines overall implementation roadmap for transforming Paragon Heavy into a secure multi-tenant logistics platform. It outlines six sequential phases aligned with deterministic state (DET STATE) checkpoints that build upon each other to establish comprehensive multi-tenancy with controlled cross-organization collaboration.
## Requirements
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

### Requirement: Sequential Phase Dependencies
The system SHALL enforce sequential implementation with clear dependencies.

#### Scenario: Phase Prerequisites
- **WHEN** implementing any phase
- **THEN** system SHALL ensure all previous phases are complete
- **AND** validate dependencies are satisfied
- **AND** maintain compatibility with existing functionality

#### Scenario: Phase Integration
- **WHEN** completing a phase
- **THEN** system SHALL integrate with previous phases
- **AND** maintain all existing invariants
- **AND** extend functionality without breaking changes

### Requirement: Timeline Management
The system SHALL follow defined implementation timeline.

#### Scenario: Phase Duration
- **WHEN** planning implementation
- **THEN** system SHALL allocate appropriate time for each phase
- **AND** account for testing and validation
- **AND** allow buffer for unexpected challenges

#### Scenario: Milestone Tracking
- **WHEN** implementing phases
- **THEN** system SHALL track progress against milestones
- **AND** identify potential delays early
- **AND** adjust timeline as needed

### Requirement: Invariant Maintenance
The system SHALL maintain all invariants throughout implementation.

#### Scenario: Invariant Validation
- **WHEN** implementing any phase
- **THEN** system SHALL validate all invariants are maintained
- **AND** test for invariant violations
- **AND** address any violations immediately

#### Scenario: Cross-Phase Consistency
- **WHEN** moving between phases
- **THEN** system SHALL ensure consistent behavior
- **AND** maintain data integrity
- **AND** preserve user experience continuity

### Requirement: Testing Strategy
The system SHALL implement comprehensive testing for each phase.

#### Scenario: Phase Testing
- **WHEN** completing a phase
- **THEN** system SHALL conduct unit, integration, and E2E tests
- **AND** validate all acceptance criteria
- **AND** ensure security requirements are met

#### Scenario: Regression Testing
- **WHEN** implementing new phases
- **THEN** system SHALL test previous phases for regressions
- **AND** ensure no functionality is broken
- **AND** maintain system stability

### Requirement: Documentation and Validation
The system SHALL maintain comprehensive documentation throughout implementation.

#### Scenario: Phase Documentation
- **WHEN** implementing each phase
- **THEN** system SHALL document all changes
- **AND** update technical specifications
- **AND** maintain implementation guides

#### Scenario: Acceptance Criteria Validation
- **WHEN** completing a phase
- **THEN** system SHALL validate all acceptance criteria
- **AND** confirm phase objectives are met
- **AND** document any deviations

## Phase Specifications

### Phase 1: Identity + Org State (Week 1-2)
**Objectives:**
- Set up Clerk authentication with org context
- Create organization and membership tables
- Implement org creation flow
- Validate user-org relationships
- Establish identity-only foundation without role-based permissions

**Key Invariants:**
- Each user belongs to exactly one organization
- Each organization has exactly one type
- Org creation is atomic (org + initial member)
- No role-based permissions or RBAC enforcement are active
- Only organization CRUD and context switching are available

### Phase 2: Roles State (Week 2-3)
**Objectives:**
- Introduce membership roles as data attached to user/organization membership
- Allow listing, storing, and updating roles for organization members
- Support defined role vocabulary (Admin, Manager, Operator)
- Ensure roles exist purely as data without affecting access control

**Key Invariants:**
- Roles exist purely as data in this phase
- No RBAC enforcement or permission checks based on role
- Role vocabulary is consistent across the system
- Role data is properly attached to membership or userProfile

### Phase 3: Permissions State (Week 3-4)
**Objectives:**
- Introduce deterministic permission map defining capabilities for each role
- Map all application actions to permissions derived from permission map
- Provide backend helpers (hasPermission) for enforcing permissions
- Ensure tenant-scoped CRUD operations enforce role-based permissions
- Gate UI actions based on permissions with clear error messages

**Key Invariants:**
- Permission map is deterministic and comprehensive
- All tenant-scoped CRUD operations enforce role-based permissions
- UI flows properly gate actions based on permissions
- Permission violations surface clear error messages
- Backend helpers are available for permission enforcement

### Phase 4: Global Discovery State (Week 4-5)
**Objectives:**
- Create global tables (global_loads, global_shipments) for cross-organization discovery
- Link each global record to owning organization via deterministic identifiers
- Allow publishing tenant-scoped resources into global discovery tables
- Enable browsing and querying global records across organizations
- Ensure basic read-only access without subscription or ACL logic

**Key Invariants:**
- Global records are linked to owning organizations
- Basic read-only access is available to all organizations
- No subscription-based or ACL-based access logic is enforced
- Global discovery is purely data-driven without dynamic access control

### Phase 5: Subscription State (Week 5-7)
**Objectives:**
- Create subscription tables for global resources
- Define explicit access levels for subscriptions (view, bid, accept, track, update)
- Allow organizations to subscribe and unsubscribe to specific global resources
- Implement subscription state checking and resource viewing
- Enforce subscription-based access control for non-owner operations

**Key Invariants:**
- Subscriptions grant explicit access to global data with defined levels
- Subscription-based access control is enforced for non-owners
- Organizations can subscribe and unsubscribe to specific resources
- Access levels are properly enforced (view < bid < accept < track < update)
- ACL logic is not required for access in this phase

### Phase 6: ACL State (Week 7-9)
**Objectives:**
- Create ACL data models for explicit cross-organization sharing of tenant-scoped resources
- Define permission levels for ACL entries and deterministic expiration model
- Allow granting and revoking ACL-based access between organizations
- Implement ACL entry listing for granted by and granted to organizations
- Ensure ACL checks are evaluated before data access when applicable

**Key Invariants:**
- ACL entries grant explicit permissions to specific tenant-scoped resources
- ACL entries have hierarchical permission levels and expiration dates
- ACL checks happen before data access when applicable
- ACL semantics complement, not replace, subscription-based access control
- Cross-organization sharing is explicit and time-limited

## Implementation Timeline

| Phase | Duration | Key Deliverables | Dependencies |
|--------|------------|------------------|---------------|
| 1 | Week 1-2 | Identity + Org State, auth context, org CRUD | None |
| 2 | Week 2-3 | Roles State, role data management | Phase 1 |
| 3 | Week 3-4 | Permissions State, RBAC enforcement, permission map | Phase 2 |
| 4 | Week 4-5 | Global Discovery State, global tables, read-only access | Phase 3 |
| 5 | Week 5-7 | Subscription State, subscription access control | Phase 4 |
| 6 | Week 7-9 | ACL State, explicit cross-org sharing | Phase 5 |

**Total Duration: 7-9 weeks**

## Success Criteria

### Technical Success
- All phases implemented according to specifications
- All invariants maintained throughout implementation
- Comprehensive test coverage achieved
- Performance requirements met

### Business Success
- Multi-tenant platform fully functional
- Cross-organization collaboration enabled
- Security and isolation requirements satisfied
- User experience meets expectations

### Operational Success
- Documentation complete and up-to-date
- Team trained on new capabilities
- Monitoring and alerting in place
- Support processes established

## Risk Management

### Implementation Risks
- **Timeline delays:** Each phase depends on previous completion
- **Technical complexity:** Multi-tenancy requires careful implementation
- **Integration challenges:** Phase dependencies may cause issues

### Mitigation Strategies
- **Buffer time:** Include extra time in each phase
- **Incremental testing:** Test thoroughly before proceeding
- **Rollback planning:** Prepare for phase rollback if needed
- **Parallel work:** Where possible, work on non-dependent items

## Invariants
- Each phase builds upon previous phases in deterministic sequence
- All invariants are maintained throughout implementation
- No breaking changes between phases
- Comprehensive testing validates each phase completion
- Documentation keeps pace with implementation
- DET STATE checkpoints provide clear validation criteria for each phase
- Role data exists separately from permission enforcement (Phase 2 vs 3)
- Global discovery is data-only before subscription and ACL phases
- ACL semantics complement rather than replace subscription-based access