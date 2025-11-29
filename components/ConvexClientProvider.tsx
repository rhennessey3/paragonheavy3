"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { ReactNode, useCallback, useMemo, useEffect, useState } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Custom hook to wrap Clerk's useAuth and always request the "convex" JWT template
function useAuthWithConvexTemplate() {
  const { getToken, isLoaded, isSignedIn: clerkIsSignedIn, orgId, orgRole } = useClerkAuth();
  const { user, isLoaded: userIsLoaded } = useUser();
  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);

  // Derive isSignedIn from multiple sources - if we have a user, we're signed in
  const derivedIsSignedIn = clerkIsSignedIn || !!user;

  // Debug: Log auth state changes
  useEffect(() => {
    console.log("🔑 ConvexClientProvider auth state:", {
      isLoaded,
      userIsLoaded,
      clerkIsSignedIn,
      derivedIsSignedIn,
      hasUser: !!user,
      userId: user?.id,
      orgId,
      orgRole,
      tokenChecked,
      hasValidToken,
    });
  }, [isLoaded, userIsLoaded, clerkIsSignedIn, derivedIsSignedIn, user, orgId, orgRole, tokenChecked, hasValidToken]);

  // Proactively check for token on mount when we have a user
  useEffect(() => {
    async function checkToken() {
      if (derivedIsSignedIn && !tokenChecked) {
        try {
          const token = await getToken({ template: "convex" });
          console.log("🔐 Initial token check:", { hasToken: !!token });
          setHasValidToken(!!token);
        } catch (e) {
          console.error("❌ Initial token check failed:", e);
          setHasValidToken(false);
        }
        setTokenChecked(true);
      }
    }
    checkToken();
  }, [derivedIsSignedIn, tokenChecked, getToken]);

  // Wrap getToken to always use the "convex" template
  const getTokenForConvex = useCallback(
    async (options: { template?: "convex"; skipCache?: boolean } = {}) => {
      console.log("🔐 ConvexClientProvider getToken CALLED with options:", options);
      try {
        // Always use "convex" template regardless of what's passed
        const token = await getToken({
          template: "convex",
          skipCache: options.skipCache,
        });
        console.log("🔐 ConvexClientProvider getToken RESULT:", {
          hasToken: !!token,
          tokenLength: token?.length,
          tokenPreview: token ? token.substring(0, 50) + "..." : null,
          isLoaded,
          derivedIsSignedIn,
        });
        if (token) {
          setHasValidToken(true);
        }
        return token;
      } catch (error) {
        console.error("❌ ConvexClientProvider getToken error:", error);
        return null;
      }
    },
    [getToken, isLoaded, derivedIsSignedIn]
  );

  // Use derived isSignedIn so ConvexProviderWithClerk will call getToken
  const effectiveIsSignedIn = derivedIsSignedIn || hasValidToken;

  return useMemo(
    () => ({
      isLoaded: isLoaded && userIsLoaded,
      isSignedIn: effectiveIsSignedIn,
      getToken: getTokenForConvex,
      orgId,
      orgRole,
    }),
    [isLoaded, userIsLoaded, effectiveIsSignedIn, getTokenForConvex, orgId, orgRole]
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuthWithConvexTemplate}>
      {children}
    </ConvexProviderWithClerk>
  );
}