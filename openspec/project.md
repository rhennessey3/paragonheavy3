# Project Context

## Purpose
Paragon Heavy is a multi-tenant logistics platform designed to facilitate secure and efficient collaboration between Shippers, Carriers, and Escort services. The system enforces strict data isolation between organizations while enabling controlled, permission-based data sharing and real-time coordination for heavy haul logistics.

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Convex (Real-time database, serverless functions)
- **Authentication:** Clerk (Identity management, organization context)
- **Package Manager:** npm

## Project Conventions

### Code Style
- **TypeScript:** Strict type safety for all components and backend functions.
- **Convex:** Use `query` and `mutation` wrappers with `v` (validator) schemas.
- **UI Components:** Use shadcn/ui components for consistency.
- **Styling:** Tailwind CSS for utility-first styling.

### Architecture Patterns
- **Multi-Tenancy:**
  - **Isolation:** Strict organization-level isolation enforced at the database query level.
  - **Invariants:** Users belong to exactly one org; Orgs have exactly one type.
- **Data Model:**
  - **Org-Scoped:** Data private to an organization (e.g., `loads`, `shipments`).
  - **Global:** Shared data discovery tables (e.g., `global_loads`).
  - **Subscriptions:** Mechanism for orgs to access global data.
  - **ACLs:** Explicit entries for cross-organization resource sharing.
- **Security:**
  - JWT-based authentication with organization context.
  - Role-Based Access Control (RBAC) within organizations (Admin, Manager, Operator).

### Testing Strategy
- **Unit Tests:** Verify business logic invariants (e.g., org creation, role assignment).
- **Integration Tests:** Validate workflows (e.g., permission checks, cross-org visibility).
- **E2E Tests:** Ensure critical UI flows function correctly.
- **Security Tests:** Explicitly test for data leakage and isolation violations.
- **Performance:** Monitor query performance and subscription latency.
- **DET STATE Testing:** Validate deterministic progression through six phases and phase-specific invariants.

### Git Workflow
- Feature branch workflow.
- PR reviews required for all changes.
- CI checks for tests and linting.
- **DET STATE Validation:** Ensure phase progression aligns with six-phase DET STATE model.

## Domain Context
- **Organization Types:**
  - **Shipper:** Originators of loads.
  - **Carrier:** Transporters of loads.
  - **Escort:** Security and pilot car services.
- **Key Entities:**
  - **Load:** A cargo requirement created by a Shipper.
  - **Shipment:** The execution of a load by a Carrier.
  - **Escort Request:** A request for escort services.
- **Access Model:**
  - **Global Data:** Visible to all but read-only.
  - **Subscriptions:** Grant specific access levels (view, bid, accept) to global data.
  - **DET STATE Phases:** Six-phase deterministic progression (Identity, Roles, Permissions, Global Discovery, Subscriptions, ACL).

## Important Constraints
- **Deterministic Invariants:**
  - Each user belongs to exactly one organization.
  - Each organization has exactly one type.
  - No implicit cross-org access; all sharing must be explicit via Subscriptions or ACLs.
  - **DET STATE Progression:** System implements six-phase deterministic progression with clear phase boundaries and validation criteria.
- **Security:** All API endpoints must validate organization membership before data access.

## External Dependencies
- **Clerk:** User authentication and organization management.
- **Convex:** Backend infrastructure and database.
- **Vercel:** Hosting and deployment (planned).
- **DET STATE Framework:** Six-phase deterministic progression model for multi-tenant implementation.
