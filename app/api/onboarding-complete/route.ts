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

    const { orgName, orgType } = requestBody;
    console.log("📋 Organization data:", {
      orgName,
      orgType,
      timestamp: new Date().toISOString()
    });

    if (!orgName || !orgType) {
      console.error("❌ Missing required organization fields", {
        orgName: !!orgName,
        orgType: !!orgType,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: "Missing required fields: orgName and orgType" }, { status: 400 });
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
    
    console.log("🏢 Creating organization in Clerk...", {
      orgName,
      orgType,
      createdBy: userId,
      timestamp: new Date().toISOString()
    });
    
    // Step 1: Create the Clerk organization
    const clerk = await clerkClient();
    const clerkOrganization = await clerk.organizations.createOrganization({
      name: orgName,
      createdBy: userId!,
      publicMetadata: {
        type: orgType,
      },
    });

    // Step 1.5: Add user as admin to the Clerk organization
    await clerk.organizations.createOrganizationMembership({
      organizationId: clerkOrganization.id,
      userId: userId!,
      role: "admin",
    });

    console.log("✅ Clerk organization created successfully:", {
      id: clerkOrganization.id,
      name: clerkOrganization.name,
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
      clerkOrgId: clerkOrganization.id,
      createdBy: userId,
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
      timestamp: new Date().toISOString()
    });

    // Step 5: Redirect the user to /dashboard
    console.log("🔄 Redirecting user to /dashboard...", {
      userId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
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