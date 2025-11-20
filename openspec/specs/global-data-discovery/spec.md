# Global Data Discovery

## Purpose
This capability enables cross-organization data visibility through global tables that are readable by all organizations but only writable by owners. It provides the foundation for marketplace functionality where organizations can discover and potentially engage with data from other organizations, implemented as Phase 4 Global Discovery State of the DET STATE model with data-only access before subscription and ACL phases.
## Requirements
### Requirement: Phase 4 Global Discovery State
The system SHALL implement Phase 4 Global Discovery State as data-only without subscription-based or ACL-based access logic.

#### Scenario: Phase 4 Global Discovery activation
- **WHEN** implementing Phase 4 (Global Discovery State)
- **THEN** system SHALL introduce global tables (e.g., global_loads, global_shipments) for cross-organization discovery
- **AND** ensure each global record is linked to its owning organization via deterministic identifiers
- **AND** allow publishing tenant-scoped resources into global discovery tables
- **AND** allow browsing and querying global records across organizations
- **AND** ensure no subscription-based or ACL-based dynamic access logic is enforced yet beyond basic read-only guarantees

### Requirement: Global Data Tables
The system SHALL provide global tables for cross-organization data discovery with data-only access.

#### Scenario: Global loads visibility
- **WHEN** any organization queries global loads
- **THEN** system SHALL return all available loads
- **AND** include shipper organization reference
- **AND** maintain read-only access for non-owners
- **AND** ensure access is data-only without subscription or ACL logic in Phase 4

#### Scenario: Global shipments visibility
- **WHEN** any organization queries global shipments
- **THEN** system SHALL return all available shipments
- **AND** include carrier organization reference
- **AND** maintain read-only access for non-owners
- **AND** ensure access is data-only without subscription or ACL logic in Phase 4

### Requirement: Phase 4 Global Data Ownership
The system SHALL enforce ownership rules for global data modifications in Phase 4 Global Discovery State.

#### Scenario: Owner modification rights
- **WHEN** an organization attempts to modify their global data
- **THEN** system SHALL allow modification
- **AND** validate organization is the owner
- **AND** maintain audit trail of changes
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

#### Scenario: Non-owner modification attempt
- **WHEN** an organization attempts to modify another's global data
- **THEN** system SHALL deny modification
- **AND** return appropriate error message
- **AND** log the attempt for security
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

### Requirement: Phase 4 Load Publishing
The system SHALL allow Shipper organizations to publish loads to global marketplace in Phase 4 Global Discovery State.

#### Scenario: Load publication
- **WHEN** a Shipper publishes a load
- **THEN** system SHALL create global_load record
- **AND** associate with shipper organization
- **AND** set initial status to "pending"
- **AND** make visible to all organizations
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

#### Scenario: Load publication validation
- **WHEN** publishing a load
- **THEN** system SHALL validate required fields (origin, destination, weight)
- **AND** verify user has publish permissions
- **AND** validate organization type is Shipper
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

### Requirement: Phase 4 Shipment Creation
The system SHALL allow Carrier organizations to create shipments for global loads in Phase 4 Global Discovery State.

#### Scenario: Shipment creation
- **WHEN** a Carrier creates a shipment
- **THEN** system SHALL create global_shipment record
- **AND** associate with carrier organization
- **AND** link to corresponding global load
- **AND** set initial status to "pending"
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

#### Scenario: Shipment validation
- **WHEN** creating a shipment
- **THEN** system SHALL validate load exists and is available
- **AND** verify user has shipment permissions
- **AND** validate organization type is Carrier
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

### Requirement: Phase 4 Global Data Querying
The system SHALL provide querying capabilities for global data discovery in Phase 4 Global Discovery State.

#### Scenario: Browse all global loads
- **WHEN** any organization queries global loads
- **THEN** system SHALL return paginated results
- **AND** include load details and shipper information
- **AND** support filtering by status
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

#### Scenario: Browse global loads by status
- **WHEN** organizations query loads by specific status
- **THEN** system SHALL filter results by status
- **AND** return only matching loads
- **AND** maintain pagination
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

#### Scenario: Search global loads
- **WHEN** organizations search loads with criteria
- **THEN** system SHALL search across relevant fields
- **AND** return matching results
- **AND** support pagination
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

### Requirement: Phase 4 Global Data Status Management
The system SHALL support status transitions for global data in Phase 4 Global Discovery State.

#### Scenario: Load status updates
- **WHEN** a Shipper updates global load status
- **THEN** system SHALL validate status transition
- **AND** update load status
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4
- **AND** defer subscription notifications until Phase 5

#### Scenario: Shipment status updates
- **WHEN** a Carrier updates global shipment status
- **THEN** system SHALL validate status transition
- **AND** update shipment status
- **AND** maintain shipment history
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

### Requirement: Phase 4 Global Data Relationships
The system SHALL maintain relationships between global data entities in Phase 4 Global Discovery State.

#### Scenario: Load-shipment linking
- **WHEN** a Carrier creates a shipment for a load
- **THEN** system SHALL link shipment to load
- **AND** update load status to "assigned"
- **AND** maintain bidirectional references
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

#### Scenario: Load availability tracking
- **WHEN** querying load availability
- **THEN** system SHALL check for existing shipments
- **AND** return availability status
- **AND** prevent duplicate shipments
- **AND** ensure this is data-only access without subscription or ACL logic in Phase 4

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

## Invariants
- Global data includes organization reference (shipperId, carrierId)
- Global data is read-only for non-owners
- Only owners can modify their global data
- Phase 4 Global Discovery State provides data-only access without subscription or ACL logic
- Global data visibility will be controlled by subscriptions in Phase 5
- Global data relationships are maintained bidirectionally
- No subscription-based or ACL-based dynamic access logic is enforced in Phase 4