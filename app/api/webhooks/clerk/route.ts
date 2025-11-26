import { serve } from "@upstash/workflow/nextjs";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/backend";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

async function validateRequest(
    payloadString: string,
    headerPayload: Headers
): Promise<WebhookEvent | null> {
    if (!webhookSecret) {
        console.error("❌ CLERK_WEBHOOK_SECRET not set");
        return null;
    }

    const svixHeaders = {
        "svix-id": headerPayload.get("svix-id")!,
        "svix-timestamp": headerPayload.get("svix-timestamp")!,
        "svix-signature": headerPayload.get("svix-signature")!,
    };

    const wh = new Webhook(webhookSecret);
    try {
        const event = wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
        console.log("✅ Webhook signature verified for event:", event.type);
        return event;
    } catch (error) {
        console.error("❌ Error verifying webhook event:", {
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}

export const { POST } = serve<string>(
    async (context) => {
        const payloadString = context.requestPayload;
        const headerPayload = context.headers;

        // Validate the webhook
        const event = await context.run("validate-webhook", async () => {
            return await validateRequest(payloadString, headerPayload);
        });

        if (!event) {
            console.log("❌ Webhook validation failed");
            return;
        }

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

                    const response = await fetch(`${convexUrl}/api/run`, {
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
                await context.run("update-org-membership", async () => {
                    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

                    console.log(`👥 ${event.type}:`, {
                        clerkUserId: event.data.public_user_data?.user_id,
                        orgId: event.data.organization?.id,
                        role: event.data.role,
                    });

                    const response = await fetch(`${convexUrl}/api/run`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "users:updateOrgMembership",
                            args: {
                                clerkUserId: event.data.public_user_data?.user_id!,
                                clerkOrgId: event.data.organization?.id!,
                                orgRole: event.data.role,
                            },
                            format: "json",
                        }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`❌ Failed to update org membership: ${errorText}`);
                        // Throw to trigger Upstash retry
                        throw new Error(`Failed to update org membership: ${response.statusText}`);
                    }

                    console.log(`✅ Org membership updated for user ${event.data.public_user_data?.user_id}`);
                });
                break;
            }

            case "organization.created":
            case "organization.updated": {
                await context.run("sync-organization-to-convex", async () => {
                    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

                    console.log(`🏢 ${event.type}:`, {
                        clerkOrgId: event.data.id,
                        name: event.data.name,
                        createdBy: event.data.created_by,
                    });

                    const response = await fetch(`${convexUrl}/api/run`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            path: "organizations:syncFromClerk",
                            args: {
                                clerkOrgId: event.data.id!,
                                name: event.data.name,
                                createdBy: event.data.created_by,
                            },
                            format: "json",
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to sync organization: ${response.statusText}`);
                    }

                    console.log(`✅ Organization sync completed for ${event.data.id}`);
                });
                break;
            }

            case "user.deleted": {
                await context.run("delete-user-from-convex", async () => {
                    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

                    const response = await fetch(`${convexUrl}/api/run`, {
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

                    const response = await fetch(`${convexUrl}/api/run`, {
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

            default:
                console.log("Ignored Clerk webhook event:", event.type);
        }
    },
    {
        initialPayloadParser: (payload) => {
            return payload;
        },
    }
);
