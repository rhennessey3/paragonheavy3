## MODIFIED Requirements
### Requirement: Organization-Scoped Data Models
The system SHALL provide organization-specific data tables for different organization types.

#### Scenario: Shipper load management
- **WHEN** a Shipper organization creates a load
- **THEN** system SHALL store the load with organizationId
- **AND** include load-specific attributes (origin, destination, weight, status)
- **AND** validate permissions based on role in Phase 3 Permissions State

#### Scenario: Carrier load management
- **WHEN** a Carrier organization creates a load
- **THEN** system SHALL store the load with organizationId
- **AND** include load-specific attributes (origin, destination, weight, status)
- **AND** validate permissions based on role in Phase 3 Permissions State

#### Scenario: Escort load management
- **WHEN** an Escort organization creates a load
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

### Requirement: Phase 3 Load Management (Universal)
The system SHALL provide load management capabilities for all organization types with role-based permission enforcement in Phase 3 Permissions State.

#### Scenario: Load creation by Shipper
- **WHEN** a Shipper creates a new load
- **THEN** system SHALL validate required fields (origin, destination, weight)
- **AND** set initial status to "pending"
- **AND** associate with their organization
- **AND** validate user has create permission using permission map in Phase 3

#### Scenario: Load creation by Carrier
- **WHEN** a Carrier creates a new load
- **THEN** system SHALL validate required fields (origin, destination, weight)
- **AND** set initial status to "pending"
- **AND** associate with their organization
- **AND** validate user has create permission using permission map in Phase 3

#### Scenario: Load creation by Escort
- **WHEN** an Escort creates a new load
- **THEN** system SHALL validate required fields (origin, destination, weight)
- **AND** set initial status to "pending"
- **AND** associate with their organization
- **AND** validate user has create permission using permission map in Phase 3

#### Scenario: Load status updates
- **WHEN** any organization type updates load status
- **THEN** system SHALL validate status transition is valid
- **AND** record status change timestamp
- **AND** maintain load history
- **AND** validate user has update permission using permission map in Phase 3