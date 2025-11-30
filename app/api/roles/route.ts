import { auth, clerkClient, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { FALLBACK_ROLES } from "@/lib/constants";

export async function GET(request: Request) {
    try {
        // Try standard auth() first
        let authObj = await auth();
        let { userId, orgId } = authObj;

        // If that fails, try getAuth(request)
        if (!userId) {
            console.log("⚠️ auth() returned null, trying getAuth(request)");
            const reqAuth = getAuth(request as any);
            if (reqAuth.userId) {
                userId = reqAuth.userId;
                orgId = reqAuth.orgId;
                console.log("✅ getAuth(request) succeeded");
            }
        }

        console.log("🔍 API /roles Debug (v2):", {
            userId,
            orgId,
            hasAuth: !!userId,
            hasSecretKey: !!process.env.CLERK_SECRET_KEY,
            secretKeyPrefix: process.env.CLERK_SECRET_KEY ? process.env.CLERK_SECRET_KEY.substring(0, 7) : "MISSING",
            headers: Object.fromEntries(request.headers.entries())
        });

        // Try to get orgId from query params as fallback
        const url = new URL(request.url);
        const queryOrgId = url.searchParams.get("orgId");

        // Manual token parsing if auth() fails but header exists
        if (!userId) {
            const token = request.headers.get("x-clerk-auth-token");
            if (token) {
                try {
                    // Simple JWT decode (payload is 2nd part)
                    const parts = token.split(".");
                    if (parts.length === 3) {
                        const payload = JSON.parse(atob(parts[1]));
                        console.log("🔓 Manually decoded token payload:", payload);
                        if (payload.sub) {
                            userId = payload.sub;
                            console.log("✅ Recovered userId from token:", userId);
                        }
                        if (payload.org_id) {
                            orgId = payload.org_id;
                            console.log("✅ Recovered orgId from token:", orgId);
                        }
                    }
                } catch (e) {
                    console.error("Failed to decode token:", e);
                }
            }
        }

        // Use query param orgId if session orgId is missing
        if (!orgId && queryOrgId) {
            orgId = queryOrgId;
            console.log("✅ Using orgId from query params:", orgId);
        }

        if (!userId) {
            console.log("❌ API /roles: No userId found (after recovery attempts)");
            return NextResponse.json(
                { error: "Unauthorized - No User" },
                { status: 401 }
            );
        }

        if (!orgId) {
            console.log("⚠️ API /roles: No orgId found (after recovery attempts)");
            return NextResponse.json(
                { error: "Unauthorized - No Organization" },
                { status: 401 }
            );
        }

        // Fetch roles for the organization using direct API call
        const rolesUrl = `https://api.clerk.com/v1/organizations/${orgId}/roles`;
        console.log(`🌐 Fetching roles from: ${rolesUrl}`);

        const response = await fetch(rolesUrl, {
            headers: {
                Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.error(`❌ Clerk API Error: ${response.status} ${response.statusText}`);

            // If 404, try to check if the org exists at all
            if (response.status === 404) {
                const orgUrl = `https://api.clerk.com/v1/organizations/${orgId}`;
                console.log(`🕵️‍♀️ Checking if org exists: ${orgUrl}`);
                const orgResponse = await fetch(orgUrl, {
                    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` }
                });
                if (!orgResponse.ok) {
                    console.error(`❌ Organization check failed: ${orgResponse.status} ${orgResponse.statusText}`);
                    if (orgResponse.status === 404) {
                        return NextResponse.json(
                            { error: "Organization not found in Clerk. Data might be stale." },
                            { status: 404 }
                        );
                    }
                } else {
                    console.log("✅ Organization exists, but roles endpoint failed. Returning fallback roles.");
                    // Fallback roles to ensure UI works even if API fails
                    return NextResponse.json({ roles: FALLBACK_ROLES });
                }
            }

            throw new Error(`Clerk API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Clerk Roles API response:", JSON.stringify(data, null, 2));
        return NextResponse.json({ roles: data.data });
    } catch (error) {
        console.error("Error fetching roles:", error);
        return NextResponse.json(
            { error: "Failed to fetch roles" },
            { status: 500 }
        );
    }
}
