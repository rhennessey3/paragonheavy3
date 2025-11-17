# 🧪 PARAGON HEAVY - TESTING & DEPLOYMENT GUIDE

## Testing Strategy Overview

This guide covers comprehensive testing approaches and deployment procedures for the Paragon Heavy Phase 1 MVP.

---

## 📋 Testing Checklist

### Unit Testing

#### Convex Functions Testing
```typescript
// convex/tests/organizations.test.ts
import { test, expect } from "vitest";
import { api } from "../_generated/api";
import { convexTest } from "convex-test";

test("createOrganization should create org and user profile", async () => {
  const t = convexTest();
  
  const orgId = await t.run(async (ctx) => {
    return await ctx.db.insert("organizations", {
      name: "Test Org",
      type: "shipper",
      clerkOrgId: "org_test123",
      createdBy: "user_test123",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  const org = await t.run(async (ctx) => {
    return await ctx.db.get(orgId);
  });

  expect(org).toMatchObject({
    name: "Test Org",
    type: "shipper",
    clerkOrgId: "org_test123",
  });
});
```

#### Component Testing
```typescript
// components/forms/__tests__/create-load-form.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateLoadForm } from "../create-load-form";
import { ConvexProvider } from "convex/react";
import { convexReactTest } from "convex-test";

describe("CreateLoadForm", () => {
  it("should render all required fields", () => {
    render(
      <ConvexProvider client={mockConvexClient}>
        <CreateLoadForm />
      </ConvexProvider>
    );

    expect(screen.getByLabelText(/load number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/origin address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/destination address/i)).toBeInTheDocument();
  });

  it("should submit form with valid data", async () => {
    const mockCreateLoad = jest.fn();
    
    render(
      <ConvexProvider client={mockConvexClient}>
        <CreateLoadForm />
      </ConvexProvider>
    );

    fireEvent.change(screen.getByLabelText(/load number/i), {
      target: { value: "LD-2024-001" }
    });

    fireEvent.click(screen.getByRole("button", { name: /create load/i }));

    await waitFor(() => {
      expect(mockCreateLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          loadNumber: "LD-2024-001"
        })
      );
    });
  });
});
```

### Integration Testing

#### Authentication Flow Testing
```typescript
// e2e/tests/auth-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("user can sign up, create org, and access dashboard", async ({ page }) => {
    // Sign up
    await page.goto("/sign-up");
    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.fill('[data-testid="name-input"]', "Test User");
    await page.click('[data-testid="sign-up-button"]');

    // Create organization
    await page.waitForURL("/org-selection");
    await page.fill('[data-testid="org-name-input"]', "Test Shipping Co");
    await page.selectOption('[data-testid="org-type-select"]', "shipper");
    await page.click('[data-testid="create-org-button"]');

    // Should redirect to dashboard
    await page.waitForURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Shipper Dashboard");
  });

  test("user without org is redirected to org selection", async ({ page }) => {
    // Sign in without org
    await page.goto("/sign-in");
    await page.fill('[data-testid="email-input"]', "noorg@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="sign-in-button"]');

    // Should redirect to org selection
    await page.waitForURL("/org-selection");
    await expect(page.locator("h1")).toContainText("Welcome to Paragon Heavy");
  });
});
```

#### Multi-Tenant Data Isolation Testing
```typescript
// e2e/tests/multi-tenant.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Multi-Tenant Data Isolation", () => {
  test("organizations cannot access each other's data", async ({ page, context }) => {
    // Create two browser contexts for different users
    const shipperContext = await context.browser().newContext();
    const carrierContext = await context.browser().newContext();

    const shipperPage = await shipperContext.newPage();
    const carrierPage = await carrierContext.newPage();

    // Shipper creates a load
    await shipperPage.goto("/sign-in");
    await shipperLogin(shipperPage, "shipper@example.com");
    await shipperPage.goto("/shipper/loads/create");
    await shipperPage.fill('[data-testid="load-number-input"]', "SHIPPER-LOAD-001");
    await shipperPage.click('[data-testid="create-load-button"]');

    // Carrier should not see shipper's internal loads
    await carrierPage.goto("/sign-in");
    await carrierLogin(carrierPage, "carrier@example.com");
    await carrierPage.goto("/carrier");
    
    // Should only see available loads, not shipper's internal loads
    const loadCards = carrierPage.locator('[data-testid="load-card"]');
    await expect(loadCards).toHaveCount(0); // No loads available yet

    // Shipper assigns load to carrier
    await shipperPage.goto("/shipper");
    await shipperPage.click('[data-testid="assign-load-button"]');
    await shipperPage.click('[data-testid="confirm-assign-button"]');

    // Carrier should now see the load
    await carrierPage.reload();
    await expect(loadCards).toHaveCount(1);
  });
});
```

