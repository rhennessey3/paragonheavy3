import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";
import { Id } from "./_generated/dataModel";

// ============================================
// CANVAS DRAFTS - Save work-in-progress canvas state
// ============================================

/**
 * Save or update a canvas draft
 */
export const saveCanvasDraft = mutation({
  args: {
    draftId: v.optional(v.id("canvasDrafts")),
    name: v.string(),
    jurisdictionId: v.optional(v.id("jurisdictions")),
    nodes: v.any(),
    edges: v.any(),
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
    const now = Date.now();

    if (args.draftId) {
      // Update existing draft
      const existingDraft = await ctx.db.get(args.draftId);
      if (!existingDraft) {
        throw new Error("Draft not found");
      }
      if (existingDraft.clerkUserId !== session.sub) {
        throw new Error("Not authorized to update this draft");
      }

      await ctx.db.patch(args.draftId, {
        name: args.name,
        jurisdictionId: args.jurisdictionId,
        nodes: args.nodes,
        edges: args.edges,
        viewport: args.viewport,
        updatedAt: now,
      });
      return args.draftId;
    } else {
      // Create new draft
      const draftId = await ctx.db.insert("canvasDrafts", {
        clerkUserId: session.sub,
        name: args.name,
        jurisdictionId: args.jurisdictionId,
        nodes: args.nodes,
        edges: args.edges,
        viewport: args.viewport,
        createdAt: now,
        updatedAt: now,
      });
      return draftId;
    }
  },
});

/**
 * Get a specific canvas draft by ID
 */
export const getCanvasDraft = query({
  args: {
    draftId: v.id("canvasDrafts"),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const draft = await ctx.db.get(args.draftId);

    if (!draft) {
      return null;
    }

    if (draft.clerkUserId !== session.sub) {
      throw new Error("Not authorized to view this draft");
    }

    return draft;
  },
});

/**
 * List all canvas drafts for the current user
 */
export const listCanvasDrafts = query({
  args: {
    jurisdictionId: v.optional(v.id("jurisdictions")),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);

    let drafts;
    if (args.jurisdictionId) {
      drafts = await ctx.db
        .query("canvasDrafts")
        .withIndex("by_user_jurisdiction", (q) =>
          q.eq("clerkUserId", session.sub).eq("jurisdictionId", args.jurisdictionId)
        )
        .collect();
    } else {
      drafts = await ctx.db
        .query("canvasDrafts")
        .withIndex("by_user", (q) => q.eq("clerkUserId", session.sub))
        .collect();
    }

    // Sort by updatedAt descending (most recent first)
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Delete a canvas draft
 */
export const deleteCanvasDraft = mutation({
  args: {
    draftId: v.id("canvasDrafts"),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const draft = await ctx.db.get(args.draftId);

    if (!draft) {
      throw new Error("Draft not found");
    }

    if (draft.clerkUserId !== session.sub) {
      throw new Error("Not authorized to delete this draft");
    }

    await ctx.db.delete(args.draftId);
    return true;
  },
});

/**
 * Rename a canvas draft
 */
export const renameCanvasDraft = mutation({
  args: {
    draftId: v.id("canvasDrafts"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const draft = await ctx.db.get(args.draftId);

    if (!draft) {
      throw new Error("Draft not found");
    }

    if (draft.clerkUserId !== session.sub) {
      throw new Error("Not authorized to rename this draft");
    }

    await ctx.db.patch(args.draftId, {
      name: args.name,
      updatedAt: Date.now(),
    });

    return args.draftId;
  },
});
