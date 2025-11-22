# Sign-Up Flow Architecture

## Current (Problematic) Flow

```mermaid
sequenceDiagram
    participant User
    participant Clerk
    participant NextJS
    participant Convex
    participant Webhook

    User->>Clerk: Sign up
    Clerk->>NextJS: Redirect to create-org-name
    User->>NextJS: Submit org name
    NextJS->>NextJS: Pass name as URL param
    NextJS->>User: Redirect to select-org-type
    User->>NextJS: Submit org type
    NextJS->>Clerk: Create org (API route)
    Clerk->>Webhook: Async webhook
    Webhook->>Convex: Store org data
    Note over NextJS,Webhook: ⚠️ Middleware checks for orgId<br/>before webhook completes
    NextJS->>User: Redirect loop!
```

## New (Synchronous) Flow

```mermaid
sequenceDiagram
    participant User
    participant Clerk
    participant NextJS
    participant Convex

    User->>Clerk: Sign up
    Clerk->>NextJS: Redirect to create-org-name
    User->>NextJS: Submit org name
    NextJS->>Clerk: Create org (JS SDK - immediate)
    Clerk-->>NextJS: Return org.id instantly
    NextJS->>Convex: Store org metadata (synchronous)
    NextJS->>Clerk: Update session claims
    NextJS->>Clerk: setActive(org)
    NextJS->>User: Redirect to select-org-type
    User->>NextJS: Submit org type
    NextJS->>Convex: Update org type
    NextJS->>Clerk: Update org metadata (optional)
    NextJS->>User: Redirect to dashboard
    Note over NextJS: ✅ No webhooks needed<br/>✅ No race conditions<br/>✅ Immediate session updates
```

## Key Differences

| Aspect | Current Flow | New Flow |
|--------|---------------|-----------|
| Organization Creation | API route + webhook | Clerk JS SDK (immediate) |
| Convex Sync | Async webhook | Synchronous mutation |
| Session Claims | Updated by webhook | Updated immediately |
| Race Conditions | ❌ Common | ✅ Eliminated |
| User Experience | ❌ Redirect loops | ✅ Smooth progression |
| Reliability | ❌ Timing dependent | ✅ Deterministic |

## Implementation Components

### Step B: create-org-name
```typescript
// Immediate organization creation
const org = await clerk.organizations.createOrganization({...});
await convex.createOrganization({...});
await user.update({unsafeMetadata: {primaryOrgId: org.id}});
await setActive({organization: org.id});
```

### Step C: select-org-type  
```typescript
// Just update type, org already exists
await convex.updateOrganizationType({...});
await convex.markOnboardingComplete({...});
```

### Middleware Logic
```typescript
// No more race conditions
if (userId && !orgId) {
  redirect('/sign-up/tasks/create-org-name');
}
// orgId available immediately after Step B