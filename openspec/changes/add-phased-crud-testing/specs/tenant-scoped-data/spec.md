## ADDED Requirements
### Requirement: Phase-Specific CRUD Testing Framework
The system SHALL provide a comprehensive testing framework that validates CRUD operations for organization members across all six DET STATE phases.

#### Scenario: Phase 1 CRUD testing (Identity + Org State)
- **WHEN** testing CRUD operations in Phase 1 (Identity + Org State)
- **THEN** system SHALL allow authenticated org members to perform CRUD operations on organization-scoped data
- **AND** validate that no role-based permissions are enforced
- **AND** ensure operations are restricted to user's organization only
- **AND** verify that organization context is properly established and maintained

#### Scenario: Phase 2 CRUD testing (Roles State)
- **WHEN** testing CRUD operations in Phase 2 (Roles State)
- **THEN** system SHALL allow authenticated org members to perform CRUD operations
- **AND** validate that roles exist purely as data without affecting access control
- **AND** ensure role data is properly stored and retrievable
- **AND** verify that role-based permissions are NOT enforced in this phase

#### Scenario: Phase 3 CRUD testing (Permissions State)
- **WHEN** testing CRUD operations in Phase 3 (Permissions State)
- **THEN** system SHALL enforce role-based permissions for all CRUD operations
- **AND** validate Admin users can create, read, update, delete
- **AND** validate Manager users can create, read, update but NOT delete
- **AND** validate Operator users can read only but NOT create, update, delete
- **AND** ensure permission violations return clear error messages

#### Scenario: Phase 4 CRUD testing (Global Discovery State)
- **WHEN** testing CRUD operations in Phase 4 (Global Discovery State)
- **THEN** system SHALL maintain all Phase 3 permission enforcement
- **AND** allow publishing tenant-scoped resources to global discovery tables
- **AND** enable browsing and querying global records across organizations
- **AND** ensure global access is read-only without subscription logic

#### Scenario: Phase 5 CRUD testing (Subscription State)
- **WHEN** testing CRUD operations in Phase 5 (Subscription State)
- **THEN** system SHALL maintain all Phase 3-4 behaviors
- **AND** enforce subscription-based access control for global resources
- **AND** validate explicit access levels (view, bid, accept, track, update)
- **AND** ensure non-owners cannot access global resources without subscription

#### Scenario: Phase 6 CRUD testing (ACL State)
- **WHEN** testing CRUD operations in Phase 6 (ACL State)
- **THEN** system SHALL maintain all Phase 3-5 behaviors
- **AND** enforce ACL-based access for explicit cross-organization sharing
- **AND** validate hierarchical permission levels and expiration model
- **AND** ensure ACL checks happen before data access when applicable

### Requirement: CRUD Test Interface
The system SHALL provide an interactive test interface for manual validation of CRUD operations across all phases.

#### Scenario: Manual CRUD testing
- **WHEN** a user accesses the CRUD test interface
- **THEN** system SHALL display current DET STATE phase
- **AND** provide forms for creating, reading, updating, deleting test data
- **AND** show real-time results of each operation
- **AND** display permission validation results
- **AND** indicate whether operations succeed or fail as expected for the current phase

#### Scenario: Automated test execution
- **WHEN** a user triggers automated CRUD tests
- **THEN** system SHALL execute predefined test sequences for all CRUD operations
- **AND** validate results against expected phase-specific behavior
- **AND** provide comprehensive test report with pass/fail status
- **AND** highlight any invariant violations or unexpected behavior

### Requirement: Phase Invariant Validation
The system SHALL validate that all phase-specific invariants are maintained during CRUD testing.

#### Scenario: Invariant checking during CRUD operations
- **WHEN** performing CRUD operations in any phase
- **THEN** system SHALL validate all applicable phase invariants
- **AND** immediately flag any invariant violations
- **AND** provide detailed explanation of which invariant was violated
- **AND** suggest corrective actions for invariant violations

#### Scenario: Cross-phase consistency validation
- **WHEN** transitioning between phases during testing
- **THEN** system SHALL ensure consistent behavior transitions
- **AND** validate that new phase behaviors are properly activated
- **AND** confirm that previous phase behaviors are appropriately deactivated
- **AND** maintain data integrity across phase transitions

### Requirement: Test Result Visualization
The system SHALL provide clear visualization of CRUD test results and phase behavior.

#### Scenario: Test result display
- **WHEN** CRUD tests are executed
- **THEN** system SHALL display comprehensive test results
- **AND** show which operations succeeded or failed
- **AND** indicate whether results match expected phase behavior
- **AND** provide detailed error messages for any failures
- **AND** allow drilling down into individual test case details

#### Scenario: Phase behavior comparison
- **WHEN** viewing test results across multiple phases
- **THEN** system SHALL allow side-by-side comparison of phase behaviors
- **AND** highlight differences in permission enforcement
- **AND** show how the same operations behave differently across phases
- **AND** provide clear explanations for behavioral changes