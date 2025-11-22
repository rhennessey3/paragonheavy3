import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

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

    console.log("🍪 Setting onboarding completion cookie for user:", userId);
    
    // Set the onboarding completion cookie
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

    return NextResponse.json({ 
      success: true, 
      message: "Onboarding completion cookie set" 
    });
  } catch (error) {
    console.error("❌ Error in /api/onboarding-complete:", {
      error: error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: "Failed to set onboarding completion cookie" },
      { status: 500 }
    );
  }
}