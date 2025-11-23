import { NextRequest, NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export async function POST(request: NextRequest) {
  console.log("🎯 /api/onboarding-complete POST request received", {
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(request.headers.entries())
  });

  try {
    const { userId } = getAuth(request);
    console.log("🔐 Auth check:", {
      userId: userId ? "present" : "missing",
      userIdValue: userId,
      timestamp: new Date().toISOString()
    });

    if (!userId) {
      console.error("❌ Unauthorized: No userId found", {
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body to get organization details
    let requestBody;
    try {
      requestBody = await request.json();
      console.log("📋 Request body parsed successfully", {
        body: requestBody,
        timestamp: new Date().toISOString()
      });
    } catch (parseError) {
      console.error("❌ Failed to parse request body", {
        error: parseError,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { orgId, orgName, orgType } = requestBody;
    console.log("📋 Organization data:", {
      orgId,
      orgName,
      orgType,
      timestamp: new Date().toISOString()
    });

    if (!orgId || !orgName || !orgType) {
      console.error("❌ Missing required organization fields", {
        orgId: !!orgId,
        orgName: !!orgName,
        orgType: !!orgType,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: "Missing required fields: orgId, orgName and orgType" }, { status: 400 });
    }

    if (!["shipper", "carrier", "escort"].includes(orgType)) {
      console.error("❌ Invalid organization type", {
        orgType,
        validTypes: ["shipper", "carrier", "escort"],
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: "Invalid organization type" }, { status: 400 });
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    console.log("🏢 Updating organization metadata in Clerk...", {
      orgId,
      orgName,
      orgType,
      timestamp: new Date().toISOString()
    });

    // Step 1: Update the existing Clerk organization with type metadata
    const clerk = await clerkClient();
    const clerkOrganization = await clerk.organizations.updateOrganization(orgId, {
      publicMetadata: {
        type: orgType,
      },
    });

    console.log("✅ Clerk organization updated successfully:", {
      id: clerkOrganization.id,
      name: clerkOrganization.name,
      metadata: clerkOrganization.publicMetadata,
      timestamp: new Date().toISOString()
    });

    console.log("💾 Creating organization record in Convex...", {
      clerkOrgId: clerkOrganization.id,
      orgName,
      orgType,
      createdBy: userId,
      timestamp: new Date().toISOString()
    });

    // Step 2: Create the Convex org record
    const convexOrgId = await convex.mutation(api.organizations.createOrganization, {
      name: orgName,
      type: orgType,
    });

    console.log("✅ Convex organization record created successfully:", {
      convexOrgId,
      clerkOrgId: clerkOrganization.id,
      timestamp: new Date().toISOString()
    });

    console.log("👤 Marking onboarding as completed in Convex...", {
      userId,
      timestamp: new Date().toISOString()
    });

    // Step 3: Mark onboardingCompleted = true in Convex
    await convex.mutation(api.users.markOnboardingCompleted, {
      clerkUserId: userId,
      orgId: convexOrgId,
    });

    console.log("✅ Onboarding marked as completed in Convex", {
      userId,
      timestamp: new Date().toISOString()
    });

    console.log("🍪 Setting onboarding completion cookie for user:", userId);

    // Step 4: Set the ph_onboarding_completed=true cookie
    const cookieStore = cookies();
    cookieStore.set("ph_onboarding_completed", "true", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    console.log("✅ Onboarding completion cookie set successfully", {
      userId,
      cookieSet: "ph_onboarding_completed=true",
      cookieOptions: {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365
      },
      timestamp: new Date().toISOString()
    });

    // DEBUG: Log all cookies being set
    console.log("🍪 DEBUG: All cookies in response:", {
      allCookies: cookieStore.getAll(),
      timestamp: new Date().toISOString()
    });

    // Step 5: Redirect the user to /dashboard
    console.log("🔄 Redirecting user to /dashboard...", {
      userId,
      timestamp: new Date().toISOString()
    });

    // Create response with proper cookie handling
    const response = NextResponse.redirect(new URL("/dashboard", request.url), 303);

    console.log("🍪 DEBUG: Response created with redirect", {
      redirectUrl: new URL("/dashboard", request.url).toString(),
      responseHeaders: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error) {
    console.error("❌ Error in /api/onboarding-complete:", {
      error: error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}