import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DebugNavigation() {
  const debugPages = [
    {
      title: "Auth Debug",
      description: "Clerk authentication and organization context",
      href: "/debug-auth"
    },
    {
      title: "Phase 2 Debug",
      description: "Roles State - role data without access control",
      href: "/debug-phase2"
    },
    {
      title: "Phase 1 CRUD Testing",
      description: "Identity + Org State - no RBAC enforcement",
      href: "/debug-phase1"
    },
    {
      title: "Phase 2 CRUD Testing",
      description: "Roles State - roles as data only",
      href: "/debug-phase2-crud"
    },
    {
      title: "Phase 3 CRUD Testing",
      description: "Permissions State - RBAC enforcement active",
      href: "/debug-phase3"
    },
    {
      title: "All Phases Testing",
      description: "Comprehensive testing across all DET STATE phases",
      href: "/debug-all-phases"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Navigation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {debugPages.map((page) => (
            <div key={page.href} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-semibold mb-2">{page.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{page.description}</p>
              <Link href={page.href}>
                <Button variant="outline" size="sm" className="w-full">
                  Open
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}