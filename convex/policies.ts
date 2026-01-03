import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

// ============================================
// COMPLIANCE POLICIES CRUD
// ============================================

/**
 * Create a new compliance policy
 */
export const createPolicy = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    policyType: v.union(
      v.literal("escort"),
      v.literal("permit"),
      v.literal("speed"),
      v.literal("hours"),
      v.literal("route"),
      v.literal("utility"),
      v.literal("dimension")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    conditions: v.optional(v.array(v.object({
      id: v.string(),
      attribute: v.string(),
      operator: v.string(),
      value: v.any(),
      sourceRegulation: v.optional(v.string()),
      notes: v.optional(v.string()),
      priority: v.optional(v.number()),
      output: v.optional(v.any()),
    }))),
    baseOutput: v.optional(v.any()),
    mergeStrategies: v.optional(v.any()),
    effectiveFrom: v.optional(v.number()),
    effectiveTo: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published")
    )),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const now = Date.now();

    const policyId = await ctx.db.insert("compliancePolicies", {
      jurisdictionId: args.jurisdictionId,
      policyType: args.policyType,
      name: args.name,
      description: args.description,
      status: args.status || "draft",
      conditions: args.conditions || [],
      baseOutput: args.baseOutput,
      mergeStrategies: args.mergeStrategies,
      effectiveFrom: args.effectiveFrom,
      effectiveTo: args.effectiveTo,
      createdBy: session.sub,
      updatedBy: session.sub,
      createdAt: now,
      updatedAt: now,
    });

    return policyId;
  },
});

/**
 * Update an existing policy
 */
export const updatePolicy = mutation({
  args: {
    policyId: v.id("compliancePolicies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    conditions: v.optional(v.array(v.object({
      id: v.string(),
      attribute: v.string(),
      operator: v.string(),
      value: v.any(),
      sourceRegulation: v.optional(v.string()),
      notes: v.optional(v.string()),
      priority: v.optional(v.number()),
      output: v.optional(v.any()),
    }))),
    baseOutput: v.optional(v.any()),
    mergeStrategies: v.optional(v.any()),
    effectiveFrom: v.optional(v.number()),
    effectiveTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const { policyId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(policyId, {
      ...filteredUpdates,
      updatedBy: session.sub,
      updatedAt: Date.now(),
    });

    return policyId;
  },
});

/**
 * Update policy status
 */
export const updatePolicyStatus = mutation({
  args: {
    policyId: v.id("compliancePolicies"),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);

    await ctx.db.patch(args.policyId, {
      status: args.status,
      updatedBy: session.sub,
      updatedAt: Date.now(),
    });

    return args.policyId;
  },
});

/**
 * Delete a policy (only drafts can be deleted)
 */
export const deletePolicy = mutation({
  args: {
    policyId: v.id("compliancePolicies"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);

    const policy = await ctx.db.get(args.policyId);
    if (!policy) {
      throw new Error("Policy not found");
    }

    if (policy.status !== "draft") {
      throw new Error("Can only delete draft policies. Archive published policies instead.");
    }

    // Delete related policy relationships
    const relationships = await ctx.db
      .query("policyRelationships")
      .filter((q) => 
        q.or(
          q.eq(q.field("sourcePolicyId"), args.policyId),
          q.eq(q.field("targetPolicyId"), args.policyId)
        )
      )
      .collect();

    for (const rel of relationships) {
      await ctx.db.delete(rel._id);
    }

    await ctx.db.delete(args.policyId);
    return args.policyId;
  },
});

/**
 * Get a policy by ID
 */
export const getPolicyById = query({
  args: {
    policyId: v.id("compliancePolicies"),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.policyId);
    if (!policy) return null;

    const jurisdiction = await ctx.db.get(policy.jurisdictionId);
    return {
      ...policy,
      jurisdiction,
    };
  },
});

/**
 * Get a policy by ID (alias for getPolicyById)
 */
