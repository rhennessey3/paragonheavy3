import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new invitation
export const createInvitation = mutation({
    args: {
        email: v.string(),
        orgId: v.id("organizations"),
        role: v.union(v.literal("admin"), v.literal("manager"), v.literal("operator")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Verify the inviter is an admin of the organization
        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!userProfile || userProfile.orgId !== args.orgId || userProfile.role !== "admin") {
            throw new Error("Only admins can invite members");
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

        // Check if user is already a member of the organization
        const existingMember = await ctx.db
            .query("userProfiles")
            .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        if (existingMember) {
            throw new Error("User is already a member of this organization");
        }

        // Generate a simple random token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const inviteId = await ctx.db.insert("invitations", {
            email: args.email,
            orgId: args.orgId,
            role: args.role,
            token,
            status: "pending",
            invitedBy: identity.subject,
            createdAt: Date.now(),
        });

        return { inviteId, token };
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
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const invite = await ctx.db.get(args.invitationId);
        if (!invite) {
            throw new Error("Invitation not found");
        }

        // Verify revoker is admin of the org
        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!userProfile || userProfile.orgId !== invite.orgId || userProfile.role !== "admin") {
            throw new Error("Only admins can revoke invitations");
        }

        await ctx.db.patch(args.invitationId, {
            status: "revoked",
        });
    },
});

// Get invitation details by token (publicly accessible for landing page)
export const getInvitationByToken = query({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const invite = await ctx.db
            .query("invitations")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!invite || invite.status !== "pending") {
            return null;
        }

        const org = await ctx.db.get(invite.orgId);

        return {
            ...invite,
            orgName: org?.name,
        };
    },
});

// Accept an invitation
export const acceptInvitation = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const invite = await ctx.db
            .query("invitations")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!invite || invite.status !== "pending") {
            throw new Error("Invalid or expired invitation");
        }

        // Get the user profile
        let userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!userProfile) {
            // Create new user profile if it doesn't exist
            const now = Date.now();
            await ctx.db.insert("userProfiles", {
                clerkUserId: identity.subject,
                email: identity.email!,
                name: identity.name || identity.email!.split("@")[0],
                orgId: invite.orgId,
                role: invite.role as "admin" | "manager" | "operator",
                createdAt: now,
                lastActiveAt: now,
                emailVerified: identity.emailVerified,
                onboardingCompleted: true, // Skip onboarding for invited users
            });
        } else {
            // Check if user is already in this organization
            if (userProfile.orgId === invite.orgId) {
                throw new Error("You are already a member of this organization");
            }

            // Update existing user profile with new org and role
            await ctx.db.patch(userProfile._id, {
                orgId: invite.orgId,
                role: invite.role as "admin" | "manager" | "operator",
            });
        }

        // Mark invitation as accepted
        await ctx.db.patch(invite._id, {
            status: "accepted",
        });

        return invite.orgId;
    },
});
