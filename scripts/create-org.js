const { ConvexHttpClient } = require("convex/browser");

// This script creates the organization in Convex to match what's in Clerk
// 🛑 SINGLE DEPLOYMENT: Uses only dev:resilient-goose-530
async function createOrganization() {
  const client = new ConvexHttpClient("https://resilient-goose-530.convex.cloud");
  
  try {
    const result = await client.mutation("organizations.createOrganization", {
      name: "Rick Hennessey's Organization",
      type: "carrier",
      clerkOrgId: "org_35icFjC8MXEoPqtdNacQeZ06e1h",
      createdBy: "user_35icCxDKPNrmZCd9gM8lohhOwlV"
    });
    
    console.log("Organization created successfully:", result);
  } catch (error) {
    console.error("Failed to create organization:", error);
  }
}

createOrganization();