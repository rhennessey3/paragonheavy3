"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  type: z.enum(["shipper", "carrier", "escort"]),
});

type CreateOrgValues = z.infer<typeof createOrgSchema>;

export default function OrgSelectionPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  
  const organizations = useQuery(api.organizations.getUserOrganizations, {
    userId: user?.id || "",
  });
  const createOrganization = useMutation(api.organizations.createOrganization);

  const form = useForm<CreateOrgValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      type: "shipper",
    },
  });

  const handleCreateOrganization = async (data: CreateOrgValues) => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      // For now, just create in our database
      // TODO: Integrate with Clerk organization creation
      const orgId = await createOrganization({
        name: data.name,
        type: data.type,
        clerkOrgId: `temp_${Date.now()}`, // Temporary ID until Clerk integration
        createdBy: user.id,
      });
      
      toast.success("Organization created successfully!");
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error("Failed to create organization. Please try again.");
      console.error("Error creating organization:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectOrganization = (clerkOrgId: string) => {
    // This will be handled by Clerk's organization switcher
    window.location.href = `/dashboard`;
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Paragon Heavy</h1>
          <p className="mt-2 text-gray-600">Select an organization or create a new one to get started</p>
        </div>

        {/* Existing Organizations */}
        {organizations && organizations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations && organizations.map((org) => (
                  <div key={org._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{org.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{org.type}</p>
                    </div>
                    <Button onClick={() => handleSelectOrganization(org.clerkOrgId)}>
                      Enter Organization
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create New Organization */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateOrganization)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Heavy Haul" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="escort">Escort</SelectItem>
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