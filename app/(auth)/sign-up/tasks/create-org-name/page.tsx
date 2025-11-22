"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useOrganizationList } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

const createOrgNameSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Organization name must be less than 100 characters"),
});

type CreateOrgNameValues = z.infer<typeof createOrgNameSchema>;

export default function CreateOrgNamePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { setActive } = useOrganizationList();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const createOrganization = useMutation(api.organizations.createOrganization);
  const createUserProfile = useMutation(api.users.createUserProfile);

  const form = useForm<CreateOrgNameValues>({
    resolver: zodResolver(createOrgNameSchema),
    defaultValues: {
      name: user?.fullName ? `${user.fullName}'s Organization` : "",
    },
  });

  // Simplified logging - only log when form state actually changes
  useEffect(() => {
    if (form.formState.isSubmitted) {
      console.log("📝 CreateOrgName: Form submitted", {
        values: form.getValues(),
        timestamp: new Date().toISOString()
      });
    }
  }, [form.formState.isSubmitted]);

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
    
    if (!user) {
      console.error("❌ CreateOrgName: No user found");
      return;
    }
    
    setIsSubmitting(true);
    console.log("🔄 CreateOrgName: isSubmitting set to true");
    
    try {
      // Check if user already has organizations
      const existingOrgs = user.organizationMemberships || [];
      console.log("🔍 CreateOrgName: Checking existing organizations", {
        existingOrgsCount: existingOrgs.length,
        existingOrgs: existingOrgs.map(org => ({
          id: org.organization.id,
          name: org.organization.name,
          role: org.role
        })),
        timestamp: new Date().toISOString()
      });
      
      // Allow users to proceed even if they have existing organizations
      // This prevents redirect loops and allows for testing/onboarding flexibility
      if (existingOrgs.length > 0) {
        console.log("ℹ️ CreateOrgName: User already has organizations, but allowing to proceed for onboarding flexibility");
        toast({
          title: "Existing Organizations Found",
          description: "You have existing organizations, but we'll proceed with onboarding.",
          variant: "default",
        });
      }
      
      // IMPORTANT: Do NOT create organization here - just pass name to next step
      // Organization will be created in select-org-type with both name and type
      console.log("📝 CreateOrgName: About to show toast");
      toast({
        title: "Organization Name Set",
        description: "Proceeding to select organization type.",
      });
      
      // Redirect to select-org-type with organization name as parameter
      const targetUrl = `/sign-up/tasks/select-org-type?name=${encodeURIComponent(data.name)}`;
      console.log("🔄 CreateOrgName: Navigation to select-org-type", {
        url: targetUrl,
        orgName: data.name,
        note: "Passing name to next step where organization will be created with type",
        encodedName: encodeURIComponent(data.name),
        decodedName: decodeURIComponent(encodeURIComponent(data.name)),
        timestamp: new Date().toISOString()
      });
      
      console.log("🔄 CreateOrgName: About to call router.push");
      const pushResult = await router.push(targetUrl);
      console.log("🔄 CreateOrgName: router.push completed", {
        result: pushResult,
        timestamp: new Date().toISOString()
      });
      
      // Add a small delay to see if navigation happens
      setTimeout(() => {
        console.log("⏰ CreateOrgName: 500ms after router.push", {
          currentUrl: window.location.href,
          timestamp: new Date().toISOString()
        });
      }, 500);
      
      console.log("✅ CreateOrgName: Navigation completed successfully");
      return;
    } catch (error) {
      console.error("❌ CreateOrgName: Organization creation failed", error);
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
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

  // Allow users to proceed even if they have existing organizations
  // This prevents redirect loops and allows for testing/onboarding flexibility
  const existingOrgs = user.organizationMemberships || [];
  
  // Simple check - no toast to prevent re-renders
  if (existingOrgs.length > 0) {
    console.log("ℹ️ CreateOrgName: User already has organizations, but allowing to proceed", {
      existingOrgsCount: existingOrgs.length,
      timestamp: new Date().toISOString()
    });
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
                  {isSubmitting ? "Creating Organization..." : "Create Organization"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}