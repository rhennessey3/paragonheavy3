"use client";

import { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardAuthWrapper from "@/components/DashboardAuthWrapper";
import { Button } from "@/components/ui/button";
import { Home, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useUser();
  const userId = user?.id;
  const pathname = usePathname();

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

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/team", label: "Team", icon: Users },
  ];

  return (
    <DashboardAuthWrapper>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Paragon Heavy</h1>
                  {organization && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {getOrgTypeLabel(organization.type)} Portal
                    </p>
                  )}
                </div>
                
                {/* Navigation */}
                <nav className="flex items-center space-x-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          size="sm"
                          className={isActive ? "bg-muted" : ""}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Only show Invite Team button for admins */}
                {organization && (userProfile?.role === "admin" || userProfile?.role === "org:admin") && (
                  <Link href="/dashboard/team">
                    <Button variant="outline" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Team
                    </Button>
                  </Link>
                )}
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto p-6">
          {children}
        </main>
      </div>
    </DashboardAuthWrapper>
  );
}