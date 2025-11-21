"use client";

import { useState } from "react";
import { useUser, useOrganizationList } from "@clerk/nextjs";
import { useMutation } from "convex/react";
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
  
  const createOrganization = useMutation(api.organizations.createOrganization);
  const createUserProfile = useMutation(api.users.createUserProfile);

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

  const handleCreateOrganization = async (data: CreateOrgTypeValues) => {
    if (!user) return;

    setIsCreating(true);
    console.log("🚀 Starting organization creation process", {
      orgName,
      type: data.type,
      timestamp: new Date().toISOString(),
      userId: user.id,
    });
    
    try {
      // Check if user already has organizations
      console.log("🔍 User's current organization memberships:", {
        memberships: user.organizationMemberships,
        unsafeMetadata: user.unsafeMetadata
      });
      
      // Check if user already has organizations and handle appropriately
      const userOrgs = user.organizationMemberships || [];
      console.log("🔍 ORG CHECK: Analyzing user's existing organizations", {
        existingOrgsCount: userOrgs.length,
        existingOrgs: userOrgs.map(org => ({
          id: org.organization.id,
          name: org.organization.name,
          role: org.role,
          publicMetadata: org.organization.publicMetadata,
          hasType: !!(org.organization.publicMetadata as any)?.type
        })),
        userUnsafeMetadata: user.unsafeMetadata,
        timestamp: new Date().toISOString()
      });
      
      if (userOrgs.length > 0) {
        // Check if any existing organization is missing a type
        const orgWithoutType = userOrgs.find(org =>
          !(org.organization.publicMetadata as any)?.type
        );
        
        if (orgWithoutType) {
          console.log("🔧 FOUND ORG WITHOUT TYPE - Allowing type selection for existing org", {
            orgId: orgWithoutType.organization.id,
            orgName: orgWithoutType.organization.name,
            currentMetadata: orgWithoutType.organization.publicMetadata,
            timestamp: new Date().toISOString()
          });
          
          // Update org name to match existing organization
          // Don't redirect - allow user to set the type
          console.log("✅ PROCEEDING WITH TYPE SELECTION FOR EXISTING ORG", {
            timestamp: new Date().toISOString()
          });
        } else {
          console.log("⚠️ USER ALREADY HAS COMPLETE ORGS - Redirecting to dashboard", {
            existingCount: userOrgs.length,
            existingOrgs: userOrgs.map(org => ({
              id: org.organization.id,
              name: org.organization.name,
              role: org.role,
              hasType: !!(org.organization.publicMetadata as any)?.type
            })),
            redirectTarget: '/dashboard',
            timestamp: new Date().toISOString()
          });
          
          toast({
            title: "Organization Already Exists",
            description: "You already have an organization. Redirecting to dashboard.",
            variant: "destructive",
          });
          setIsCreating(false);
          router.push('/dashboard');
          return;
        }
      } else {
        console.log("✅ USER HAS NO EXISTING ORGS - Proceeding with organization creation", {
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if we need to create a new org or update existing one
      const orgWithoutType = userOrgs.find(org =>
        !(org.organization.publicMetadata as any)?.type
      );
      
      let clerkOrg;
      
      if (orgWithoutType) {
        console.log("🔧 Updating existing organization in Clerk...", {
          orgId: orgWithoutType.organization.id,
          orgName: orgWithoutType.organization.name,
          newType: data.type,
          timestamp: new Date().toISOString()
        });
        
        // Update existing organization using API route instead of client
        const updateResponse = await fetch('/api/organizations', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: orgWithoutType.organization.id,
            type: data.type,
          }),
        });

        console.log("📋 Clerk update API response status:", updateResponse.status);
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error("❌ Clerk update API error:", errorText);
          throw new Error(`Failed to update organization in Clerk: ${errorText}`);
        }

        clerkOrg = await updateResponse.json();
        console.log("✅ Clerk organization updated:", {
          id: clerkOrg.id,
          name: clerkOrg.name,
          type: (clerkOrg.publicMetadata as any)?.type,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log("📝 Creating new organization in Clerk...", {
          name: orgName,
          type: data.type,
          timestamp: new Date().toISOString()
        });
        
        // Create new organization
        const response = await fetch('/api/organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: orgName,
            type: data.type,
          }),
        });

        console.log("📋 Clerk API response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Clerk API error:", errorText);
          throw new Error(`Failed to create organization in Clerk: ${errorText}`);
        }

        clerkOrg = await response.json();
        console.log("✅ Clerk organization created:", {
          ...clerkOrg,
          timestamp: new Date().toISOString()
        });
      }
      
      // Wait for Convex client to sync with updated Clerk session
      console.log("⏳ Waiting for Convex session synchronization...", {
        timestamp: new Date().toISOString(),
        userOrgMemberships: user.organizationMemberships?.length || 0,
        userUnsafeMetadata: user.unsafeMetadata
      });
      
      // Wait for synchronization
      for (let i = 0; i < 5; i++) {
        console.log(`⏳ Starting sync check ${i + 1}/5`, {
          iteration: i + 1,
          timestamp: new Date().toISOString()
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`⏳ Sync check ${i + 1}/5 completed`, {
          iteration: i + 1,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log("⏳ Extended wait completed, proceeding with Convex call...", {
        timestamp: new Date().toISOString()
      });
      
      // Then create/update in Convex
      console.log("🔧 Processing organization in Convex...", {
        name: orgWithoutType ? orgWithoutType.organization.name : orgName,
        type: data.type,
        clerkOrgId: clerkOrg.id,
        createdBy: user.id,
        isUpdate: !!orgWithoutType,
        timestamp: new Date().toISOString()
      });
      
      let convexOrgId;
      try {
        if (orgWithoutType) {
          // Update existing organization in Convex
          convexOrgId = await createOrganization({
            name: orgWithoutType.organization.name,
            type: data.type,
            clerkOrgId: orgWithoutType.organization.id,
            createdBy: user.id,
          });
        } else {
          // Create new organization in Convex
          convexOrgId = await createOrganization({
            name: orgName,
            type: data.type,
            clerkOrgId: clerkOrg.id,
            createdBy: user.id,
          });
        }
        console.log("✅ Convex organization processed:", {
          convexOrgId,
          action: orgWithoutType ? "updated" : "created",
          timestamp: new Date().toISOString()
        });
      } catch (convexError) {
        console.error("❌ Convex organization creation failed:", {
          error: convexError,
          timestamp: new Date().toISOString()
        });
        throw convexError;
      }
      
      // Create user profile for the organization creator
      console.log("👤 Creating user profile...");
      await createUserProfile({
        clerkUserId: user.id,
        clerkOrgId: clerkOrg.id,
        orgId: convexOrgId!,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.username || "",
        role: "admin", // Organization creator is admin by default
      });
      console.log("✅ User profile created");
      
      // Update user metadata
      console.log("🔄 Updating user metadata...");
      await user.update({
        unsafeMetadata: {
          primaryOrgId: clerkOrg.id,
        },
      });
      console.log("✅ User metadata updated");

      // Switch to organization
      console.log("🔄 Switching to organization (Clerk)...");
      if (setActive) {
        await setActive({ organization: clerkOrg.id });
      }
      console.log("✅ Organization switched in Clerk");

      // Switch to organization (API)
      console.log("🔄 Switching organization (API)...");
      const switchResponse = await fetch('/api/switch-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId: clerkOrg.id }),
      });
      console.log("📋 Switch organization API response:", switchResponse.status);

      toast({
        title: "Success",
        description: "Organization created successfully!",
      });
      
      console.log("🚀 Redirecting to dashboard...");
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error("❌ Error in organization creation process:", error);
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

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
      timestamp: new Date().toISOString()
    });
    router.push('/sign-up/tasks/create-org-name');
    return <div>Redirecting...</div>;
  }

  console.log("✅ SelectOrgType: All checks passed, rendering form", {
    orgName,
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
                <form onSubmit={form.handleSubmit(handleCreateOrganization)} className="space-y-6">
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
                  </form>
              </Form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}