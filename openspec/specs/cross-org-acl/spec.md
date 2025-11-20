# Cross-Organization Access Control

## Purpose
This capability implements Access Control Lists (ACLs) for explicit cross-organization resource sharing. It provides fine-grained, time-limited permissions that complement the subscription model, allowing organizations to grant specific access to their private resources to other organizations.
## Requirements
### Requirement: ACL Entries
From Phase 6 (ACL State) onward, the system SHALL support ACL entries for explicit resource sharing.

#### Scenario: ACL entry creation
- **WHEN** an organization grants access to a resource
- **THEN** system SHALL create acl_entry record
- **AND** specify resource type and ID
- **AND** define grantor and grantee organizations
- **AND** assign permission level (view, edit, delete)

#### Scenario: ACL entry validation
- **WHEN** creating an ACL entry
- **THEN** system SHALL validate grantor owns the resource
- **AND** verify grantee organization exists
- **AND** ensure permission level is valid
- **AND** prevent self-granting

### Requirement: Phase 6 Resource Type Support
From Phase 6 (ACL State) onward, the system SHALL support ACLs for multiple resource types.

#### Scenario: Load ACL entries
- **WHEN** granting access to a load
- **THEN** system SHALL create ACL entry for "load" resource type
- **AND** reference specific load ID
- **AND** apply permissions to tenant-scoped load data

#### Scenario: Shipment ACL entries
- **WHEN** granting access to a shipment
- **THEN** system SHALL create ACL entry for "shipment" resource type
- **AND** reference specific shipment ID
- **AND** apply permissions to tenant-scoped shipment data

#### Scenario: Escort request ACL entries
- **WHEN** granting access to an escort request
- **THEN** system SHALL create ACL entry for "escort_request" resource type
- **AND** reference specific escort request ID
- **AND** apply permissions to tenant-scoped escort request data

### Requirement: Phase 6 Permission Levels
From Phase 6 (ACL State) onward, the system SHALL enforce hierarchical permission levels for ACL entries.

#### Scenario: View permissions
- **WHEN** an organization has view permission
- **THEN** system SHALL allow read operations
- **AND** deny write and delete operations
- **AND** provide access to resource metadata

#### Scenario: Edit permissions
- **WHEN** an organization has edit permission
- **THEN** system SHALL allow read and write operations
- **AND** deny delete operations
- **AND** allow resource modification

#### Scenario: Delete permissions
- **WHEN** an organization has delete permission
- **THEN** system SHALL allow read, write, and delete operations
- **AND** provide full resource control
- **AND** allow resource removal

### Requirement: Phase 6 ACL Validation
From Phase 6 (ACL State) onward, the system SHALL validate ACL entries before granting access.

#### Scenario: Resource ownership verification
- **WHEN** creating an ACL entry
- **THEN** system SHALL verify grantor owns the resource
- **AND** check resource belongs to grantor organization
- **AND** reject ACL creation for unowned resources

#### Scenario: Permission hierarchy enforcement
- **WHEN** checking ACL permissions
- **THEN** system SHALL enforce hierarchy: view < edit < delete
- **AND** allow operations within permission level
- **AND** deny operations beyond permission level

### Requirement: Phase 6 Time-Limited Access
From Phase 6 (ACL State) onward, the system SHALL support time-limited ACL entries.

#### Scenario: Expiring ACL entries
- **WHEN** creating an ACL with expiration
- **THEN** system SHALL record expiration timestamp
- **AND** automatically revoke access after expiration
- **AND** remove expired entries from queries

#### Scenario: ACL renewal
- **WHEN** renewing an expiring ACL entry
- **THEN** system SHALL update expiration timestamp
- **AND** maintain existing permission level
- **AND** extend access period

### Requirement: Phase 6 ACL Management
From Phase 6 (ACL State) onward, the system SHALL provide comprehensive ACL lifecycle management.

#### Scenario: ACL listing
- **WHEN** an organization queries their ACL entries
- **THEN** system SHALL return entries they granted
- **AND** return entries granted to them
- **AND** include resource details and permissions

#### Scenario: ACL revocation
- **WHEN** an organization revokes ACL access
- **THEN** system SHALL remove ACL entry
- **AND** immediately revoke access to resource
- **AND** maintain audit trail of revocation

#### Scenario: ACL modification
- **WHEN** modifying an existing ACL entry
- **THEN** system SHALL update permission level
- **AND** update expiration if specified
- **AND** maintain resource reference

### Requirement: Phase 6 Cross-Organization Access
From Phase 6 (ACL State) onward, the system SHALL enable secure cross-organization resource access.

#### Scenario: ACL-based data access
- **WHEN** accessing a resource via ACL
- **THEN** system SHALL validate ACL entry exists
- **AND** verify permission is sufficient for operation
- **AND** check ACL has not expired
- **AND** grant access if all validations pass

#### Scenario: ACL permission checking
- **WHEN** performing operations on ACL-protected resources
- **THEN** system SHALL check both organization ownership and ACL
- **AND** allow access if either condition is met
- **AND** prioritize direct ownership over ACL

### Requirement: Phase 6 ACL Analytics
From Phase 6 (ACL State) onward, the system SHALL provide analytics for ACL usage and management.

#### Scenario: ACL usage metrics
- **WHEN** querying ACL analytics
- **THEN** system SHALL return grant/receive statistics
- **AND** provide permission level distribution
- **AND** include active vs expired entry counts

#### Scenario: Resource sharing patterns
- **WHEN** analyzing sharing patterns
- **THEN** system SHALL identify most shared resources
- **AND** track sharing frequency by organization
- **AND** provide trend analysis

### Requirement: Phase 6 Bulk ACL Operations
From Phase 6 (ACL State) onward, the system SHALL support bulk ACL management operations.

#### Scenario: Bulk ACL creation
- **WHEN** granting access to multiple resources
- **THEN** system SHALL create multiple ACL entries atomically
- **AND** validate all entries before creation
- **AND** rollback on any failure

#### Scenario: Bulk ACL revocation
- **WHEN** revoking multiple ACL entries
- **THEN** system SHALL remove all specified entries
- **AND** process revocations efficiently
- **AND** maintain audit trail

## Invariants
- ACL entries grant explicit permissions to specific resources
- ACL entries have hierarchical permission levels
- ACL entries can have expiration dates
- ACL validation occurs before cross-organization data access
- Only resource owners can grant ACL access
- ACL checks happen before data operations
- Phase 6 ACL State provides explicit cross-organization sharing of tenant-scoped resources
- ACL semantics complement, and do not replace, subscription-based access control from Phase 5
- ACL checks are evaluated in Convex and other backend logic before data access when applicable
- Phase 6 ACL State is the final phase in the six-phase DET STATE model