"use client";

import { useState } from "react";
import { useUser, useOrganizationList } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const createOrgSchema = z.object({
  type: z.enum(["shipper", "carrier", "escort"]),
});

type CreateOrgValues = z.infer<typeof createOrgSchema>;

export default function WhatTypeOfOrgAreYouPage() {
  const { user } = useUser();
  const { setActive } = useOrganizationList();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
  const createOrganization = useMutation(api.organizations.createOrganization);

  const form = useForm<CreateOrgValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      type: "shipper",
    },
  });

  const handleCreateOrganization = async (data: CreateOrgValues) => {
    if (!user) return;
    
    const orgName = user.fullName
      ? `${user.fullName}'s Organization`
      : "My Organization";

    setIsCreating(true);
    try {
      // Create organization in Clerk first
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

      if (!response.ok) {
        throw new Error('Failed to create organization in Clerk');
      }

      const clerkOrg = await response.json();
      
      // Then create in Convex
      await createOrganization({
        name: orgName,
        type: data.type,
        clerkOrgId: clerkOrg.id,
        createdBy: user.id,
      });
      
      // Update user metadata
      await user.update({
        unsafeMetadata: {
          primaryOrgId: clerkOrg.id,
        },
      });

      // Switch to organization
      if (setActive) {
        await setActive({ organization: clerkOrg.id });
      }

      // Switch to organization (API)
      await fetch('/api/switch-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId: clerkOrg.id }),
      });

      toast({
        title: "Success",
        description: "Organization created successfully!",
      });
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating organization:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Who are you in the heavy-haul ecosystem?</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us how your business operates so we can set up the right tools, permissions, and workflows from day one.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose the option that best fits</CardTitle>
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

                <Button type="submit" disabled={isCreating} className="w-full">
                  {isCreating ? "Creating..." : "Create Organization"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}