# Sign-Up Flow Implementation Plan

## Problem Analysis

The current sign-up flow has a critical timing issue:
- Users sign up → middleware sees `userId: yes, orgId: no` → redirects to create-org-name
- create-org-name just passes name as URL parameter to select-org-type
- select-org-type creates organization via API route
- **But middleware checks for orgId immediately, before webhooks sync to Convex**
- This causes redirect loops because session claims don't have orgId yet

## Solution: Synchronous Flow

### Step A: Sign up → verify email (✅ Already working)
- Middleware sees: `userId: yes, orgId: no`
- Redirect to `/sign-up/tasks/create-org-name`

### Step B: Enter org name (🔄 NEEDS CHANGES)
**Current**: Just passes name as URL parameter
**New**: 
- Use Clerk JS SDK to create org immediately
- Get `org.id` instantly  
- Call Convex mutation to store org metadata
- Store `orgId` in session claim via `user.update()`
- Use `setActive()` to switch to organization
- Redirect to `/sign-up/tasks/select-org-type`

### Step C: Select org type (🔄 NEEDS CHANGES)
**Current**: Creates organization from scratch
**New**:
- Organization already exists from Step B
- Just update orgType in Convex
- Optionally update Clerk org metadata
- Mark onboarding complete in Convex
- Redirect to `/dashboard`

## Detailed Implementation Changes

### 1. Update create-org-name page (`app/(auth)/sign-up/tasks/create-org-name/page.tsx`)

**Key Changes:**
- Import `useOrganizationList` and `useMutation` from Convex
- Replace current `handleSubmit` to:
  ```typescript
  const handleSubmit = async (data: CreateOrgNameValues) => {
    setIsSubmitting(true);
    
    try {
      // Create organization immediately using Clerk JS SDK
      const clerk = await clerkClient();
      const organization = await clerk.organizations.createOrganization({
        name: data.name,
        createdBy: user!.id,
        publicMetadata: {
          type: "shipper", // Default type, will be updated in next step
        },
      });

      // Store in Convex immediately
      const convexOrgId = await createOrganization({
        name: data.name,
        type: "shipper", // Default type
        clerkOrgId: organization.id,
        createdBy: user!.id,
      });

      // Create user profile
      await createUserProfile({
        clerkUserId: user!.id,
        clerkOrgId: organization.id,
        orgId: convexOrgId!,
        email: user!.primaryEmailAddress?.emailAddress || "",
        name: user!.fullName || user!.username || "",
        role: "admin",
      });

      // Update user metadata with primary org
      await user!.update({
        unsafeMetadata: {
          primaryOrgId: organization.id,
        },
      });

      // Switch to organization
      if (setActive) {
        await setActive({ organization: organization.id });
      }

      // Redirect to select-org-type
      router.push('/sign-up/tasks/select-org-type');
    } catch (error) {
      console.error("Error creating organization:", error);
      // Handle error...
    } finally {
      setIsSubmitting(false);
    }
  };
  ```

### 2. Update select-org-type page (`app/(auth)/sign-up/tasks/select-org-type/page.tsx`)

**Key Changes:**
- Remove organization creation logic
- Assume organization already exists
- Just update organization type:
  ```typescript
  const handleUpdateOrganizationType = async (data: CreateOrgTypeValues) => {
    if (!user || !orgId) return;

    setIsCreating(true);
    
    try {
      // Update organization type in Convex
      await updateOrganizationType({
        clerkOrgId: orgId,
        type: data.type,
      });

      // Optionally update Clerk organization metadata
      await fetch('/api/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          type: data.type,
        }),
      });

      // Mark onboarding complete
      await markOnboardingComplete({
        clerkUserId: user.id,
        clerkOrgId: orgId,
      });

      toast({
        title: "Success",
        description: "Organization setup completed!",
      });

      router.push('/dashboard');
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: "Failed to update organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  ```

### 3. Add Convex mutations (`convex/organizations.ts`)

**Add these mutations:**
```typescript
export const updateOrganizationType = mutation({
  args: {
    clerkOrgId: v.string(),
    type: v.union(v.literal("shipper"), v.literal("carrier"), v.literal("escort")),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (!organization) {
      throw new Error("Organization not found");
    }

    await ctx.db.patch(organization._id, {
      type: args.type,
      updatedAt: Date.now(),
    });

    return organization._id;
  },
});

export const markOnboardingComplete = mutation({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    
    if (session.sub !== args.clerkUserId) {
      throw new Error("Unauthorized");
    }

    // Update user profile to mark onboarding complete
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        onboardingCompleted: true,
        lastActiveAt: Date.now(),
      });
    }

    return true;
  },
});
```

### 4. Update schema (`convex/schema.ts`)

**Add onboardingCompleted field to userProfiles:**
```typescript
userProfiles: defineTable({
  // ... existing fields ...
  onboardingCompleted: v.boolean(),
})
// ... existing indexes ...
```

### 5. Update middleware (`middleware.ts`)

**Minor updates to handle edge cases:**
- Add better logging for debugging
- Ensure select-org-type is accessible even with orgId
- Handle race conditions gracefully

### 6. Remove webhook dependencies

**Files to check and update:**
- Remove organization creation from webhook handlers
- Keep webhooks only for sync purposes, not onboarding flow

## Testing Strategy

1. **Test Step B**: Verify organization creation is immediate
2. **Test Step C**: Verify organization type updates work
3. **Test middleware**: Verify no redirect loops occur
4. **Test session**: Verify orgId is available immediately after Step B
5. **End-to-end**: Test complete flow from sign-up to dashboard

## Key Benefits

✅ **Synchronous**: No more waiting for webhooks
✅ **Immediate**: orgId available in session claims instantly  
✅ **Reliable**: No race conditions or redirect loops
✅ **User-friendly**: Smooth progression through onboarding steps

## Implementation Order

1. Update Convex schema and add new mutations
2. Update create-org-name page (Step B)
3. Update select-org-type page (Step C) 
4. Test middleware flow
5. Remove webhook dependencies
6. End-to-end testing

This implementation follows the exact requirements specified:
- Step B creates org immediately using Clerk JS SDK
- Convex mutation stores metadata synchronously
- Session claims updated immediately
- Step C just updates type and marks onboarding complete
- No reliance on webhooks for onboarding flow