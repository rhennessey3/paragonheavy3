import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
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
    const { userProfileId, ...updates } = args;
    
    const userProfile = await ctx.db.get(userProfileId);
    if (!userProfile) {
      throw new Error("User profile not found");
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