import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sign-up/tasks/create-organization(.*)',
  '/sign-up/tasks/select-org-type(.*)',
  '/sign-up/tasks/choose-organization(.*)',
  '/api/webhooks(.*)',
  '/api/onboarding-complete(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId, sessionClaims } = await auth();
  
  const cookieHeader = req.headers.get("cookie") ?? "";
  const onboardingCompleted =
    cookieHeader.includes("ph_onboarding_completed=true");

  const path = req.nextUrl.pathname;

  // 1) User logged in, onboarding NOT completed → force them into onboarding tasks
  // BUT ONLY after email verification is complete to prevent redirect loops
  if (userId && !onboardingCompleted && sessionClaims?.emailVerified) {
    const allowed = [
      "/sign-up/tasks/create-organization",
      "/sign-up/tasks/select-org-type",
      "/sign-up/tasks/choose-organization",
      "/api/organizations",
      "/api/switch-organization",
      "/api/onboarding-complete",
    ];

    const isAllowed = allowed.some((prefix) => path.startsWith(prefix));

    if (isAllowed) {
      return NextResponse.next();
    }

    const url = new URL("/sign-up/tasks/create-organization", req.url);
    return NextResponse.redirect(url);
  }

  // 2) User logged in, onboarding completed → keep them away from auth + onboarding pages
  // Only apply this rule after email verification is complete
  if (userId && onboardingCompleted && sessionClaims?.emailVerified) {
    const isAuthOrOnboarding =
      path.startsWith("/sign-in") ||
      path.startsWith("/sign-up") ||
      path.startsWith("/sign-up/tasks");

    if (isAuthOrOnboarding) {
      const dashboardUrl = new URL("/dashboard", req.url);
      return NextResponse.redirect(dashboardUrl, { status: 303 });
    }
  }

  // 3) Existing unauthenticated logic:
  if (!userId && !isPublicRoute(req) && path !== "/") {
    const signInUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};