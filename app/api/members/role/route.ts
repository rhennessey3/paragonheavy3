import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(request: Request) {
  try {
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { clerkOrgId, clerkUserId, newRole } = await request.json();

    if (!clerkOrgId || !clerkUserId || !newRole) {
      return NextResponse.json(
        { error: "Missing required fields: clerkOrgId, clerkUserId, newRole" },
        { status: 400 }
      );
    }

    console.log("🔄 Updating member role in Clerk:", {
      clerkOrgId,
      clerkUserId,
      newRole,
      updatedBy: currentUserId,
    });

    // Call Clerk's API to update the organization membership role
    const response = await fetch(
      `https://api.clerk.com/v1/organizations/${clerkOrgId}/memberships/${clerkUserId}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Clerk API error:", {
        status: response.status,
        error: errorData,
      });
      
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || "Failed to update role in Clerk" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ Role updated in Clerk:", {
      clerkUserId,
      newRole,
      membership: data,
    });

    return NextResponse.json({
      success: true,
      role: newRole,
    });
  } catch (error) {
    console.error("❌ Error updating member role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

