import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

// ============================================
// STATE FIELDS FUNCTIONS
// ============================================

export const getStateFields = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stateFields")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();
  },
});

export const getStateFieldById = query({
  args: {
    stateFieldId: v.id("stateFields"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.stateFieldId);
  },
});

export const createStateField = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    key: v.string(),
    label: v.optional(v.string()),
    dataType: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Check if key already exists for this jurisdiction
    const existing = await ctx.db
      .query("stateFields")
      .withIndex("by_jurisdiction_key", (q) =>
        q.eq("jurisdictionId", args.jurisdictionId).eq("key", args.key)
      )
      .first();

    if (existing) {
      throw new Error(`State field with key "${args.key}" already exists for this jurisdiction`);
    }

    return await ctx.db.insert("stateFields", {
      jurisdictionId: args.jurisdictionId,
      key: args.key,
      label: args.label,
      dataType: args.dataType,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStateField = mutation({
  args: {
    stateFieldId: v.id("stateFields"),
    label: v.optional(v.string()),
    dataType: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const { stateFieldId, ...updates } = args;

    await ctx.db.patch(stateFieldId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return stateFieldId;
  },
});

export const deleteStateField = mutation({
  args: {
    stateFieldId: v.id("stateFields"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);

    // Check if any mappings use this state field
    const mappings = await ctx.db
      .query("stateFieldMappings")
      .withIndex("by_state_field", (q) => q.eq("stateFieldId", args.stateFieldId))
      .collect();

    // Remove mappings that reference this state field
    for (const mapping of mappings) {
      await ctx.db.patch(mapping._id, {
        stateFieldId: undefined,
      });
    }

    await ctx.db.delete(args.stateFieldId);
    return args.stateFieldId;
  },
});

export const bulkCreateStateFields = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    fields: v.array(
      v.object({
        key: v.string(),
        label: v.optional(v.string()),
        dataType: v.string(),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    const created: string[] = [];
    const skipped: string[] = [];

    for (const field of args.fields) {
      const existing = await ctx.db
        .query("stateFields")
        .withIndex("by_jurisdiction_key", (q) =>
          q.eq("jurisdictionId", args.jurisdictionId).eq("key", field.key)
        )
        .first();

      if (existing) {
        skipped.push(field.key);
        continue;
      }

      await ctx.db.insert("stateFields", {
        jurisdictionId: args.jurisdictionId,
        key: field.key,
        label: field.label,
        dataType: field.dataType,
        description: field.description,
        createdAt: now,
        updatedAt: now,
      });

      created.push(field.key);
    }

    return { created, skipped };
  },
});

// ============================================
// MAPPING FUNCTIONS (with state field support)
// ============================================

export const createMappingWithStateField = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    systemFieldId: v.id("systemFields"),
    stateFieldId: v.id("stateFields"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Get the state field to use its label
    const stateField = await ctx.db.get(args.stateFieldId);
    if (!stateField) {
      throw new Error("State field not found");
    }

    // Check if mapping already exists
    const existing = await ctx.db
      .query("stateFieldMappings")
      .withIndex("by_jurisdiction_field", (q) =>
        q.eq("jurisdictionId", args.jurisdictionId).eq("systemFieldId", args.systemFieldId)
      )
      .first();

    if (existing) {
      // Update existing mapping
      await ctx.db.patch(existing._id, {
        stateFieldId: args.stateFieldId,
        stateLabel: stateField.label || stateField.key,
        stateFieldKey: stateField.key,
        isActive: true,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new mapping
    return await ctx.db.insert("stateFieldMappings", {
      jurisdictionId: args.jurisdictionId,
      systemFieldId: args.systemFieldId,
      stateFieldId: args.stateFieldId,
      stateLabel: stateField.label || stateField.key,
      stateFieldKey: stateField.key,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeMappingBySystemField = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    systemFieldId: v.id("systemFields"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);

    const mapping = await ctx.db
      .query("stateFieldMappings")
      .withIndex("by_jurisdiction_field", (q) =>
        q.eq("jurisdictionId", args.jurisdictionId).eq("systemFieldId", args.systemFieldId)
      )
      .first();

    if (mapping) {
      await ctx.db.delete(mapping._id);
    }

    return mapping?._id;
  },
});

export const getStateFieldsWithMappingStatus = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    const stateFields = await ctx.db
      .query("stateFields")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();

    const mappings = await ctx.db
      .query("stateFieldMappings")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();

    // Create a set of mapped state field IDs
    const mappedStateFieldIds = new Set(
      mappings.filter((m) => m.stateFieldId).map((m) => m.stateFieldId)
    );

    // Add mapping status to each state field
    return stateFields.map((field) => ({
      ...field,
      isMapped: mappedStateFieldIds.has(field._id),
    }));
  },
});

export const getMappingsWithStateFields = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    const mappings = await ctx.db
      .query("stateFieldMappings")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();

    // Fetch state field and system field info for each mapping
    const mappingsWithDetails = await Promise.all(
      mappings.map(async (mapping) => {
        const systemField = await ctx.db.get(mapping.systemFieldId);
        const stateField = mapping.stateFieldId
          ? await ctx.db.get(mapping.stateFieldId)
          : null;

        return {
          ...mapping,
          systemField,
          stateField,
        };
      })
    );

    return mappingsWithDetails;
  },
});
