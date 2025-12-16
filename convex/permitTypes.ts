import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

// ============================================
// PERMIT TYPE FUNCTIONS
// ============================================

export const getPermitTypesForJurisdiction = query({
  args: {
    jurisdictionId: v.optional(v.id("jurisdictions")),
  },
  handler: async (ctx, args) => {
    // Get global permit types (jurisdictionId = null)
    const globalPermitTypes = await ctx.db
      .query("permitTypes")
      .filter((q) => q.eq(q.field("jurisdictionId"), undefined))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get jurisdiction-specific permit types if jurisdictionId provided
    let jurisdictionPermitTypes: any[] = [];
    if (args.jurisdictionId) {
      jurisdictionPermitTypes = await ctx.db
        .query("permitTypes")
        .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    // Combine and sort by sortOrder
    const allPermitTypes = [...globalPermitTypes, ...jurisdictionPermitTypes];
    return allPermitTypes.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getAllPermitTypes = query({
  args: {},
  handler: async (ctx) => {
    const permitTypes = await ctx.db
      .query("permitTypes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Fetch jurisdiction info for each
    const permitTypesWithJurisdiction = await Promise.all(
      permitTypes.map(async (pt) => {
        let jurisdiction = null;
        if (pt.jurisdictionId) {
          jurisdiction = await ctx.db.get(pt.jurisdictionId);
        }
        return {
          ...pt,
          jurisdiction,
        };
      })
    );

    return permitTypesWithJurisdiction.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getPermitTypeStats = query({
  args: {},
  handler: async (ctx) => {
    const permitTypes = await ctx.db
      .query("permitTypes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // For each permit type, get field configuration stats and jurisdiction info
    const permitTypeStats = await Promise.all(
      permitTypes.map(async (pt) => {
        // Get all field configurations for this permit type
        const fieldConfigs = await ctx.db
          .query("permitTypeFields")
          .withIndex("by_permit_type", (q) => q.eq("permitTypeId", pt._id))
          .collect();

        const fieldStats = {
          total: fieldConfigs.length,
          required: fieldConfigs.filter((fc) => fc.requirement === "required").length,
          optional: fieldConfigs.filter((fc) => fc.requirement === "optional").length,
          hidden: fieldConfigs.filter((fc) => fc.requirement === "hidden").length,
        };

        // Fetch jurisdiction info if available
        let jurisdiction = null;
        if (pt.jurisdictionId) {
          jurisdiction = await ctx.db.get(pt.jurisdictionId);
        }

        return {
          ...pt,
          fieldStats,
          jurisdiction,
        };
      })
    );

    return permitTypeStats.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getPermitTypeById = query({
  args: {
    permitTypeId: v.id("permitTypes"),
  },
  handler: async (ctx, args) => {
    const permitType = await ctx.db.get(args.permitTypeId);
    if (!permitType) return null;

    let jurisdiction = null;
    if (permitType.jurisdictionId) {
      jurisdiction = await ctx.db.get(permitType.jurisdictionId);
    }

    return {
      ...permitType,
      jurisdiction,
    };
  },
});

export const getPermitTypeFields = query({
  args: {
    permitTypeId: v.id("permitTypes"),
  },
  handler: async (ctx, args) => {
    const fieldConfigs = await ctx.db
      .query("permitTypeFields")
      .withIndex("by_permit_type", (q) => q.eq("permitTypeId", args.permitTypeId))
      .collect();

    return fieldConfigs.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const createPermitType = mutation({
  args: {
    jurisdictionId: v.optional(v.id("jurisdictions")),
    key: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    typical_cost_min: v.optional(v.number()),
    typical_cost_max: v.optional(v.number()),
    typical_processing_days: v.optional(v.number()),
    application_url: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Check if permit type with same key already exists for this jurisdiction
    const existing = await ctx.db
      .query("permitTypes")
      .withIndex("by_jurisdiction_key", (q) => 
        q.eq("jurisdictionId", args.jurisdictionId).eq("key", args.key)
      )
      .first();

    if (existing) {
      throw new Error(`Permit type with key "${args.key}" already exists for this jurisdiction`);
    }

    // Determine sort order if not provided
    let sortOrder = args.sortOrder;
    if (sortOrder === undefined) {
      const allPermitTypes = await ctx.db.query("permitTypes").collect();
      sortOrder = allPermitTypes.length > 0 
        ? Math.max(...allPermitTypes.map(pt => pt.sortOrder)) + 1 
        : 0;
    }

    const permitTypeId = await ctx.db.insert("permitTypes", {
      jurisdictionId: args.jurisdictionId,
      key: args.key,
      label: args.label,
      description: args.description,
      typical_cost_min: args.typical_cost_min,
      typical_cost_max: args.typical_cost_max,
      typical_processing_days: args.typical_processing_days,
      application_url: args.application_url,
      isActive: true,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    });

    return permitTypeId;
  },
});

export const updatePermitType = mutation({
  args: {
    permitTypeId: v.id("permitTypes"),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    typical_cost_min: v.optional(v.number()),
    typical_cost_max: v.optional(v.number()),
    typical_processing_days: v.optional(v.number()),
    application_url: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
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
    
    const permitType = await ctx.db.get(args.permitTypeId);
    if (!permitType) {
      throw new Error("Permit type not found");
    }

    // Check if any rules reference this permit type
    // (We'd need to scan complianceRules conditions for permit_type_key matching this permitType.key)
    // For now, just soft delete by setting isActive = false
    
    await ctx.db.patch(args.permitTypeId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.permitTypeId;
  },
});

export const bulkSetFieldRequirements = mutation({
  args: {
    permitTypeId: v.id("permitTypes"),
    fields: v.array(
      v.object({
        systemFieldId: v.id("systemFields"),
        requirement: v.union(v.literal("required"), v.literal("optional"), v.literal("hidden")),
        sortOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Verify permit type exists
    const permitType = await ctx.db.get(args.permitTypeId);
    if (!permitType) {
      throw new Error("Permit type not found");
    }

    // For each field, either update existing config or create new one
    for (const field of args.fields) {
      // Check if config already exists
      const existingConfig = await ctx.db
        .query("permitTypeFields")
        .withIndex("by_permit_type", (q) => q.eq("permitTypeId", args.permitTypeId))
        .filter((q) => q.eq(q.field("systemFieldId"), field.systemFieldId))
        .first();

      if (existingConfig) {
        // Update existing
        await ctx.db.patch(existingConfig._id, {
          requirement: field.requirement,
          sortOrder: field.sortOrder,
          updatedAt: now,
        });
      } else {
        // Create new
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

    return { success: true };
  },
});

export const copyPermitTypeFields = mutation({
  args: {
    sourcePermitTypeId: v.id("permitTypes"),
    targetPermitTypeId: v.id("permitTypes"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Verify both permit types exist
    const sourcePermitType = await ctx.db.get(args.sourcePermitTypeId);
    const targetPermitType = await ctx.db.get(args.targetPermitTypeId);
    
    if (!sourcePermitType || !targetPermitType) {
      throw new Error("Permit type not found");
    }

    // Get all field configurations from source
    const sourceFields = await ctx.db
      .query("permitTypeFields")
      .withIndex("by_permit_type", (q) => q.eq("permitTypeId", args.sourcePermitTypeId))
      .collect();

    // Copy each field configuration to target
    for (const field of sourceFields) {
      await ctx.db.insert("permitTypeFields", {
        permitTypeId: args.targetPermitTypeId,
        systemFieldId: field.systemFieldId,
        requirement: field.requirement,
        sortOrder: field.sortOrder,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, copiedFields: sourceFields.length };
  },
});

// ============================================
// SEED FUNCTIONS
// ============================================

export const seedGlobalPermitTypes = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    const GLOBAL_PERMIT_TYPES = [
      {
        key: "single_trip_oversize",
        label: "Single Trip - Oversize",
        description: "One-time permit for oversize load",
        typical_cost_min: 30,
        typical_cost_max: 150,
        typical_processing_days: 3,
        sortOrder: 0,
      },
      {
        key: "single_trip_overweight",
        label: "Single Trip - Overweight",
        description: "One-time permit for overweight load",
        typical_cost_min: 50,
        typical_cost_max: 200,
        typical_processing_days: 3,
        sortOrder: 1,
      },
      {
        key: "single_trip_combined",
        label: "Single Trip - Oversize/Overweight",
        description: "One-time permit for loads exceeding both size and weight limits",
        typical_cost_min: 75,
        typical_cost_max: 300,
        typical_processing_days: 5,
        sortOrder: 2,
      },
      {
        key: "annual_oversize",
        label: "Annual - Oversize",
        description: "Annual permit for recurring oversize loads",
        typical_cost_min: 500,
        typical_cost_max: 2000,
        typical_processing_days: 10,
        sortOrder: 3,
      },
      {
        key: "annual_overweight",
        label: "Annual - Overweight",
        description: "Annual permit for recurring overweight loads",
        typical_cost_min: 750,
        typical_cost_max: 3000,
        typical_processing_days: 10,
        sortOrder: 4,
      },
      {
        key: "mobile_home",
        label: "Mobile Home Transport",
        description: "Permit for transporting mobile/manufactured homes",
        typical_cost_min: 100,
        typical_cost_max: 400,
        typical_processing_days: 5,
        sortOrder: 5,
      },
      {
        key: "superload",
        label: "Superload",
        description: "Special permit for extremely large or heavy loads requiring engineering analysis",
        typical_cost_min: 1000,
        typical_cost_max: 10000,
        typical_processing_days: 30,
        sortOrder: 6,
      },
    ];

    const created: string[] = [];
    const skipped: string[] = [];

    for (const permitType of GLOBAL_PERMIT_TYPES) {
      // Check if already exists
      const existing = await ctx.db
        .query("permitTypes")
        .filter((q) => q.eq(q.field("jurisdictionId"), undefined))
        .filter((q) => q.eq(q.field("key"), permitType.key))
        .first();

      if (existing) {
        skipped.push(permitType.key);
        continue;
      }

      await ctx.db.insert("permitTypes", {
        jurisdictionId: undefined,
        key: permitType.key,
        label: permitType.label,
        description: permitType.description,
        typical_cost_min: permitType.typical_cost_min,
        typical_cost_max: permitType.typical_cost_max,
        typical_processing_days: permitType.typical_processing_days,
        isActive: true,
        sortOrder: permitType.sortOrder,
        createdAt: now,
        updatedAt: now,
      });

      created.push(permitType.key);
    }

    return { created, skipped };
  },
});

// Alias for compatibility with permit-types page
export const seedPermitTypes = seedGlobalPermitTypes;

export const seedPermitTypeFields = mutation({
  args: {
    permitTypeKey: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Get all system fields
    const systemFields = await ctx.db.query("systemFields").collect();
    
    if (systemFields.length === 0) {
      throw new Error("No system fields found. Please seed system fields first.");
    }

    // Get the permit type
    const permitType = await ctx.db
      .query("permitTypes")
      .filter((q) => q.eq(q.field("key"), args.permitTypeKey))
      .first();

    if (!permitType) {
      throw new Error(`Permit type with key "${args.permitTypeKey}" not found`);
    }

    // Default field configuration - make commonly used fields required or optional
    const commonlyRequiredFields = [
      "vehicle_registration",
      "driver_license", 
      "insurance_policy",
      "contact_phone",
      "contact_email",
      "load_dimensions_length",
      "load_dimensions_width", 
      "load_dimensions_height",
      "load_weight_total",
      "origin_address",
      "destination_address",
      "route_description",
    ];

    const commonlyOptionalFields = [
      "vehicle_vin",
      "vehicle_make",
      "vehicle_model",
      "vehicle_year",
      "load_description",
      "commodity_type",
      "trip_start_date",
      "trip_end_date",
    ];

    const created: string[] = [];
    const skipped: string[] = [];

    for (const field of systemFields) {
      // Check if field config already exists
      const existing = await ctx.db
        .query("permitTypeFields")
        .withIndex("by_permit_type", (q) => q.eq("permitTypeId", permitType._id))
        .filter((q) => q.eq(q.field("systemFieldId"), field._id))
        .first();

      if (existing) {
        skipped.push(field.key);
        continue;
      }

      // Determine if field should be required, optional, or hidden
      let requirement: "required" | "optional" | "hidden";
      if (commonlyRequiredFields.includes(field.key)) {
        requirement = "required";
      } else if (commonlyOptionalFields.includes(field.key)) {
        requirement = "optional";
      } else {
        requirement = "hidden";
      }

      await ctx.db.insert("permitTypeFields", {
        permitTypeId: permitType._id,
        systemFieldId: field._id,
        requirement,
        sortOrder: field.sortOrder,
        createdAt: now,
        updatedAt: now,
      });

      created.push(field.key);
    }

    return { created, skipped };
  },
});
