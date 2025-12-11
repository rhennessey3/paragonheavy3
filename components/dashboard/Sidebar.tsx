"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Truck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isCustom?: boolean; // Flag for custom icon rendering
  children?: NavItem[]; // Sub-navigation items
}

// Custom Equipment icon component - tool SVG
const EquipmentIcon = ({ className }: { className?: string }) => {
  return (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-5", className)}
    >
      <path 
        d="M6 6L10.5 10.5M6 6H3L2 3L3 2L6 3V6ZM19.259 2.74101L16.6314 5.36863C16.2354 5.76465 16.0373 5.96265 15.9632 6.19098C15.8979 6.39183 15.8979 6.60817 15.9632 6.80902C16.0373 7.03735 16.2354 7.23535 16.6314 7.63137L16.8686 7.86863C17.2646 8.26465 17.4627 8.46265 17.691 8.53684C17.8918 8.6021 18.1082 8.6021 18.309 8.53684C18.5373 8.46265 18.7354 8.26465 19.1314 7.86863L21.5893 5.41072C21.854 6.05488 22 6.76039 22 7.5C22 10.5376 19.5376 13 16.5 13C16.1338 13 15.7759 12.9642 15.4298 12.8959C14.9436 12.8001 14.7005 12.7521 14.5532 12.7668C14.3965 12.7824 14.3193 12.8059 14.1805 12.8802C14.0499 12.9501 13.919 13.081 13.657 13.343L6.5 20.5C5.67157 21.3284 4.32843 21.3284 3.5 20.5C2.67157 19.6716 2.67157 18.3284 3.5 17.5L10.657 10.343C10.919 10.081 11.0499 9.95005 11.1198 9.81949C11.1941 9.68068 11.2176 9.60347 11.2332 9.44681C11.2479 9.29945 11.1999 9.05638 11.1041 8.57024C11.0358 8.22406 11 7.86621 11 7.5C11 4.46243 13.4624 2 16.5 2C17.5055 2 18.448 2.26982 19.259 2.74101ZM12.0001 14.9999L17.5 20.4999C18.3284 21.3283 19.6716 21.3283 20.5 20.4999C21.3284 19.6715 21.3284 18.3283 20.5 17.4999L15.9753 12.9753C15.655 12.945 15.3427 12.8872 15.0408 12.8043C14.6517 12.6975 14.2249 12.7751 13.9397 13.0603L12.0001 14.9999Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Load collapsed state and expanded sections from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }
    const savedExpanded = localStorage.getItem("sidebarExpandedSections");
    if (savedExpanded) {
      setExpandedSections(JSON.parse(savedExpanded));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  // Toggle expanded section
  const toggleSection = (href: string) => {
    const newExpanded = { ...expandedSections, [href]: !expandedSections[href] };
    setExpandedSections(newExpanded);
    localStorage.setItem("sidebarExpandedSections", JSON.stringify(newExpanded));
  };

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/loads", label: "Job Management", icon: Truck },
    { href: "/dashboard/documents", label: "Document Hub", icon: FileText },
    { href: "/dashboard/team", label: "Personnel", icon: Users },
    { href: "/dashboard/equipment", label: "Equipment", isCustom: true },
    { href: "/dashboard/reports", label: "Reports & Analytics", icon: BarChart3 },
    { 
      href: "/dashboard/compliance", 
      label: "Compliance Studio", 
      icon: Shield,
      children: [
        { href: "/dashboard/compliance/rules", label: "Rules Management" },
        { href: "/dashboard/compliance/jurisdictions", label: "Jurisdictions" },
        { href: "/dashboard/compliance/fields", label: "System Fields" },
        { href: "/dashboard/compliance/permit-types", label: "Permit Types" },
        { href: "/dashboard/compliance/fields/mapper", label: "Field Mapper" },
      ]
    },
  ];

  return (
    <div className={cn(
      "flex h-screen flex-col bg-gray-100 relative transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo and App Name */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200 relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 flex-shrink-0">
          <div className="h-8 w-8 rounded bg-green-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">↑</span>
          </div>
        </div>
        {!isCollapsed && (
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Paragon</h1>
            <h1 className="text-xl font-bold text-gray-900">Heavy</h1>
          </div>
        )}
      </div>

      {/* Collapse Toggle - positioned on right edge */}
      <button
        onClick={toggleCollapse}
        className={cn(
          "absolute z-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600",
          isCollapsed ? "right-0 translate-x-1/2" : "right-0 translate-x-1/2",
          "top-32"
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedSections[item.href];
          const isActive = pathname === item.href;
          const isChildActive = hasChildren && item.children?.some(
            child => pathname === child.href || pathname.startsWith(child.href + "/")
          );
          const isParentActive = isActive || isChildActive;
          
          if (hasChildren) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleSection(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                    isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
                    isParentActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {Icon && <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isParentActive ? "text-blue-600" : "text-gray-500"
                  )} />}
                  {!isCollapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </>
                  )}
                </button>
                {!isCollapsed && isExpanded && (
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                    {item.children?.map((child) => {
                      const isChildItemActive = pathname === child.href || pathname.startsWith(child.href + "/");
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block px-3 py-2 rounded-lg text-sm transition-colors",
                            isChildItemActive
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {item.isCustom ? (
                <EquipmentIcon className={isActive ? "text-blue-600" : "text-gray-500"} />
              ) : (
                Icon && <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-blue-600" : "text-gray-500"
                )} />
              )}
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Settings Only */}
      <div className="border-t border-gray-200 px-4 py-4 space-y-2 relative z-10">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
            isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
            pathname === "/dashboard/settings"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className={cn(
            "h-5 w-5 flex-shrink-0",
            pathname === "/dashboard/settings" ? "text-blue-600" : "text-gray-500"
          )} />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  );
}

