import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

export const createOrganization = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("shipper"), v.literal("carrier"), v.literal("escort")),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const now = Date.now();

    // Generate slug if not provided
    const slug = args.slug || args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      type: args.type,
      slug,
      createdBy: session.sub,
      createdAt: now,
      updatedAt: now,
    });

    // Automatically create/update user profile to be admin of this new org
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", session.sub))
      .first();

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        orgId: orgId,
        role: "admin",
        onboardingCompleted: true,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        clerkUserId: session.sub,
        orgId: orgId,
        email: session.email || "",
        name: session.name || "",
        role: "admin",
        createdAt: now,
        lastActiveAt: now,
        onboardingCompleted: true,
      });
    }

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

export const getOrganizationById = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.orgId);
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

    const memberOrgIds = userProfiles
      .map(profile => profile.orgId)
      .filter((id): id is import("./_generated/dataModel").Id<"organizations"> => !!id);

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
    console.log("🏢 syncFromClerk called:", {
      ...args,
      timestamp: new Date().toISOString()
    });

    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    console.log("🔍 Existing organization check:", {
      clerkOrgId: args.clerkOrgId,
      existingOrg: !!existingOrg,
      existingOrgId: existingOrg?._id,
      existingOrgName: existingOrg?.name,
      timestamp: new Date().toISOString()
    });

    if (existingOrg) {
      // Update existing organization
      console.log("📝 Updating existing organization:", existingOrg._id);
      await ctx.db.patch(existingOrg._id, {
        name: args.name,
        updatedAt: Date.now(),
      });
      console.log("✅ Organization updated successfully");
      return existingOrg._id;
    } else {
      // Enhanced race condition handling
      console.log("🔍 Checking if organization was recently created by user:", {
        clerkOrgId: args.clerkOrgId,
        createdBy: args.createdBy,
        hasCreatedBy: !!args.createdBy,
        timestamp: new Date().toISOString()
      });

      // Check if this organization was created very recently (within last 10 seconds)
      const recentTimeThreshold = Date.now() - 10000; // 10 seconds ago
      const recentOrgs = await ctx.db
        .query("organizations")
        .withIndex("by_clerkOrgId", (q) =>
          q.eq("clerkOrgId", args.clerkOrgId)
        )
        .collect();

      const veryRecentOrg = recentOrgs.find(org =>
        org.clerkOrgId === args.clerkOrgId &&
        org.createdAt > recentTimeThreshold
      );

      console.log("🕐 Race condition check:", {
        clerkOrgId: args.clerkOrgId,
        recentOrgsCount: recentOrgs.length,
        veryRecentOrg: !!veryRecentOrg,
        recentTimeThreshold: new Date(recentTimeThreshold).toISOString(),
        timestamp: new Date().toISOString()
      });

      // If createdBy is not provided, this is likely a webhook sync for an org
      // created by another process (like manual admin creation)
      if (!args.createdBy && !veryRecentOrg) {
        console.log("➕ Creating new organization from webhook (no createdBy, no recent race)", {
          timestamp: new Date().toISOString()
        });
        const now = Date.now();
        const orgId = await ctx.db.insert("organizations", {
          name: args.name,
          type: "shipper", // Default type, can be updated later
          clerkOrgId: args.clerkOrgId,
          createdBy: "",
          createdAt: now,
          updatedAt: now,
        });
        console.log("✅ Organization created successfully:", {
          orgId,
          timestamp: new Date().toISOString()
        });
        return orgId;
      } else {
        console.log("⏭️ Skipping organization creation - webhook race condition or user flow", {
          reason: args.createdBy ? "has createdBy (user flow)" : "very recent org (race condition)",
          timestamp: new Date().toISOString()
        });
        return null;
      }
    }
  },
});

export const updateOrganizationType = mutation({
  args: {
    clerkOrgId: v.string(),
    type: v.union(v.literal("shipper"), v.literal("carrier"), v.literal("escort")),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);

    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Verify user is member of this organization
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", session.sub))
      .filter((q) => q.eq(q.field("clerkOrgId"), args.clerkOrgId))
      .first();

    if (!userProfile) {
      throw new Error("Unauthorized: User is not a member of this organization");
    }

    await ctx.db.patch(organization._id, {
      type: args.type,
      updatedAt: Date.now(),
    });

    return organization._id;
  },
});

export const markOnboardingComplete = mutation({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);

    if (session.sub !== args.clerkUserId) {
      throw new Error("Unauthorized: clerkUserId does not match session");
    }

    // Update user profile to mark onboarding complete
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("clerkOrgId"), args.clerkOrgId))
      .first();

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        onboardingCompleted: true,
        lastActiveAt: Date.now(),
      });
    }

    return true;
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

export const createInternalOrganization = internalMutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    type: v.string(),
    createdByClerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const orgId = await ctx.db.insert("organizations", {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      type: args.type as "shipper" | "carrier" | "escort",
      createdBy: args.createdByClerkUserId,
      createdAt: now,
      updatedAt: now,
    });

    return orgId;
  },
});