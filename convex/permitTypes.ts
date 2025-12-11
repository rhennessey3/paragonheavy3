import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

// ============================================
// PERMIT TYPES FUNCTIONS
// ============================================

export const getPermitTypes = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let permitTypes = await ctx.db.query("permitTypes").collect();
    
    if (args.activeOnly) {
      permitTypes = permitTypes.filter(pt => pt.isActive);
    }
    
    return permitTypes.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getPermitTypeById = query({
  args: {
    permitTypeId: v.id("permitTypes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.permitTypeId);
  },
});

export const getPermitTypeByKey = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permitTypes")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

export const createPermitType = mutation({
  args: {
    key: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Check if key already exists
    const existing = await ctx.db
      .query("permitTypes")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      throw new Error(`Permit type with key "${args.key}" already exists`);
    }

    // Get max sort order
    const allTypes = await ctx.db.query("permitTypes").collect();
    const maxSort = allTypes.length > 0 ? Math.max(...allTypes.map(t => t.sortOrder)) : 0;

    return await ctx.db.insert("permitTypes", {
      key: args.key,
      label: args.label,
      description: args.description,
      isActive: args.isActive ?? true,
      sortOrder: args.sortOrder ?? maxSort + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePermitType = mutation({
  args: {
    permitTypeId: v.id("permitTypes"),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const { permitTypeId, ...updates } = args;

    await ctx.db.patch(permitTypeId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return permitTypeId;
  },
});

export const deletePermitType = mutation({
  args: {
    permitTypeId: v.id("permitTypes"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);

    // Delete all field configurations for this permit type
    const fields = await ctx.db
      .query("permitTypeFields")
      .withIndex("by_permit_type", (q) => q.eq("permitTypeId", args.permitTypeId))
      .collect();

    for (const field of fields) {
      await ctx.db.delete(field._id);
    }

    await ctx.db.delete(args.permitTypeId);
    return args.permitTypeId;
  },
});

// ============================================
// PERMIT TYPE FIELDS FUNCTIONS
// ============================================

export const getPermitTypeFields = query({
  args: {
    permitTypeId: v.id("permitTypes"),
  },
  handler: async (ctx, args) => {
    const fields = await ctx.db
      .query("permitTypeFields")
      .withIndex("by_permit_type", (q) => q.eq("permitTypeId", args.permitTypeId))
      .collect();

    // Fetch system field info for each
    const fieldsWithInfo = await Promise.all(
      fields.map(async (field) => {
        const systemField = await ctx.db.get(field.systemFieldId);
        return {
          ...field,
          systemField,
        };
      })
    );

    return fieldsWithInfo.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const setFieldRequirement = mutation({
  args: {
    permitTypeId: v.id("permitTypes"),
    systemFieldId: v.id("systemFields"),
    requirement: v.union(
      v.literal("required"),
      v.literal("optional"),
      v.literal("hidden")
    ),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Check if mapping already exists
    const existing = await ctx.db
      .query("permitTypeFields")
      .withIndex("by_permit_field", (q) =>
        q.eq("permitTypeId", args.permitTypeId).eq("systemFieldId", args.systemFieldId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        requirement: args.requirement,
        sortOrder: args.sortOrder ?? existing.sortOrder,
        updatedAt: now,
      });
      return existing._id;
    }

    // Get max sort order for this permit type
    const allFields = await ctx.db
      .query("permitTypeFields")
      .withIndex("by_permit_type", (q) => q.eq("permitTypeId", args.permitTypeId))
      .collect();
    const maxSort = allFields.length > 0 ? Math.max(...allFields.map(f => f.sortOrder)) : 0;

    return await ctx.db.insert("permitTypeFields", {
      permitTypeId: args.permitTypeId,
      systemFieldId: args.systemFieldId,
      requirement: args.requirement,
      sortOrder: args.sortOrder ?? maxSort + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const bulkSetFieldRequirements = mutation({
  args: {
    permitTypeId: v.id("permitTypes"),
    fields: v.array(v.object({
      systemFieldId: v.id("systemFields"),
      requirement: v.union(
        v.literal("required"),
        v.literal("optional"),
        v.literal("hidden")
      ),
      sortOrder: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    for (const field of args.fields) {
      const existing = await ctx.db
        .query("permitTypeFields")
        .withIndex("by_permit_field", (q) =>
          q.eq("permitTypeId", args.permitTypeId).eq("systemFieldId", field.systemFieldId)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          requirement: field.requirement,
          sortOrder: field.sortOrder,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("permitTypeFields", {
          permitTypeId: args.permitTypeId,
          systemFieldId: field.systemFieldId,
          requirement: field.requirement,
          sortOrder: field.sortOrder,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return args.permitTypeId;
  },
});

export const getPermitTypeStats = query({
  args: {},
  handler: async (ctx) => {
    const permitTypes = await ctx.db.query("permitTypes").collect();

    const stats = await Promise.all(
      permitTypes.map(async (pt) => {
        const fields = await ctx.db
          .query("permitTypeFields")
          .withIndex("by_permit_type", (q) => q.eq("permitTypeId", pt._id))
          .collect();

        const required = fields.filter(f => f.requirement === "required").length;
        const optional = fields.filter(f => f.requirement === "optional").length;
        const hidden = fields.filter(f => f.requirement === "hidden").length;

        return {
          ...pt,
          fieldStats: {
            required,
            optional,
            hidden,
            visible: required + optional,
            total: fields.length,
          },
        };
      })
    );

    return stats.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// ============================================
// SEED FUNCTIONS
// ============================================

export const seedPermitTypes = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    const PERMIT_TYPES = [
      { key: "single_trip", label: "Single Trip Permit", description: "One-time permit for a specific route and date range", sortOrder: 1 },
      { key: "annual", label: "Annual Permit", description: "Yearly permit for multiple trips within size/weight limits", sortOrder: 2 },
      { key: "superload", label: "Superload Permit", description: "For loads exceeding standard oversize/overweight limits", sortOrder: 3 },
      { key: "oversize", label: "Oversize Permit", description: "For loads exceeding legal dimension limits", sortOrder: 4 },
      { key: "overweight", label: "Overweight Permit", description: "For loads exceeding legal weight limits", sortOrder: 5 },
    ];

    const created: string[] = [];
    const skipped: string[] = [];

    for (const pt of PERMIT_TYPES) {
      const existing = await ctx.db
        .query("permitTypes")
        .withIndex("by_key", (q) => q.eq("key", pt.key))
        .first();

      if (existing) {
        skipped.push(pt.key);
        continue;
      }

      await ctx.db.insert("permitTypes", {
        ...pt,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      created.push(pt.key);
    }

    return { created, skipped };
  },
});

export const seedPermitTypeFields = mutation({
  args: {
    permitTypeKey: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Get the permit type
    const permitType = await ctx.db
      .query("permitTypes")
      .withIndex("by_key", (q) => q.eq("key", args.permitTypeKey))
      .first();

    if (!permitType) {
      throw new Error(`Permit type "${args.permitTypeKey}" not found`);
    }

    // Default field configurations
    const DEFAULT_CONFIGS: Record<string, [string, "required" | "optional" | "hidden"][]> = {
      single_trip: [
        ["permit_number", "required"],
        ["permit_type", "required"],
        ["start_date", "required"],
        ["end_date", "required"],
        ["requestor", "required"],
        ["allowable_route", "required"],
        ["permit_fee", "optional"],
        ["travel_times", "optional"],
        ["telephone_number", "optional"],
        ["usdot", "optional"],
        ["general_conditions", "optional"],
      ],
      annual: [
        ["permit_number", "required"],
        ["permit_type", "required"],
        ["start_date", "required"],
        ["end_date", "required"],
        ["requestor", "required"],
        ["permit_fee", "required"],
        ["total_permit_cost", "required"],
        ["requestor_street_address", "required"],
        ["requestor_city", "required"],
        ["requestor_state", "required"],
        ["requestor_zip_code", "required"],
        ["telephone_number", "required"],
        ["usdot", "required"],
        ["payment_method", "required"],
      ],
      superload: [
        ["permit_number", "required"],
        ["permit_type", "required"],
        ["start_date", "required"],
        ["end_date", "required"],
        ["requestor", "required"],
        ["contact", "required"],
        ["allowable_route", "required"],
        ["travel_times", "required"],
        ["general_conditions", "required"],
        ["permit_fee", "required"],
        ["other_fee", "required"],
        ["total_permit_cost", "required"],
        ["requestor_street_address", "required"],
        ["requestor_city", "required"],
        ["requestor_state", "required"],
        ["requestor_zip_code", "required"],
        ["telephone_number", "required"],
        ["usdot", "required"],
        ["payment_method", "required"],
        ["issuer_name", "required"],
        ["date_issued", "required"],
      ],
      oversize: [
        ["permit_number", "required"],
        ["permit_type", "required"],
        ["start_date", "required"],
        ["end_date", "required"],
        ["requestor", "required"],
        ["allowable_route", "required"],
        ["permit_fee", "optional"],
        ["travel_times", "optional"],
        ["telephone_number", "optional"],
        ["usdot", "optional"],
      ],
      overweight: [
        ["permit_number", "required"],
        ["permit_type", "required"],
        ["start_date", "required"],
        ["end_date", "required"],
        ["requestor", "required"],
        ["allowable_route", "required"],
        ["permit_fee", "optional"],
        ["usdot", "required"],
        ["telephone_number", "optional"],
      ],
    };

    const config = DEFAULT_CONFIGS[args.permitTypeKey];
    if (!config) {
      throw new Error(`No default configuration for permit type "${args.permitTypeKey}"`);
    }

    let created = 0;
    let updated = 0;

    for (let i = 0; i < config.length; i++) {
      const [fieldKey, requirement] = config[i];

      // Find the system field
      const systemField = await ctx.db
        .query("systemFields")
        .withIndex("by_key", (q) => q.eq("key", fieldKey))
        .first();

      if (!systemField) {
        console.warn(`System field "${fieldKey}" not found, skipping`);
        continue;
      }

      // Check if mapping exists
      const existing = await ctx.db
        .query("permitTypeFields")
        .withIndex("by_permit_field", (q) =>
          q.eq("permitTypeId", permitType._id).eq("systemFieldId", systemField._id)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          requirement,
          sortOrder: i + 1,
          updatedAt: now,
        });
        updated++;
      } else {
        await ctx.db.insert("permitTypeFields", {
          permitTypeId: permitType._id,
          systemFieldId: systemField._id,
          requirement,
          sortOrder: i + 1,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    return { created, updated, permitTypeKey: args.permitTypeKey };
  },
});
