"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

const createOrgNameSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Organization name must be less than 100 characters"),
});

type CreateOrgNameValues = z.infer<typeof createOrgNameSchema>;

export default function CreateOrgNamePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add logging for user state
  console.log("👤 CreateOrgName: User state", {
    isUserLoaded,
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      fullName: user.fullName
    } : null,
    timestamp: new Date().toISOString()
  });

  const form = useForm<CreateOrgNameValues>({
    resolver: zodResolver(createOrgNameSchema),
    defaultValues: {
      name: user?.fullName ? `${user.fullName}'s Organization` : "",
    },
  });

  // Add form state logging
  console.log("📝 CreateOrgName: Form state", {
    formState: form.formState,
    defaultValues: form.formState.defaultValues,
    errors: form.formState.errors,
    timestamp: new Date().toISOString()
  });

  const handleSubmit = async (data: CreateOrgNameValues) => {
    console.log("🚀 CreateOrgName: Form submission started", {
      data,
      user: user ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        existingOrgs: user.organizationMemberships?.length || 0
      } : null,
      timestamp: new Date().toISOString()
    });
    
    setIsSubmitting(true);
    console.log("🔄 CreateOrgName: isSubmitting set to true");
    
    try {
      // Check if user already has organizations before redirecting
      const existingOrgs = user?.organizationMemberships || [];
      console.log("🔍 CreateOrgName: Checking existing organizations before redirect", {
        existingOrgsCount: existingOrgs.length,
        existingOrgs: existingOrgs.map(org => ({
          id: org.organization.id,
          name: org.organization.name,
          role: org.role
        })),
        timestamp: new Date().toISOString()
      });
      
      // IMMEDIATELY redirect to organization type selection with name as URL parameter
      // Don't wait for any async operations or Clerk responses
      const targetUrl = `/sign-up/tasks/select-org-type?name=${encodeURIComponent(data.name)}`;
      console.log("🔄 CreateOrgName: IMMEDIATE navigation to select-org-type", {
        url: targetUrl,
        isSubmittingBeforeNav: isSubmitting,
        userHasExistingOrgs: existingOrgs.length > 0
      });
      
      // Use window.location for immediate navigation to bypass any Clerk redirects
      console.log("🌐 CreateOrgName: About to call window.location.href");
      window.location.href = targetUrl;
      
      console.log("✅ CreateOrgName: Navigation initiated successfully");
      return; // Exit immediately to prevent any further processing
    } catch (error) {
      console.error("❌ CreateOrgName: Navigation failed", error);
      console.log("🔄 CreateOrgName: Attempting router.push fallback");
      // Fallback to router.push if window.location fails
      try {
        await router.push(`/sign-up/tasks/select-org-type?name=${encodeURIComponent(data.name)}`);
        console.log("✅ CreateOrgName: Router fallback succeeded");
      } catch (routerError) {
        console.error("❌ CreateOrgName: Router fallback also failed", routerError);
      }
    } finally {
      console.log("🔄 CreateOrgName: Finally block - setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  if (!isUserLoaded) {
    console.log("⏳ CreateOrgName: User not loaded yet, showing loading...");
    return <div>Loading user data...</div>;
  }

  if (!user) {
    console.log("❌ CreateOrgName: No user found, this should not happen after sign-up");
    return <div>Error: No user found. Please try signing up again.</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Progress Indicator */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</div>
            <div className="w-8 h-0.5 bg-border"></div>
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">2</div>
          </div>
          <p className="text-sm text-muted-foreground">Step 1 of 2</p>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Create Your Organization</h1>
          <p className="mt-2 text-muted-foreground">
            Let's start with your organization name
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Organization Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your organization name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Continuing..." : "Continue"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}