### End-to-End Testing Scenarios

#### Complete Shipper Workflow
```typescript
// e2e/tests/shipper-workflow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Shipper Complete Workflow", () => {
  test("shipper can create load, assign carrier, and track status", async ({ page }) => {
    // Login as shipper
    await page.goto("/sign-in");
    await shipperLogin(page, "shipper@example.com");

    // Create load
    await page.goto("/shipper/loads/create");
    await page.fill('[data-testid="load-number-input"]', "TEST-LOAD-001");
    await page.fill('[data-testid="origin-address-input"]', "123 Main St, New York, NY 10001");
    await page.fill('[data-testid="destination-address-input"]', "456 Oak Ave, Los Angeles, CA 90210");
    await page.fill('[data-testid="height-input"]', "8");
    await page.fill('[data-testid="width-input"]', "8");
    await page.fill('[data-testid="length-input"]', "40");
    await page.fill('[data-testid="weight-input"]', "40000");
    await page.click('[data-testid="create-load-button"]');

    // Verify load appears in list
    await page.goto("/shipper");
    await expect(page.locator('[data-testid="load-card"]')).toContainText("TEST-LOAD-001");
    await expect(page.locator('[data-testid="load-status"]')).toContainText("created");

    // Assign to carrier
    await page.click('[data-testid="assign-load-button"]');
    await page.click('[data-testid="carrier-select"]');
    await page.click('[data-testid="confirm-assign-button"]');

    // Verify status updated
    await expect(page.locator('[data-testid="load-status"]')).toContainText("carrier_assigned");
  });
});
```

#### Carrier Workflow Testing
```typescript
// e2e/tests/carrier-workflow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Carrier Complete Workflow", () => {
  test("carrier can view available loads, accept, and update status", async ({ page }) => {
    // Login as carrier
    await page.goto("/sign-in");
    await carrierLogin(page, "carrier@example.com");

    // View available loads
    await page.goto("/carrier");
    await expect(page.locator('[data-testid="available-loads-section"]')).toBeVisible();

    // Accept a load
    await page.click('[data-testid="accept-load-button"]');
    await page.click('[data-testid="confirm-accept-button"]');

    // Verify load appears in assigned loads
    await page.goto("/carrier/assigned");
    await expect(page.locator('[data-testid="assigned-load"]')).toBeVisible();

    // Update load status
    await page.click('[data-testid="start-job-button"]');
    await page.click('[data-testid="confirm-start-button"]');

    // Verify status updated
    await expect(page.locator('[data-testid="load-status"]')).toContainText("in_progress");
  });
});
```

---

## 🔍 Manual Testing Checklist

### Authentication & Organization Management
- [ ] User can sign up with valid email and password
- [ ] User can sign in with correct credentials
- [ ] User cannot sign in with incorrect credentials
- [ ] User is redirected to org selection after first login
- [ ] User can create new organization
- [ ] User can select existing organization
- [ ] User can switch between organizations
- [ ] User is logged out correctly
- [ ] Protected routes redirect to sign-in

### Shipper Functionality
- [ ] Shipper can create new load with all required fields
- [ ] Shipper can view all their loads
- [ ] Shipper can edit existing load
- [ ] Shipper can delete load
- [ ] Shipper can assign carrier to load
- [ ] Shipper can view load details
- [ ] Shipper can see carrier information after assignment
- [ ] Shipper can see load status updates

### Carrier Functionality
- [ ] Carrier can view available loads
- [ ] Carrier cannot see loads already assigned
- [ ] Carrier can accept available load
- [ ] Carrier can view their assigned loads
- [ ] Carrier can update load status to "in_progress"
- [ ] Carrier can view load details
- [ ] Carrier cannot see other carriers' assigned loads

### Escort Functionality
- [ ] Escort can view loads (read-only)
- [ ] Escort cannot modify loads
- [ ] Escort can view load details
- [ ] Escort dashboard displays correctly

### Data Isolation & Security
- [ ] Organizations cannot access each other's data
- [ ] User without organization cannot access dashboard
- [ ] API calls are properly authenticated
- [ ] Data filtering works correctly by organization
- [ ] Sensitive data is not exposed in client-side code

### Real-time Updates
- [ ] Load status updates appear in real-time
- [ ] Multiple users see updates simultaneously
- [ ] Connection errors are handled gracefully
- [ ] Optimistic updates work correctly

### UI/UX Testing
- [ ] Responsive design works on mobile
- [ ] Forms show proper validation errors
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Navigation works smoothly
- [ ] Empty states provide clear guidance

---

## 🚀 Deployment Checklist

### Pre-Deployment Preparation

