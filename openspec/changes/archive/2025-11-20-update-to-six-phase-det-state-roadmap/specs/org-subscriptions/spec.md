## MODIFIED Requirements
### Requirement: Load Subscriptions
From Phase 5 (Subscription State) onward, the system SHALL allow organizations to subscribe to global loads with access levels.

#### Scenario: Load subscription creation
- **WHEN** an organization subscribes to a load
- **THEN** system SHALL create load_subscription record
- **AND** assign specified access level (view, bid, accept)
- **AND** record subscription timestamp
- **AND** prevent duplicate subscriptions

#### Scenario: Load access level validation
- **WHEN** accessing a subscribed load
- **THEN** system SHALL validate subscription access level
- **AND** allow operations within access level
- **AND** deny operations beyond access level

### Requirement: Phase 5 Shipment Subscriptions
From Phase 5 (Subscription State) onward, the system SHALL allow organizations to subscribe to global shipments with access levels.

#### Scenario: Shipment subscription creation
- **WHEN** an organization subscribes to a shipment
- **THEN** system SHALL create shipment_subscription record
- **AND** assign specified access level (view, track, update)
- **AND** record subscription timestamp
- **AND** prevent duplicate subscriptions

#### Scenario: Shipment access validation
- **WHEN** accessing a subscribed shipment
- **THEN** system SHALL validate subscription access level
- **AND** allow operations within access level
- **AND** deny operations beyond access level

### Requirement: Phase 5 Access Level Hierarchy
From Phase 5 (Subscription State) onward, the system SHALL enforce hierarchical access levels for subscriptions.

#### Scenario: Load access levels
- **WHEN** checking load subscription permissions
- **THEN** system SHALL enforce hierarchy: view < bid < accept
- **AND** allow view operations for all access levels
- **AND** allow bid operations for bid and accept levels
- **AND** allow accept operations only for accept level

#### Scenario: Shipment access levels
- **WHEN** checking shipment subscription permissions
- **THEN** system SHALL enforce hierarchy: view < track < update
- **AND** allow view operations for all access levels
- **AND** allow track operations for track and update levels
- **AND** allow update operations only for update level

### Requirement: Phase 5 Subscription Management
From Phase 5 (Subscription State) onward, the system SHALL provide subscription lifecycle management.

#### Scenario: Subscription listing
- **WHEN** an organization queries their subscriptions
- **THEN** system SHALL return all active subscriptions
- **AND** include resource details and access levels
- **AND** filter by resource type if specified

#### Scenario: Subscription cancellation
- **WHEN** an organization cancels a subscription
- **THEN** system SHALL remove subscription record
- **AND** revoke access to the resource
- **AND** maintain audit trail of cancellation

### Requirement: Phase 5 Subscription Expiration
From Phase 5 (Subscription State) onward, the system SHALL support time-limited subscriptions.

#### Scenario: Expiring subscriptions
- **WHEN** creating a subscription with expiration
- **THEN** system SHALL record expiration timestamp
- **AND** automatically revoke access after expiration
- **AND** remove expired subscriptions from queries

#### Scenario: Subscription renewal
- **WHEN** renewing an expiring subscription
- **THEN** system SHALL update expiration timestamp
- **AND** maintain existing access level
- **AND** extend access period

### Requirement: Phase 5 Subscription-Based Data Filtering
From Phase 5 (Subscription State) onward, the system SHALL filter global data queries based on subscriptions.

#### Scenario: Subscribed loads query
- **WHEN** querying subscribed loads
- **THEN** system SHALL return only subscribed loads
- **AND** include access level information
- **AND** exclude non-subscribed loads

#### Scenario: Subscribed shipments query
- **WHEN** querying subscribed shipments
- **THEN** system SHALL return only subscribed shipments
- **AND** include access level information
- **AND** exclude non-subscribed shipments

### Requirement: Phase 5 Subscription Validation
From Phase 5 (Subscription State) onward, the system SHALL validate subscriptions before data access.

#### Scenario: Subscription existence check
- **WHEN** accessing global data
- **THEN** system SHALL validate subscription exists
- **AND** verify subscription is active
- **AND** check subscription has not expired

#### Scenario: Subscription permission check
- **WHEN** performing operations on subscribed data
- **THEN** system SHALL validate operation is permitted by access level
- **AND** deny unauthorized operations
- **AND** log permission violations