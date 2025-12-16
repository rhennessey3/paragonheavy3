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
    // No auth required - this is an admin seed operation
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
      { key: "date_move_begins", label: "Date Move Begins", category: "dates", dataType: "date" as const, isRequired: false, sortOrder: 12.5, description: "Date the physical move/transport is scheduled to begin" },
      { key: "date_move_ends", label: "Date Move Ends", category: "dates", dataType: "date" as const, isRequired: false, sortOrder: 12.6, description: "Date the physical move/transport is scheduled to end" },

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
      { key: "route_description", label: "Route Description", category: "route_conditions", dataType: "string" as const, isRequired: false, sortOrder: 30, description: "Formatted list of route numbers with travel direction (e.g., I-80E, I-81N)" },
      { key: "interim_routes", label: "Interim Routes", category: "route_conditions", dataType: "string" as const, isRequired: false, sortOrder: 31, description: "Non-state/local routes (listed in parentheses on permit forms)" },
      { key: "total_miles", label: "Total Miles", category: "route_conditions", dataType: "number" as const, isRequired: false, sortOrder: 32, description: "Total distance in miles for the route" },
      { key: "route_origin_city", label: "Route Origin City", category: "route_conditions", dataType: "string" as const, isRequired: false, sortOrder: 33, description: "Starting city for the permit route" },
      { key: "route_origin_state", label: "Route Origin State", category: "route_conditions", dataType: "string" as const, isRequired: false, sortOrder: 34, description: "Starting state for the permit route (2-letter code)" },
      { key: "route_destination_city", label: "Route Destination City", category: "route_conditions", dataType: "string" as const, isRequired: false, sortOrder: 35, description: "Destination city for the permit route" },
      { key: "route_destination_state", label: "Route Destination State", category: "route_conditions", dataType: "string" as const, isRequired: false, sortOrder: 36, description: "Destination state for the permit route (2-letter code)" },
      { key: "counties_traversed", label: "Counties Traversed", category: "route_conditions", dataType: "string" as const, isRequired: false, sortOrder: 37, description: "Comma-separated list of counties the route passes through" },

      // Load Dimensions
      { key: "gross_weight", label: "Gross Weight (lbs)", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 38, description: "Maximum gross vehicle weight in pounds" },
      { key: "legal_weight", label: "Legal Weight (lbs)", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 39, description: "Legal weight limit in pounds" },
      { key: "total_length_ft", label: "Total Length (ft)", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 40, description: "Total length in feet" },
      { key: "total_length_in", label: "Total Length (in)", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 41, description: "Total length additional inches" },
      { key: "total_width_ft", label: "Total Width (ft)", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 42, description: "Total width in feet" },
      { key: "total_width_in", label: "Total Width (in)", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 43, description: "Total width additional inches" },
      { key: "body_width_ft", label: "Body Width 63A/63B (ft)", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 44, description: "Body width per 63A/63B in feet" },
      { key: "body_width_in", label: "Body Width 63A/63B (in)", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 45, description: "Body width per 63A/63B additional inches" },
      { key: "total_height_ft", label: "Total Height (ft)", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 46, description: "Total height in feet" },
      { key: "total_height_in", label: "Total Height (in)", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 47, description: "Total height additional inches" },
      { key: "load_quantity", label: "Load Quantity", category: "load_dimensions", dataType: "number" as const, isRequired: false, sortOrder: 48, description: "Number of loads/items" },
      { key: "serial_id", label: "Serial ID (Last 6 Digits)", category: "load_dimensions", dataType: "string" as const, isRequired: false, sortOrder: 49, description: "Last six digits of serial identification" },
      { key: "bol", label: "BOL", category: "load_dimensions", dataType: "string" as const, isRequired: false, sortOrder: 50, description: "Bill of Lading number" },
      { key: "type_code", label: "Type Code", category: "load_dimensions", dataType: "string" as const, isRequired: false, sortOrder: 51, description: "Load type classification code" },
      { key: "load_description", label: "Load Description", category: "load_dimensions", dataType: "string" as const, isRequired: false, sortOrder: 52, description: "Detailed description of the load" },

      // Axle Configuration
      { key: "total_axle_count", label: "Total Axle Count", category: "axle_configuration", dataType: "number" as const, isRequired: false, sortOrder: 53, description: "Combined total axle count (power unit + drawn unit)" },
      { key: "power_unit_axles", label: "Power Unit Axles", category: "axle_configuration", dataType: "number" as const, isRequired: false, sortOrder: 54, description: "Number of axles on the truck/tractor" },
      { key: "drawn_unit_axles", label: "Drawn Unit Axles", category: "axle_configuration", dataType: "number" as const, isRequired: false, sortOrder: 55, description: "Number of axles on the trailer(s)" },
      { key: "axle_weights_summary", label: "Axle Weights", category: "axle_configuration", dataType: "string" as const, isRequired: false, sortOrder: 56, description: "Formatted summary of individual axle weights (e.g., 'Front: 12000, 2nd: 34000, 3rd: 34000')" },
      { key: "axle_distances_summary", label: "Axle Distances", category: "axle_configuration", dataType: "string" as const, isRequired: false, sortOrder: 57, description: "Formatted summary of axle spacings (e.g., '1-2: 18\\'6\", 2-3: 4\\'6\"')" },

      // Vehicle Equipment
      { key: "vehicle_count", label: "Number of Vehicles", category: "vehicle_equipment", dataType: "number" as const, isRequired: false, sortOrder: 58, description: "Total number of vehicles in the combination" },
      { key: "power_unit_type", label: "Power Unit Type", category: "vehicle_equipment", dataType: "string" as const, isRequired: false, sortOrder: 59, description: "Type of power unit (e.g., Day Cab, Sleeper, Heavy Haul)" },
      { key: "power_unit_usdot", label: "Power Unit US DOT #", category: "vehicle_equipment", dataType: "string" as const, isRequired: false, sortOrder: 60, description: "US DOT number for the power unit" },
      { key: "power_unit_plate", label: "Power Unit Plate #", category: "vehicle_equipment", dataType: "string" as const, isRequired: false, sortOrder: 61, description: "License plate number for the power unit" },
      { key: "power_unit_vin", label: "Power Unit VIN #", category: "vehicle_equipment", dataType: "string" as const, isRequired: false, sortOrder: 62, description: "VIN (or last 6 digits) for the power unit" },
      { key: "power_unit_state", label: "Power Unit State", category: "vehicle_equipment", dataType: "string" as const, isRequired: false, sortOrder: 63, description: "Registration state for the power unit (2-letter code)" },
      { key: "drawn_unit_type", label: "Drawn Unit Type", category: "vehicle_equipment", dataType: "string" as const, isRequired: false, sortOrder: 64, description: "Type of drawn unit (e.g., Flatbed, Step Deck, RGN)" },
      { key: "drawn_unit_plate", label: "Drawn Unit Plate #", category: "vehicle_equipment", dataType: "string" as const, isRequired: false, sortOrder: 65, description: "License plate number for the drawn unit" },
      { key: "drawn_unit_vin", label: "Drawn Unit VIN #", category: "vehicle_equipment", dataType: "string" as const, isRequired: false, sortOrder: 66, description: "VIN (or last 6 digits) for the drawn unit" },
      { key: "drawn_unit_state", label: "Drawn Unit State", category: "vehicle_equipment", dataType: "string" as const, isRequired: false, sortOrder: 67, description: "Registration state for the drawn unit (2-letter code)" },
      { key: "drawn_unit_axles", label: "Drawn Unit Axle Count", category: "vehicle_equipment", dataType: "number" as const, isRequired: false, sortOrder: 68, description: "Number of axles on the drawn unit" },
      { key: "equipment_description", label: "Equipment Description", category: "vehicle_equipment", dataType: "string" as const, isRequired: false, sortOrder: 69, description: "Full description of all vehicles in the combination" },
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
