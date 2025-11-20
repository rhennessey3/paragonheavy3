import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

export const createUserProfile = mutation({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
    orgId: v.id("organizations"),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("driver")),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    if (session.sub !== args.clerkUserId) {
      throw new Error("Unauthorized: clerkUserId does not match session");
    }

    const now = Date.now();
    
    const userProfileId = await ctx.db.insert("userProfiles", {
      clerkUserId: args.clerkUserId,
      clerkOrgId: args.clerkOrgId,
      orgId: args.orgId,
      email: args.email,
      name: args.name,
      role: args.role,
      createdAt: now,
      lastActiveAt: now,
    });

    return userProfileId;
  },
});

export const getUserProfile = query({
  args: {
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = args.clerkUserId;
    if (!userId) {
      const session = await requireAuthSession(ctx);
      userId = session.sub;
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", userId))
      .first();

    return userProfile;
  },
});

export const getUserProfileByOrg = query({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("clerkOrgId"), args.clerkOrgId))
      .first();

    return userProfile;
  },
});

export const getOrganizationUsers = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userProfiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    return userProfiles;
  },
});

export const updateUserProfile = mutation({
  args: {
    userProfileId: v.id("userProfiles"),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("member"), v.literal("driver"))),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const { userProfileId, ...updates } = args;
    
    const userProfile = await ctx.db.get(userProfileId);
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (userProfile.clerkUserId !== session.sub) {
      throw new Error("Unauthorized: You can only update your own profile");
    }

    await ctx.db.patch(userProfileId, updates);

    return userProfileId;
  },
});

export const updateLastActive = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        lastActiveAt: Date.now(),
      });
    }

    return userProfile?._id;
  },
});

export const syncFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    orgId: v.optional(v.string()),
    orgRole: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        email: args.email,
        name: args.name,
        lastActiveAt: Date.now(),
        emailVerified: args.emailVerified,
      });
      return existingProfile._id;
    } else {
      // Create new profile if user has an organization
      if (args.orgId) {
        const organization = await ctx.db
          .query("organizations")
          .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.orgId!))
          .first();

        if (organization) {
          const now = Date.now();
          const userProfileId = await ctx.db.insert("userProfiles", {
            clerkUserId: args.clerkUserId,
            clerkOrgId: args.orgId,
            orgId: organization._id,
            email: args.email,
            name: args.name,
            role: args.orgRole === "admin" ? "admin" : "member",
            createdAt: now,
            lastActiveAt: now,
            emailVerified: args.emailVerified,
          });
          return userProfileId;
        }
      }
    }
    return null;
  },
});

export const deleteFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (userProfile) {
      await ctx.db.delete(userProfile._id);
    }

    return userProfile?._id;
  },
});