export const getPolicy = query({
  args: {
    policyId: v.id("compliancePolicies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.policyId);
  },
});

/**
 * Get all policies for a jurisdiction
 */
export const getPoliciesForJurisdiction = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    )),
    policyType: v.optional(v.union(
      v.literal("escort"),
      v.literal("permit"),
      v.literal("speed"),
      v.literal("hours"),
      v.literal("route"),
      v.literal("utility"),
      v.literal("dimension")
    )),
  },
  handler: async (ctx, args) => {
    let policies = await ctx.db
      .query("compliancePolicies")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();

    if (args.status) {
      policies = policies.filter(p => p.status === args.status);
    }

    if (args.policyType) {
      policies = policies.filter(p => p.policyType === args.policyType);
    }

    return policies;
  },
});

/**
 * Get published policies for a jurisdiction by type
 */
export const getPublishedPolicyByType = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    policyType: v.union(
      v.literal("escort"),
      v.literal("permit"),
      v.literal("speed"),
      v.literal("hours"),
      v.literal("route"),
      v.literal("utility"),
      v.literal("dimension")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const policies = await ctx.db
      .query("compliancePolicies")
      .withIndex("by_jurisdiction_type", (q) => 
        q.eq("jurisdictionId", args.jurisdictionId).eq("policyType", args.policyType)
      )
      .collect();

    // Filter to published and within effective dates
    const activePolicies = policies.filter(p => {
      if (p.status !== "published") return false;
      if (p.effectiveFrom && p.effectiveFrom > now) return false;
      if (p.effectiveTo && p.effectiveTo < now) return false;
      return true;
    });

    return activePolicies;
  },
});

/**
 * Search policies across jurisdictions
 */
export const searchPolicies = query({
  args: {
    jurisdictionId: v.optional(v.id("jurisdictions")),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    )),
    policyType: v.optional(v.union(
      v.literal("escort"),
      v.literal("permit"),
      v.literal("speed"),
      v.literal("hours"),
      v.literal("route"),
      v.literal("utility"),
      v.literal("dimension")
    )),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let policies = await ctx.db.query("compliancePolicies").collect();

    // Apply filters
    if (args.jurisdictionId) {
      policies = policies.filter(p => p.jurisdictionId === args.jurisdictionId);
    }
    if (args.status) {
      policies = policies.filter(p => p.status === args.status);
    }
    if (args.policyType) {
      policies = policies.filter(p => p.policyType === args.policyType);
    }
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      policies = policies.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description?.toLowerCase().includes(term) ?? false)
      );
    }

    // Fetch jurisdiction info for each policy
    const policiesWithJurisdiction = await Promise.all(
      policies.map(async (policy) => {
        const jurisdiction = await ctx.db.get(policy.jurisdictionId);
        return {
          ...policy,
          jurisdiction,
        };
      })
    );

    return policiesWithJurisdiction;
  },
});

/**
 * Add a condition to a policy
 */
