import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up',
  '/sign-up/verify-email-address',
  '/sign-up/sso-callback',
  '/sign-up/tasks/create-organization(.*)',
  '/api/webhooks(.*)',
  '/api/workflows(.*)',
  '/api/onboarding-complete(.*)',
  '/api/invitations(.*)',
  '/api/roles(.*)',
  '/api/password-reset(.*)',
  '/api/sync-roles(.*)',
  '/invite(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  console.log("🔒 Middleware Debug:", {
    path,
    userId,
    isPublic: isPublicRoute(req),
    cookies: req.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' })),
    secretKeyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 7),
    pubKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 7)
  });

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // If the user is not authenticated by Clerk's server-side auth() helper
  if (!userId) {
    // Check if we have a session cookie - if so, this might be a sync issue
    // Let the client-side handle the redirect or auth check to avoid a loop
    const hasSessionCookie = req.cookies.has('__session');

    if (hasSessionCookie) {
      console.log("🔒 Middleware: Session cookie found but userId is null - allowing request to proceed to client");
      return NextResponse.next();
    }

    console.log("🔒 Middleware: Redirecting unauthenticated user to sign-in", { path });
    const signInUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};