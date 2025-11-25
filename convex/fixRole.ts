import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const restoreAdminRole = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const userProfile = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        if (!userProfile) {
            return "User not found";
        }

        await ctx.db.patch(userProfile._id, {
            role: "admin",
        });

        return `Restored admin role for ${args.email}`;
    },
});
