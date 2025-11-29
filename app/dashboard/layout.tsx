"use client";

import { ReactNode, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardAuthWrapper from "@/components/DashboardAuthWrapper";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { InviteMemberModal } from "@/components/dashboard/InviteMemberModal";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const userProfile = useQuery(api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  const organization = useQuery(api.organizations.getOrganizationById,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  // Capitalize and format org type
  const getOrgTypeLabel = (type?: string) => {
    if (!type) return "";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <DashboardAuthWrapper>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Paragon Heavy</h1>
                {organization && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {getOrgTypeLabel(organization.type)} Portal
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {organization && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex" // Removed hidden md:flex
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Team
                  </Button>
                )}
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto p-6">
          {children}
        </main>

        {organization && (
          <InviteMemberModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            orgId={organization._id}
            orgType={organization.type as any}
          />
        )}
      </div>
    </DashboardAuthWrapper>
  );
}