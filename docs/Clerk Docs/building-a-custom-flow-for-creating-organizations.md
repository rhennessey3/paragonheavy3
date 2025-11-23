# Building a Custom Flow for Creating Organizations

> **⚠️ Warning**
> 
> This guide is for users who want to build a custom flow. To use a prebuilt UI, use the Account Portal pages or prebuilt components.

This guide demonstrates how to use Clerk's API to build a custom flow for creating Organizations, with examples ranging from simple implementations to complex multi-step workflows.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Simple Implementation](#simple-implementation)
3. [Advanced Multi-Step Implementation](#advanced-multi-step-implementation)
4. [Error Handling](#error-handling)
5. [Integration Patterns](#integration-patterns)
6. [File Structure](#file-structure)
7. [Best Practices](#best-practices)

## Prerequisites

Before implementing custom organization creation, ensure you have:

- Clerk authentication set up in your Next.js application
- The `@clerk/nextjs` package installed
- User authentication flow implemented
- Organizations enabled in your Clerk dashboard

```bash
npm install @clerk/nextjs
```

## Simple Implementation

The following example uses the `useOrganizationList()` hook to access the `createOrganization()` method. This method is used to create a new Organization with the provided name.

This example is written for Next.js App Router but can be adapted for any React-based framework.

### Basic Component Example

```typescript
// app/components/CreateOrganization.tsx
'use client'

import { useOrganizationList } from '@clerk/nextjs'
import { FormEventHandler, useState } from 'react'

export default function CreateOrganization() {
  const { isLoaded, createOrganization } = useOrganizationList()
  const [organizationName, setOrganizationName] = useState('')

  if (!isLoaded) return null

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    createOrganization({ name: organizationName })
      .then((res) => {
        console.log('Organization created:', res)
      })
      .catch((err) => {
        // See https://clerk.com/docs/guides/development/custom-flows/error-handling
        // for more info on error handling
        console.error(JSON.stringify(err, null, 2))
      })
    setOrganizationName('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="organizationName"
        value={organizationName}
        onChange={(e) => setOrganizationName(e.currentTarget.value)}
        placeholder="Enter organization name"
      />
      <button type="submit">Create organization</button>
    </form>
  )
}
```

## Advanced Multi-Step Implementation

For more complex workflows, such as collecting organization type and additional metadata, consider a multi-step approach. This pattern is used in production applications and provides better user experience.

### Step 1: Using Clerk's CreateOrganization Component

Instead of building a custom form, you can use Clerk's prebuilt `CreateOrganization` component for a polished, accessible organization creation experience.

```typescript
// app/(auth)/sign-up/tasks/create-organization/page.tsx
"use client";

import { CreateOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CreateOrganizationPage() {
  const router = useRouter();

  useEffect(() => {
    console.log("🏢 CreateOrganizationPage: Page loaded", {
      timestamp: new Date().toISOString(),
      currentUrl: window.location.href
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Create Your Organization</h1>
          <p className="mt-2 text-muted-foreground">
            Let's get your organization set up
          </p>
        </div>
        
        <div className="bg-card rounded-lg shadow-lg p-6">
          <CreateOrganization
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm normal-case w-full",
                card: "shadow-none border-0 p-0",
                headerTitle: "text-2xl font-semibold text-foreground",
                headerSubtitle: "text-muted-foreground",
                formFieldLabel: "text-sm font-medium text-foreground",
                formFieldInput: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                footer: "hidden", // Hide Clerk's footer since we have our own flow
              },
              variables: {
                colorPrimary: "hsl(var(--primary))",
                colorBackground: "hsl(var(--background))",
                colorForeground: "hsl(var(--foreground))",
                colorInput: "hsl(var(--background))",
                colorInputText: "hsl(var(--foreground))",
              },
            }}
            afterCreateOrganizationUrl="/sign-up/tasks/select-org-type"
          />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            After creating your organization, you'll select type
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Organization Type Selection

After the organization is created using Clerk's component, the user is redirected to select the organization type. This page updates the organization's metadata with the selected type.

```typescript
// app/(auth)/sign-up/tasks/select-org-type/page.tsx
"use client";

import { useState } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";

const createOrgTypeSchema = z.object({
  type: z.enum(["shipper", "carrier", "escort"]),
});

type CreateOrgTypeValues = z.infer<typeof createOrgTypeSchema>;

export default function SelectOrgTypePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateOrgTypeValues>({
    resolver: zodResolver(createOrgTypeSchema),
    defaultValues: {
      type: "shipper",
    },
  });

  if (!isUserLoaded || !isOrgLoaded) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return <div>Error: No user found. Please try signing up again.</div>;
  }

  if (!organization) {
    // If no organization, redirect back to organization creation
    router.push('/sign-up/tasks/create-organization');
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Select Organization Type</h1>
          <p className="mt-2 text-muted-foreground">
            Organization: <span className="font-medium">{organization.name}</span>
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (data) => {
            setIsCreating(true);
            
            try {
              // Call onboarding-complete API with orgId, orgName and orgType
              const response = await fetch('/api/onboarding-complete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orgId: organization.id,
                  orgName: organization.name,
                  orgType: data.type,
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to complete onboarding");
              }
              
              toast({
                title: "Organization Created",
                description: "Your organization has been set up successfully!",
              });
              
              // Redirect to dashboard
              window.location.href = '/dashboard';
            } catch (error) {
              console.error("Organization type update failed", error);
              toast({
                title: "Error",
                description: "Failed to update organization type. Please try again.",
                variant: "destructive",
              });
            } finally {
              setIsCreating(false);
            }
          })} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="shipper">Shipper</SelectItem>
                      <SelectItem value="carrier">Carrier</SelectItem>
                      <SelectItem value="escort">Escort / Pilot Car</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? "Updating Organization..." : "Complete Setup"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
```

### API Route for Organization Metadata Update

Since the organization is already created by Clerk's component, this API route updates the organization's metadata and creates the corresponding record in your database.

```typescript
// app/api/onboarding-complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient, getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, orgName, orgType } = await request.json();
    
    if (!orgId || !orgName || !orgType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update organization metadata in Clerk
    const clerk = await clerkClient();
    const clerkOrganization = await clerk.organizations.updateOrganization(orgId, {
      publicMetadata: {
        type: orgType,
      },
    });

    // Create organization in your database (Convex example)
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const convexOrgId = await convex.mutation(api.organizations.createOrganization, {
      name: orgName,
      type: orgType,
      clerkOrgId: clerkOrganization.id,
      createdBy: userId,
    });

    // Set onboarding complete cookie
    const response = NextResponse.json({
      success: true,
      organizationId: clerkOrganization.id,
      convexOrgId
    });
    
    response.cookies.set('onboarding_complete', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Onboarding completion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Error Handling

### Common Error Scenarios

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  try {
    await createOrganization({ name: organizationName });
    // Handle success
  } catch (error) {
    if (error.errors) {
      // Handle Clerk validation errors
      error.errors.forEach((err: any) => {
        console.error(`${err.code}: ${err.message}`);
      });
    } else if (error.status === 429) {
      // Handle rate limiting
      console.error('Too many requests. Please try again later.');
    } else {
      // Handle other errors
      console.error('Failed to create organization:', error);
    }
  }
};
```

### Toast Notifications for Better UX

```typescript
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();

// In your error handling:
toast({
  title: "Error",
  description: "Failed to create organization. Please try again.",
  variant: "destructive",
});

// In your success handling:
toast({
  title: "Success",
  description: "Organization created successfully!",
});
```

## Integration Patterns

### 1. Middleware Protection

```typescript
// middleware.ts
import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  afterAuth(auth, req) {
    // Handle organization-specific routes
    if (req.nextUrl.pathname.startsWith('/dashboard') && !auth.orgId) {
      const orgSelection = new URL('/sign-up/tasks/choose-organization', req.url);
      return NextResponse.redirect(orgSelection);
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### 2. Organization Context

```typescript
// hooks/useOrganization.ts
import { useOrganization } from '@clerk/nextjs';

export function useCurrentOrganization() {
  const { organization, isLoaded } = useOrganization();
  
  return {
    organization,
    isLoaded,
    isAdmin: organization?.memberships?.some(
      membership => membership.role === 'admin'
    ),
  };
}
```

## File Structure

For a typical Next.js application using Clerk's CreateOrganization component:

```
app/
├── (auth)/
│   └── sign-up/
│       └── tasks/
│           ├── create-organization/
│           │   └── page.tsx          # Uses Clerk's CreateOrganization component
│           ├── select-org-type/
│           │   └── page.tsx          # Updates organization metadata
│           └── choose-organization/
│               └── page.tsx
├── api/
│   └── onboarding-complete/
│       └── route.ts                  # Updates organization metadata and creates database record
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   └── select.tsx
│   └── organization/
│       └── OrganizationSelector.tsx
├── layout.tsx                        # Updated ClerkProvider configuration
├── middleware.ts                     # Updated route protection
└── dashboard/
    └── page.tsx
```

## Best Practices

1. **Validation**: Always validate organization names and types on both client and server
2. **Error Handling**: Provide clear error messages to users
3. **Loading States**: Show loading indicators during async operations
4. **Accessibility**: Ensure forms are accessible with proper labels and ARIA attributes
5. **Security**: Validate all inputs and implement proper rate limiting
6. **Testing**: Test organization creation flows thoroughly
7. **Analytics**: Track organization creation events for business insights

## Related Documentation

- [Clerk Organizations API](https://clerk.com/docs/reference/backend/organizations)
- [Error Handling Guide](https://clerk.com/docs/guides/development/custom-flows/error-handling)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

---

This documentation provides a comprehensive guide for building custom organization creation flows, from simple implementations to complex multi-step workflows with proper error handling and integration patterns.
