## MODIFIED Requirements
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