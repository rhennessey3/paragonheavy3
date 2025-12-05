# Environment Setup and Configuration Guide

This guide explains how to set up and configure environment variables and URL relationships for Paragon Heavy multi-tenant logistics platform.

## 🛑 SINGLE DEPLOYMENT ARCHITECTURE

This project uses ONLY ONE Convex deployment: `dev:resilient-goose-530`
No production environment files or configurations are permitted.

## Quick Start

1. **Copy** environment template
   ```bash
   cp .env.example .env.local
   ```

2. **Use** the exact configuration provided in `.env.example`
   - No need to get your own Convex URL
   - No need to get your own Clerk keys
   - Use the provided dev:resilient-goose-530 deployment

3. **Start** development
   ```bash
   npm run dev
   ```

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend     │    │   Clerk Auth    │    │   Convex DB    │
│   (Next.js)    │    │   Service       │    │   Backend       │
│                 │    │                 │    │                 │
│ Port: 3000     │    │ refined-monkey-47 │    │ resilient-goose-530│
│                 │    │ .clerk.accounts.dev│    │ .convex.cloud    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ User Authentication   │ JWT Verification        │ Data Storage
          │──────────────────────▶│──────────────────────▶│
          │                      │                      │
          │ Webhook Events       │ User Sync             │ Real-time Updates
          │◀──────────────────────│──────────────────────▶│
          │                      │                      │
          │ Webhook Endpoint:     │                      │
          │ /clerk-webhook       │                      │
└─────────┴───────┘    └─────────┴───────┘    └─────────┴───────┘
```

## Environment Variables

### Required Variables (Fixed Values)

| Variable | Purpose | Value | Required |
|----------|---------|---------|----------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex backend URL | `https://resilient-goose-530.convex.cloud` | Yes |
| `CONVEX_DEPLOYMENT` | Convex deployment ID | `dev:resilient-goose-530` | Yes |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk auth domain | `https://refined-monkey-47.clerk.accounts.dev` | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend auth key | `pk_test_cmVmaW5lZC1tb25rZXktNDcuY2xlcmsuYWNjb3VudHMuZGV2JA` | Yes |
| `CLERK_SECRET_KEY` | Backend auth key | `sk_test_b4qn4jNV3DUC6o4RTJ8HVuHEFApsCkN2CSCnmyBSjP` | Yes |
| `CLERK_WEBHOOK_SECRET` | Webhook verification | `whsec_9GQ4TrAYzaxZ0WgUFmH8AOWS4u/Br15F` | Yes |
| `NODE_ENV` | Environment mode | `development` | Yes |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | Custom domain | `http://localhost:3000` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox access token for map features | None (required for route planning) |

## URL Configuration

### Single Environment Configuration

```bash
# Frontend (local development)
http://localhost:3000

# API Routes
http://localhost:3000/api/*

# Convex Backend (SINGLE DEPLOYMENT)
https://resilient-goose-530.convex.cloud

# Clerk Authentication (SINGLE INSTANCE)
https://refined-monkey-47.clerk.accounts.dev

# Webhook Endpoint (FIXED)
https://resilient-goose-530.convex.cloud/clerk-webhook
```

## Service Relationships

### 1. Frontend ↔ Clerk Authentication
- **Purpose**: User authentication and session management
- **Flow**: 
  1. User signs in through Clerk (refined-monkey-47)
  2. Clerk issues JWT with user and organization context
  3. Frontend receives JWT and maintains session
