import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up',
  '/sign-up/verify-email-address',
  '/sign-up/sso-callback',
  '/sign-up/tasks/create-organization(.*)',
  '/dashboard(.*)',
  '/api/webhooks(.*)',
  '/api/workflows(.*)',
  '/api/onboarding-complete(.*)',
  '/invite(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  console.log("🔒 Middleware Debug:", {
    path,
    userId,
    isPublic: isPublicRoute(req)
  });

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (!userId) {
    console.log("🔒 Middleware: Redirecting unauthenticated user to sign-in", {
      path,
      userId
    });
    const signInUrl = new URL("/sign-in", req.url);
    // return NextResponse.redirect(signInUrl); // DISABLE REDIRECT FOR DEBUGGING
    console.log("🔒 Middleware: Would redirect to sign-in, but disabled for debugging");
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};