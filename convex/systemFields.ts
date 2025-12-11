import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

// ============================================
// SYSTEM FIELDS FUNCTIONS
// ============================================

export const getSystemFields = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("systemFields")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    }
    
    const fields = await ctx.db.query("systemFields").collect();
    return fields.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getSystemFieldById = query({
  args: {
    fieldId: v.id("systemFields"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fieldId);
  },
});

export const getSystemFieldByKey = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("systemFields")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

export const createSystemField = mutation({
  args: {
    key: v.string(),
    label: v.string(),
    category: v.string(),
    dataType: v.union(
      v.literal("string"),
      v.literal("number"),
      v.literal("date"),
      v.literal("currency"),
      v.literal("phone"),
      v.literal("address")
    ),
    description: v.optional(v.string()),
    isRequired: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Check if key already exists
    const existing = await ctx.db
      .query("systemFields")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      throw new Error(`System field with key "${args.key}" already exists`);
    }

    return await ctx.db.insert("systemFields", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSystemField = mutation({
  args: {
    fieldId: v.id("systemFields"),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const { fieldId, ...updates } = args;

    const field = await ctx.db.get(fieldId);
    if (!field) {
      throw new Error("System field not found");
    }

    await ctx.db.patch(fieldId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return fieldId;
  },
});

export const deleteSystemField = mutation({
  args: {
    fieldId: v.id("systemFields"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);

    // Check if any mappings exist for this field
    const mappings = await ctx.db
      .query("stateFieldMappings")
      .withIndex("by_system_field", (q) => q.eq("systemFieldId", args.fieldId))
      .collect();

    if (mappings.length > 0) {
      throw new Error(`Cannot delete field with ${mappings.length} existing state mappings. Remove mappings first.`);
    }

    await ctx.db.delete(args.fieldId);
    return args.fieldId;
  },
});

// ============================================
// STATE FIELD MAPPINGS FUNCTIONS
// ============================================

export const getStateMappings = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    const mappings = await ctx.db
      .query("stateFieldMappings")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();

    // Fetch system field info for each mapping
    const mappingsWithFields = await Promise.all(
      mappings.map(async (mapping) => {
        const systemField = await ctx.db.get(mapping.systemFieldId);
        return {
          ...mapping,
          systemField,
        };
      })
    );

    return mappingsWithFields;
  },
});

export const getMappingsBySystemField = query({
  args: {
    systemFieldId: v.id("systemFields"),
  },
  handler: async (ctx, args) => {
    const mappings = await ctx.db
      .query("stateFieldMappings")
      .withIndex("by_system_field", (q) => q.eq("systemFieldId", args.systemFieldId))
      .collect();

    // Fetch jurisdiction info for each mapping
    const mappingsWithJurisdictions = await Promise.all(
      mappings.map(async (mapping) => {
        const jurisdiction = await ctx.db.get(mapping.jurisdictionId);
        return {
          ...mapping,
          jurisdiction,
        };
      })
    );

    return mappingsWithJurisdictions;
  },
});

export const createOrUpdateMapping = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    systemFieldId: v.id("systemFields"),
    stateLabel: v.string(),
    stateFieldKey: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

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
        stateLabel: args.stateLabel,
        stateFieldKey: args.stateFieldKey,
        notes: args.notes,
        isActive: args.isActive ?? existing.isActive,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new mapping
    return await ctx.db.insert("stateFieldMappings", {
      jurisdictionId: args.jurisdictionId,
      systemFieldId: args.systemFieldId,
      stateLabel: args.stateLabel,
      stateFieldKey: args.stateFieldKey,
      notes: args.notes,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteMapping = mutation({
  args: {
    mappingId: v.id("stateFieldMappings"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    await ctx.db.delete(args.mappingId);
    return args.mappingId;
  },
});

export const getMappingCounts = query({
  args: {},
  handler: async (ctx) => {
    const systemFields = await ctx.db.query("systemFields").collect();
    const totalFields = systemFields.length;

    // Get all jurisdictions
    const jurisdictions = await ctx.db
      .query("jurisdictions")
      .withIndex("by_type", (q) => q.eq("type", "state"))
      .collect();

    // Get mapping counts per jurisdiction
    const jurisdictionStats = await Promise.all(
      jurisdictions.map(async (jurisdiction) => {
        const mappings = await ctx.db
          .query("stateFieldMappings")
          .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", jurisdiction._id))
          .collect();

        const activeMappings = mappings.filter(m => m.isActive);

        return {
          jurisdictionId: jurisdiction._id,
          jurisdictionName: jurisdiction.name,
          abbreviation: jurisdiction.abbreviation,
          totalMappings: mappings.length,
          activeMappings: activeMappings.length,
          coverage: totalFields > 0 ? Math.round((activeMappings.length / totalFields) * 100) : 0,
        };
      })
    );

    return {
      totalFields,
      jurisdictionStats: jurisdictionStats.sort((a, b) => b.coverage - a.coverage),
    };
  },
});

// ============================================
// SEED FUNCTIONS
// ============================================

export const seedSystemFields = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    const CANONICAL_FIELDS = [
      // Permit Information
      { key: "permit_number", label: "Permit Number", category: "permit_info", dataType: "string" as const, isRequired: true, sortOrder: 1, description: "Unique identifier for the permit" },
      { key: "permit_type", label: "Permit Type", category: "permit_info", dataType: "string" as const, isRequired: true, sortOrder: 2, description: "Type of permit (single trip, annual, superload, etc.)" },
      { key: "permit_fee", label: "Permit Fee", category: "permit_info", dataType: "currency" as const, isRequired: false, sortOrder: 3, description: "Base permit fee amount" },
      { key: "other_fee", label: "Other Fee", category: "permit_info", dataType: "currency" as const, isRequired: false, sortOrder: 4, description: "Additional fees (processing, expedite, etc.)" },
      { key: "total_permit_cost", label: "Total Permit Cost", category: "permit_info", dataType: "currency" as const, isRequired: false, sortOrder: 5, description: "Total cost including all fees" },
      { key: "permit_service", label: "Permit Service", category: "permit_info", dataType: "string" as const, isRequired: false, sortOrder: 6, description: "Service level or permit service provider" },

      // Dates & Times
      { key: "requested_start_date", label: "Requested Start Date", category: "dates", dataType: "date" as const, isRequired: false, sortOrder: 7, description: "Date requested for permit to begin" },
      { key: "start_date", label: "Start Date", category: "dates", dataType: "date" as const, isRequired: true, sortOrder: 8, description: "Effective start date of permit" },
      { key: "end_date", label: "End Date", category: "dates", dataType: "date" as const, isRequired: true, sortOrder: 9, description: "Expiration date of permit" },
      { key: "date_issued", label: "Date Issued", category: "dates", dataType: "date" as const, isRequired: false, sortOrder: 10, description: "Date the permit was issued" },
      { key: "time_issued", label: "Time Issued", category: "dates", dataType: "string" as const, isRequired: false, sortOrder: 11, description: "Time the permit was issued" },
      { key: "travel_times", label: "Travel Times", category: "dates", dataType: "string" as const, isRequired: false, sortOrder: 12, description: "Allowed travel times/restrictions" },

      // People
      { key: "issuer_name", label: "Issuer Name", category: "people", dataType: "string" as const, isRequired: false, sortOrder: 13, description: "Name of the permit issuer/agency" },
      { key: "requestor", label: "Requestor", category: "people", dataType: "string" as const, isRequired: true, sortOrder: 14, description: "Name of person/company requesting permit" },
      { key: "contact", label: "Contact", category: "people", dataType: "string" as const, isRequired: false, sortOrder: 15, description: "Primary contact person" },
      { key: "recipient_name", label: "Recipient Name", category: "people", dataType: "string" as const, isRequired: false, sortOrder: 16, description: "Name of permit recipient if different from requestor" },

      // Requestor Address
      { key: "requestor_street_address", label: "Requestor Street Address", category: "requestor_address", dataType: "address" as const, isRequired: false, sortOrder: 17, description: "Street address of requestor" },
      { key: "requestor_city", label: "Requestor City", category: "requestor_address", dataType: "string" as const, isRequired: false, sortOrder: 18, description: "City of requestor" },
      { key: "requestor_state", label: "Requestor State", category: "requestor_address", dataType: "string" as const, isRequired: false, sortOrder: 19, description: "State of requestor" },
      { key: "requestor_zip_code", label: "Requestor Zip Code", category: "requestor_address", dataType: "string" as const, isRequired: false, sortOrder: 20, description: "Zip code of requestor" },

      // Recipient Address
      { key: "recipient_street_address", label: "Recipient Street Address", category: "recipient_address", dataType: "address" as const, isRequired: false, sortOrder: 21, description: "Street address of recipient" },
      { key: "recipient_city", label: "Recipient City", category: "recipient_address", dataType: "string" as const, isRequired: false, sortOrder: 22, description: "City of recipient" },
      { key: "recipient_state", label: "Recipient State", category: "recipient_address", dataType: "string" as const, isRequired: false, sortOrder: 23, description: "State of recipient" },
      { key: "recipient_zip_code", label: "Recipient Zip Code", category: "recipient_address", dataType: "string" as const, isRequired: false, sortOrder: 24, description: "Zip code of recipient" },

      // Contact & Payment
      { key: "telephone_number", label: "Telephone Number", category: "contact", dataType: "phone" as const, isRequired: false, sortOrder: 25, description: "Contact phone number" },
      { key: "usdot", label: "USDOT", category: "contact", dataType: "string" as const, isRequired: false, sortOrder: 26, description: "USDOT number" },
      { key: "payment_method", label: "Payment Method", category: "contact", dataType: "string" as const, isRequired: false, sortOrder: 27, description: "Method of payment for permit" },

      // Route & Conditions
      { key: "allowable_route", label: "Allowable Route", category: "route_conditions", dataType: "string" as const, isRequired: false, sortOrder: 28, description: "Approved route for travel" },
      { key: "general_conditions", label: "General Conditions", category: "route_conditions", dataType: "string" as const, isRequired: false, sortOrder: 29, description: "General conditions and restrictions" },
    ];

    const created: string[] = [];
    const skipped: string[] = [];

    for (const field of CANONICAL_FIELDS) {
      const existing = await ctx.db
        .query("systemFields")
        .withIndex("by_key", (q) => q.eq("key", field.key))
        .first();

      if (existing) {
        skipped.push(field.key);
        continue;
      }

      await ctx.db.insert("systemFields", {
        ...field,
        createdAt: now,
        updatedAt: now,
      });

      created.push(field.key);
    }

    return { created, skipped, total: CANONICAL_FIELDS.length };
  },
});
