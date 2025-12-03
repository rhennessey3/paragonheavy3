"use client";

import { ReactNode } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  User, 
  BarChart3, 
  Wrench,
  Settings,
  Truck,
  Hammer
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isCustom?: boolean; // Flag for custom icon rendering
}

// Custom Equipment icon component - hammer and wrench crossed
const EquipmentIcon = ({ className }: { className?: string }) => {
  const colorClass = className || "text-gray-500";
  return (
    <div className="relative h-5 w-5">
      <Wrench className={cn("absolute inset-0 h-5 w-5 rotate-45", colorClass)} />
      <Hammer className={cn("absolute inset-0 h-5 w-5 -rotate-45", colorClass)} />
    </div>
  );
};

export function Sidebar() {
  const { user } = useUser();
  const userId = user?.id;
  const pathname = usePathname();

  // Get user profile to display role
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  // Get organization to display org name
  const organization = useQuery(
    api.organizations.getOrganizationById,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  // Format role for display (remove "org:" prefix and capitalize)
  const formatRole = (role?: string) => {
    if (!role) return "Member";
    // Remove "org:" prefix if present
    const cleanRole = role.replace(/^org:/, "");
    // Capitalize first letter and replace underscores with spaces
    return cleanRole
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const displayRole = formatRole(userProfile?.role);
  const orgName = organization?.name || "";

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/loads", label: "Job Management", icon: Truck },
    { href: "/dashboard/documents", label: "Document Hub", icon: FileText },
    { href: "/dashboard/team", label: "Personnel", icon: Users },
    { href: "/dashboard/equipment", label: "Equipment", isCustom: true },
    { href: "/dashboard/reports", label: "Reports & Analytics", icon: BarChart3 },
    { href: "/dashboard/compliance", label: "Compliance & Safety", icon: Wrench },
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-100 relative">
      {/* Logo and App Name */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200 relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 border border-amber-200">
          <div className="h-8 w-8 rounded bg-green-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">↑</span>
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Paragon Heavy</h1>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {item.isCustom ? (
                <EquipmentIcon className={isActive ? "text-blue-600" : "text-gray-500"} />
              ) : (
                Icon && <Icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-blue-600" : "text-gray-500"
                )} />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - User Profile and Settings */}
      <div className="border-t border-gray-200 px-4 py-4 space-y-2 relative z-10">
        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2.5 group">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-gray-300 transition-all">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={user.fullName || "User"} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.fullName || user?.firstName || "User"}
              </p>
              <p className="text-xs text-gray-500">{displayRole}</p>
              {orgName && (
                <p className="text-xs text-gray-400 truncate">{orgName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "shadow-lg",
                }
              }}
            />
          </div>
        </div>

        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === "/dashboard/settings"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Settings className={cn(
            "h-5 w-5",
            pathname === "/dashboard/settings" ? "text-blue-600" : "text-gray-500"
          )} />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}

