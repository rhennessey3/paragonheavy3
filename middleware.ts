import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sign-up/tasks/create-org-name(.*)',
  '/sign-up/tasks/select-org-type(.*)',
  '/api/webhooks(.*)',
  '/api/onboarding-complete(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
  console.log(`🔄 Middleware processing: ${req.nextUrl.pathname}`);
  console.log(`🔐 Auth state: userId=${userId}, orgId=${orgId}`);
  console.log(`🌐 Full URL: ${req.url}`);
  console.log(`🔍 Headers:`, Object.fromEntries(req.headers.entries()));
  
  const cookieHeader = req.headers.get("cookie") ?? "";
  const onboardingCompleted =
    cookieHeader.includes("ph_onboarding_completed=true");
  console.log(`🍪 Onboarding cookie: ${onboardingCompleted ? 'completed' : 'not completed'}`);

  const path = req.nextUrl.pathname;

  // 1) User logged in, onboarding NOT completed → force them into onboarding tasks
  if (userId && !onboardingCompleted) {
    const allowed = [
      "/sign-up/tasks/create-org-name",
      "/sign-up/tasks/select-org-type",
      "/api/organizations",
      "/api/switch-organization",
    ];

    const isAllowed = allowed.some((prefix) => path.startsWith(prefix));

    if (!isAllowed) {
      console.log(`⚠️ Redirecting to create-org-name: User logged in but onboarding not completed`);
      console.log(`📍 Current path: ${path}`);
      console.log(`📍 Redirect target: /sign-up/tasks/create-org-name`);
      const url = new URL("/sign-up/tasks/create-org-name", req.url);
      return NextResponse.redirect(url);
    }
  }

  // 2) User logged in, onboarding completed → keep them away from auth + onboarding pages
  if (userId && onboardingCompleted) {
    const isAuthOrOnboarding =
      path.startsWith("/sign-in") ||
      path.startsWith("/sign-up") ||
      path.startsWith("/sign-up/tasks");

    if (isAuthOrOnboarding) {
      console.log(`🔄 Redirecting to dashboard: User completed onboarding but trying to access auth/onboarding pages`);
      console.log(`📍 Current path: ${path}`);
      console.log(`📍 Redirect target: /dashboard`);
      const dashboardUrl = new URL("/dashboard", req.url);
      return NextResponse.redirect(dashboardUrl, { status: 303 });
    }
  }

  // 3) Existing unauthenticated logic:
  if (!userId && !isPublicRoute(req) && path !== "/") {
    console.log(`🔄 Redirecting to sign-in: Unauthenticated user trying to access protected route`);
    console.log(`📍 Current path: ${path}`);
    console.log(`📍 Redirect target: /sign-in`);
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