import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

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
        const session = await requireAuthSession(ctx);

        // Get user profile
        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", session.sub))
            .first();

        if (!userProfile) throw new Error("User profile not found");

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

        return { inviteId, clerkOrgId, token };
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

// Get all invitations for an organization (pending, accepted, revoked)
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

        // Get all invitations (not filtered by status)
        const invitations = await ctx.db
            .query("invitations")
            .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
            .order("desc")
            .collect();

        // Enrich with inviter information
        const enrichedInvitations = await Promise.all(
            invitations.map(async (invite) => {
                const inviter = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_clerkUserId", (q: any) => q.eq("clerkUserId", invite.invitedBy))
                    .first();

                return {
                    ...invite,
                    inviterName: inviter?.name || "Unknown",
                };
            })
        );

        return enrichedInvitations;
    },
});

// Revoke an invitation
export const revokeInvitation = mutation({
    args: {
        invitationId: v.id("invitations"),
    },
    handler: async (ctx, args) => {
        const session = await requireAuthSession(ctx);

        // Get user profile
        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", session.sub))
            .first();

        if (!userProfile) throw new Error("User profile not found");

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

// Get invitation by token (for public invite page)
export const getInvitationByToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const invite = await ctx.db
            .query("invitations")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!invite) return null;

        // Return limited info for public page
        const org = await ctx.db.get(invite.orgId);
        return {
            ...invite,
            orgName: org?.name,
        };
    },
});

// Accept invitation via token
export const acceptInvitation = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        console.log("🎫 acceptInvitation called with token:", args.token.substring(0, 8) + "...");
        
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("❌ acceptInvitation: No identity found - user not authenticated");
            throw new Error("Unauthorized");
        }
        
        console.log("👤 acceptInvitation: User identity found:", {
            subject: identity.subject,
            email: identity.email,
        });

        const invite = await ctx.db
            .query("invitations")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!invite || invite.status !== "pending") {
            console.log("❌ acceptInvitation: Invalid/expired invitation:", {
                inviteFound: !!invite,
                status: invite?.status,
            });
            throw new Error("Invalid or expired invitation");
        }
        
        console.log("✅ acceptInvitation: Invitation found:", {
            inviteId: invite._id,
            email: invite.email,
            orgId: invite.orgId,
            role: invite.role,
        });

        const org = await ctx.db.get(invite.orgId);
        if (!org) {
            console.log("❌ acceptInvitation: Organization not found:", invite.orgId);
            throw new Error("Organization not found");
        }
        
        console.log("✅ acceptInvitation: Organization found:", {
            orgId: org._id,
            name: org.name,
            clerkOrgId: org.clerkOrgId,
        });

        let userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!userProfile) {
            console.log("⚠️ acceptInvitation: User profile NOT found for clerkUserId:", identity.subject);
            console.log("🔧 Creating user profile on-demand for invited user...");
            
            // Create user profile on-demand if webhook hasn't processed yet
            const now = Date.now();
            const userProfileId = await ctx.db.insert("userProfiles", {
                clerkUserId: identity.subject,
                email: identity.email || invite.email,
                name: identity.name || identity.email?.split("@")[0] || "Unknown",
                role: invite.role,
                orgId: invite.orgId,
                clerkOrgId: org.clerkOrgId,
                createdAt: now,
                lastActiveAt: now,
            });
            
            console.log("✅ acceptInvitation: User profile created on-demand:", userProfileId);
            
            // Mark invitation as accepted
            await ctx.db.patch(invite._id, {
                status: "accepted",
            });
            
            console.log("✅ acceptInvitation: Invitation marked as accepted");
            return { orgId: invite.orgId };
        }

        console.log("✅ acceptInvitation: Existing user profile found:", {
            profileId: userProfile._id,
            existingOrgId: userProfile.orgId,
            existingRole: userProfile.role,
        });

        // Update user profile
        await ctx.db.patch(userProfile._id, {
            orgId: invite.orgId,
            role: invite.role,
            clerkOrgId: org.clerkOrgId,
        });
        
        console.log("✅ acceptInvitation: User profile updated with org info");

        // Mark invitation as accepted
        await ctx.db.patch(invite._id, {
            status: "accepted",
        });
        
        console.log("✅ acceptInvitation: Invitation marked as accepted");

        return { orgId: invite.orgId };
    },
});
