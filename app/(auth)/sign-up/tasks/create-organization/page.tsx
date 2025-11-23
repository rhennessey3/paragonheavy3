"use client";

import { CreateOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CreateOrganizationPage() {
  const router = useRouter();

  useEffect(() => {
    console.log("🏢 CreateOrganizationPage: Page loaded", {
      timestamp: new Date().toISOString(),
      currentUrl: window.location.href
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Create Your Organization</h1>
          <p className="mt-2 text-muted-foreground">
            Let's get your organization set up
          </p>
        </div>
        
        <div className="bg-card rounded-lg shadow-lg p-6">
          <CreateOrganization
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm normal-case w-full",
                card: "shadow-none border-0 p-0",
                headerTitle: "text-2xl font-semibold text-foreground",
                headerSubtitle: "text-muted-foreground",
                formFieldLabel: "text-sm font-medium text-foreground",
                formFieldInput: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                footer: "hidden", // Hide Clerk's footer since we have our own flow
              },
              variables: {
                colorPrimary: "hsl(var(--primary))",
                colorBackground: "hsl(var(--background))",
                colorForeground: "hsl(var(--foreground))",
                colorInput: "hsl(var(--background))",
                colorInputText: "hsl(var(--foreground))",
              },
            }}
            afterCreateOrganizationUrl="/sign-up/tasks/select-org-type"
          />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            After creating your organization, you'll select the type
          </p>
        </div>
      </div>
    </div>
  );
}