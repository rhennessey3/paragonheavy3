# 🧭 PARAGON HEAVY - PHASE 1 MVP

A multi-tenant heavy haul logistics platform built with Next.js, Clerk, and Convex.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Clerk account (configured for organizations)
- Convex account
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd paragonheavy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Clerk and Convex credentials

# Start development server
npm run dev

# Start Convex backend (in separate terminal)
npx convex dev
```

### Environment Variables

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex Configuration
CONVEX_DEPLOYMENT=convex-dev-...
NEXT_PUBLIC_CONVEX_URL=https://your-dev.convex.cloud

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📋 Project Overview

Paragon Heavy is a comprehensive logistics platform designed for heavy haul operations. Phase 1 focuses on multi-tenant architecture with three organization types:

### Organization Types

#### 🚚 Shippers
- Create and manage loads
- Assign carriers to jobs
- Track load status updates
- View carrier information

#### 🚛 Carriers  
- View available loads
- Accept job assignments
- Update load status to "in_progress"
- Manage assigned loads

#### 👮 Escorts (Phase 1 - Placeholder)
- Read-only load viewing
- Foundation for Phase 2 escort workflows

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router)
- **Authentication**: Clerk (with organization support)
- **Backend**: Convex (real-time database)
- **UI**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel + Convex Cloud

### Key Features
- ✅ Multi-tenant data isolation
- ✅ Real-time updates
- ✅ Organization-level permissions
- ✅ Load lifecycle management
- ✅ Responsive design
- ✅ Type-safe development

## 📁 Project Structure

```
paragonheavy/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── org-selection/     # Organization selection
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   ├── layouts/          # Layout components
│   └── loads/            # Load-related components
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── organizations.ts   # Organization functions
│   ├── loads.ts          # Load management functions
│   └── users.ts          # User management functions
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

## 🔄 User Workflows

### Shipper Workflow
1. Sign up / Sign in
2. Create or select organization
3. Create new load with details
4. Assign carrier to load
5. Track status updates

### Carrier Workflow
1. Sign up / Sign in
2. Create or select carrier organization
3. View available loads
4. Accept load assignment
5. Update load status

### Load Status Flow
```
created → carrier_assigned → in_progress → completed
```

## 📊 Data Model

### Organizations
- Organization details and metadata
- Multi-tenant isolation
- Type-specific configuration

### User Profiles
- Clerk user mapping
- Organization membership
- Role-based access (Phase 1: admin only)

### Loads
- Complete load information
- Status tracking
- Multi-party relationships
- Real-time updates

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Test Categories
- **Unit Tests**: Convex functions, utilities
- **Integration Tests**: Component interactions
- **E2E Tests**: Complete user workflows
- **Manual Testing**: Multi-tenant isolation

## 🚀 Deployment

### Development
```bash
# Start development server
npm run dev

# Start Convex development
npx convex dev
```

### Production
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy Convex functions
npx convex deploy --prod
```

## 📚 Documentation

- [📋 Architecture Overview](./PARAGON_HEAVY_ARCHITECTURE.md)
- [🗓️ Sprint Plan](./SPRINT_PLAN.md)
- [🛠️ Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [🧪 Testing & Deployment](./TESTING_DEPLOYMENT_GUIDE.md)

## 🎯 Phase 1 Deliverables

### Core Functionality
- [x] Multi-tenant architecture
- [x] Organization management
- [x] Load CRUD operations
- [x] Shipper-carrier workflow
- [x] Real-time updates
- [x] Data isolation

### User Experience
- [x] Responsive design
- [x] Intuitive dashboards
- [x] Form validation
- [x] Error handling
- [x] Loading states

### Technical Excellence
- [x] Type safety
- [x] Performance optimization
- [x] Security best practices
- [x] Scalable architecture
- [x] Comprehensive testing

## 🔮 Phase 2 Preview

### Planned Features
- **Escort Workflows**: Complete escort management
- **Route Mapping**: Integration with mapping services
- **Compliance Engine**: Automated permit checking
- **File Management**: Document upload and management
- **GPS Tracking**: Real-time load tracking
- **Billing System**: Cost calculation and invoicing
- **Advanced Permissions**: Role-based access control
- **Analytics**: Business intelligence dashboard

### Technical Enhancements
- Advanced search and filtering
- Mobile app development
- API integrations
- Advanced notifications
- Performance optimizations

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Run test suite and ensure coverage
4. Submit pull request for review
5. Merge after approval

### Code Standards
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📞 Support

### Getting Help
- Review documentation first
- Check existing issues
- Create new issue with details
- Contact development team

### Common Issues
- **Authentication**: Verify Clerk configuration
- **Database**: Check Convex connection
- **Environment**: Validate all variables
- **Dependencies**: Ensure compatible versions

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

## 🎉 Getting Started

Ready to build Paragon Heavy? Follow these steps:

1. **Review Architecture**: Read [`PARAGON_HEAVY_ARCHITECTURE.md`](./PARAGON_HEAVY_ARCHITECTURE.md)
2. **Plan Sprint**: Follow [`SPRINT_PLAN.md`](./SPRINT_PLAN.md) for 4-week timeline
3. **Implement**: Use [`IMPLEMENTATION_GUIDE.md`](./IMPLEMENTATION_GUIDE.md) for technical details
4. **Test & Deploy**: Follow [`TESTING_DEPLOYMENT_GUIDE.md`](./TESTING_DEPLOYMENT_GUIDE.md)

### Development Commands

```bash
# Start development
npm run dev

# Run tests
npm run test

# Build production
npm run build

# Deploy
npm run deploy
```

Welcome to Paragon Heavy - let's build something amazing! 🚛✨