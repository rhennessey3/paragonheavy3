import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Toaster } from "@/components/ui/toaster";
import { DebugAuthInfo } from "@/components/DebugAuthInfo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Paragon Heavy",
  description: "Heavy haul logistics platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm normal-case",
          card: "shadow-lg",
        },
      }}
      // Prevent Clerk from showing organization creation UI
      signInForceRedirectUrl="/sign-up/tasks/create-organization"
      signUpForceRedirectUrl="/sign-up/tasks/create-organization"
    >
      <ConvexClientProvider>
        <html lang="en">
          <body className={inter.className}>
            {children}
            <Toaster />
            <DebugAuthInfo />
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}