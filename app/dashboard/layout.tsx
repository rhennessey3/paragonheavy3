import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId, orgId } = await auth();
  console.log(`DashboardLayout: userId=${userId}, orgId=${orgId}`);

  if (!userId || !orgId) {
    console.log("DashboardLayout: Missing userId or orgId, redirecting to /what-type-of-org-are-you");
    redirect("/what-type-of-org-are-you");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Paragon Heavy</h1>
            <div className="flex items-center space-x-4">
              {/* Organization switcher will go here */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-6">
        {children}
      </main>
    </div>
  );
}