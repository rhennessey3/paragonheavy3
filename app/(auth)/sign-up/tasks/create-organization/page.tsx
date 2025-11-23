"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const createOrganization = useMutation(api.organizations.createOrganization);

  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<"shipper" | "carrier" | "escort">("shipper");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Protect the route client-side
  useEffect(() => {
    if (isAuthLoaded && !userId) {
      console.log("🔒 CreateOrganizationPage: No user found, redirecting to sign-in");
      router.push("/sign-in");
    }
  }, [isAuthLoaded, userId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim()) {
      toast({
        title: "Organization name required",
        description: "Please enter a name for your organization.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🚀 Creating organization via Convex:", { name: orgName, type: orgType });

      const orgId = await createOrganization({
        name: orgName,
        type: orgType,
      });

      console.log("✅ Organization created:", orgId);

      toast({
        title: "Organization created",
        description: "Your organization has been successfully created.",
      });

      // Redirect to dashboard
      window.location.href = "/dashboard";

    } catch (err: any) {
      console.error("❌ Failed to create organization:", err);
      toast({
        title: "Error creating organization",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isUserLoaded || !isAuthLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create Your Organization</CardTitle>
          <CardDescription>
            Set up your organization profile to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Logistics"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgType">Organization Type</Label>
              <Select
                value={orgType}
                onValueChange={(value: "shipper" | "carrier" | "escort") => setOrgType(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipper">Shipper</SelectItem>
                  <SelectItem value="carrier">Carrier</SelectItem>
                  <SelectItem value="escort">Escort</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Organization"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}