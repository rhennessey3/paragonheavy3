# Change: Allow All Organization Types to Create Loads

## Why
The current specifications restrict load creation to only Shipper organizations, but allowing all organization types (Shippers, Carriers, and Escorts) to create loads scoped to their organizations would provide more flexibility and enable additional use cases like Carriers creating backhaul loads or Escorts creating specialized transport loads.

## What Changes
- Modify tenant-scoped data specifications to allow all organization types to create loads
- Update CarrierDashboard component to include load creation functionality
- Update global data discovery specifications to reflect universal load creation
- **BREAKING**: Changes the business logic that previously restricted load creation to shippers only

## Impact
- Affected specs: tenant-scoped-data, global-data-discovery
- Affected code: components/dashboard/CarrierDashboard.tsx, components/dashboard/EscortDashboard.tsx
- Database: No schema changes needed, just permission logic updates