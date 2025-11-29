import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to require authentication
async function requireAuth(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerkUserId", (q: any) => q.eq("clerkUserId", identity.subject))
        .first();

    if (!userProfile) throw new Error("User profile not found");

    return { identity, userProfile };
}

// Create invitation for hybrid Clerk approach
export const createInvitationWithClerk = mutation({
    args: {
        email: v.string(),
        orgId: v.id("organizations"),
        role: v.union(
            v.literal("admin"),
            v.literal("manager"),
            v.literal("operator"),
            v.literal("member"),
            v.literal("dispatcher"),
            v.literal("driver"),
            v.literal("safety"),
            v.literal("accounting"),
            v.literal("escort"),
            v.literal("planner"),
            v.literal("ap")
        ),
    },
    handler: async (ctx, args) => {
        const { userProfile } = await requireAuth(ctx);

        // Verify admin permission
        if (userProfile.role !== "admin") {
            throw new Error("Only admins can invite users");
        }

        // Verify user belongs to org
        if (userProfile.orgId !== args.orgId) {
            throw new Error("Access denied");
        }

        const org = await ctx.db.get(args.orgId);
        if (!org) {
            throw new Error("Organization not found");
        }

        let clerkOrgId = org.clerkOrgId;

        // Self-healing: If org is missing clerkOrgId, try to recover it from user profile
        if (!clerkOrgId && userProfile.clerkOrgId) {
            console.log(`🛠️ Self-healing: Recovering clerkOrgId ${userProfile.clerkOrgId} for org ${args.orgId}`);
            clerkOrgId = userProfile.clerkOrgId;
            await ctx.db.patch(args.orgId, { clerkOrgId });
        }

        if (!clerkOrgId) {
            throw new Error("Organization not found (missing Clerk ID)");
        }

        // Check for existing pending invitation
        const existingInvite = await ctx.db
            .query("invitations")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .filter((q) => q.eq(q.field("orgId"), args.orgId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .first();

        if (existingInvite) {
            throw new Error("Pending invitation already exists for this email");
        }

        // Check if user is already a member
        const existingMember = await ctx.db
            .query("userProfiles")
            .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        if (existingMember) {
            throw new Error("User is already a member of this organization");
        }

        // Generate token (still used for internal tracking)
        const token = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        // Create invitation (clerkInvitationId will be added by client)
        const inviteId = await ctx.db.insert("invitations", {
            email: args.email,
            orgId: args.orgId,
            role: args.role,
            token,
            status: "pending",
            invitedBy: userProfile.clerkUserId,
            createdAt: Date.now(),
        });

        return { inviteId, clerkOrgId };
    },
});

// Link Clerk invitation ID after Clerk API call
export const linkClerkInvitation = mutation({
    args: {
        inviteId: v.id("invitations"),
        clerkInvitationId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.inviteId, {
            clerkInvitationId: args.clerkInvitationId,
        });
    },
});

// Get invitation by Clerk ID (for webhook processing)
export const getByClerkId = query({
    args: { clerkInvitationId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("invitations")
            .withIndex("by_clerkInvitationId", (q) =>
                q.eq("clerkInvitationId", args.clerkInvitationId)
            )
            .first();
    },
});

// Mark invitation as accepted
export const markAccepted = mutation({
    args: { clerkInvitationId: v.string() },
    handler: async (ctx, args) => {
        const invite = await ctx.db
            .query("invitations")
            .withIndex("by_clerkInvitationId", (q) =>
                q.eq("clerkInvitationId", args.clerkInvitationId)
            )
            .first();

        if (invite) {
            await ctx.db.patch(invite._id, { status: "accepted" });
        }
    },
});

// Get pending invitations for an organization
export const getOrgInvitations = query({
    args: {
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        // Verify user belongs to the org
        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerkUserId", (q: any) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!userProfile || userProfile.orgId !== args.orgId) {
            return [];
        }

        return await ctx.db
            .query("invitations")
            .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();
    },
});

// Revoke an invitation
export const revokeInvitation = mutation({
    args: {
        invitationId: v.id("invitations"),
    },
    handler: async (ctx, args) => {
        const { userProfile } = await requireAuth(ctx);

        const invite = await ctx.db.get(args.invitationId);
        if (!invite) {
            throw new Error("Invitation not found");
        }

        // Verify revoker is admin of the org
        if (userProfile.orgId !== invite.orgId || userProfile.role !== "admin") {
            throw new Error("Only admins can revoke invitations");
        }

        await ctx.db.patch(args.invitationId, {
            status: "revoked",
        });
    },
});
