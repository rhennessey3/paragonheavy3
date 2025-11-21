## MODIFIED Requirements
### Requirement: Phase 4 Load Publishing
The system SHALL allow any organization type to publish loads to global marketplace in Phase 4 Global Discovery State.

#### Scenario: Load publication by Shipper
- **WHEN** a Shipper publishes a load
- **THEN** system SHALL create global_load record
- **AND** associate with shipper organization
- **AND** set initial status to "pending"
- **AND** make visible to all organizations
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

#### Scenario: Load publication by Carrier
- **WHEN** a Carrier publishes a load
- **THEN** system SHALL create global_load record
- **AND** associate with carrier organization
- **AND** set initial status to "pending"
- **AND** make visible to all organizations
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

#### Scenario: Load publication by Escort
- **WHEN** an Escort publishes a load
- **THEN** system SHALL create global_load record
- **AND** associate with escort organization
- **AND** set initial status to "pending"
- **AND** make visible to all organizations
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

#### Scenario: Load publication validation
- **WHEN** publishing a load
- **THEN** system SHALL validate required fields (origin, destination, weight)
- **AND** verify user has publish permissions
- **AND** validate organization type (shipper, carrier, or escort)
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4