# Environment Configuration and URL Management

## Purpose
This capability defines environment variables, URLs, and configuration requirements for Paragon Heavy multi-tenant logistics platform. It establishes clear relationships between frontend, backend, authentication, and deployment environments.

## 🛑 SINGLE DEPLOYMENT ARCHITECTURE

This project uses ONLY ONE Convex deployment: `dev:resilient-goose-530`
No production environment files or configurations are permitted.

## Requirements

### Requirement: Environment Variable Structure
The system SHALL use a structured approach to environment variables for single development deployment.

#### Scenario: Development Environment Configuration
- **WHEN** setting up development environment
- **THEN** system SHALL require the following environment variables:
  - `NEXT_PUBLIC_CONVEX_URL` - Convex backend URL (MUST be "https://resilient-goose-530.convex.cloud")
  - `CONVEX_DEPLOYMENT` - Convex deployment identifier (MUST be "dev:resilient-goose-530")
  - `CLERK_JWT_ISSUER_DOMAIN` - Clerk JWT issuer domain for authentication (MUST be "https://refined-monkey-47.clerk.accounts.dev")
  - `CLERK_WEBHOOK_SECRET` - Clerk webhook secret for user synchronization
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key for frontend
  - `CLERK_SECRET_KEY` - Clerk secret key for backend operations
  - `NODE_ENV` - Environment mode (MUST be "development")

#### Scenario: Production Environment Configuration
- **WHEN** attempting to deploy to production
- **THEN** system SHALL reject production configurations
- **AND** SHALL only use dev:resilient-goose-530 deployment
- **AND** SHALL NOT create production environment files

### Requirement: URL Configuration Management
The system SHALL maintain clear URL mappings between different services.

#### Scenario: Frontend to Backend Communication
- **WHEN** frontend needs to communicate with Convex backend
- **THEN** system SHALL use `NEXT_PUBLIC_CONVEX_URL` environment variable
- **AND** ConvexClientProvider SHALL initialize with this URL
- **AND** SHALL NOT use any fallback URLs

#### Scenario: Authentication Flow URLs
- **WHEN** users authenticate through Clerk
- **THEN** system SHALL use `CLERK_JWT_ISSUER_DOMAIN` for JWT verification
- **AND** Convex auth.config SHALL reference this domain for JWKS endpoint
- **AND** middleware SHALL redirect unauthenticated users to `/sign-in`

#### Scenario: Webhook Processing
- **WHEN** Clerk sends webhook events
- **THEN** system SHALL verify using `CLERK_WEBHOOK_SECRET`
- **AND** process user creation, updates, and organization changes
- **AND** update Convex database accordingly
- **AND** webhook endpoint SHALL be `https://resilient-goose-530.convex.cloud/clerk-webhook`

### Requirement: Environment-Specific URL Patterns
The system SHALL follow consistent URL patterns for the single deployment.

#### Scenario: Development URL Structure
- **WHEN** running in development
- **THEN** system SHALL use these URL patterns:
  - Frontend: `http://localhost:3000`
  - Convex: `https://resilient-goose-530.convex.cloud`
  - Clerk: `https://refined-monkey-47.clerk.accounts.dev`
  - API routes: `http://localhost:3000/api/*`

#### Scenario: Production URL Structure
- **WHEN** deployed to production
- **THEN** system SHALL continue using the same deployment:
  - Frontend: `https://your-domain.com` (or configured domain)
  - Convex: `https://resilient-goose-530.convex.cloud` (SAME AS DEV)
  - Clerk: `https://refined-monkey-47.clerk.accounts.dev` (SAME AS DEV)
  - API routes: `https://your-domain.com/api/*`

### Requirement: Configuration File Relationships
The system SHALL maintain clear relationships between configuration files and environment variables.

#### Scenario: Next.js Configuration
- **WHEN** configuring Next.js
- **THEN** next.config.js SHALL include Clerk image domains
- **AND** allow images from `images.clerk.dev`
- **AND** support user profile images from Clerk

#### Scenario: Convex Authentication Configuration
- **WHEN** configuring Convex auth
- **THEN** convex/auth.config.js SHALL read `CLERK_JWT_ISSUER_DOMAIN`
- **AND** use application ID "convex" for JWT template matching
- **AND** log configuration for debugging purposes

