# Environment Configuration Design

## Context

This design document provides technical implementation details for environment configuration and URL management system in Paragon Heavy. The system uses a multi-service architecture with Next.js frontend, Clerk authentication, and Convex backend, requiring careful coordination of environment variables and URL configurations.

## 🛑 SINGLE DEPLOYMENT ARCHITECTURE

This project uses ONLY ONE Convex deployment: `dev:resilient-goose-530`
No production environment files or configurations are permitted.

## Goals / Non-Goals

### Goals
- Provide clear, secure environment variable management across all services
- Establish consistent URL patterns and service communication
- Enable seamless development workflow with proper environment isolation
- Ensure security best practices for secret management
- Support single deployment architecture (dev:resilient-goose-530 only)

### Non-Goals
- Dynamic environment variable generation at runtime
- Automatic environment detection without explicit configuration
- Shared environment variables across different deployment targets
- Production environment configurations
- Multiple Convex deployments

## Decisions

### Environment Variable Structure

**Decision**: Use prefix-based naming convention for environment variables
- **Rationale**: Clear separation between client-side (`NEXT_PUBLIC_*`) and server-side variables
- **Alternatives considered**: Flat naming structure, service-specific prefixes
- **Chosen approach**: Next.js standard convention with clear security boundaries

**Decision**: NO fallback values for development
- **Rationale**: Enforce explicit configuration to prevent wrong deployment usage
- **Alternatives considered**: Sensible defaults, configuration files
- **Chosen approach**: Required variables with explicit validation

### URL Management Strategy

**Decision**: Centralize URL configuration in environment variables
- **Rationale**: Single source of truth for service endpoints
- **Alternatives considered**: Hardcoded URLs, configuration files, runtime discovery
- **Chosen approach**: Environment-specific URL variables with validation

**Decision**: Use single Convex deployment for all environments
- **Rationale**: Simplified architecture, consistent data access
- **Alternatives considered**: Separate deployments per environment, shared deployment with segregation
- **Chosen approach**: Single deployment `dev:resilient-goose-530` for everything

### Authentication Integration

**Decision**: Clerk as sole authentication provider with JWT-based flow
- **Rationale**: Comprehensive auth solution with organization support
- **Alternatives considered**: Custom auth, multiple providers, self-hosted
- **Chosen approach**: Clerk for both frontend and backend authentication

## Technical Implementation

### File Structure

```
project-root/
├── .env.example              # Template for required variables (single deployment)
├── .env.local                # Local development (gitignored)
├── convex/
│   └── auth.config.js        # Convex auth configuration
├── components/
│   └── ConvexClientProvider.tsx  # Frontend Convex client
├── middleware.ts              # Next.js request middleware
└── next.config.js           # Next.js configuration
```

### Environment Variable Processing

#### Frontend (Client-Side)
```typescript
// ConvexClientProvider.tsx - NO FALLBACKS
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
```

#### Backend (Server-Side)
```javascript
// convex/auth.config.js
const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;
export default {
  providers: [{
    domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
    applicationID: "convex",
  }],
};
```

### Configuration Flow

1. **Application Startup**
   ```typescript
   // Validate required environment variables
   const requiredVars = [
     'NEXT_PUBLIC_CONVEX_URL',
     'CONVEX_DEPLOYMENT',
     'CLERK_JWT_ISSUER_DOMAIN',
     'CLERK_WEBHOOK_SECRET',
     'NODE_ENV'
   ];
   
   requiredVars.forEach(varName => {
     if (!process.env[varName]) {
       console.error(`Missing required environment variable: ${varName}`);
       process.exit(1);
     }
   });
   
   // Validate single deployment
   if (process.env.CONVEX_DEPLOYMENT !== 'dev:resilient-goose-530') {
     console.error('Only dev:resilient-goose-530 deployment is allowed');
     process.exit(1);
   }
   ```

2. **Service Initialization**
   - Next.js reads `NEXT_PUBLIC_*` variables for client-side access
   - Convex reads server-side variables for auth configuration
   - Middleware uses Clerk for request authentication

3. **Runtime Configuration**
   ```typescript
   // Fixed configuration for single deployment
   const config = {
     isDevelopment: process.env.NODE_ENV === 'development',
     convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
     convexDeployment: process.env.CONVEX_DEPLOYMENT,
     clerkDomain: process.env.CLERK_JWT_ISSUER_DOMAIN
   };
   ```

### Security Implementation

