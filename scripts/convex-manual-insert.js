// This script uses the Convex function runner to manually insert data
// Run with: npx convex run scripts/convex-manual-insert.js

const { internalMutation } = require("./convex/_generated/server");

const manualInsert = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("🔄 Starting manual data insertion...");
    
    // Your existing Clerk data
    const clerkData = {
      user: {
        id: "user_35icCxDKPNrmZCd9gM8lohhOwlV",
        email: "rhennessey3@gmail.com",
        name: "Rick Hennessey",
      },
      organization: {
        id: "org_35icFjC8MXEoPqtdNacQeZ06e1h",
        name: "Rick Hennessey's Organization",
        type: "carrier",
        createdBy: "user_35icCxDKPNrmZCd9gM8lohhOwlV",
      }
    };

    // Check if organization already exists
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", clerkData.organization.id))
      .first();

    let orgId;
    if (existingOrg) {
      console.log("📝 Organization already exists, updating...");
      await ctx.db.patch(existingOrg._id, {
        name: clerkData.organization.name,
        type: clerkData.organization.type,
        updatedAt: Date.now(),
      });
      orgId = existingOrg._id;
      console.log("✅ Organization updated");
    } else {
      console.log("➕ Creating new organization...");
      const now = Date.now();
      orgId = await ctx.db.insert("organizations", {
        name: clerkData.organization.name,
        type: clerkData.organization.type,
        clerkOrgId: clerkData.organization.id,
        createdBy: clerkData.organization.createdBy,
        createdAt: now,
        updatedAt: now,
      });
      console.log("✅ Organization created:", orgId);
    }

    // Check if user profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkData.user.id))
      .first();

    if (existingProfile) {
      console.log("📝 User profile already exists, updating...");
      await ctx.db.patch(existingProfile._id, {
        email: clerkData.user.email,
        name: clerkData.user.name,
        lastActiveAt: Date.now(),
      });
      console.log("✅ User profile updated");
    } else {
      console.log("➕ Creating new user profile...");
      const now = Date.now();
      const userProfileId = await ctx.db.insert("userProfiles", {
        clerkUserId: clerkData.user.id,
        clerkOrgId: clerkData.organization.id,
        orgId: orgId,
        email: clerkData.user.email,
        name: clerkData.user.name,
        role: "admin",
        createdAt: now,
        lastActiveAt: now,
        emailVerified: true,
        onboardingCompleted: false,
      });
      console.log("✅ User profile created with onboardingCompleted: false:", userProfileId);
    }

    console.log("🎉 Manual data insertion completed!");
    console.log("Now refresh your dashboard - it should work!");
    
    return { success: true, orgId, message: "Data synced successfully" };
  },
});

export default manualInsert;