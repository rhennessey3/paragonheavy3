import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

export const createOrganization = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("shipper"), v.literal("carrier"), v.literal("escort")),
    clerkOrgId: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    if (session.sub !== args.createdBy) {
      throw new Error("Unauthorized: createdBy does not match session");
    }

    const now = Date.now();
    
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      type: args.type,
      clerkOrgId: args.clerkOrgId,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return orgId;
  },
});

export const getOrganization = query({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    return organization;
  },
});

export const getUserOrganizations = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const session = await requireAuthSession(ctx);
      userId = session.sub;
    }

    // Get organizations where user is the creator
    const createdOrgs = await ctx.db
      .query("organizations")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .collect();

    // Get user profiles to find organizations where user is a member
    const userProfiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", userId))
      .collect();

    const memberOrgIds = userProfiles.map(profile => profile.orgId);
    const memberOrgs = await Promise.all(
      memberOrgIds.map(orgId => ctx.db.get(orgId))
    );

    // Combine and remove duplicates
    const allOrgs = [...createdOrgs, ...memberOrgs.filter(Boolean)];
    const uniqueOrgs = allOrgs.filter((org, index, self) =>
      index === self.findIndex((o) => o?._id === org?._id)
    );

    return uniqueOrgs;
  },
});

export const updateOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("shipper"), v.literal("carrier"), v.literal("escort"))),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const { orgId, ...updates } = args;
    
    const organization = await ctx.db.get(orgId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Phase 2: Only check if user is the creator
    // Role-based access control will be implemented in Phase 3
    // For now, roles exist purely as data without affecting access control
    
    const isCreator = organization.createdBy === session.sub;
    
    if (!isCreator) {
        throw new Error("Unauthorized: Only the organization creator can update organization details in Phase 2");
    }

    await ctx.db.patch(orgId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return orgId;
  },
});

export const syncFromClerk = internalMutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (existingOrg) {
      // Update existing organization
      await ctx.db.patch(existingOrg._id, {
        name: args.name,
        updatedAt: Date.now(),
      });
      return existingOrg._id;
    } else {
      // Create new organization
      const now = Date.now();
      const orgId = await ctx.db.insert("organizations", {
        name: args.name,
        type: "shipper", // Default type, can be updated later
        clerkOrgId: args.clerkOrgId,
        createdBy: args.createdBy || "",
        createdAt: now,
        updatedAt: now,
      });
      return orgId;
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (organization) {
      // Delete all user profiles associated with this organization
      const userProfiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_orgId", (q) => q.eq("orgId", organization._id))
        .collect();

      for (const profile of userProfiles) {
        await ctx.db.delete(profile._id);
      }

      // Delete the organization
      await ctx.db.delete(organization._id);
    }

    return organization?._id;
  },
});