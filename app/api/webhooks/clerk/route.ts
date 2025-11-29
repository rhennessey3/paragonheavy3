import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Client } from "@upstash/qstash";

export async function POST(req: Request) {
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!SIGNING_SECRET) {
        throw new Error("Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
    }

    // Create new Svix instance with secret
    const wh = new Webhook(SIGNING_SECRET);

    // Get headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error: Missing Svix headers", {
            status: 400,
        });
    }

    // Get body
    const payloadString = await req.text();

    console.log("Webhook Debug:", {
        svix_id,
        svix_timestamp,
        svix_signature,
        payloadLength: payloadString.length,
        secretLength: SIGNING_SECRET.length,
        secretStart: SIGNING_SECRET.substring(0, 5)
    });

    let evt: WebhookEvent;

    // Verify payload with headers
    try {
        evt = wh.verify(payloadString, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("Error: Could not verify webhook:", err);
        return new Response("Error: Verification error", {
            status: 400,
        });
    }

    // Initialize QStash client
    const client = new Client({ token: process.env.QSTASH_TOKEN! });

    // Construct the workflow URL
    // In production, this should be your production URL.
    // In development with ngrok, we can use the host header.
    let workflowUrl = process.env.UPSTASH_WORKFLOW_URL;
    if (!workflowUrl) {
        const host = headerPayload.get("host");
        const protocol = host?.includes("localhost") ? "http" : "https";
        workflowUrl = `${protocol}://${host}`;
    }
    workflowUrl = `${workflowUrl}/api/workflows/clerk`;

    console.log(`🚀 Triggering workflow at ${workflowUrl} for event: ${evt.type}`);

    try {
        await client.publishJSON({
            url: workflowUrl,
            body: evt,
        });
        return new Response("Webhook received and workflow triggered", { status: 200 });
    } catch (error) {
        console.error("❌ Failed to trigger workflow:", error);
        return new Response("Failed to trigger workflow", { status: 500 });
    }
}
