"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShipperDashboard } from "@/components/dashboard/ShipperDashboard";
import { CarrierDashboard } from "@/components/dashboard/CarrierDashboard";
import { EscortDashboard } from "@/components/dashboard/EscortDashboard";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { userId, getToken, sessionClaims } = useAuth();
  const { user } = useUser();
  const [convexTokenClaims, setConvexTokenClaims] = useState<any>(null);

  const userProfile = useQuery(api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  const organization = useQuery(api.organizations.getOrganizationById,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  const createUserProfile = useMutation(api.users.createUserProfile);
  const createOrganization = useMutation(api.organizations.createOrganization);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getToken({ template: "convex" });
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setConvexTokenClaims(payload);
        }
      } catch (e) {
        console.error("Failed to fetch Convex token", e);
      }
    };
    fetchToken();
  }, [getToken]);

  if (!userId) {
    console.log("❌ DashboardPage: Missing userId, showing loading state");
    return <div>Loading authentication...</div>;
  }

  // Wait for user profile to load
  if (userProfile === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Handle case when orgId is missing in Convex profile - show onboarding prompt
  if (!userProfile?.orgId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to Paragon Heavy</h1>
          <p className="text-muted-foreground">Let's get your organization set up</p>
        </div>

        <div className="p-6 border rounded-lg bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Complete Your Organization Setup</h2>
          <p className="text-blue-700 mb-4">
            You need to create an organization to access the full dashboard features.
          </p>
          <a
            href="/sign-up/tasks/create-organization"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Organization
          </a>
        </div>
      </div>
    );
  }

  if (organization === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (organization === null) {
    return (
      <div className="p-4 border rounded bg-red-50 text-red-800">
        <h3 className="font-bold">Organization not found</h3>
        <p className="mt-2">Your organization data could not be loaded. Please contact support.</p>
      </div>
    );
  }

  // Use the type from the organization object, which is the source of truth
  const orgType = organization.type;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to {organization.name}</p>
      </div>

      {orgType === "shipper" && <ShipperDashboard />}
      {orgType === "carrier" && <CarrierDashboard />}
      {orgType === "escort" && <EscortDashboard />}

      {!orgType && (
        <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
          Unknown organization type. Please contact support.
        </div>
      )}
    </div>
  );
}
function ClaimsChecklist({ claims }: { claims: any }) {
  const expectedClaims = [
    "name",
    "email",
    "org_id",
    "org_name",
    "org.role",
    "orgType",
    "picture",
    "nickname",
    "given_name",
    "updated_at",
    "email_verified",
    // Standard claims
    "azp",
    "exp",
    "fva",
    "iss",
    "nbf",
    "o",
    "sid",
    "sts",
    "sub",
    "v"
  ];

  if (!claims) return <div className="text-xs text-muted-foreground">No claims data</div>;

  return (
    <div className="space-y-1">
      {expectedClaims.map((claim) => {
        const isPresent = claims[claim] !== undefined || (claim === "org.role" && claims["org"]?.role) || (claim === "org_name" && claims["org"]?.name);
        // Note: org.role and org_name might be nested or flat depending on how Clerk maps them. 
        // The user's template showed "org.role": "{{org.role}}", which usually results in a flat key "org.role" if using standard claims, 
        // but Clerk often nests them under "org" or "o".
        // Let's check for both flat and nested for robustness, or just check if the key exists in the flat object if that's what the user expects.
        // Based on the user's JSON output earlier: "o": { "id": ..., "rol": ... }
        // So "org_id" might be mapped to "org_id" if custom, or "o.id" if default.
        // But the user's template explicitly sets "org_id": "{{org.id}}".

        // Let's stick to checking if the key exists in the object as provided.
        // Also check for null, as the user considers null as "missing"
        const value = claims[claim];
        const exists = value !== undefined && value !== null;

        return (
          <div key={claim} className="flex items-center text-xs justify-between">
            <div className="flex items-center">
              <span className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${exists ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {exists ? "✓" : "✕"}
              </span>
              <span className={exists ? "text-foreground" : "text-muted-foreground"}>
                {claim}
              </span>
            </div>
            {exists && (
              <span className="text-muted-foreground ml-2 max-w-[150px] truncate" title={String(value)}>
                {String(value)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}