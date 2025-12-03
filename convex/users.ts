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
    role: v.string(),
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

    console.log("✅ User profile created for clerkUserId:", args.clerkUserId);
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
    role: v.optional(v.string()),
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

export const syncFromClerk = mutation({
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
          });
          console.log("✅ User profile created for clerkUserId:", args.clerkUserId);
          return userProfileId;
        } else {
          console.log("❌ Organization not found for clerkOrgId:", args.orgId);
          console.log("⚠️ Creating basic user profile without org - will be updated by membership webhook");
        }
      } else {
        console.log("⚠️ No orgId provided for user sync");
        console.log("✅ Creating basic user profile - will be updated when user joins/creates org");
      }

      // Create a basic user profile without organization
      // This will be updated later when the organizationMembership webhook fires
      const now = Date.now();
      const userProfileId = await ctx.db.insert("userProfiles", {
        clerkUserId: args.clerkUserId,
        email: args.email,
        name: args.name,
        role: "member", // Default role, will be updated by membership webhook
        createdAt: now,
        lastActiveAt: now,
        emailVerified: args.emailVerified,
      });
      console.log("✅ Basic user profile created for clerkUserId:", args.clerkUserId);
      return userProfileId;
    }
    return null;
  },
});

export const updateOrgMembership = mutation({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
    orgRole: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("👥 updateOrgMembership called:", {
      clerkUserId: args.clerkUserId,
      clerkOrgId: args.clerkOrgId,
      orgRole: args.orgRole,
    });

    // Find the user profile
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!userProfile) {
      console.error("❌ User profile not found for clerkUserId:", args.clerkUserId);
      throw new Error(`User profile not found for clerkUserId: ${args.clerkUserId}. This will trigger a retry.`);
    }

    // Find the organization
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (!organization) {
      console.error("❌ Organization not found for clerkOrgId:", args.clerkOrgId);
      throw new Error(`Organization not found for clerkOrgId: ${args.clerkOrgId}. This will trigger a retry.`);
    }

    // Store the full Clerk role key to maintain consistency with Clerk
    // This ensures webhooks preserve the exact role (e.g., "org:dispatch", "org:heavy_haul_rig_operator")
    // instead of mapping to generic values like "operator"
    const roleToStore = args.orgRole;

    // Update the user profile with org info
    await ctx.db.patch(userProfile._id, {
      clerkOrgId: args.clerkOrgId,
      orgId: organization._id,
      role: roleToStore,
      lastActiveAt: Date.now(),
    });

    console.log("✅ Org membership updated successfully for user:", args.clerkUserId);
    return userProfile._id;
  },
});

export const deleteFromClerk = mutation({
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
    newRole: v.string(),
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
    // Support both "admin" (legacy) and "org:admin" (Clerk format) for role sync
    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", session.sub))
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .first();

    if (!currentUserProfile || (currentUserProfile.role !== "admin" && currentUserProfile.role !== "org:admin")) {
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
    // Get organization to find clerkOrgId
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      return [];
    }

    // Get members by internal orgId
    const membersByOrgId = await ctx.db
      .query("userProfiles")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Also get members by clerkOrgId as fallback (in case orgId wasn't set properly)
    let membersByClerkOrgId: any[] = [];
    if (org.clerkOrgId) {
      membersByClerkOrgId = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", org.clerkOrgId))
        .collect();
    }

    // Merge and deduplicate
    const allMembers = [...membersByOrgId];
    const existingIds = new Set(membersByOrgId.map((m) => m._id.toString()));

    for (const member of membersByClerkOrgId) {
      if (!existingIds.has(member._id.toString())) {
        allMembers.push(member);
      }
    }

    return allMembers;
  },
});

// Sync a member's orgId if they have clerkOrgId but missing orgId
export const syncMemberOrgId = mutation({
  args: {
    userProfileId: v.id("userProfiles"),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userProfileId, {
      orgId: args.orgId,
    });
    return args.userProfileId;
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
      orgId: args.orgId, // if you want to bind the user to that org
      lastActiveAt: Date.now(),
    });

    console.log("✅ markOnboardingCompleted: Onboarding marked as complete for clerkUserId:", args.clerkUserId);
  },
});

// Link user to organization after invitation sign-up
// This ensures the user profile is properly set up before they hit the dashboard
export const linkUserToOrgAfterInvite = mutation({
  args: {
    clerkOrgId: v.string(),
    clerkInvitationId: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const clerkUserId = session.sub;

    console.log("🔗 linkUserToOrgAfterInvite called:", {
      clerkUserId,
      clerkOrgId: args.clerkOrgId,
      clerkInvitationId: args.clerkInvitationId,
    });

    // Find the organization by Clerk org ID
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (!organization) {
      console.error("❌ Organization not found for clerkOrgId:", args.clerkOrgId);
      throw new Error("Organization not found. Please try again in a moment.");
    }

    // Find or create user profile
    let userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    const now = Date.now();

    if (userProfile) {
      // Update existing profile with org info
      console.log("📝 Updating existing user profile with org:", organization._id);
      await ctx.db.patch(userProfile._id, {
        orgId: organization._id,
        clerkOrgId: args.clerkOrgId,
        role: args.role || userProfile.role || "member",
        lastActiveAt: now,
      });
    } else {
      // Create new profile
      console.log("➕ Creating new user profile for invited user");
      await ctx.db.insert("userProfiles", {
        clerkUserId,
        clerkOrgId: args.clerkOrgId,
        orgId: organization._id,
        email: session.email || "",
        name: session.name || "",
        role: args.role || "member",
        createdAt: now,
        lastActiveAt: now,
      });
    }

    // Mark invitation as accepted if we have the Clerk invitation ID
    if (args.clerkInvitationId) {
      const invite = await ctx.db
        .query("invitations")
        .withIndex("by_clerkInvitationId", (q) => 
          q.eq("clerkInvitationId", args.clerkInvitationId)
        )
        .first();

      if (invite && invite.status === "pending") {
        await ctx.db.patch(invite._id, { status: "accepted" });
        console.log("✅ Marked invitation as accepted");
      }
    }

    console.log("✅ User successfully linked to organization:", organization.name);
    return { success: true, orgId: organization._id, orgName: organization.name };
  },
});