# Tenant-Scoped Data Management

## Purpose
This capability manages organization-specific data that is isolated within tenant boundaries. It enforces strict data isolation at the database query level and implements role-based access controls for organization members, with explicit activation in Phase 3 Permissions State of the DET STATE model.
## Requirements
### Requirement: Phase 3 Permissions State Activation
The system SHALL activate tenant-scoped CRUD operations and role-based checks explicitly in Phase 3 Permissions State.

#### Scenario: Permissions State activation
- **WHEN** implementing Phase 3 (Permissions State)
- **THEN** system SHALL introduce a deterministic permission map that defines capabilities for each role
- **AND** map all relevant application actions to permissions derived from this permission map
- **AND** provide backend helpers (e.g., hasPermission) for enforcing permissions in Convex functions and other server logic
- **AND** ensure tenant-scoped CRUD operations for loads, shipments, and escort requests enforce role-based permissions
- **AND** ensure UI flows gate actions based on permissions and surface clear errors for RBAC violations

### Requirement: Organization Data Isolation
The system SHALL enforce strict isolation of organization-scoped data.

#### Scenario: Query filtering by organization
- **WHEN** a user queries organization data
- **THEN** system SHALL automatically filter results by their organizationId
- **AND** prevent access to data from other organizations

#### Scenario: Cross-organization data access attempt
- **WHEN** a user attempts to access data from another organization
- **THEN** system SHALL deny the request
- **AND** return appropriate error message

### Requirement: Organization-Scoped Data Models
The system SHALL provide organization-specific data tables for different organization types.

#### Scenario: Shipper load management
- **WHEN** a Shipper organization creates a load
- **THEN** system SHALL store the load with organizationId
- **AND** include load-specific attributes (origin, destination, weight, status)
- **AND** validate permissions based on role in Phase 3 Permissions State

#### Scenario: Carrier shipment tracking
- **WHEN** a Carrier organization creates a shipment
- **THEN** system SHALL store the shipment with organizationId
- **AND** include shipment-specific attributes (loadId, status)
- **AND** validate permissions based on role in Phase 3 Permissions State

#### Scenario: Escort service requests
- **WHEN** an Escort organization creates an escort request
- **THEN** system SHALL store the request with organizationId
- **AND** include request-specific attributes (location, status)
- **AND** validate permissions based on role in Phase 3 Permissions State

### Requirement: Phase 3 Role-Based Data Access
From Phase 3 (Permissions State) onward, the system SHALL enforce role-based permissions for data operations on organization-scoped data (including loads, shipments, and escort requests).

#### Scenario: Admin data operations
- **WHEN** an Admin user performs data operations in Phase 3 (Permissions State) or later
- **THEN** system SHALL allow create, read, update, delete operations
- **AND** validate all operations are within their organization
- **AND** ensure operations respect the organizationId of the data

#### Scenario: Manager data operations
- **WHEN** a Manager user performs data operations in Phase 3 (Permissions State) or later
- **THEN** system SHALL allow create, read, update operations
- **AND** deny delete operations
- **AND** validate all operations are within their organization

#### Scenario: Operator data operations
- **WHEN** an Operator user performs data operations in Phase 3 (Permissions State) or later
- **THEN** system SHALL allow read operations only
- **AND** deny create, update, delete operations
- **AND** validate all reads are scoped to their organization

### Requirement: Data Mutation Validation
From Phase 3 (Permissions State) onward, the system SHALL validate organization membership and role permissions before allowing data mutations on organization-scoped data.

#### Scenario: Data creation validation
- **WHEN** a user attempts to create data in Phase 3 (Permissions State) or later
- **THEN** system SHALL validate their organization membership
- **AND** verify they have appropriate role permissions for the requested operation
- **AND** associate data with their organizationId
- **AND** prevent creation of data for other organizations

#### Scenario: Data modification validation
- **WHEN** a user attempts to modify existing data in Phase 3 (Permissions State) or later
- **THEN** system SHALL validate data belongs to their organization
- **AND** verify they have appropriate role permissions for the requested operation
- **AND** reject modifications to other organization data
- **AND** ensure mutations respect role-based constraints defined in the permission map

### Requirement: Organization Context Helper
The system SHALL provide helper functions to extract and validate organization context.

#### Scenario: Context extraction
- **WHEN** processing any request
- **THEN** system SHALL extract user identity and organization context
- **AND** validate user is active member of the organization
- **AND** provide context for subsequent operations

#### Scenario: Permission validation
- **WHEN** checking user permissions
- **THEN** system SHALL validate role-based permissions
- **AND** return boolean result for permission check
- **AND** log permission denials for audit

### Requirement: Phase 3 Load Management (Shipper)
The system SHALL provide load management capabilities for Shipper organizations with role-based permission enforcement in Phase 3 Permissions State.

#### Scenario: Load creation
- **WHEN** a Shipper creates a new load
- **THEN** system SHALL validate required fields (origin, destination, weight)
- **AND** set initial status to "pending"
- **AND** associate with their organization
- **AND** validate user has create permission using permission map in Phase 3

#### Scenario: Load status updates
- **WHEN** a Shipper updates load status
- **THEN** system SHALL validate status transition is valid
- **AND** record status change timestamp
- **AND** maintain load history
- **AND** validate user has update permission using permission map in Phase 3

### Requirement: Phase 3 Shipment Management (Carrier)
The system SHALL provide shipment management capabilities for Carrier organizations with role-based permission enforcement in Phase 3 Permissions State.

#### Scenario: Shipment creation
- **WHEN** a Carrier creates a shipment
- **THEN** system SHALL associate shipment with a load
- **AND** set initial status to "pending"
- **AND** associate with their organization
- **AND** validate user has create permission using permission map in Phase 3

#### Scenario: Shipment tracking
- **WHEN** a Carrier updates shipment status
- **THEN** system SHALL validate status transition
- **AND** update tracking information
- **AND** maintain shipment history
- **AND** validate user has update permission using permission map in Phase 3

### Requirement: Phase 3 Escort Request Management (Escort)
The system SHALL provide escort request management for Escort organizations with role-based permission enforcement in Phase 3 Permissions State.

#### Scenario: Escort request creation
- **WHEN** an Escort creates a request
- **THEN** system SHALL validate required fields (location)
- **AND** set initial status to "pending"
- **AND** associate with their organization
- **AND** validate user has create permission using permission map in Phase 3

#### Scenario: Request status management
- **WHEN** an Escort updates request status
- **THEN** system SHALL validate status transition
- **AND** update request information
- **AND** maintain request history
- **AND** validate user has update permission using permission map in Phase 3

## Invariants
- All organization-scoped data includes organizationId
- Queries automatically filter by organizationId
- No cross-organization data access without explicit permission
- Data mutations validate organization membership and role permissions
- Organization context is validated before all data operations
- Phase 3 Permissions State activates all tenant-scoped CRUD operations with role-based enforcement
- Permission map is deterministic and comprehensive for all tenant-scoped operations
- Backend helpers (hasPermission) are available for permission enforcement in Phase 3
- UI flows gate actions based on permissions with clear error messages in Phase 3