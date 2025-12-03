"use client";

import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardAuthWrapper from "@/components/DashboardAuthWrapper";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useUser } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useUser();
  const userId = user?.id;

  const userProfile = useQuery(api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  const organization = useQuery(api.organizations.getOrganizationById,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  return (
    <DashboardAuthWrapper>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </DashboardAuthWrapper>
  );
}