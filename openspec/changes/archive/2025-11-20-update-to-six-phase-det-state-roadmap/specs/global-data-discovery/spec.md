## MODIFIED Requirements
### Requirement: Phase 4 Global Data Permissions
From Phase 4 (Global Discovery State) onward, the system SHALL implement read-only access for non-owner organizations while deferring subscription- and ACL-based gating to later phases.

#### Scenario: Non-owner read access in Phase 4
- **WHEN** non-owner organizations query global data in Phase 4 (Global Discovery State)
- **THEN** system SHALL allow read access
- **AND** return complete data needed for discovery
- **AND** not expose sensitive owner information
- **AND** SHALL NOT require an active subscription or ACL entry for read access in this phase

#### Scenario: Non-owner write attempt
- **WHEN** non-owner organizations attempt write operations on global data
- **THEN** system SHALL deny all write operations
- **AND** return permission denied error
- **AND** log the attempt for audit and security analysis

#### Scenario: Subscription and ACL gating in later phases
- **WHEN** Phases 5 (Subscription State) and 6 (ACL State) are active
- **THEN** system SHALL additionally evaluate subscription and ACL state before allowing non-owner operations on global data
- **AND** ensure subscription-based access control from Phase 5 can further restrict or structure access
- **AND** ensure ACL-based access control from Phase 6 can grant explicit cross-organization permissions without weakening the read-only guarantee for unauthorized non-owners