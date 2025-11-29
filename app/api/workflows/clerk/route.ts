import { serve } from "@upstash/workflow/nextjs";
import type { WebhookEvent } from "@clerk/backend";

export const { POST } = serve<WebhookEvent>(
    async (context) => {
        const event = context.requestPayload;

        console.log("✅ Processing webhook event:", event.type);

        // Handle different event types
        switch (event.type) {
            case "user.created":
            case "user.updated": {
                await context.run("sync-user-to-convex", async () => {
                    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

                    console.log(`👤 ${event.type}:`, {
                        clerkUserId: event.data.id,
                        email: event.data.email_addresses?.[0]?.email_address,
                        name: `${event.data.first_name || ""} ${event.data.last_name || ""}`.trim(),
                    });

                    const response = await fetch(`${convexUrl}/api/mutation`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "users:syncFromClerk",
                            args: {
                                clerkUserId: event.data.id!,
                                email: event.data.email_addresses?.[0]?.email_address || "",
                                name: `${event.data.first_name || ""} ${event.data.last_name || ""}`.trim() || event.data.username || "",
                                imageUrl: event.data.image_url,
                                orgId: event.data.organization_memberships?.[0]?.organization?.id,
                                orgRole: event.data.organization_memberships?.[0]?.role,
                                emailVerified: event.data.email_addresses?.[0]?.verification?.status === "verified",
                            },
                            format: "json",
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to sync user: ${response.statusText}`);
                    }

                    console.log(`✅ User sync completed for ${event.data.id}`);
                });
                break;
            }

            case "organizationMembership.created":
            case "organizationMembership.updated": {
                const clerkOrgId = event.data.organization?.id!;
                const clerkUserId = event.data.public_user_data?.user_id!;

                // Step 1: Verify organization exists in Convex before updating membership
                // If this fails, we throw an error to trigger Upstash retry
                await context.run("verify-org-exists", async () => {
                    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

                    console.log(`🔍 Checking if org exists in Convex: ${clerkOrgId}`);

                    const response = await fetch(`${convexUrl}/api/query`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "organizations:getOrganization",
                            args: { clerkOrgId },
                            format: "json",
                        }),
                    });

                    const data = await response.json();
                    if (!data.value) {
                        console.error(`❌ Organization not found in Convex: ${clerkOrgId}`);
                        throw new Error(`Organization not ready yet - will retry`);
                    }

                    console.log(`✅ Organization exists in Convex: ${clerkOrgId}`);
                });

                // Step 2: Update org membership
                await context.run("update-org-membership", async () => {
                    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

                    console.log(`👥 ${event.type}:`, {
                        clerkUserId,
                        orgId: clerkOrgId,
                        role: event.data.role,
                    });

                    const response = await fetch(`${convexUrl}/api/mutation`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "users:updateOrgMembership",
                            args: {
                                clerkUserId,
                                clerkOrgId,
                                orgRole: event.data.role,
                            },
                            format: "json",
                        }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`❌ Failed to update org membership: ${errorText}`);
                        throw new Error(`Failed to update org membership: ${response.statusText}`);
                    }

                    console.log(`✅ Org membership updated for user ${clerkUserId}`);
                });
                break;
            }

            case "organization.created":
            case "organization.updated": {
                const clerkOrgId = event.data.id!;

                // Step 1: Sync organization to Convex
                await context.run("sync-organization-to-convex", async () => {
                    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

                    console.log(`🏢 ${event.type}:`, {
                        clerkOrgId,
                        name: event.data.name,
                        createdBy: event.data.created_by,
                    });

                    const response = await fetch(`${convexUrl}/api/mutation`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "organizations:syncFromClerk",
                            args: {
                                clerkOrgId,
                                name: event.data.name,
                                createdBy: event.data.created_by,
                                type: (event.data.public_metadata as any)?.type,
                            },
                            format: "json",
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to sync organization: ${response.statusText}`);
                    }

                    console.log(`✅ Organization sync completed for ${clerkOrgId}`);
                });

                // Step 2: Verify organization was created successfully
                if (event.type === "organization.created") {
                    await context.run("verify-org-created", async () => {
                        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

                        console.log(`🔍 Verifying org was created: ${clerkOrgId}`);

                        const response = await fetch(`${convexUrl}/api/query`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                path: "organizations:getOrganization",
                                args: { clerkOrgId },
                                format: "json",
                            }),
                        });

                        const data = await response.json();
                        if (!data.value) {
                            console.error(`❌ Organization verification failed: ${clerkOrgId}`);
                            throw new Error(`Organization creation verification failed - will retry`);
                        }

                        console.log(`✅ Organization verified in Convex: ${clerkOrgId}`);
                    });
                }
                break;
            }

            case "user.deleted": {
                await context.run("delete-user-from-convex", async () => {
                    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

                    const response = await fetch(`${convexUrl}/api/mutation`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "users:deleteFromClerk",
                            args: {
                                clerkUserId: event.data.id!,
                            },
                            format: "json",
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to delete user: ${response.statusText}`);
                    }

                    console.log(`✅ User deleted: ${event.data.id}`);
                });
                break;
            }

            case "organization.deleted": {
                await context.run("delete-organization-from-convex", async () => {
                    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

                    const response = await fetch(`${convexUrl}/api/mutation`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "organizations:deleteFromClerk",
                            args: {
                                clerkOrgId: event.data.id!,
                            },
                            format: "json",
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to delete organization: ${response.statusText}`);
                    }

                    console.log(`✅ Organization deleted: ${event.data.id}`);
                });
                break;
            }

            case "organizationInvitation.accepted": {
                await context.run("process-invitation-accepted", async () => {
                    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
                    const invitation = event.data as any; // Type assertion for invitation data

                    console.log("📧 organizationInvitation.accepted:", {
                        invitationId: invitation.id,
                        email: invitation.email_address,
                        orgId: invitation.organization_id,
                        userId: invitation.public_user_data?.user_id,
                    });

                    // Look up the role in Convex
                    const convexInviteResponse = await fetch(`${convexUrl}/api/query`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "invitations:getByClerkId",
                            args: {
                                clerkInvitationId: invitation.id,
                            },
                            format: "json",
                        }),
                    });

                    if (!convexInviteResponse.ok) {
                        console.warn("Failed to fetch Convex invitation:", convexInviteResponse.statusText);
                        return;
                    }

                    const convexInvite = await convexInviteResponse.json();

                    if (!convexInvite) {
                        console.warn("No Convex invitation found for:", invitation.id);
                        return;
                    }

                    // Update user profile with the correct role
                    const updateResponse = await fetch(`${convexUrl}/api/mutation`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "users:updateOrgMembership",
                            args: {
                                clerkUserId: invitation.public_user_data?.user_id,
                                clerkOrgId: invitation.organization_id,
                                orgRole: convexInvite.role, // Use role from Convex
                            },
                            format: "json",
                        }),
                    });

                    if (!updateResponse.ok) {
                        throw new Error(`Failed to update user role: ${updateResponse.statusText}`);
                    }

                    // Mark invitation as accepted
                    await fetch(`${convexUrl}/api/mutation`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "invitations:markAccepted",
                            args: {
                                clerkInvitationId: invitation.id,
                            },
                            format: "json",
                        }),
                    });

                    console.log(`✅ Invitation accepted and role assigned: ${convexInvite.role}`);
                });
                break;
            }

            default:
                console.log("Ignored Clerk webhook event:", event.type);
        }
    },
    {
        baseUrl: process.env.UPSTASH_WORKFLOW_URL,
    }
);
