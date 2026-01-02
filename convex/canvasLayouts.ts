import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

// ============================================
// CANVAS LAYOUTS - Per-user position persistence
// ============================================

/**
 * Get the canvas layout for the current user and jurisdiction
 */
export const getCanvasLayout = query({
  args: {
    jurisdictionId: v.optional(v.string()), // "all" or specific jurisdiction ID
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const jurisdictionKey = args.jurisdictionId || "all";

    const layout = await ctx.db
      .query("canvasLayouts")
      .withIndex("by_user_jurisdiction", (q) =>
        q.eq("clerkUserId", session.sub).eq("jurisdictionId", jurisdictionKey)
      )
      .first();

    return layout;
  },
});

/**
 * Save/update the canvas layout for the current user and jurisdiction
 */
export const saveCanvasLayout = mutation({
  args: {
    jurisdictionId: v.optional(v.string()), // "all" or specific jurisdiction ID
    nodePositions: v.any(), // { [nodeId]: { x: number, y: number } }
    viewport: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
        zoom: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const jurisdictionKey = args.jurisdictionId || "all";
    const now = Date.now();

    // Check if layout already exists for this user + jurisdiction
    const existingLayout = await ctx.db
      .query("canvasLayouts")
      .withIndex("by_user_jurisdiction", (q) =>
        q.eq("clerkUserId", session.sub).eq("jurisdictionId", jurisdictionKey)
      )
      .first();

    if (existingLayout) {
      // Update existing layout
      await ctx.db.patch(existingLayout._id, {
        nodePositions: args.nodePositions,
        viewport: args.viewport,
        updatedAt: now,
      });
      return existingLayout._id;
    } else {
      // Create new layout
      const layoutId = await ctx.db.insert("canvasLayouts", {
        clerkUserId: session.sub,
        jurisdictionId: jurisdictionKey,
        nodePositions: args.nodePositions,
        viewport: args.viewport,
        updatedAt: now,
      });
      return layoutId;
    }
  },
});

/**
 * Delete a canvas layout (useful for "reset to default")
 */
export const deleteCanvasLayout = mutation({
  args: {
    jurisdictionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const jurisdictionKey = args.jurisdictionId || "all";

    const existingLayout = await ctx.db
      .query("canvasLayouts")
      .withIndex("by_user_jurisdiction", (q) =>
        q.eq("clerkUserId", session.sub).eq("jurisdictionId", jurisdictionKey)
      )
      .first();

    if (existingLayout) {
      await ctx.db.delete(existingLayout._id);
      return true;
    }

    return false;
  },
});

