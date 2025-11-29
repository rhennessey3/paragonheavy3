"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Custom auth hook that explicitly requests the "convex" template
function useAuth() {
  const { getToken, isLoaded, isSignedIn, orgId, orgRole } = useClerkAuth();

  return {
    isLoaded,
    isSignedIn,
    getToken: async (options?: { template?: "convex"; skipCache?: boolean }) => {
      return await getToken({ template: "convex", ...options });
    },
    orgId,
    orgRole,
  };
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk
      client={convex}
      useAuth={useAuth}
    >
      {children}
    </ConvexProviderWithClerk>
  );
}