#### Environment Configuration
```bash
# Production environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

CONVEX_DEPLOYMENT=convex-prod-...
NEXT_PUBLIC_CONVEX_URL=https://your-production.convex.cloud

NEXT_PUBLIC_APP_URL=https://paragonheavy.com
```

#### Security Configuration
- [ ] Clerk production application configured
- [ ] CORS settings configured for production domains
- [ ] Environment variables reviewed for sensitive data
- [ ] SSL certificates configured
- [ ] Security headers implemented
- [ ] Rate limiting configured

#### Performance Optimization
- [ ] Images optimized and compressed
- [ ] Bundle size analyzed and optimized
- [ ] Code splitting implemented
- [ ] Caching strategies configured
- [ ] Database indexes optimized
- [ ] CDN configuration verified

### Vercel Deployment Steps

#### 1. Repository Setup
```bash
# Connect GitHub repository to Vercel
# Configure build settings:
# Build Command: npm run build
# Output Directory: .next
# Install Command: npm install
```

#### 2. Environment Variables Configuration
```bash
# Add all production environment variables in Vercel dashboard
# Verify no development values are present
# Test connection to external services
```

#### 3. Deployment Process
```bash
# Trigger deployment
# Monitor build logs for errors
# Verify deployment success
# Test production URL
```

### Convex Production Deployment

#### 1. Production Setup
```bash
# Create production Convex deployment
npx convex deploy --prod

# Verify schema migration
npx convex dashboard

# Check function deployment
npx convex dev --prod
```

#### 2. Data Migration (if needed)
```bash
# Export development data (for testing)
npx convex export --file dev-data.json

# Import to production (careful!)
npx convex import --file prod-data.json
```

#### 3. Monitoring Setup
```bash
# Configure error tracking
# Set up performance monitoring
# Configure alerting
# Test monitoring systems
```

### Post-Deployment Verification

#### Functional Testing
- [ ] All authentication flows work in production
- [ ] Organization creation/selection works
- [ ] Load CRUD operations function correctly
- [ ] Real-time updates work across multiple users
- [ ] Multi-tenant data isolation verified
- [ ] Error handling works correctly

#### Performance Testing
- [ ] Page load times under 2 seconds
- [ ] Real-time updates under 500ms
- [ ] Database queries optimized
- [ ] Mobile performance acceptable
- [ ] No memory leaks detected

#### Security Testing
- [ ] HTTPS enforced everywhere
- [ ] Authentication tokens secure
- [ ] API endpoints protected
- [ ] Data encryption verified
- [ ] No sensitive data in client bundles

#### Monitoring & Analytics
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] User analytics working
- [ ] Uptime monitoring set up
- [ ] Alert notifications configured

---

## 📊 Production Monitoring

### Key Metrics to Monitor

#### Application Performance
- Page load time
- Time to interactive
- API response times
- Real-time update latency
- Error rates

#### Business Metrics
- User signup conversion
- Organization creation rate
- Load creation frequency
- Carrier acceptance rate
- Load completion time

#### System Health
- Server uptime
- Database performance
- Convex function execution time
- Memory usage
- CPU utilization

### Monitoring Tools Setup

#### Vercel Analytics
```bash
# Enable Vercel Analytics
# Configure custom events
# Set up conversion tracking
# Monitor performance metrics
```

#### Convex Monitoring
```bash
# Access Convex dashboard
# Monitor function performance
# Track database queries
# Set up alerts for errors
```

#### Error Tracking
```typescript
// Configure error tracking
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Alert Configuration

#### Critical Alerts
- Application downtime
- Authentication failures
- Database connection issues
- Security incidents

#### Warning Alerts
- Performance degradation
- High error rates
- Unusual user behavior patterns
- Resource utilization spikes

---

## 🔄 Rollback Plan

### Immediate Rollback Triggers
- Authentication system failure
- Data isolation breach
- Critical functionality broken
- Security vulnerability discovered
- Performance degradation > 50%

### Rollback Procedures
```bash
# Vercel rollback
vercel rollback [deployment-url]

# Convex rollback
npx convex deploy --previous

# Database rollback (if needed)
npx convex import --file backup-data.json
```

### Communication Plan
- Notify development team immediately
- Inform stakeholders of impact
- Update status page for users
- Document incident and resolution

---

## 📝 Documentation Requirements

### Technical Documentation
- [ ] API documentation updated
- [ ] Database schema documented
- [ ] Deployment procedures documented
- [ ] Monitoring setup documented
- [ ] Security procedures documented

### User Documentation
- [ ] User guide created
- [ ] Onboarding instructions
- [ ] FAQ section
- [ ] Support contact information
- [ ] Video tutorials (optional)

This comprehensive testing and deployment guide ensures the Paragon Heavy Phase 1 MVP is production-ready with proper quality assurance and monitoring in place.