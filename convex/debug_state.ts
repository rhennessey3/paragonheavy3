import { query } from "./_generated/server";

export const debugState = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { error: "Not authenticated" };
        }

        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!userProfile) {
            return { error: "User profile not found", clerkUserId: identity.subject };
        }

        let org = null;
        if (userProfile.orgId) {
            org = await ctx.db.get(userProfile.orgId);
        }

        return {
            userProfile,
            orgId: userProfile.orgId,
            orgFound: !!org,
            org,
        };
    },
});
