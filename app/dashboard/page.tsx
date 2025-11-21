"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShipperDashboard } from "@/components/dashboard/ShipperDashboard";
import { CarrierDashboard } from "@/components/dashboard/CarrierDashboard";
import { EscortDashboard } from "@/components/dashboard/EscortDashboard";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { userId, orgId, getToken, sessionClaims } = useAuth();
  const { user } = useUser();
  const [convexTokenClaims, setConvexTokenClaims] = useState<any>(null);
  
  const organization = useQuery(api.organizations.getOrganization, {
    clerkOrgId: orgId || "",
  });
  
  const userProfile = useQuery(api.users.getUserProfile, {
    clerkUserId: userId || undefined,
  });

  
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

  // Create user profile if it doesn't exist
  useEffect(() => {
    const ensureUserProfile = async () => {
      if (userId && orgId && organization && !userProfile) {
        try {
          await createUserProfile({
            clerkUserId: userId,
            clerkOrgId: orgId,
            orgId: organization._id,
            email: user?.primaryEmailAddress?.emailAddress || "",
            name: user?.fullName || user?.username || "",
            role: "operator", // Default role for existing users
          });
          console.log("Created user profile for existing user");
        } catch (error) {
          console.error("Failed to create user profile:", error);
        }
      }
    };
    
    ensureUserProfile();
  }, [userId, orgId, organization, userProfile, createUserProfile, user]);

  // Recovery mechanism: If user has orgId but no organization in Convex, sync it
  useEffect(() => {
    const syncMissingOrganization = async () => {
      if (userId && orgId && !organization && user?.organizationMemberships && user.organizationMemberships.length > 0) {
        console.log("🔄 Dashboard: Detected missing organization in Convex, attempting recovery sync", {
          userId,
          orgId,
          clerkOrgs: user.organizationMemberships.map(org => ({
            id: org.organization.id,
            name: org.organization.name,
            role: org.role
          })),
          timestamp: new Date().toISOString()
        });

        try {
          // Find the matching organization from user's memberships
          const matchingOrg = user.organizationMemberships.find(
            membership => membership.organization.id === orgId
          );

          if (matchingOrg) {
            console.log("🔧 Dashboard: Creating missing organization in Convex", {
              name: matchingOrg.organization.name,
              clerkOrgId: matchingOrg.organization.id,
              createdBy: userId
            });

            // Create the organization in Convex
            const convexOrgId = await createOrganization({
              name: matchingOrg.organization.name,
              type: (matchingOrg.organization.publicMetadata as any)?.type || "shipper",
              clerkOrgId: matchingOrg.organization.id,
              createdBy: userId,
            });

            console.log("✅ Dashboard: Organization recovery sync completed", {
              convexOrgId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error("❌ Dashboard: Organization recovery sync failed", {
            error,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    syncMissingOrganization();
  }, [userId, orgId, organization, user, createOrganization]);

  if (!userId || !orgId) {
    return <div>Loading...</div>;
  }

  if (organization === undefined) {
    return <div>Loading organization data...</div>;
  }

  if (organization === null) {
    return (
      <div className="p-4 border rounded bg-red-50 text-red-800 space-y-4">
        <div>
          <h3 className="font-bold">
            Organization {(sessionClaims as any)?.org_name ? `'${(sessionClaims as any).org_name}'` : ""} not found in database
          </h3>
          {(sessionClaims as any)?.org_name ? (
            <p className="text-xs text-green-600 mb-2">
              ✓ Name retrieved from Clerk session claim 'org_name'
            </p>
          ) : (
            <p className="text-xs text-red-600 mb-2">
              ✕ Name not found in Clerk session claim 'org_name'
            </p>
          )}
          <p>Please contact support.</p>
          <p className="mt-2 text-sm text-muted-foreground">Org ID: {orgId}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded border border-red-200 overflow-auto max-h-96">
            <h4 className="font-semibold mb-1 text-sm">Session Claims (Next.js):</h4>
            <p className="text-xs text-muted-foreground mb-2">Used by Middleware & App</p>
            <pre className="text-xs whitespace-pre-wrap break-all">
              {JSON.stringify(
                Object.keys(sessionClaims || {}).filter(key => key !== '__raw').sort().reduce((obj: any, key) => {
                  obj[key] = (sessionClaims as any)[key];
                  return obj;
                }, {}),
                null,
                2
              )}
            </pre>
          </div>
          
          <div className="bg-white p-4 rounded border border-red-200 overflow-auto max-h-96">
            <h4 className="font-semibold mb-2 text-sm">Convex JWT Template:</h4>
            <pre className="text-xs whitespace-pre-wrap break-all">
              {convexTokenClaims ? JSON.stringify(
                Object.keys(convexTokenClaims).sort().reduce((obj: any, key) => {
                  obj[key] = convexTokenClaims[key];
                  return obj;
                }, {}),
                null,
                2
              ) : "Loading..."}
            </pre>
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-red-200 mt-4">
          <h4 className="font-semibold mb-4 text-sm">Claims Checklist</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h5 className="text-xs font-medium mb-2 text-muted-foreground">Session Claims (Next.js)</h5>
              <ClaimsChecklist claims={sessionClaims} />
            </div>
            <div>
              <h5 className="text-xs font-medium mb-2 text-muted-foreground">Convex JWT Template</h5>
              <ClaimsChecklist claims={convexTokenClaims} />
            </div>
          </div>
        </div>
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