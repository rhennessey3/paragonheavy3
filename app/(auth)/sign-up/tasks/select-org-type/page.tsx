"use client";

import { useState, Suspense } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const createOrgTypeSchema = z.object({
  type: z.enum(["shipper", "carrier", "escort"]),
});

type CreateOrgTypeValues = z.infer<typeof createOrgTypeSchema>;

function SelectOrgTypePageContent() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  console.log("🏢 SelectOrgType: Page loaded", {
    isUserLoaded,
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      fullName: user.fullName
    } : null,
    isOrgLoaded,
    organization: organization ? {
      id: organization.id,
      name: organization.name,
    } : null,
    timestamp: new Date().toISOString()
  });

  const form = useForm<CreateOrgTypeValues>({
    resolver: zodResolver(createOrgTypeSchema),
    defaultValues: {
      type: "shipper",
    },
  });

  if (!isUserLoaded || !isOrgLoaded) {
    console.log("⏳ SelectOrgType: Loading user or organization data...");
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log("❌ SelectOrgType: No user found, this should not happen after sign-up");
    return <div>Error: No user found. Please try signing up again.</div>;
  }

  // Check if we have an active organization
  const activeOrg = organization;

  // If no active organization, check if we have any memberships and set the first one as active
  if (!activeOrg && user?.organizationMemberships?.length > 0) {
    const firstOrg = user.organizationMemberships[0].organization;
    console.log("🔄 SelectOrgType: No active organization, but found membership. Setting active...", {
      orgId: firstOrg.id,
      orgName: firstOrg.name
    });

    // We can't synchronously set it here and expect it to be ready immediately for rendering
    // But we can use this org data for the form rendering if we want, or wait.
    // Better to show a loading state while we switch.
    // However, useOrganization doesn't expose setActive directly, useSessionList or useOrganizationList does.
    // But usually Clerk handles this.

    // Let's just use the first org from memberships for rendering if active is null
    // This avoids the redirect loop.
  } else if (!activeOrg) {
    console.log("⚠️ SelectOrgType: No organization found and no memberships, redirecting back to create-organization", {
      timestamp: new Date().toISOString(),
      currentUrl: window.location.href,
      clerkLoaded: { isUserLoaded, isOrgLoaded }
    });

    router.push('/sign-up/tasks/create-organization');
    return <div>Redirecting...</div>;
  }

  const effectiveOrg = activeOrg || (user?.organizationMemberships?.[0]?.organization);

  if (!effectiveOrg) {
    return <div>Redirecting...</div>;
  }

  console.log("✅ SelectOrgType: All checks passed, rendering form", {
    orgId: effectiveOrg.id,
    orgName: effectiveOrg.name,
    currentUrl: window.location.href,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Progress Indicator */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">1</div>
            <div className="w-8 h-0.5 bg-border"></div>
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</div>
          </div>
          <p className="text-sm text-muted-foreground">Step 2 of 2</p>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Select Organization Type</h1>
          <p className="mt-2 text-muted-foreground">
            Organization: <span className="font-medium">{effectiveOrg.name}</span>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What type of organization is this?</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(async (data) => {
                console.log("🚀 SelectOrgType: Form submission started", {
                  data,
                  orgId: effectiveOrg.id,
                  orgName: effectiveOrg.name,
                  user: user ? {
                    id: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                  } : null,
                  timestamp: new Date().toISOString()
                });

                setIsUpdating(true);

                try {
                  // Call onboarding-complete API with orgId and orgType
                  console.log("🎯 SelectOrgType: Calling onboarding-complete API...", {
                    orgId: effectiveOrg.id,
                    orgName: effectiveOrg.name,
                    orgType: data.type,
                    timestamp: new Date().toISOString()
                  });

                  const response = await fetch('/api/onboarding-complete', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      orgId: effectiveOrg.id,
                      orgName: effectiveOrg.name,
                      orgType: data.type,
                    }),
                  });

                  console.log("🎯 SelectOrgType: API response received", {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    headers: Object.fromEntries(response.headers.entries()),
                    timestamp: new Date().toISOString()
                  });

                  if (!response.ok) {
                    console.error("❌ SelectOrgType: Failed to complete onboarding", {
                      status: response.status,
                      statusText: response.statusText,
                      body: await response.text()
                    });
                    throw new Error("Failed to complete onboarding");
                  }

                  // The API will handle redirect, but if it doesn't, we'll handle it here
                  if (response.redirected) {
                    console.log("✅ SelectOrgType: API redirected successfully");
                    window.location.href = response.url;
                    return;
                  }

                  // If no redirect from API, manually redirect to dashboard
                  console.log("✅ SelectOrgType: Onboarding completed successfully, redirecting to dashboard");
                  window.location.href = '/dashboard';
                  return;

                } catch (error) {
                  console.error("❌ SelectOrgType: Organization type update failed", error);
                  toast({
                    title: "Error",
                    description: "Failed to update organization type. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsUpdating(false);
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

                <Button type="submit" disabled={isUpdating} className="w-full">
                  {isUpdating ? "Updating Organization..." : "Complete Setup"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SelectOrgTypePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SelectOrgTypePageContent />
    </Suspense>
  );
}