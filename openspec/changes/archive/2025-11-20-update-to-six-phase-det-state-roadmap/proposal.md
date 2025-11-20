# Change: Align implementation roadmap and capabilities with six-phase DET STATE model

## Why
The current OpenSpec roadmap uses five phases with earlier RBAC activation and no explicit roles-only or pure global discovery phases, which does not match the intended six-phase deterministic progression. This change realigns the roadmap and capability specs to the six DET states: Identity, Roles, Permissions, Global Discovery, Subscriptions, and ACL.

## What Changes
- Introduce a six-phase multi-tenant implementation roadmap reflecting the DET states.
- Adjust identity-org-management requirements to separate identity-only (Phase 1), roles-as-data (Phase 2), and RBAC activation (Phase 3).
- Adjust tenant-scoped-data requirements to tie CRUD and role-based checks explicitly to the Permissions State (Phase 3).
- Adjust global-data-discovery requirements to model Phase 4 as pure global discovery without subscription-based access logic.
- Adjust org-subscriptions requirements to map subscription semantics and invariants to Phase 5.
- Adjust cross-org-acl requirements to map ACL semantics, permission levels, and expiration to Phase 6.
- Update high-level project overview references to use the six-phase DET STATE model consistently.

## Impact
- Affected specs: implementation-roadmap, identity-org-management, tenant-scoped-data, global-data-discovery, org-subscriptions, cross-org-acl, project.
- Affected code: Phase planning, feature flags, and rollout sequencing for identity, RBAC, global data, subscriptions, and ACL.
- **BREAKING**: Changes to phase definitions and expectations may require adjustment of any existing implementation, documentation, or tooling that assumes the previous five-phase roadmap.