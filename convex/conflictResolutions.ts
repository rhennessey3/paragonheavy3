import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

// ============================================
// CONFLICT RESOLUTION FUNCTIONS
// ============================================

/**
 * Create or update a conflict resolution
 */
export const saveResolution = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    ruleA: v.id("complianceRules"),
    ruleB: v.id("complianceRules"),
    conflictType: v.union(
      v.literal("category_overlap"),
      v.literal("condition_overlap"),
      v.literal("requirement_contradiction")
    ),
    resolution: v.union(
      v.literal("rule_a_wins"),
      v.literal("rule_b_wins"),
      v.literal("cumulative"),
      v.literal("unresolved")
    ),
    strategy: v.optional(v.union(
      v.literal("priority"),
      v.literal("specificity"),
      v.literal("cumulative"),
      v.literal("manual")
    )),
    mergedRequirement: v.optional(v.any()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const now = Date.now();

    // Ensure consistent ordering of rules (smaller ID first)
    const [firstRule, secondRule] = args.ruleA < args.ruleB 
      ? [args.ruleA, args.ruleB] 
      : [args.ruleB, args.ruleA];

    // Check if a resolution already exists for this pair
    const existing = await ctx.db
      .query("conflictResolutions")
      .withIndex("by_rules", (q) => q.eq("ruleA", firstRule).eq("ruleB", secondRule))
      .first();

    if (existing) {
      // Update existing resolution
      await ctx.db.patch(existing._id, {
        resolution: args.resolution,
        strategy: args.strategy,
        mergedRequirement: args.mergedRequirement,
        notes: args.notes,
        resolvedBy: session.sub,
        resolvedAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new resolution
    return await ctx.db.insert("conflictResolutions", {
      jurisdictionId: args.jurisdictionId,
      ruleA: firstRule,
      ruleB: secondRule,
      conflictType: args.conflictType,
      resolution: args.resolution,
      strategy: args.strategy,
      mergedRequirement: args.mergedRequirement,
      notes: args.notes,
      resolvedBy: session.sub,
      resolvedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Get all resolutions for a jurisdiction
 */
export const getResolutionsForJurisdiction = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    const resolutions = await ctx.db
      .query("conflictResolutions")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();

    // Fetch rule details for each resolution
    const resolutionsWithRules = await Promise.all(
      resolutions.map(async (resolution) => {
        const ruleA = await ctx.db.get(resolution.ruleA);
        const ruleB = await ctx.db.get(resolution.ruleB);
        return {
          ...resolution,
          ruleADetails: ruleA ? { id: ruleA._id, title: ruleA.title, category: ruleA.category } : null,
          ruleBDetails: ruleB ? { id: ruleB._id, title: ruleB.title, category: ruleB.category } : null,
        };
      })
    );

    return resolutionsWithRules;
  },
});

/**
 * Get resolution for a specific rule pair
 */
export const getResolutionForRules = query({
  args: {
    ruleA: v.id("complianceRules"),
    ruleB: v.id("complianceRules"),
  },
  handler: async (ctx, args) => {
    // Ensure consistent ordering
    const [firstRule, secondRule] = args.ruleA < args.ruleB 
      ? [args.ruleA, args.ruleB] 
      : [args.ruleB, args.ruleA];

    return await ctx.db
      .query("conflictResolutions")
      .withIndex("by_rules", (q) => q.eq("ruleA", firstRule).eq("ruleB", secondRule))
      .first();
  },
});

/**
 * Get all resolutions involving a specific rule
 */
export const getResolutionsForRule = query({
  args: {
    ruleId: v.id("complianceRules"),
  },
  handler: async (ctx, args) => {
    // Query both indexes since the rule could be in either position
    const asRuleA = await ctx.db
      .query("conflictResolutions")
      .withIndex("by_rule_a", (q) => q.eq("ruleA", args.ruleId))
      .collect();

    const asRuleB = await ctx.db
      .query("conflictResolutions")
      .withIndex("by_rule_b", (q) => q.eq("ruleB", args.ruleId))
      .collect();

    // Combine and dedupe
    const allResolutions = [...asRuleA, ...asRuleB];
    const uniqueResolutions = Array.from(
      new Map(allResolutions.map((r) => [r._id, r])).values()
    );

    // Fetch rule details
    const resolutionsWithRules = await Promise.all(
      uniqueResolutions.map(async (resolution) => {
        const ruleA = await ctx.db.get(resolution.ruleA);
        const ruleB = await ctx.db.get(resolution.ruleB);
        return {
          ...resolution,
          ruleADetails: ruleA ? { id: ruleA._id, title: ruleA.title, category: ruleA.category } : null,
          ruleBDetails: ruleB ? { id: ruleB._id, title: ruleB.title, category: ruleB.category } : null,
        };
      })
    );

    return resolutionsWithRules;
  },
});

/**
 * Delete a resolution
 */
export const deleteResolution = mutation({
  args: {
    resolutionId: v.id("conflictResolutions"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    await ctx.db.delete(args.resolutionId);
    return args.resolutionId;
  },
});

/**
 * Update rule priority
 */
export const updateRulePriority = mutation({
  args: {
    ruleId: v.id("complianceRules"),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) {
      throw new Error("Rule not found");
    }

    // Update the rule's priority in its conditions
    const updatedConditions = {
      ...rule.conditions,
      priority: args.priority,
    };

    await ctx.db.patch(args.ruleId, {
      conditions: updatedConditions,
      priority: args.priority, // Also store at top level for easy querying
      updatedBy: session.sub,
      updatedAt: Date.now(),
    });

    return args.ruleId;
  },
});

/**
 * Batch update priorities for multiple rules
 */
export const batchUpdatePriorities = mutation({
  args: {
    priorities: v.array(v.object({
      ruleId: v.id("complianceRules"),
      priority: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const now = Date.now();

    for (const { ruleId, priority } of args.priorities) {
      const rule = await ctx.db.get(ruleId);
      if (rule) {
        const updatedConditions = {
          ...rule.conditions,
          priority,
        };

        await ctx.db.patch(ruleId, {
          conditions: updatedConditions,
          priority,
          updatedBy: session.sub,
          updatedAt: now,
        });
      }
    }

    return { updated: args.priorities.length };
  },
});

/**
 * Get unresolved conflicts count for a jurisdiction
 */
export const getUnresolvedConflictsCount = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    const resolutions = await ctx.db
      .query("conflictResolutions")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();

    const unresolved = resolutions.filter((r) => r.resolution === "unresolved");
    const resolved = resolutions.filter((r) => r.resolution !== "unresolved");

    return {
      total: resolutions.length,
      unresolved: unresolved.length,
      resolved: resolved.length,
    };
  },
});

