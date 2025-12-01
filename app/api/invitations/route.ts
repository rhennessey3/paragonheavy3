import { auth, getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/invitations/roles - Fetch available roles from Clerk
export async function GET(req: NextRequest) {
    try {
        // Fetch roles from Clerk's Backend API
        const clerkResponse = await fetch(
            "https://api.clerk.com/v1/organizations/roles",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!clerkResponse.ok) {
            const errorData = await clerkResponse.json().catch(() => ({}));
            console.error("❌ Clerk roles API error:", {
                status: clerkResponse.status,
                error: errorData,
            });
            return NextResponse.json(
                { error: "Failed to fetch roles from Clerk" },
                { status: clerkResponse.status }
            );
        }

        const rolesData = await clerkResponse.json();
        console.log("✅ Clerk roles fetched:", rolesData);

        // Transform roles into a simpler format for the frontend
        const roles = rolesData.data?.map((role: any) => ({
            key: role.key,
            name: role.name,
            description: role.description,
        })) || [];

        return NextResponse.json({ roles });
    } catch (error) {
        console.error("❌ /api/invitations GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Clerk Organization Invitation API integration
// POST /api/invitations - Create invitation via Clerk API (sends email)
export async function POST(req: NextRequest) {
    try {
        // Try standard auth() first
        let authObj = await auth();
        let { userId, orgId: clerkOrgId } = authObj;

        // If that fails, try getAuth(request)
        if (!userId) {
            console.log("⚠️ auth() returned null, trying getAuth(request)");
            const reqAuth = getAuth(req as any);
            if (reqAuth.userId) {
                userId = reqAuth.userId;
                clerkOrgId = reqAuth.orgId;
                console.log("✅ getAuth(request) succeeded");
            }
        }

        // Manual token parsing if auth() fails but header exists
        if (!userId) {
            const token = req.headers.get("x-clerk-auth-token");
            if (token) {
                try {
                    const parts = token.split(".");
                    if (parts.length === 3) {
                        const payload = JSON.parse(atob(parts[1]));
                        if (payload.sub) userId = payload.sub;
                        if (payload.org_id) clerkOrgId = payload.org_id;
                        console.log("✅ Recovered auth from token:", { userId, clerkOrgId });
                    }
                } catch (e) {
                    console.error("Failed to decode token:", e);
                }
            }
        }

        const body = await req.json();
        const { email, role, clerkRole: providedClerkRole, convexInviteId, orgId: bodyOrgId } = body;

        // Fallback to body orgId if session orgId is missing
        if (!clerkOrgId && bodyOrgId) {
            clerkOrgId = bodyOrgId;
            console.log("✅ Using orgId from request body:", clerkOrgId);
        }

        if (!userId || !clerkOrgId) {
            console.log("❌ /api/invitations: Unauthorized - missing userId or orgId", { userId, clerkOrgId });
            return NextResponse.json(
                { error: "Unauthorized - must be signed in and have an active organization" },
                { status: 401 }
            );
        }

        if (!email || !role) {
            return NextResponse.json(
                { error: "Missing required fields: email, role" },
                { status: 400 }
            );
        }

        console.log("📧 Creating Clerk organization invitation:", {
            email,
            role,
            providedClerkRole,
            clerkOrgId,
            invitedBy: userId,
        });

        // Use the provided Clerk role key if available, otherwise fall back to mapping
        let clerkRole = providedClerkRole;

        if (!clerkRole) {
            // Fallback mapping for backwards compatibility
            const roleMapping: Record<string, string> = {
                admin: "org:admin",
                member: "org:member",
                dispatch: "org:dispatch",
                accounting: "org:accounting",
                heavy_haul_rig_operator: "org:heavy_haul_rig_operator",
                escort_operator: "org:escort_operator",
                // Legacy mappings
                operator: "org:heavy_haul_rig_operator",
                manager: "org:admin",
                dispatcher: "org:dispatch",
                driver: "org:member",
                safety: "org:member",
                escort: "org:escort_operator",
                planner: "org:dispatch",
                ap: "org:accounting",
            };
            clerkRole = roleMapping[role] || "org:member";
        }

        console.log("🔄 Final role for Clerk:", { internalRole: role, clerkRole });

        // Call Clerk's Backend API to create organization invitation
        // Use the app URL, preferring ngrok URL for webhook consistency
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        const clerkResponse = await fetch(
            `https://api.clerk.com/v1/organizations/${clerkOrgId}/invitations`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email_address: email,
                    role: clerkRole,
                    // redirect_url is where users go after Clerk handles sign-up/sign-in
                    // Use "/" (public route) to avoid auth redirect issues, then let the 
                    // home page redirect signed-in users to dashboard
                    redirect_url: `${appUrl}/`,
                }),
            }
        );

        if (!clerkResponse.ok) {
            const errorData = await clerkResponse.json().catch(() => ({}));
            console.error("❌ Clerk invitation API error:", {
                status: clerkResponse.status,
                statusText: clerkResponse.statusText,
                error: errorData,
            });

            // Handle specific error cases
            if (clerkResponse.status === 400 && errorData?.errors?.[0]?.code === "duplicate_record") {
                return NextResponse.json(
                    { error: "An invitation for this email already exists in this organization" },
                    { status: 400 }
                );
            }

            if (clerkResponse.status === 422 && errorData?.errors?.[0]?.message?.includes("already a member")) {
                return NextResponse.json(
                    { error: "This user is already a member of the organization" },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: errorData?.errors?.[0]?.message || "Failed to create invitation in Clerk" },
                { status: clerkResponse.status }
            );
        }

        const clerkInvitation = await clerkResponse.json();

        console.log("✅ Clerk invitation created:", {
            clerkInvitationId: clerkInvitation.id,
            email: clerkInvitation.email_address,
            status: clerkInvitation.status,
        });

        // If we have a Convex invite ID, link the Clerk invitation ID to it
        if (convexInviteId) {
            try {
                const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
                await fetch(`${convexUrl}/api/mutation`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        path: "invitations:linkClerkInvitation",
                        args: {
                            inviteId: convexInviteId,
                            clerkInvitationId: clerkInvitation.id,
                        },
                        format: "json",
                    }),
                });
                console.log("✅ Linked Clerk invitation to Convex record");
            } catch (linkError) {
                console.warn("⚠️ Failed to link Clerk invitation to Convex:", linkError);
                // Don't fail the request - the invitation was still created
            }
        }

        return NextResponse.json({
            success: true,
            clerkInvitationId: clerkInvitation.id,
            email: clerkInvitation.email_address,
            status: clerkInvitation.status,
        });

    } catch (error) {
        console.error("❌ /api/invitations error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}