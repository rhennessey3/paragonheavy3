import { query } from "./_generated/server";

export const debugCurrentUserOrg = query({
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

        if (!userProfile.orgId) {
            return { error: "User has no orgId", userProfile };
        }

        const org = await ctx.db.get(userProfile.orgId);

        return {
            userProfile,
            org,
            hasClerkOrgId: !!org?.clerkOrgId,
            clerkOrgIdValue: org?.clerkOrgId
        };
    },
});
