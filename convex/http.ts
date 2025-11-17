import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occurred", { status: 400 });
    }
    
    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated":
        await ctx.runMutation(internal.users.syncFromClerk, {
          clerkUserId: event.data.id!,
          email: event.data.email_addresses?.[0]?.email_address || "",
          name: `${event.data.first_name || ""} ${event.data.last_name || ""}`.trim() || event.data.username || "",
          imageUrl: event.data.image_url,
          orgId: event.data.organization_memberships?.[0]?.organization?.id,
          orgRole: event.data.organization_memberships?.[0]?.role,
        });
        break;

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }
      
      case "organization.created": // intentional fallthrough
      case "organization.updated":
        await ctx.runMutation(internal.organizations.syncFromClerk, {
          clerkOrgId: event.data.id!,
          name: event.data.name,
          createdBy: event.data.created_by,
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

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return null;
  }

  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  
  const wh = new Webhook(webhookSecret);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;