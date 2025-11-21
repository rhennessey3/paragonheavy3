// Script to clear all data from Convex
// Run with: npx convex run scripts/clear-convex-data.js

const { internalMutation } = require("./_generated/server");

const clearData = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("🗑️ Clearing all data from Convex...");
    
    // Delete all user profiles
    const userProfiles = await ctx.db.query("userProfiles").collect();
    for (const profile of userProfiles) {
      await ctx.db.delete(profile._id);
    }
    console.log(`✅ Deleted ${userProfiles.length} user profiles`);
    
    // Delete all organizations
    const organizations = await ctx.db.query("organizations").collect();
    for (const org of organizations) {
      await ctx.db.delete(org._id);
    }
    console.log(`✅ Deleted ${organizations.length} organizations`);
    
    // Delete all loads (if any)
    const loads = await ctx.db.query("loads").collect();
    for (const load of loads) {
      await ctx.db.delete(load._id);
    }
    console.log(`✅ Deleted ${loads.length} loads`);
    
    console.log("🎉 All data cleared from Convex!");
    console.log("Now you can sign up again through the app to trigger proper webhook sync.");
    
    return { success: true, message: "All data cleared" };
  },
});

export default clearData;