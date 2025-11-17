import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/org-selection(.*)', '/api/webhooks(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
  
  // Handle user without organization
  if (userId && !orgId && !req.nextUrl.pathname.includes('/org-selection')) {
    const orgSelectionUrl = new URL('/org-selection', req.url);
    return NextResponse.redirect(orgSelectionUrl);
  }

  // Redirect authenticated users away from auth pages
  if (userId && orgId && (req.nextUrl.pathname.includes('/sign-in') || req.nextUrl.pathname.includes('/sign-up'))) {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Redirect unauthenticated users to sign-in
  if (!userId && !isPublicRoute(req) && req.nextUrl.pathname !== '/') {
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};