export const addConditionToPolicy = mutation({
  args: {
    policyId: v.id("compliancePolicies"),
    condition: v.object({
      id: v.string(),
      attribute: v.string(),
      operator: v.string(),
      value: v.any(),
      sourceRegulation: v.optional(v.string()),
      notes: v.optional(v.string()),
      priority: v.optional(v.number()),
      output: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    
    const policy = await ctx.db.get(args.policyId);
    if (!policy) {
      throw new Error("Policy not found");
    }

    const updatedConditions = [...(policy.conditions || []), args.condition];

    await ctx.db.patch(args.policyId, {
      conditions: updatedConditions,
      updatedBy: session.sub,
      updatedAt: Date.now(),
    });

    return args.policyId;
  },
});

/**
 * Update a condition within a policy
 */
export const updateConditionInPolicy = mutation({
  args: {
    policyId: v.id("compliancePolicies"),
    conditionId: v.string(),
    updates: v.object({
      attribute: v.optional(v.string()),
      operator: v.optional(v.string()),
      value: v.optional(v.any()),
      sourceRegulation: v.optional(v.string()),
      notes: v.optional(v.string()),
      priority: v.optional(v.number()),
      output: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    
    const policy = await ctx.db.get(args.policyId);
    if (!policy) {
      throw new Error("Policy not found");
    }

    const updatedConditions = (policy.conditions || []).map(cond => {
      if (cond.id === args.conditionId) {
        return { ...cond, ...args.updates };
      }
      return cond;
    });

    await ctx.db.patch(args.policyId, {
      conditions: updatedConditions,
      updatedBy: session.sub,
      updatedAt: Date.now(),
    });

    return args.policyId;
  },
});

/**
 * Remove a condition from a policy
 */
export const removeConditionFromPolicy = mutation({
  args: {
    policyId: v.id("compliancePolicies"),
    conditionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    
    const policy = await ctx.db.get(args.policyId);
    if (!policy) {
      throw new Error("Policy not found");
    }

    const updatedConditions = (policy.conditions || []).filter(
      cond => cond.id !== args.conditionId
    );

    await ctx.db.patch(args.policyId, {
      conditions: updatedConditions,
      updatedBy: session.sub,
      updatedAt: Date.now(),
    });

    return args.policyId;
  },
});

// ============================================
// POLICY RELATIONSHIPS
// ============================================

/**
 * Create a relationship between two policies
 */
export const createPolicyRelationship = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    sourcePolicyId: v.id("compliancePolicies"),
    targetPolicyId: v.id("compliancePolicies"),
    relationshipType: v.union(
      v.literal("requires"),
      v.literal("exempts_from"),
      v.literal("modifies"),
      v.literal("conflicts_with")
    ),
    modification: v.optional(v.any()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const now = Date.now();

    // Verify both policies exist
    const sourcePolicy = await ctx.db.get(args.sourcePolicyId);
    const targetPolicy = await ctx.db.get(args.targetPolicyId);

    if (!sourcePolicy || !targetPolicy) {
      throw new Error("One or both policies not found");
    }

    // Check for existing relationship
    const existing = await ctx.db
      .query("policyRelationships")
      .withIndex("by_source", (q) => q.eq("sourcePolicyId", args.sourcePolicyId))
      .collect();

    const alreadyExists = existing.some(r => r.targetPolicyId === args.targetPolicyId);
    if (alreadyExists) {
      throw new Error("Relationship already exists between these policies");
    }

    const relationshipId = await ctx.db.insert("policyRelationships", {
      jurisdictionId: args.jurisdictionId,
      sourcePolicyId: args.sourcePolicyId,
      targetPolicyId: args.targetPolicyId,
      relationshipType: args.relationshipType,
      modification: args.modification,
      notes: args.notes,
      createdBy: session.sub,
      updatedBy: session.sub,
      createdAt: now,
      updatedAt: now,
    });

    return relationshipId;
  },
});

/**
 * Delete a policy relationship
 */
export const deletePolicyRelationship = mutation({
  args: {
    relationshipId: v.id("policyRelationships"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    await ctx.db.delete(args.relationshipId);
    return args.relationshipId;
  },
});

/**
 * Get relationships for a policy
 */
export const getPolicyRelationships = query({
  args: {
    policyId: v.id("compliancePolicies"),
  },
  handler: async (ctx, args) => {
    // Get relationships where this policy is the source
    const outgoing = await ctx.db
      .query("policyRelationships")
      .withIndex("by_source", (q) => q.eq("sourcePolicyId", args.policyId))
      .collect();

    // Get relationships where this policy is the target
    const incoming = await ctx.db
      .query("policyRelationships")
      .withIndex("by_target", (q) => q.eq("targetPolicyId", args.policyId))
      .collect();

    // Enrich with policy details
    const enrichOutgoing = await Promise.all(
      outgoing.map(async (rel) => {
        const targetPolicy = await ctx.db.get(rel.targetPolicyId);
        return { ...rel, targetPolicy };
      })
    );

    const enrichIncoming = await Promise.all(
      incoming.map(async (rel) => {
        const sourcePolicy = await ctx.db.get(rel.sourcePolicyId);
        return { ...rel, sourcePolicy };
      })
    );

    return {
      outgoing: enrichOutgoing,
      incoming: enrichIncoming,
    };
  },
});

/**
 * Get all relationships for a jurisdiction
 */
export const getRelationshipsForJurisdiction = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("policyRelationships")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();
  },
});


