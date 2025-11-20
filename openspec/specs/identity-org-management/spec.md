# Identity and Organization Management

## Purpose
This capability handles user authentication, organization creation, and membership management. It establishes the foundation for multi-tenancy by ensuring users belong to exactly one organization and enforcing strict organization boundaries.
## Requirements
### Requirement: User Authentication
The system SHALL authenticate users using Clerk and establish their organization context.

#### Scenario: User login with organization context
- **WHEN** a user authenticates with valid credentials
- **THEN** the system SHALL establish the user's organization context
- **AND** restrict all subsequent operations to that organization

#### Scenario: Unauthenticated access attempt
- **WHEN** an unauthenticated user attempts to access protected resources
- **THEN** the system SHALL deny access
- **AND** redirect to authentication

### Requirement: Organization Creation
The system SHALL allow authenticated users to create new organizations with atomic creation of the initial membership.

#### Scenario: Successful organization creation
- **WHEN** an authenticated user creates an organization with valid name and type
- **THEN** the system SHALL create the organization record
- **AND** automatically add the creator as an Admin member
- **AND** ensure the operation is atomic (both succeed or both fail)

#### Scenario: Invalid organization type
- **WHEN** a user attempts to create an organization with invalid type
- **THEN** the system SHALL reject the creation
- **AND** return appropriate error message

### Requirement: Organization Types
The system SHALL support exactly three organization types: Shipper, Carrier, and Escort.

#### Scenario: Organization type validation
- **WHEN** creating or updating an organization
- **THEN** the system SHALL validate the type is one of: "Shipper", "Carrier", "Escort"
- **AND** reject invalid types

#### Scenario: Organization type immutability
- **WHEN** attempting to change an organization's type
- **THEN** the system SHALL reject the change
- **AND** maintain the original type

### Requirement: User-Organization Relationship
The system SHALL enforce that each user belongs to exactly one organization.

#### Scenario: User organization membership
- **WHEN** querying a user's organization
- **THEN** the system SHALL return exactly one organization
- **AND** include the user's role within that organization

#### Scenario: Organization membership transfer
- **WHEN** a user needs to change organizations
- **THEN** the system SHALL remove the user from current organization
- **AND** add them to the new organization
- **AND** ensure the user has exactly one active membership

### Requirement: Organization Membership Roles
From Phase 2 (Roles State) onward, the system SHALL support three membership roles: Admin, Manager, and Operator.

#### Scenario: Roles as data in Phase 2
- **WHEN** an organization member record is created or updated in Phase 2 (Roles State)
- **THEN** the system SHALL store a role value for the member
- **AND** ensure the role is one of: "Admin", "Manager", "Operator"
- **AND** ensure that in Phase 2 (Roles State), the stored role SHALL NOT be used to make access-control decisions

#### Scenario: Role assignment
- **WHEN** an Admin adds a member to an organization
- **THEN** the system SHALL assign the specified role
- **AND** validate the role is one of: "Admin", "Manager", "Operator"
- **AND** record the role on the membership or userProfile record

### Requirement: Organization Membership Management
The system SHALL allow Admin users to manage organization memberships.

#### Scenario: Adding organization members
- **WHEN** an Admin adds a user to the organization
- **THEN** the system SHALL create a membership record
- **AND** assign the specified role
- **AND** record the join timestamp

#### Scenario: Removing organization members
- **WHEN** an Admin removes a member from the organization
- **THEN** the system SHALL delete the membership record
- **AND** revoke all access to organization resources

### Requirement: Organization Discovery
The system SHALL allow users to view their organizations and switch between them if applicable.

#### Scenario: User organization listing
- **WHEN** a user requests their organizations
- **THEN** the system SHALL return all organizations they belong to
- **AND** include their role in each organization

#### Scenario: Organization context switching
- **WHEN** a user switches between organizations
- **THEN** the system SHALL update the active organization context
- **AND** apply new organization permissions immediately

### Requirement: Organization Operation Permissions
From Phase 3 (Permissions State) onward, the system SHALL enforce role-based permissions for organization operations.

#### Scenario: Admin organization operations
- **WHEN** an Admin user performs organization-level operations (such as managing members or updating organization settings)
- **THEN** the system SHALL allow the operation
- **AND** log that the operation was authorized based on the Admin role

#### Scenario: Restricted organization operations for non-admins
- **WHEN** a non-Admin user attempts an organization-level operation that requires Admin permissions
- **THEN** the system SHALL deny the operation
- **AND** return an appropriate authorization error
- **AND** ensure this enforcement is based on the user's role starting in Phase 3 (Permissions State)

## Invariants
- Each user belongs to exactly one organization
- Each organization has exactly one type (Shipper, Carrier, or Escort)
- Each organization member has exactly one role (Admin, Manager, or Operator)
- Organization creation is atomic (organization + initial member)
- Organization type is immutable after creation
- Phase 1: Identity and organization context without role-based permissions
- Phase 2: Roles exist purely as data without affecting access control
- Phase 3: RBAC enforcement is activated based on role data from Phase 2