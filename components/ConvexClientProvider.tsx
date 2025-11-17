"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";

// Add diagnostic logging
console.log("ConvexClientProvider: NEXT_PUBLIC_CONVEX_URL =", process.env.NEXT_PUBLIC_CONVEX_URL);
console.log("ConvexClientProvider: Initializing Convex client");

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://disciplined-moose-799.convex.cloud");

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Add diagnostic logging for auth state
  const auth = useAuth();
  console.log("ConvexClientProvider: Auth state =", {
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn,
    userId: auth.userId
  });

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}