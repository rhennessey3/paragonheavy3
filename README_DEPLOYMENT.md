# Convex Deployment Setup Guide

This project now supports multiple deployment environments with proper configuration separation.

## 📁 Environment Files

- **`.env.local`** - Local development with local Convex backend
- **`.env.development`** - Cloud development deployment (dev:resilient-goose-530)
- **`.env.production`** - Production deployment (prod:disciplined-moose-799)

## 🚀 Deployment Commands

### Local Development
```bash
# Start local development with local Convex backend
npm run dev
# This uses .env.local automatically
```

### Cloud Development
```bash
# Switch to cloud development environment
cp .env.development .env.local

# Start development with cloud backend
npm run dev
```

### Deploy to Development
```bash
# Deploy to development environment
npm run deploy:dev
```

### Deploy to Production
```bash
# Deploy to production environment
npm run deploy:prod
```

## 🔄 Environment Switching

### Method 1: Manual File Copy
```bash
# Switch to local development
cp .env.local .env.backup
# (already configured for local)

# Switch to cloud development
cp .env.development .env.local

# Switch to production
cp .env.production .env.local
```

### Method 2: Using Convex CLI
```bash
# Configure for local development
npx convex dev --configure --dev-deployment=local

# Configure for cloud development
npx convex dev --configure
# Choose cloud deployment when prompted
```

## 📊 Deployment URLs

| Environment | Convex Deployment | Frontend URL |
|-------------|------------------|---------------|
| Local | local (127.0.0.1:3210) | http://127.0.0.1:3210 |
| Development | dev:resilient-goose-530 | https://resilient-goose-530.convex.cloud |
| Production | prod:disciplined-moose-799 | https://disciplined-moose-799.convex.cloud |

## ⚠️ Important Notes

1. **Never commit actual secrets** to version control
2. **Production credentials** in `.env.production` are placeholders - update before production deployment
3. **Local development** runs Convex backend on your machine (port 3210)
4. **Cloud development** uses shared Convex infrastructure
5. **Always restart** both `npx convex dev` and `npm run dev` after switching environments

## 🔧 Troubleshooting

### Issues with Environment Variables
```bash
# Check current Convex environment
npx convex env list

# Verify which deployment you're connected to
npx convex dashboard
```

### Clear Configuration Issues
```bash
# Reset Convex configuration
npx convex dev --configure

# Clear local cache if needed
rm -rf .convex/
```

### Function Deployment Issues
```bash
# Regenerate types
npx convex codegen

# Force redeploy
npx convex deploy --yes --verbose
```

## 📋 Development Workflow

1. **Local Development**: Use `.env.local` for rapid iteration
2. **Feature Testing**: Switch to `.env.development` for cloud testing
3. **Production Release**: Use `.env.production` for production deployment

## 🔐 Security Considerations

- All environment files are in `.gitignore` except `.env.example`
- Production secrets should be managed through your hosting provider
- Use deployment keys for CI/CD environments
- Regularly rotate Clerk and Convex secrets