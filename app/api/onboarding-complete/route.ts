import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { verifyToken } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  console.log("🎯 /api/onboarding-complete POST request received", {
    timestamp: new Date().toISOString(),
  });

  try {
    const { userId } = await auth();
    console.log("🔐 Auth check:", {
      userId: userId ? "present" : "missing",
      hasCookie: request.headers.has("cookie"),
      cookieLength: request.headers.get("cookie")?.length || 0,
      hasAuthHeader: request.headers.has("authorization"),
      authHeaderLength: request.headers.get("authorization")?.length || 0,
      secretKeyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 7) || "missing",
      secretKeySuffix: process.env.CLERK_SECRET_KEY?.slice(-5) || "missing",
      userAgent: request.headers.get("user-agent"),
      timestamp: new Date().toISOString()
    });

    // Debug: Decode token to check issuer
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log("🔍 Token Payload Debug:", {
            iss: payload.iss,
            azp: payload.azp,
            sub: payload.sub,
            exp: new Date(payload.exp * 1000).toISOString(),
            iat: new Date(payload.iat * 1000).toISOString()
          });
        }
      } catch (e) {
        console.error("❌ Failed to decode token:", e);
      }
    }

    let finalUserId = userId;

    if (!finalUserId) {
      console.error("❌ Unauthorized: No userId found via auth()");

      // Debug: Try manual verification with backend SDK
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.split(" ")[1];

          const verified = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
          });

          console.log("✅ Manual verification SUCCEEDED!", verified);

          if (verified.sub) {
            console.log("🔓 Bypassing auth() failure with manual verification");
            finalUserId = verified.sub;
          }

        } catch (verifyError: any) {
          console.error("🚨 Manual verification FAILED. Reason:", {
            message: verifyError.message,
            reason: verifyError.reason,
            code: verifyError.code
          });
        }
      }
    }

    if (!finalUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body to get organization details
    const { orgId, orgType } = await request.json();
    console.log("📋 Organization data:", { orgId, orgType });

    if (!orgId || !orgType) {
      console.error("❌ Missing required fields");
      return NextResponse.json({ error: "Missing required fields: orgId and orgType" }, { status: 400 });
    }

    if (!["shipper", "carrier", "escort"].includes(orgType)) {
      console.error("❌ Invalid organization type:", orgType);
      return NextResponse.json({ error: "Invalid organization type" }, { status: 400 });
    }

    console.log("🏢 Updating organization metadata in Clerk...");

    // Update the Clerk organization with type metadata
    // This will trigger an organization.updated webhook which will sync to Convex
    const clerk = await clerkClient();
    await clerk.organizations.updateOrganization(orgId, {
      publicMetadata: {
        type: orgType,
      },
    });

    console.log("✅ Clerk organization updated successfully");

    // Sync organization and user to Convex directly (don't wait for webhook)
    // This ensures the user sees the dashboard immediately without the "Complete Setup" prompt
    console.log("🔄 Syncing to Convex...");
    
    try {
      // Get user details from Clerk
      const clerkUser = await clerk.users.getUser(finalUserId);
      const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "";
      const userName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "";
      
      // Step 1: Sync the user profile to Convex (create if doesn't exist)
      console.log("🔄 Syncing user profile to Convex...");
      await convex.mutation(api.users.syncFromClerk, {
        clerkUserId: finalUserId,
        email: userEmail,
        name: userName,
        imageUrl: clerkUser.imageUrl,
        emailVerified: clerkUser.emailAddresses?.[0]?.verification?.status === "verified",
      });
      console.log("✅ User profile synced to Convex");

      // Step 2: Get org details and sync organization to Convex
      console.log("🔄 Syncing organization to Convex...");
      const clerkOrg = await clerk.organizations.getOrganization({ organizationId: orgId });
      await convex.mutation(api.organizations.syncFromClerk, {
        clerkOrgId: orgId,
        name: clerkOrg.name,
        createdBy: finalUserId,
        type: orgType as "shipper" | "carrier" | "escort",
      });
      console.log("✅ Organization synced to Convex");

      // Step 3: Update the user's org membership
      console.log("🔄 Updating user org membership...");
      await convex.mutation(api.users.updateOrgMembership, {
        clerkUserId: finalUserId,
        clerkOrgId: orgId,
        orgRole: "org:admin", // Creator is admin
      });
      console.log("✅ User org membership synced to Convex");
    } catch (convexError) {
      console.error("⚠️ Convex sync error (webhook will retry):", convexError);
      // Don't fail the request - webhook will eventually sync
    }

    // Return success JSON so client can handle navigation
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error in /api/onboarding-complete:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}