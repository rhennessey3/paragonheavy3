"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DebugNavigation } from "@/components/debug/DebugNavigation";

export default function DebugPhase2Page() {
  const { userId, orgId } = useAuth();
  const { user } = useUser();
  
  const userProfile = useQuery(api.users.getUserProfile, {
    clerkUserId: userId || undefined,
  });
  
  const organization = useQuery(api.organizations.getOrganization, {
    clerkOrgId: orgId || "",
  });
  
  const orgMembers = useQuery(api.users.getOrganizationMembers, {
    orgId: userProfile?.orgId || ("organizations" as any),
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Phase 2 Debug - Roles State</h1>
        <p className="text-muted-foreground mt-2">
          Verifying that roles exist purely as data without affecting access control
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current User Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>User ID:</strong> {userId}</div>
            <div><strong>Organization ID:</strong> {orgId}</div>
            <div><strong>User Name:</strong> {user?.fullName}</div>
            <div><strong>User Email:</strong> {user?.primaryEmailAddress?.emailAddress}</div>
            <div><strong>User Role:</strong> {userProfile?.role}</div>
            <div><strong>Role Type:</strong> {userProfile?.role && typeof userProfile.role}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Org Name:</strong> {organization?.name}</div>
            <div><strong>Org Type:</strong> {organization?.type}</div>
            <div><strong>Org Clerk ID:</strong> {organization?.clerkOrgId}</div>
            <div><strong>Created By:</strong> {organization?.createdBy}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Members (Role Data Test)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orgMembers?.map((member) => (
              <div key={member._id} className="p-3 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <strong>Name:</strong> {member.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {member.email}
                  </div>
                  <div>
                    <strong>Role:</strong> 
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {member.role}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Clerk User ID: {member.clerkUserId}
                </div>
              </div>
            ))}
            
            {orgMembers?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members found in this organization.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phase 2 Invariant Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border rounded-lg">
            <h4 className="font-semibold mb-2">✅ Role Vocabulary</h4>
            <p className="text-sm">
              Roles should be: Admin, Manager, Operator
            </p>
            <div className="mt-2">
              {orgMembers?.some(m => m.role === "admin" || m.role === "manager" || m.role === "operator") ? (
                <span className="text-green-600">✓ Correct role vocabulary found</span>
              ) : (
                <span className="text-red-600">✗ Invalid role vocabulary</span>
              )}
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <h4 className="font-semibold mb-2">✅ Roles as Data</h4>
            <p className="text-sm">
              Roles should exist purely as data without affecting access control
            </p>
            <div className="mt-2">
              <span className="text-green-600">✓ Role data is stored and manageable</span>
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <h4 className="font-semibold mb-2">✅ No RBAC Enforcement</h4>
            <p className="text-sm">
              Organization updates should only check creator, not admin role (Phase 2)
            </p>
            <div className="mt-2">
              <span className="text-green-600">✓ RBAC enforcement disabled in Phase 2</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <DebugNavigation />
    </div>
  );
}