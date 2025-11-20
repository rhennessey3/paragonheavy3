import { NextRequest, NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

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

    if (!["shipper", "carrier", "escort"].includes(type)) {
      return NextResponse.json({ error: "Invalid organization type" }, { status: 400 });
    }

    const clerk = await clerkClient();
    const organization = await clerk.organizations.createOrganization({
      name,
      createdBy: userId!,
      publicMetadata: {
        type,
      },
    });

    return NextResponse.json({ id: organization.id });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}