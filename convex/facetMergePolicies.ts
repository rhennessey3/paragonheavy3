import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

// ============================================
// FACET MERGE POLICIES FUNCTIONS
// ============================================
// Manage how rule outputs are merged within each facet (policy domain)

/**
 * Get all merge policies for a jurisdiction
 */
export const getMergePolicies = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("facetMergePolicies")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();
  },
});

/**
 * Get merge policies for a specific facet
 */
export const getMergePoliciesForFacet = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    facet: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("facetMergePolicies")
      .withIndex("by_jurisdiction_facet", (q) => 
        q.eq("jurisdictionId", args.jurisdictionId).eq("facet", args.facet)
      )
      .collect();
  },
});

/**
 * Get a specific merge policy
 */
export const getMergePolicy = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    facet: v.string(),
    field: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("facetMergePolicies")
      .withIndex("by_jurisdiction_facet_field", (q) => 
        q.eq("jurisdictionId", args.jurisdictionId)
          .eq("facet", args.facet)
          .eq("field", args.field)
      )
      .first();
  },
});

/**
 * Create or update a merge policy
 */
export const upsertMergePolicy = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    facet: v.string(),
    field: v.string(),
    mergeStrategy: v.union(
      v.literal("MAX"),
      v.literal("MIN"),
      v.literal("UNION"),
      v.literal("FIRST"),
      v.literal("LAST"),
      v.literal("INTERSECTION"),
      v.literal("OR")
    ),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Check if policy already exists
    const existing = await ctx.db
      .query("facetMergePolicies")
      .withIndex("by_jurisdiction_facet_field", (q) => 
        q.eq("jurisdictionId", args.jurisdictionId)
          .eq("facet", args.facet)
          .eq("field", args.field)
      )
      .first();

    if (existing) {
      // Update existing policy
      await ctx.db.patch(existing._id, {
        mergeStrategy: args.mergeStrategy,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new policy
    return await ctx.db.insert("facetMergePolicies", {
      jurisdictionId: args.jurisdictionId,
      facet: args.facet,
      field: args.field,
      mergeStrategy: args.mergeStrategy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Delete a merge policy (reverts to default)
 */
export const deleteMergePolicy = mutation({
  args: {
    policyId: v.id("facetMergePolicies"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    await ctx.db.delete(args.policyId);
    return args.policyId;
  },
});

/**
 * Batch update merge policies for a facet
 */
export const batchUpdateFacetPolicies = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    facet: v.string(),
    policies: v.array(v.object({
      field: v.string(),
      mergeStrategy: v.union(
        v.literal("MAX"),
        v.literal("MIN"),
        v.literal("UNION"),
        v.literal("FIRST"),
        v.literal("LAST"),
        v.literal("INTERSECTION"),
        v.literal("OR")
      ),
    })),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    const results = [];

    for (const policy of args.policies) {
      // Check if policy exists
      const existing = await ctx.db
        .query("facetMergePolicies")
        .withIndex("by_jurisdiction_facet_field", (q) => 
          q.eq("jurisdictionId", args.jurisdictionId)
            .eq("facet", args.facet)
            .eq("field", policy.field)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          mergeStrategy: policy.mergeStrategy,
          updatedAt: now,
        });
        results.push(existing._id);
      } else {
        const newId = await ctx.db.insert("facetMergePolicies", {
          jurisdictionId: args.jurisdictionId,
          facet: args.facet,
          field: policy.field,
          mergeStrategy: policy.mergeStrategy,
          createdAt: now,
          updatedAt: now,
        });
        results.push(newId);
      }
    }

    return results;
  },
});

/**
 * Initialize default merge policies for a jurisdiction
 * This creates the standard policies based on DEFAULT_MERGE_POLICIES
 */
export const initializeDefaultPolicies = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Default policies from lib/compliance.ts
    const defaultPolicies = {
      escort: { 
        rear_escorts: 'MAX', 
        front_escorts: 'MAX', 
        height_pole: 'OR',
      },
      permit: { 
        types: 'UNION',
      },
      speed: { 
        max: 'MIN',
      },
      hours: { 
        windows: 'INTERSECTION',
      },
      utility: { 
        notice_hours: 'MAX', 
        types: 'UNION',
      },
    };

    const results = [];

    for (const [facet, fields] of Object.entries(defaultPolicies)) {
      for (const [field, strategy] of Object.entries(fields)) {
        // Check if policy exists
        const existing = await ctx.db
          .query("facetMergePolicies")
          .withIndex("by_jurisdiction_facet_field", (q) => 
            q.eq("jurisdictionId", args.jurisdictionId)
              .eq("facet", facet)
              .eq("field", field)
          )
          .first();

        if (!existing) {
          const newId = await ctx.db.insert("facetMergePolicies", {
            jurisdictionId: args.jurisdictionId,
            facet,
            field,
            mergeStrategy: strategy as any,
            createdAt: now,
            updatedAt: now,
          });
          results.push(newId);
        }
      }
    }

    return { initialized: results.length, policies: results };
  },
});

/**
 * Get effective merge policies for a jurisdiction
 * Returns custom policies merged with defaults
 */
export const getEffectiveMergePolicies = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    // Default policies
    const defaults: Record<string, Record<string, string>> = {
      escort: { 
        rear_escorts: 'MAX', 
        front_escorts: 'MAX', 
        height_pole: 'OR',
        front_distance_min_ft: 'MIN',
        front_distance_max_ft: 'MAX',
        rear_distance_min_ft: 'MIN',
        rear_distance_max_ft: 'MAX',
      },
      permit: { 
        types: 'UNION',
        estimated_cost: 'MAX',
        processing_days: 'MAX',
      },
      speed: { 
        max: 'MIN',
        min: 'MAX',
      },
      hours: { 
        windows: 'INTERSECTION',
        blackout_periods: 'UNION',
      },
      utility: { 
        notice_hours: 'MAX', 
        types: 'UNION',
      },
      route: {
        restrictions: 'UNION',
      },
      dimension: {
        max_width: 'MIN',
        max_height: 'MIN',
        max_length: 'MIN',
        max_weight: 'MIN',
      },
    };

    // Get custom policies for this jurisdiction
    const customPolicies = await ctx.db
      .query("facetMergePolicies")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();

    // Merge custom over defaults
    const effective = { ...defaults };
    
    for (const policy of customPolicies) {
      if (!effective[policy.facet]) {
        effective[policy.facet] = {};
      }
      effective[policy.facet][policy.field] = policy.mergeStrategy;
    }

    return effective;
  },
});