#### Variable Access Control
```typescript
// Type-safe environment variable access
interface EnvVars {
  NEXT_PUBLIC_CONVEX_URL: string;
  CONVEX_DEPLOYMENT: string;
  CLERK_JWT_ISSUER_DOMAIN: string;
  CLERK_WEBHOOK_SECRET: string;
  NODE_ENV: string;
  // ... other variables
}

const env = process.env as Partial<EnvVars>;

// Runtime validation
function validateEnv(env: Partial<EnvVars>): EnvVars {
  if (!env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is required');
  }
  if (env.CONVEX_DEPLOYMENT !== 'dev:resilient-goose-530') {
    throw new Error('Only dev:resilient-goose-530 deployment is allowed');
  }
  if (env.NODE_ENV !== 'development') {
    throw new Error('Only development environment is allowed');
  }
  // ... other validations
  return env as EnvVars;
}
```

#### Secret Management
```bash
# .env.example (committed to repo)
# 🛑 SINGLE DEPLOYMENT ARCHITECTURE
CONVEX_DEPLOYMENT=dev:resilient-goose-530
NEXT_PUBLIC_CONVEX_URL=https://resilient-goose-530.convex.cloud
CLERK_JWT_ISSUER_DOMAIN=https://refined-monkey-47.clerk.accounts.dev
NODE_ENV=development
# CLERK_WEBHOOK_SECRET=whsec_9GQ4TrAYzaxZ0WgUFmH8AOWS4u/Br15F
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmVmaW5lZC1tb25rZXktNDcuY2xlcmsuYWNjb3VudHMuZGV2JA
# CLERK_SECRET_KEY=sk_test_b4qn4jNV3DUC6o4RTJ8HVuHEFApsCkN2CSCnmyBSjP
```

### Service Communication Patterns

#### Frontend to Backend
```typescript
// Convex client initialization with fixed URL
const convexClient = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

// Type-safe API calls
const { data } = useQuery(api.organizations.list, {});
```

#### Authentication Flow
```typescript
// Middleware authentication
export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
  
  // Route protection logic
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
});
```

#### Webhook Processing
```typescript
// Webhook endpoint with secret verification
export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  const payload = await verifyWebhook(req, webhookSecret);
  
  // Process user/organization updates
  await syncUserWithConvex(payload);
}
```

## Risks / Trade-offs

### Risks
1. **Environment Variable Exposure**: Accidental commit of secrets
   - **Mitigation**: Comprehensive `.gitignore`, pre-commit hooks, environment validation

2. **Single Point of Failure**: Single Convex deployment for all environments
   - **Mitigation**: Regular backups, monitoring, development data isolation

3. **Development vs Production Parity**: Same deployment for all environments
   - **Mitigation**: Clear data separation, environment-aware feature flags

### Trade-offs
1. **Simplicity vs Isolation**: Single deployment for simplicity
   - **Decision**: Prioritize simplicity with clear data management

2. **Flexibility vs Consistency**: Single environment pattern vs multiple patterns
   - **Decision**: Enforce consistency with single deployment

## Migration Plan

### Phase 1: Environment Variable Standardization
1. Create `.env.example` with single deployment variables
2. Update configuration files to use environment variables
3. Add validation for required variables
4. Update documentation

### Phase 2: Single Deployment Enforcement
1. Remove all production environment files
2. Add deployment validation logic
3. Update all hardcoded URLs to use single deployment
4. Create deployment scripts for single environment

### Phase 3: Developer Experience
1. Create setup scripts for new developers
2. Add environment variable validation in CI/CD
3. Implement single deployment debugging tools
4. Create onboarding documentation

## Open Questions

1. **Data Separation**: How to ensure development and production data don't interfere in single deployment?
2. **Backup Strategy**: What's the backup and recovery process for single deployment?
3. **Scaling**: How will single deployment handle increased load from multiple environments?
4. **Monitoring**: How to distinguish between development and production issues in single deployment?

## Implementation Checklist

- [x] Create `.env.example` template with single deployment
- [x] Update ConvexClientProvider to remove fallbacks
- [x] Modify convex/auth.config.js for single deployment
- [x] Add environment variable validation middleware
- [x] Remove all production environment files
- [x] Update all hardcoded URLs to use resilient-goose-530
- [x] Implement single deployment validation
- [x] Add environment documentation to onboarding
- [x] Create debugging tools for configuration issues
- [x] Set up CI/CD environment variable validation
- [x] Test single deployment configuration thoroughly