- **Variables Used**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_JWT_ISSUER_DOMAIN`

### 2. Frontend ↔ Convex Backend
- **Purpose**: Data storage and real-time updates
- **Flow**:
  1. Frontend initializes Convex client with `NEXT_PUBLIC_CONVEX_URL`
  2. All API calls go through Convex (resilient-goose-530)
  3. Real-time subscriptions receive updates
- **Variables Used**: `NEXT_PUBLIC_CONVEX_URL`

### 3. Clerk ↔ Convex (Backend)
- **Purpose**: JWT verification and user synchronization
- **Flow**:
  1. Convex verifies JWTs using `CLERK_JWT_ISSUER_DOMAIN`
  2. Clerk sends webhook events to `/clerk-webhook`
  3. Webhook verified with `CLERK_WEBHOOK_SECRET`
  4. User data synchronized with Convex
- **Variables Used**: `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SECRET`, `CLERK_SECRET_KEY`

## Setup Instructions

### 1. Local Development Setup

1. **Create Environment File**
   ```bash
   cp .env.example .env.local
   ```

2. **Verify Configuration**
   ```bash
   # .env.local should contain:
   CONVEX_DEPLOYMENT=dev:resilient-goose-530
   NEXT_PUBLIC_CONVEX_URL=https://resilient-goose-530.convex.cloud
   CLERK_JWT_ISSUER_DOMAIN=https://refined-monkey-47.clerk.accounts.dev
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmVmaW5lZC1tb25rZXktNDcuY2xlcmsuYWNjb3VudHMuZGV2JA
   CLERK_SECRET_KEY=sk_test_b4qn4jNV3DUC6o4RTJ8HVuHEFApsCkN2CSCnmyBSjP
   CLERK_WEBHOOK_SECRET=whsec_9GQ4TrAYzaxZ0WgUFmH8AOWS4u/Br15F
   NODE_ENV=development
   ```

3. **Start Development**
   ```bash
   npm install
   npm run dev
   ```

### 2. Vercel Deployment

1. **Environment Variables in Vercel**
   - Add all required variables to Vercel dashboard
   - Use the SAME values as local development
   - NO production-specific variables

2. **Domain Configuration**
   - Set custom domain in Vercel
   - Clerk allowed origins already configured

3. **Webhook Configuration**
   - Clerk webhook already points to: `https://resilient-goose-530.convex.cloud/clerk-webhook`
   - No changes needed

## Troubleshooting

### Common Issues

1. **"Missing CLERK_JWT_ISSUER_DOMAIN"**
   - **Solution**: Copy exact values from `.env.example`
   - **Check**: Ensure `.env.local` is created correctly

2. **"Convex connection failed"**
   - **Solution**: Verify `NEXT_PUBLIC_CONVEX_URL` is exactly `https://resilient-goose-530.convex.cloud`
   - **Check**: No typos in the URL

3. **"Webhook verification failed"**
   - **Solution**: Verify `CLERK_WEBHOOK_SECRET` matches exactly
   - **Check**: No extra spaces or characters

4. **"JWT verification error"**
   - **Solution**: Ensure Convex auth config matches Clerk setup
   - **Check**: Application ID is "convex"

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

This will show:
- Environment variable loading
- Service initialization
- Authentication flow
- API request/response details

## Security Best Practices

1. **Never commit secrets**
   - `.env.local` should be in `.gitignore`
   - Use only the provided values

2. **Use fixed configuration**
   - Do not change Convex deployment URL
   - Do not change Clerk domain
   - Do not create production keys

3. **Monitor access**
   - Check Convex dashboard for unusual activity
   - Monitor Clerk authentication logs

## Deployment

### Vercel (Required)

1. **Environment Variables**
   - Add all required variables to Vercel dashboard
   - Use the EXACT same values as development

2. **No Production Configuration**
   - Do not create production environment files
   - Do not use production keys
   - Do not change Convex deployment

3. **Webhook Setup**
   - Webhook already configured for resilient-goose-530
   - No changes needed

### Docker (Not Recommended)

If using Docker, ensure environment variables match exactly:
```bash
docker run -e NEXT_PUBLIC_CONVEX_URL=https://resilient-goose-530.convex.cloud your-app
```

## Support

For environment setup issues:
1. Check this documentation first
2. Review error logs in console
3. Verify all required variables are set exactly as shown
4. Ensure you're using the single deployment: resilient-goose-530
5. Consult [Clerk Documentation](https://clerk.com/docs)
6. Consult [Convex Documentation](https://docs.convex.dev)

## 🚫 PROHIBITED CONFIGURATIONS

Do NOT:
- Create `.env.production` files
- Use production Clerk keys
- Change Convex deployment URL
- Point webhooks to different deployments
- Use different JWT issuer domains
- Set `NODE_ENV=production`

All configurations MUST use the single deployment: `dev:resilient-goose-530`