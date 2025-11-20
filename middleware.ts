import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/what-type-of-org-are-you(.*)', '/api/webhooks(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
  console.log(`Middleware processing: ${req.nextUrl.pathname}`);
  console.log(`Auth state: userId=${userId}, orgId=${orgId}`);
  
  // Handle user without organization
  if (userId && !orgId &&
      !req.nextUrl.pathname.includes('/what-type-of-org-are-you') &&
      !req.nextUrl.pathname.includes('/api/organizations') &&
      !req.nextUrl.pathname.includes('/api/switch-organization')
  ) {
    const chooseOrgUrl = new URL('/what-type-of-org-are-you', req.url);
    return NextResponse.redirect(chooseOrgUrl);
  }

  // Redirect authenticated users away from auth pages
  if (userId && orgId && (req.nextUrl.pathname.includes('/sign-in') || req.nextUrl.pathname.includes('/sign-up'))) {
    const dashboardUrl = new URL('/dashboard', req.url);
    // Use 303 See Other to force GET method if the original request was POST
    return NextResponse.redirect(dashboardUrl, { status: 303 });
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