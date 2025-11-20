## 1. Spec Updates
- [x] 1.1 Update implementation-roadmap/spec.md and design.md to define six DET phases and adjust diagrams, phase descriptions, and timeline.
- [x] 1.2 Update identity-org-management/spec.md (and design.md if needed) to separate Phase 1 identity-only, Phase 2 roles-as-data, and Phase 3 RBAC activation.
- [x] 1.3 Update tenant-scoped-data/spec.md to tie CRUD and role-based checks explicitly to Phase 3 Permissions State.
- [x] 1.4 Update global-data-discovery/spec.md to model Phase 4 Global Discovery as data-only (no subscription gating) and reference later Subscription and ACL phases.
- [x] 1.5 Update org-subscriptions/spec.md and design.md to associate subscription semantics and invariants with Phase 5 Subscription State.
- [x] 1.6 Update cross-org-acl/spec.md and design.md to associate ACL semantics and invariants with Phase 6 ACL State and clarify interactions with subscriptions.
- [x] 1.7 Update project.md and any cross-document references so all phase mentions use the six-phase DET model consistently.

## 2. Validation and Documentation
- [x] 2.1 Run `openspec validate update-to-six-phase-det-state-roadmap --strict` and resolve any validation errors.
- [x] 2.2 Manually review specs to confirm phase semantics (Identity, Roles, Permissions, Global Discovery, Subscriptions, ACL) match the DET STATE definitions.
- [x] 2.3 Update any external documentation or diagrams (outside OpenSpec) that still assume the old five-phase roadmap.