# Production Deployment Guide for Clerk-Convex Integration

## Overview
This guide covers the production deployment setup for integrating Clerk authentication with Convex backend using the production URL.

## Current Configuration Status

### ✅ Completed Tasks
1. **ConvexClientProvider Component** - Created to integrate Convex with Clerk
2. **Environment Configuration** - Updated for production deployment
3. **Convex Authentication** - Configured with Clerk JWT issuer domain
4. **Root Layout** - Updated to properly wrap providers
5. **Webhook Handler** - Created for Clerk user synchronization

### 🔄 In Progress
6. **Production Deployment** - Functions need to be deployed to production

### ⏳ Pending
7. **Authentication Flow Testing** - Test production authentication
8. **Documentation Updates** - Update production configuration docs

## Production Environment Variables

### Required Environment Variables

```env
# Clerk Production Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.com

# Convex Production Configuration
CONVEX_DEPLOYMENT=disciplined-moose-799
NEXT_PUBLIC_CONVEX_URL=https://disciplined-moose-799.convex.cloud

# Webhook Configuration
CLERK_WEBHOOK_SECRET=your-webhook-secret-here

# Convex Auth Configuration
AUTH_SECRET_1=your-auth-secret-here
AUTH_SECRET_2=your-auth-secret-here
AUTH_SECRET_3=your-auth-secret-here
AUTH_URL=https://disciplined-moose-799.convex.cloud
AUTH_REDIRECT_PROXY_URL=http://localhost:3000
AUTH_CLERK_ID=convex
AUTH_CLERK_SECRET=sk_live_...
AUTH_CLERK_ISSUER=https://your-domain.clerk.accounts.com
```

## Deployment Steps

### 1. Set Production Environment Variables

Set all required environment variables in the Convex production dashboard:

```bash
# Set Convex deployment environment
npx convex env set CONVEX_DEPLOYMENT=disciplined-moose-799 --prod

# Set authentication secrets
npx convex env set AUTH_SECRET_1="your-generated-secret" --prod
npx convex env set AUTH_SECRET_2="your-generated-secret" --prod
npx convex env set AUTH_SECRET_3="your-generated-secret" --prod

# Set URL configurations
npx convex env set AUTH_URL="https://disciplined-moose-799.convex.cloud" --prod
npx convex env set AUTH_REDIRECT_PROXY_URL="http://localhost:3000" --prod

# Set Clerk configuration
npx convex env set AUTH_CLERK_ID=convex --prod
npx convex env set AUTH_CLERK_SECRET="sk_live_..." --prod
npx convex env set AUTH_CLERK_ISSUER="https://your-domain.clerk.accounts.com" --prod
```

### 2. Deploy Functions to Production

```bash
# Deploy to production
export CONVEX_DEPLOYMENT=disciplined-moose-799
npx convex deploy
```

### 3. Configure Clerk Webhooks

1. Go to Clerk Dashboard → Webhooks
2. Add webhook endpoint: `https://disciplined-moose-799.convex.site/clerk-webhook`
3. Set webhook secret to match `CLERK_WEBHOOK_SECRET`
4. Subscribe to events: `user.created`, `user.updated`, `user.deleted`, `organization.created`, `organization.updated`, `organization.deleted`

### 4. Update Client Configuration

Ensure your Next.js application uses production URLs:

```env
# .env.local
NEXT_PUBLIC_CONVEX_URL=https://disciplined-moose-799.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

## Authentication Flow

### Provider Hierarchy
```
ClerkProvider
└── ConvexProviderWithClerk
    └── App Components
```

### Token Flow
1. User authenticates with Clerk
2. Clerk generates JWT token with "convex" template
3. ConvexClientProvider fetches token using `getToken({ template: "convex" })`
4. Token is sent to Convex backend for authentication
5. Convex validates token using Clerk JWKS endpoint

## Troubleshooting

### Common Issues

1. **Environment Variable Errors**
   - Ensure all AUTH_* variables are set in production
   - Check Convex dashboard for missing variables

2. **Authentication Failures**
   - Verify CLERK_JWT_ISSUER_DOMAIN matches production Clerk domain
   - Check JWT template configuration in Clerk dashboard

3. **Webhook Issues**
   - Verify webhook endpoint is accessible
   - Check webhook secret matches configuration

### Verification Commands

```bash
# Check current deployment
npx convex deploy --dry-run

# Verify environment variables
npx convex env list --prod

# Test webhook endpoint
curl -X POST https://disciplined-moose-799.convex.site/clerk-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Next Steps

1. Complete production deployment
2. Test authentication flow end-to-end
3. Verify webhook synchronization
4. Update production environment variables in hosting platform
5. Monitor logs for authentication issues

## Security Considerations

- Use production Clerk keys (pk_live_*, sk_live_*)
- Generate secure random secrets for AUTH_SECRET_* variables
- Set up webhook signature verification
- Enable IP restrictions if needed
- Monitor authentication logs regularly