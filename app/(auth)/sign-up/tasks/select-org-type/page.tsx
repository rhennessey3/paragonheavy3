"use client";

import { useState } from "react";
import { useUser, useOrganizationList } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";

const createOrgTypeSchema = z.object({
  type: z.enum(["shipper", "carrier", "escort"]),
});

type CreateOrgTypeValues = z.infer<typeof createOrgTypeSchema>;

export default function SelectOrgTypePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { setActive } = useOrganizationList();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  

  // Get organization name from URL parameter
  const orgName = searchParams.get('name') || '';

  // Add logging for page load and state
  console.log("🏢 SelectOrgType: Page loaded", {
    isUserLoaded,
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      fullName: user.fullName
    } : null,
    orgName,
    searchParams: Object.fromEntries(searchParams.entries()),
    timestamp: new Date().toISOString()
  });

  // Add logging for URL parameter parsing
  console.log("🔍 SelectOrgType: URL parameter analysis", {
    rawSearchParams: searchParams.toString(),
    orgNameParam: searchParams.get('name'),
    orgNameDecoded: orgName,
    hasOrgName: !!orgName,
    timestamp: new Date().toISOString()
  });

  const form = useForm<CreateOrgTypeValues>({
    resolver: zodResolver(createOrgTypeSchema),
    defaultValues: {
      type: "shipper",
    },
  });


  if (!isUserLoaded) {
    console.log("⏳ SelectOrgType: User not loaded yet, showing loading...");
    return <div>Loading user data...</div>;
  }

  if (!user) {
    console.log("❌ SelectOrgType: No user found, this should not happen after sign-up");
    return <div>Error: No user found. Please try signing up again.</div>;
  }

  // If no organization name provided, redirect back to name entry
  if (!orgName) {
    console.log("⚠️ SelectOrgType: No organization name found, redirecting back to create-org-name", {
      orgName,
      searchParams: searchParams.toString(),
      currentUrl: window.location.href,
      timestamp: new Date().toISOString()
    });
    console.log("🔄 SelectOrgType: About to redirect to create-org-name");
    router.push('/sign-up/tasks/create-org-name');
    return <div>Redirecting...</div>;
  }

  console.log("✅ SelectOrgType: All checks passed, rendering form", {
    orgName,
    currentUrl: window.location.href,
    searchParams: searchParams.toString(),
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
            Organization: <span className="font-medium">{orgName}</span>
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
                    orgName,
                    user: user ? {
                      id: user.id,
                      email: user.primaryEmailAddress?.emailAddress,
                      existingOrgs: user.organizationMemberships?.length || 0
                    } : null,
                    timestamp: new Date().toISOString()
                  });
                  
                  setIsCreating(true);
                  
                  try {
                    
                    // Find the user's organization
                    
                    
                    // Call onboarding-complete API with orgName and orgType
                    console.log("🎯 SelectOrgType: Calling onboarding-complete API...", {
                      orgName,
                      orgType: data.type,
                      timestamp: new Date().toISOString()
                    });
                    
                    const response = await fetch('/api/onboarding-complete', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        orgName,
                        orgType: data.type,
                      }),
                    });
                    
                    if (!response.ok) {
                      console.error("❌ SelectOrgType: Failed to complete onboarding", {
                        status: response.status,
                        statusText: response.statusText
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
            </CardContent>
        </Card>
      </div>
    </div>
  );
}