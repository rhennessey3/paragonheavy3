"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChooseOrganizationPage() {
  const router = useRouter();

  useEffect(() => {
    console.log("🔄 Clerk tried to redirect to choose-organization, redirecting to custom flow", {
      timestamp: new Date().toISOString(),
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
      clerkEnvironment: {
        publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "present" : "missing",
        domain: process.env.NEXT_PUBLIC_CLERK_JWT_ISSUER_DOMAIN ? "present" : "missing",
        afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "not set"
      }
    });
    
    // Check if user already has organizations
    const checkUserOrgs = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (response.ok) {
          const orgs = await response.json();
          console.log("🏢 User organizations check:", {
            orgCount: orgs.length,
            orgs: orgs.map((org: any) => ({ id: org.id, name: org.name })),
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("❌ Failed to check user organizations:", error);
      }
    };
    
    checkUserOrgs();
    
    // Immediately redirect to our new organization creation flow
    router.replace("/sign-up/tasks/create-organization");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to organization setup...</p>
      </div>
    </div>
  );
}