#### Scenario: Middleware Configuration
- **WHEN** processing requests through middleware
- **THEN** middleware.ts SHALL use Clerk authentication
- **AND** protect routes based on authentication state
- **AND** redirect users without organizations to setup flow

### Requirement: Environment Variable Security
The system SHALL enforce proper security practices for environment variables.

#### Scenario: Public vs Private Variables
- **WHEN** defining environment variables
- **THEN** system SHALL use `NEXT_PUBLIC_` prefix for client-side variables
- **AND** keep server-only variables without public prefix
- **AND** ensure secrets are never exposed to frontend

#### Scenario: Variable Validation
- **WHEN** starting application
- **THEN** system SHALL validate required environment variables
- **AND** log warnings for missing critical variables
- **AND** provide clear error messages for configuration issues

### Requirement: Development Workflow Integration
The system SHALL integrate environment configuration with development workflow.

#### Scenario: Local Development Setup
- **WHEN** setting up local development
- **THEN** developers SHALL create `.env.local` file
- **AND** add to `.gitignore` to prevent committing secrets
- **AND** reference `.env.example` for required variables

#### Scenario: Environment Documentation
- **WHEN** onboarding new developers
- **THEN** system SHALL provide clear environment setup documentation
- **AND** include variable descriptions and example values
- **AND** document relationships between services

## Environment Variable Reference

### Frontend Variables (Client-Side)
| Variable | Purpose | Example Value | Required |
|----------|---------|---------------|----------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex backend URL | `https://resilient-goose-530.convex.cloud` | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key | `pk_test_cmVmaW5lZC1tb25rZXktNDcuY2xlcmsuYWNjb3VudHMuZGV2JA` | Yes |

### Backend Variables (Server-Side)
| Variable | Purpose | Example Value | Required |
|----------|---------|---------------|----------|
| `CONVEX_DEPLOYMENT` | Convex deployment ID | `dev:resilient-goose-530` | Yes |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT domain | `https://refined-monkey-47.clerk.accounts.dev` | Yes |
| `CLERK_WEBHOOK_SECRET` | Webhook verification | `whsec_9GQ4TrAYzaxZ0WgUFmH8AOWS4u/Br15F` | Yes |
| `CLERK_SECRET_KEY` | Clerk backend operations | `sk_test_b4qn4jNV3DUC6o4RTJ8HVuHEFApsCkN2CSCnmyBSjP` | Yes |
| `NODE_ENV` | Environment mode | `development` | Yes |

## URL Mapping Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend     │    │     Clerk       │    │     Convex      │
│  (Next.js)     │    │  (Auth)         │    │  (Backend)       │
│                 │    │                 │    │                 │
│ localhost:3000  │    │ refined-monkey-47 │    │ resilient-goose-530│
│                 │    │ .clerk.accounts.dev│    │ .convex.cloud    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ JWT Auth             │ JWT Verification        │ API Calls
          │──────────────────────▶│──────────────────────▶│
          │                      │                      │
          │ Webhook Events       │ User Sync             │ Data Storage
          │◀──────────────────────│──────────────────────▶│
          │                      │                      │
          │ Webhook Endpoint:     │                      │
          │ /clerk-webhook       │                      │
└─────────┴───────┘    └─────────┴───────┘    └─────────┴───────┘
```

## Configuration Flow

1. **Frontend Initialization**
   - Reads `NEXT_PUBLIC_CONVEX_URL`
   - Initializes Convex client with resilient-goose-530
   - Sets up Clerk authentication

2. **Authentication Flow**
   - User signs in through Clerk (refined-monkey-47)
   - Clerk issues JWT with user and org context
   - Frontend receives JWT and user session

3. **Backend Communication**
   - Convex verifies JWT using `CLERK_JWT_ISSUER_DOMAIN`
   - Enforces organization-scoped data access
   - Processes mutations and queries

4. **Webhook Processing**
   - Clerk sends webhook events to `/clerk-webhook`
   - Backend verifies using `CLERK_WEBHOOK_SECRET`
   - Updates local user and organization data

## Invariants

- Environment variables SHALL be consistent across all deployments
- Public variables SHALL be prefixed with `NEXT_PUBLIC_`
- Secret keys SHALL never be committed to version control
- URL configurations SHALL use the single Convex deployment
- All required variables SHALL be validated at startup
- Production environment files SHALL NOT be created
- Only dev:resilient-goose-530 Convex deployment SHALL be used