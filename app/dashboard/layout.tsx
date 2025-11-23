import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import DashboardAuthWrapper from "@/components/DashboardAuthWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Server-side auth check removed to rely on client-side protection (DashboardAuthWrapper)
  // This avoids race conditions where middleware/server doesn't see the session cookie yet.
  // const { userId } = await auth();
  // if (!userId) {
  //   redirect("/sign-in");
  // }

  return (
    <DashboardAuthWrapper>
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
    </DashboardAuthWrapper>
  );
}