## MODIFIED Requirements
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

## ADDED Requirements
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