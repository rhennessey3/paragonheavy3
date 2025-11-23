import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

export const createUserProfile = mutation({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.optional(v.string()),
    orgId: v.id("organizations"),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("operator"), v.literal("member")),
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
      onboardingCompleted: false,
    });

    console.log("✅ User profile created with onboardingCompleted: false for clerkUserId:", args.clerkUserId);
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
    clerkOrgId: v.optional(v.string()),
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
    role: v.optional(v.union(v.literal("admin"), v.literal("manager"), v.literal("operator"), v.literal("member"))),
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
    console.log("👤 syncFromClerk called:", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      orgId: args.orgId,
      orgRole: args.orgRole,
      emailVerified: args.emailVerified,
    });

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existingProfile) {
      // Update existing profile
      console.log("📝 Updating existing user profile:", existingProfile._id);
      await ctx.db.patch(existingProfile._id, {
        email: args.email,
        name: args.name,
        lastActiveAt: Date.now(),
        emailVerified: args.emailVerified,
      });
      console.log("✅ User profile updated successfully");
      return existingProfile._id;
    } else {
      // Create new profile if user has an organization
      if (args.orgId) {
        console.log("🔍 Looking for organization with clerkOrgId:", args.orgId);
        const organization = await ctx.db
          .query("organizations")
          .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.orgId!))
          .first();

        if (organization) {
          console.log("✅ Found organization:", organization._id, "Creating user profile");
          const now = Date.now();
          const userProfileId = await ctx.db.insert("userProfiles", {
            clerkUserId: args.clerkUserId,
            clerkOrgId: args.orgId,
            orgId: organization._id,
            email: args.email,
            name: args.name,
            role: args.orgRole === "admin" ? "admin" : args.orgRole === "member" ? "member" : "operator",
            createdAt: now,
            lastActiveAt: now,
            emailVerified: args.emailVerified,
            onboardingCompleted: false,
          });
          console.log("✅ User profile created with onboardingCompleted: false for clerkUserId:", args.clerkUserId);
          return userProfileId;
        } else {
          console.log("❌ Organization not found for clerkOrgId:", args.orgId);
        }
      } else {
        console.log("⚠️ No orgId provided for user sync");
      }

      // If user doesn't have an organization in Clerk, check if they are a member of any organizations in Convex
      // This handles cases where user was added to an organization directly in Convex
      const existingOrgs = await ctx.db
        .query("organizations")
        .collect();

      console.log("📊 Total organizations in database:", existingOrgs.length);

      // For now, we won't auto-create profiles without an organization
      // User should be explicitly added to organizations
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

export const updateMemberRole = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    newRole: v.union(v.literal("admin"), v.literal("manager"), v.literal("operator"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);

    // Get the user profile to update
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.userId))
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found in this organization");
    }

    // Check if the current user is an admin of this organization
    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", session.sub))
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .first();

    if (!currentUserProfile || currentUserProfile.role !== "admin") {
      throw new Error("Unauthorized: Only admins can update member roles");
    }

    // Update the role
    await ctx.db.patch(userProfile._id, {
      role: args.newRole,
    });

    return userProfile._id;
  },
});

export const getOrganizationMembers = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("userProfiles")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    return members;
  },
});


export const markOnboardingCompleted = mutation({
  args: {
    clerkUserId: v.string(),
    orgId: v.optional(v.id("organizations")), // optional but recommended
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);

    if (session.sub !== args.clerkUserId) {
      throw new Error("Unauthorized: clerkUserId does not match session");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (!userProfile) {
      console.log("❌ markOnboardingCompleted: No user profile found for clerkUserId:", args.clerkUserId);
      return;
    }

    await ctx.db.patch(userProfile._id, {
      onboardingCompleted: true,
      orgId: args.orgId, // if you want to bind the user to that org
      lastActiveAt: Date.now(),
    });

    console.log("✅ markOnboardingCompleted: Onboarding marked as complete for clerkUserId:", args.clerkUserId);
  },
});