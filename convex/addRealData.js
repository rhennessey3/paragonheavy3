const { internalMutation } = require("./_generated/server");

const addRealData = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("🔄 Adding real Clerk data to Convex...");
    
    // Your real Clerk data
    const realData = {
      user: {
        id: "user_35icCxDKPNrmZCd9gM8lohhOwlV",
        email: "rhennessey3@gmail.com",
        name: "Rick Hennessey",
      },
      organization: {
        id: "org_35icFjC8MXEoPqtdNacQeZ06e1h",
        name: "Rick Hennessey's Organization",
        type: "carrier", // From your session claims: orgType: "carrier"
        createdBy: "user_35icCxDKPNrmZCd9gM8lohhOwlV",
      }
    };

    // Create organization
    console.log("📝 Creating organization...");
    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name: realData.organization.name,
      type: realData.organization.type,
      clerkOrgId: realData.organization.id,
      createdBy: realData.organization.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    console.log("✅ Organization created:", orgId);

    // Create user profile
    console.log("👤 Creating user profile...");
    const userProfileId = await ctx.db.insert("userProfiles", {
      clerkUserId: realData.user.id,
      clerkOrgId: realData.organization.id,
      orgId: orgId,
      email: realData.user.email,
      name: realData.user.name,
      role: "admin",
      createdAt: now,
      lastActiveAt: now,
      emailVerified: true,
      onboardingCompleted: false,
    });
    console.log("✅ User profile created with onboardingCompleted: false:", userProfileId);

    console.log("🎉 Real data added successfully!");
    console.log("Now refresh your dashboard - it should work!");
    
    return { success: true, orgId, message: "Real data synced" };
  },
});

export default addRealData;