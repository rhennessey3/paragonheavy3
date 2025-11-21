const { ConvexHttpClient } = require("convex/browser");
const { ClerkExpressWithAuth } = require("@clerk/backend");

// This script manually syncs existing Clerk data to Convex
// Run with: node scripts/manual-sync-clerk-to-convex.js

async function manualSync() {
  // Use the correct Convex deployment URL from your environment
  const convexUrl = "https://resilient-goose-530.convex.cloud";
  console.log("🔗 Connecting to Convex at:", convexUrl);
  const convex = new ConvexHttpClient(convexUrl);
  
  // Your existing Clerk data from the dashboard
  const clerkData = {
    user: {
      id: "user_35icCxDKPNrmZCd9gM8lohhOwlV",
      email: "rhennessey3@gmail.com",
      name: "Rick Hennessey",
      firstName: "Rick",
      lastName: "Hennessey",
    },
    organization: {
      id: "org_35icFjC8MXEoPqtdNacQeZ06e1h",
      name: "Rick Hennessey's Organization",
      type: "carrier", // You mentioned this is a carrier org
      createdBy: "user_35icCxDKPNrmZCd9gM8lohhOwlV",
    }
  };

  try {
    console.log("🔄 Starting manual sync from Clerk to Convex...");
    
    // Step 1: Create organization first using internal mutation (no auth required)
    console.log("📝 Creating organization...");
    const orgId = await convex.mutation("organizations:syncFromClerk", {
      clerkOrgId: clerkData.organization.id,
      name: clerkData.organization.name,
      createdBy: clerkData.organization.createdBy,
    });
    console.log("✅ Organization created with ID:", orgId);
    
    // Step 2: Create user profile using internal mutation (no auth required)
    console.log("👤 Creating user profile...");
    const userProfileId = await convex.mutation("users:syncFromClerk", {
      clerkUserId: clerkData.user.id,
      email: clerkData.user.email,
      name: clerkData.user.name,
      orgId: clerkData.organization.id,
      orgRole: "admin",
      emailVerified: true,
    });
    console.log("✅ User profile created with ID:", userProfileId);
    
    console.log("🎉 Manual sync completed successfully!");
    console.log("Now try refreshing your dashboard - it should work!");
    
  } catch (error) {
    console.error("❌ Error during manual sync:", error);
  }
}

if (require.main === module) {
  manualSync();
}

module.exports = { manualSync };