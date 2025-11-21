import { NextRequest, NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  console.log("🏢 /api/organizations POST request received", {
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

    const { name, type } = requestBody;
    console.log("📋 Request data:", {
      name,
      type,
      timestamp: new Date().toISOString()
    });

    if (!name || !type) {
      console.error("❌ Missing required fields", {
        name: !!name,
        type: !!type,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["shipper", "carrier", "escort"].includes(type)) {
      console.error("❌ Invalid organization type", {
        type,
        validTypes: ["shipper", "carrier", "escort"],
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: "Invalid organization type" }, { status: 400 });
    }

    console.log("🔧 Creating organization in Clerk...", {
      name,
      type,
      createdBy: userId,
      timestamp: new Date().toISOString()
    });
    
    const clerk = await clerkClient();
    const organization = await clerk.organizations.createOrganization({
      name,
      createdBy: userId!,
      publicMetadata: {
        type,
      },
    });

    console.log("✅ Clerk organization created successfully:", {
      id: organization.id,
      name: organization.name,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ id: organization.id });
  } catch (error) {
    console.error("❌ Error in /api/organizations:", {
      error: error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
    console.log("🔧 /api/organizations PATCH request received", {
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
  
      const { organizationId, type } = requestBody;
      console.log("📋 Request data:", {
        organizationId,
        type,
        timestamp: new Date().toISOString()
      });
  
      if (!organizationId || !type) {
        console.error("❌ Missing required fields", {
          organizationId: !!organizationId,
          type: !!type,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
  
      if (!["shipper", "carrier", "escort"].includes(type)) {
        console.error("❌ Invalid organization type", {
          type,
          validTypes: ["shipper", "carrier", "escort"],
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({ error: "Invalid organization type" }, { status: 400 });
      }
  
      console.log("🔧 Updating organization in Clerk...", {
        organizationId,
        type,
        timestamp: new Date().toISOString()
      });
      
      const clerk = await clerkClient();
      const organization = await clerk.organizations.updateOrganization(organizationId, {
        publicMetadata: {
          type,
        },
      });
  
      console.log("✅ Clerk organization updated successfully:", {
        id: organization.id,
        name: organization.name,
        type: (organization.publicMetadata as any)?.type,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        id: organization.id,
        name: organization.name,
        type: (organization.publicMetadata as any)?.type
      });
    } catch (error) {
      console.error("❌ Error in /api/organizations:", {
        error: error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 }
      );
    }
  }