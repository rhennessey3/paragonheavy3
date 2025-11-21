# Change: Add Phased CRUD Testing Framework

## Why
To validate that single org members can perform CRUD operations and read data back to the client across all six DET STATE phases, ensuring proper phase-specific behavior and invariants are maintained throughout the multi-tenant implementation.

## What Changes
- Add comprehensive CRUD testing framework that validates behavior for each DET STATE phase
- Create phase-specific test scenarios that validate invariants and permissions
- Implement test interface for manual and automated validation of CRUD operations
- Add test pages for each phase to verify phase-specific behavior

## Impact
- Affected specs: tenant-scoped-data, identity-org-management, implementation-roadmap
- Affected code: convex/loads.ts, convex/users.ts, convex/organizations.ts, test pages
- New testing capabilities: Phase 1-6 CRUD validation, invariant checking, permission boundary testing