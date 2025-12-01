import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Debug query to check all tables exist and are accessible
export const checkAllTables = query({
  args: {},
  handler: async (ctx) => {
    console.log("DEBUG: Checking all tables accessibility");

    const results = {
      organizations: {
        exists: true,
        count: 0,
        sample: null as any
      },
      userProfiles: {
        exists: true,
        count: 0,
        sample: null as any
      },
      loads: {
        exists: true,
        count: 0,
        sample: null as any
      }
    };

    try {
      // Check organizations table
      const orgs = await ctx.db.query("organizations").collect();
      results.organizations.count = orgs.length;
      results.organizations.sample = orgs[0] || null;
      console.log(`DEBUG: Organizations table accessible, count: ${orgs.length}`);
    } catch (error) {
      results.organizations.exists = false;
      console.log(`DEBUG: Organizations table error:`, error);
    }

    try {
      // Check userProfiles table
      const users = await ctx.db.query("userProfiles").collect();
      results.userProfiles.count = users.length;
      results.userProfiles.sample = users[0] || null;
      console.log(`DEBUG: UserProfiles table accessible, count: ${users.length}`);
    } catch (error) {
      results.userProfiles.exists = false;
      console.log(`DEBUG: UserProfiles table error:`, error);
    }

    try {
      // Check loads table
      const loads = await ctx.db.query("loads").collect();
      results.loads.count = loads.length;
      results.loads.sample = loads[0] || null;
      console.log(`DEBUG: Loads table accessible, count: ${loads.length}`);
    } catch (error) {
      results.loads.exists = false;
      console.log(`DEBUG: Loads table error:`, error);
    }

    return results;
  },
});

// Create sample data to make tables visible in dashboard
export const createSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("DEBUG: Creating sample data for all tables");

    // Create sample organization if none exists
    const existingOrgs = await ctx.db.query("organizations").collect();
    if (existingOrgs.length === 0) {
      const orgId = await ctx.db.insert("organizations", {
        name: "Sample Organization",
        type: "shipper",
        clerkOrgId: "sample_clerk_org_123",
        createdBy: "sample_user_123",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`DEBUG: Created sample organization: ${orgId}`);

      // Create sample user profile
      const userProfileId = await ctx.db.insert("userProfiles", {
        clerkUserId: "sample_user_123",
        clerkOrgId: "sample_clerk_org_123",
        orgId: orgId,
        email: "sample@example.com",
        name: "Sample User",
        role: "admin",
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
      console.log(`DEBUG: Created sample user profile: ${userProfileId}`);

      // Create sample load
      const loadId = await ctx.db.insert("loads", {
        loadNumber: "SAMPLE-001",
        orgId: orgId,
        createdBy: "sample_user_123",
        status: "draft",
        origin: {
          address: "123 Sample St",
          city: "Sample City",
          state: "SC",
          zip: "12345",
        },
        destination: {
          address: "456 Destination Ave",
          city: "Dest City",
          state: "DC",
          zip: "67890",
        },
        dimensions: {
          height: 10,
          width: 8,
          length: 20,
          weight: 1000,
          description: "Sample load",
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`DEBUG: Created sample load: ${loadId}`);

      return {
        success: true,
        orgId,
        userProfileId,
        loadId,
        message: "Sample data created for all tables"
      };
    }

    return {
      success: false,
      message: "Sample data already exists"
    };
  },
});

// Debug: Manually link a user to an organization (for fixing broken invitation flows)
export const manuallyLinkUserToOrg = mutation({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("🔧 DEBUG: Manually linking user to org:", args);

    // Find the organization by Clerk org ID
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (!organization) {
      console.error("❌ Organization not found for clerkOrgId:", args.clerkOrgId);
      return { success: false, error: "Organization not found" };
    }

    // Find or create user profile
    let userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
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
      return { 
        success: true, 
        action: "updated",
        orgId: organization._id, 
        orgName: organization.name,
        userId: userProfile._id
      };
    } else {
      console.error("❌ User profile not found for clerkUserId:", args.clerkUserId);
      return { success: false, error: "User profile not found" };
    }
  },
});