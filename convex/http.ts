import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

// DEPRECATED: This webhook handler has been replaced by Upstash Workflow
// See app/api/webhooks/clerk/route.ts for the new implementation
// Keeping this code commented for reference during migration

/*
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const requestUrl = new URL(request.url);
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    console.log("🔔 Clerk webhook received:", {
      url: requestUrl.origin + requestUrl.pathname,
      method: request.method,
      headers
    });
    
    const event = await validateRequest(request);
    if (!event) {
      console.log("❌ Webhook validation failed");
      return new Response("Error occurred", { status: 400 });
    }
    
    console.log("✅ Webhook validated successfully:", event.type);
    
    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated":
        console.log(`👤 ${event.type}:`, {
          clerkUserId: event.data.id!,
          email: event.data.email_addresses?.[0]?.email_address || "",
          name: `${event.data.first_name || ""} ${event.data.last_name || ""}`.trim() || event.data.username || "",
          orgId: event.data.organization_memberships?.[0]?.organization?.id,
          orgRole: event.data.organization_memberships?.[0]?.role,
        });
        await ctx.runMutation(internal.users.syncFromClerk, {
          clerkUserId: event.data.id!,
          email: event.data.email_addresses?.[0]?.email_address || "",
          name: `${event.data.first_name || ""} ${event.data.last_name || ""}`.trim() || event.data.username || "",
          imageUrl: event.data.image_url,
          orgId: event.data.organization_memberships?.[0]?.organization?.id,
          orgRole: event.data.organization_memberships?.[0]?.role,
          emailVerified: event.data.email_addresses?.[0]?.verification?.status === "verified",
        });
        console.log(`✅ User sync completed for ${event.data.id!}`);
        break;

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }
      
      case "organization.created": // intentional fallthrough
      case "organization.updated":
        console.log(`🏢 ${event.type}:`, {
          clerkOrgId: event.data.id!,
          name: event.data.name,
          createdBy: event.data.created_by,
          publicMetadata: event.data.public_metadata,
          privateMetadata: event.data.private_metadata,
          createdAt: event.data.created_at,
          updatedAt: event.data.updated_at,
        });
        
        // Check if this is a duplicate creation attempt
        const existingOrgCheck = await ctx.runQuery(api.organizations.getOrganization, {
          clerkOrgId: event.data.id!,
        });
        console.log(`🔍 Pre-sync organization check:`, {
          clerkOrgId: event.data.id!,
          existingOrg: !!existingOrgCheck,
          existingOrgId: existingOrgCheck?._id,
          eventType: event.type
        });
        
        const syncResult = await ctx.runMutation(internal.organizations.syncFromClerk, {
          clerkOrgId: event.data.id!,
          name: event.data.name,
          createdBy: event.data.created_by,
        });
        console.log(`✅ Organization sync completed for ${event.data.id!}:`, {
          syncResult,
          wasCreated: !!syncResult,
          wasUpdated: !syncResult
        });
        break;

      case "organization.deleted": {
        const clerkOrgId = event.data.id!;
        await ctx.runMutation(internal.organizations.deleteFromClerk, { clerkOrgId });
        break;
      }
      
      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});
*/

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  console.log("🔍 Environment check:", {
    hasWebhookSecret: !!webhookSecret,
    webhookSecretLength: webhookSecret?.length || 0,
    nodeEnv: process.env.NODE_ENV
  });

  if (!webhookSecret) {
    console.error("❌ CLERK_WEBHOOK_SECRET not set");
    return null;
  }

  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };

  console.log("🔍 Webhook validation:", {
    hasSecret: !!webhookSecret,
    hasSvixId: !!svixHeaders["svix-id"],
    hasSvixTimestamp: !!svixHeaders["svix-timestamp"],
    hasSvixSignature: !!svixHeaders["svix-signature"],
    payloadLength: payloadString.length,
    payloadPreview: payloadString.substring(0, 100) + "..."
  });

  const wh = new Webhook(webhookSecret);
  try {
    const event = wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
    console.log("✅ Webhook signature verified for event:", event.type);
    return event;
  } catch (error) {
    console.error("❌ Error verifying webhook event:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      headers: svixHeaders,
      payloadLength: payloadString.length
    });
    return null;
  }
}

export default http;