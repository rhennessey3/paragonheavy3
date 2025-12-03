import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organization members from Clerk
    const memberships = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    console.log("🔄 Syncing roles from Clerk to Convex:", {
      orgId,
      memberCount: memberships.data.length,
    });

    const syncResults = [];

    for (const membership of memberships.data) {
      const clerkUserId = membership.publicUserData?.userId;
      const clerkRole = membership.role;

      if (!clerkUserId || !clerkRole) {
        console.warn("⚠️ Skipping membership - missing userId or role:", membership);
        continue;
      }

      console.log("📝 Syncing member:", {
        clerkUserId,
        clerkRole,
        email: membership.publicUserData?.identifier,
      });

      // Call Convex mutation to update the role
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
      const response = await fetch(`${convexUrl}/api/mutation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "users:updateOrgMembership",
          args: {
            clerkUserId,
            clerkOrgId: orgId,
            orgRole: clerkRole,
          },
          format: "json",
        }),
      });

      if (response.ok) {
        syncResults.push({
          clerkUserId,
          clerkRole,
          status: "success",
        });
        console.log("✅ Synced role for user:", clerkUserId, clerkRole);
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to sync role for user:", clerkUserId, errorText);
        syncResults.push({
          clerkUserId,
          clerkRole,
          status: "error",
          error: errorText,
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncResults.filter(r => r.status === "success").length,
      total: syncResults.length,
      results: syncResults,
    });
  } catch (error) {
    console.error("❌ Error syncing roles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

