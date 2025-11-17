import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, type } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // For now, return a mock organization response
    // TODO: Implement actual Clerk organization creation when API is available
    const mockOrganization = {
      id: `org_${Date.now()}`,
      name,
      public_metadata: {
        type,
      },
      private_metadata: {
        type,
      },
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(mockOrganization);
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}