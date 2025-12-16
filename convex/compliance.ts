import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

// ============================================
// JURISDICTION FUNCTIONS
// ============================================

export const createJurisdiction = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("state"),
      v.literal("county"),
      v.literal("city"),
      v.literal("district"),
      v.literal("region"),
      v.literal("custom")
    ),
    abbreviation: v.optional(v.string()),
    code: v.optional(v.string()),
    parentId: v.optional(v.id("jurisdictions")),
    composedOf: v.optional(v.array(v.id("jurisdictions"))),
    geometry: v.optional(v.any()),
    fipsCode: v.optional(v.string()),
    population: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const now = Date.now();

    const jurisdictionId = await ctx.db.insert("jurisdictions", {
      name: args.name,
      type: args.type,
      abbreviation: args.abbreviation,
      code: args.code,
      parentId: args.parentId,
      composedOf: args.composedOf,
      geometry: args.geometry,
      fipsCode: args.fipsCode,
      population: args.population,
      createdAt: now,
      updatedAt: now,
    });

    return jurisdictionId;
  },
});

export const getJurisdictions = query({
  args: {
    type: v.optional(v.union(
      v.literal("state"),
      v.literal("county"),
      v.literal("city"),
      v.literal("district"),
      v.literal("region"),
      v.literal("custom")
    )),
    parentId: v.optional(v.id("jurisdictions")),
  },
  handler: async (ctx, args) => {
    if (args.parentId) {
      return await ctx.db
        .query("jurisdictions")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
        .collect();
    }
    if (args.type) {
      return await ctx.db
        .query("jurisdictions")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    }
    return await ctx.db.query("jurisdictions").collect();
  },
});

export const getJurisdictionChildren = query({
  args: {
    parentId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jurisdictions")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
  },
});

export const getJurisdictionHierarchy = query({
  args: {
    stateId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db.get(args.stateId);
    if (!state || state.type !== "state") {
      return null;
    }

    // Get all children of this state
    const children = await ctx.db
      .query("jurisdictions")
      .withIndex("by_parent", (q) => q.eq("parentId", args.stateId))
      .collect();

    // Separate by type
    const counties = children.filter(c => c.type === "county");
    const districts = children.filter(c => c.type === "district");
    const regions = children.filter(c => c.type === "region");
    const cities = children.filter(c => c.type === "city");

    return {
      state,
      counties,
      districts,
      regions,
      cities,
    };
  },
});

export const getJurisdictionById = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jurisdictionId);
  },
});

export const getJurisdictionByAbbreviation = query({
  args: {
    abbreviation: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jurisdictions")
      .withIndex("by_abbreviation", (q) => q.eq("abbreviation", args.abbreviation))
      .first();
  },
});

export const updateJurisdiction = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    name: v.optional(v.string()),
    abbreviation: v.optional(v.string()),
    geometry: v.optional(v.any()),
    fipsCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const { jurisdictionId, ...updates } = args;

    await ctx.db.patch(jurisdictionId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return jurisdictionId;
  },
});

// ============================================
// COMPLIANCE RULE FUNCTIONS
// ============================================

export const createRule = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    category: v.union(
      v.literal("dimension_limit"),
      v.literal("escort_requirement"),
      v.literal("time_restriction"),
      v.literal("permit_requirement"),
      v.literal("speed_limit"),
      v.literal("route_restriction"),
      v.literal("utility_notice")
    ),
    title: v.string(),
    summary: v.string(),
    source: v.optional(v.string()),
    effectiveFrom: v.optional(v.number()),
    effectiveTo: v.optional(v.number()),
    geometryScopeType: v.optional(v.union(
      v.literal("whole_jurisdiction"),
      v.literal("segment_based"),
      v.literal("point_based")
    )),
    geometry: v.optional(v.any()),
    conditions: v.any(),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const now = Date.now();

    const ruleId = await ctx.db.insert("complianceRules", {
      jurisdictionId: args.jurisdictionId,
      status: "draft",
      category: args.category,
      title: args.title,
      summary: args.summary,
      source: args.source,
      effectiveFrom: args.effectiveFrom,
      effectiveTo: args.effectiveTo,
      geometryScopeType: args.geometryScopeType || "whole_jurisdiction",
      geometry: args.geometry,
      conditions: args.conditions,
      createdBy: session.sub,
      updatedBy: session.sub,
      createdAt: now,
      updatedAt: now,
    });

    return ruleId;
  },
});

export const updateRule = mutation({
  args: {
    ruleId: v.id("complianceRules"),
    category: v.optional(v.union(
      v.literal("dimension_limit"),
      v.literal("escort_requirement"),
      v.literal("time_restriction"),
      v.literal("permit_requirement"),
      v.literal("speed_limit"),
      v.literal("route_restriction"),
      v.literal("utility_notice")
    )),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    source: v.optional(v.string()),
    effectiveFrom: v.optional(v.number()),
    effectiveTo: v.optional(v.number()),
    geometryScopeType: v.optional(v.union(
      v.literal("whole_jurisdiction"),
      v.literal("segment_based"),
      v.literal("point_based")
    )),
    geometry: v.optional(v.any()),
    conditions: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const { ruleId, ...updates } = args;

    await ctx.db.patch(ruleId, {
      ...updates,
      updatedBy: session.sub,
      updatedAt: Date.now(),
    });

    return ruleId;
  },
});

export const updateRuleStatus = mutation({
  args: {
    ruleId: v.id("complianceRules"),
    status: v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("published"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);

    await ctx.db.patch(args.ruleId, {
      status: args.status,
      updatedBy: session.sub,
      updatedAt: Date.now(),
    });

    return args.ruleId;
  },
});

export const deleteRule = mutation({
  args: {
    ruleId: v.id("complianceRules"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) {
      throw new Error("Rule not found");
    }

    // Only allow deletion of draft rules
    if (rule.status !== "draft") {
      throw new Error("Can only delete draft rules. Archive published rules instead.");
    }

    await ctx.db.delete(args.ruleId);
    return args.ruleId;
  },
});

export const getRuleById = query({
  args: {
    ruleId: v.id("complianceRules"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) return null;

    const jurisdiction = await ctx.db.get(rule.jurisdictionId);
    return {
      ...rule,
      jurisdiction,
    };
  },
});

export const getRulesForJurisdiction = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("published"),
      v.literal("archived")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("complianceRules")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId));

    const rules = await query.collect();

    if (args.status) {
      return rules.filter(r => r.status === args.status);
    }

    return rules;
  },
});

export const searchRules = query({
  args: {
    jurisdictionId: v.optional(v.id("jurisdictions")),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("published"),
      v.literal("archived")
    )),
    category: v.optional(v.union(
      v.literal("dimension_limit"),
      v.literal("escort_requirement"),
      v.literal("time_restriction"),
      v.literal("permit_requirement"),
      v.literal("speed_limit"),
      v.literal("route_restriction"),
      v.literal("utility_notice")
    )),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let rules = await ctx.db.query("complianceRules").collect();

    // Apply filters
    if (args.jurisdictionId) {
      rules = rules.filter(r => r.jurisdictionId === args.jurisdictionId);
    }
    if (args.status) {
      rules = rules.filter(r => r.status === args.status);
    }
    if (args.category) {
      rules = rules.filter(r => r.category === args.category);
    }
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      rules = rules.filter(r => 
        r.title.toLowerCase().includes(term) ||
        r.summary.toLowerCase().includes(term)
      );
    }

    // Fetch jurisdiction info for each rule
    const rulesWithJurisdiction = await Promise.all(
      rules.map(async (rule) => {
        const jurisdiction = await ctx.db.get(rule.jurisdictionId);
        return {
          ...rule,
          jurisdiction,
        };
      })
    );

    return rulesWithJurisdiction;
  },
});

export const getPublishedRulesForStates = query({
  args: {
    stateAbbreviations: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const result: Array<{
      jurisdictionId: string;
      jurisdictionName: string;
      abbreviation: string;
      rules: any[];
    }> = [];

    for (const abbr of args.stateAbbreviations) {
      const jurisdiction = await ctx.db
        .query("jurisdictions")
        .withIndex("by_abbreviation", (q) => q.eq("abbreviation", abbr))
        .first();

      if (!jurisdiction) continue;

      const rules = await ctx.db
        .query("complianceRules")
        .withIndex("by_jurisdiction_status", (q) => 
          q.eq("jurisdictionId", jurisdiction._id).eq("status", "published")
        )
        .collect();

      // Filter by effective dates
      const activeRules = rules.filter(rule => {
        if (rule.effectiveFrom && rule.effectiveFrom > now) return false;
        if (rule.effectiveTo && rule.effectiveTo < now) return false;
        return true;
      });

      if (activeRules.length > 0) {
        result.push({
          jurisdictionId: jurisdiction._id,
          jurisdictionName: jurisdiction.name,
          abbreviation: abbr,
          rules: activeRules,
        });
      }
    }

    return result;
  },
});

// ============================================
// JURISDICTION EDITORS FUNCTIONS
// ============================================

export const addJurisdictionEditor = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    orgId: v.id("organizations"),
    role: v.union(v.literal("publisher"), v.literal("reviewer"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);

    // Check if already exists
    const existing = await ctx.db
      .query("jurisdictionEditors")
      .withIndex("by_jurisdiction_org", (q) => 
        q.eq("jurisdictionId", args.jurisdictionId).eq("orgId", args.orgId)
      )
      .first();

    if (existing) {
      // Update role
      await ctx.db.patch(existing._id, { role: args.role });
      return existing._id;
    }

    return await ctx.db.insert("jurisdictionEditors", {
      jurisdictionId: args.jurisdictionId,
      orgId: args.orgId,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});

export const removeJurisdictionEditor = mutation({
  args: {
    jurisdictionId: v.id("jurisdictions"),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);

    const editor = await ctx.db
      .query("jurisdictionEditors")
      .withIndex("by_jurisdiction_org", (q) => 
        q.eq("jurisdictionId", args.jurisdictionId).eq("orgId", args.orgId)
      )
      .first();

    if (editor) {
      await ctx.db.delete(editor._id);
    }

    return editor?._id;
  },
});

export const getJurisdictionEditors = query({
  args: {
    jurisdictionId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    const editors = await ctx.db
      .query("jurisdictionEditors")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.jurisdictionId))
      .collect();

    // Fetch org info for each editor
    const editorsWithOrgs = await Promise.all(
      editors.map(async (editor) => {
        const org = await ctx.db.get(editor.orgId);
        return {
          ...editor,
          organization: org,
        };
      })
    );

    return editorsWithOrgs;
  },
});

export const getEditableJurisdictions = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const editorRecords = await ctx.db
      .query("jurisdictionEditors")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const jurisdictions = await Promise.all(
      editorRecords.map(async (record) => {
        const jurisdiction = await ctx.db.get(record.jurisdictionId);
        return {
          ...jurisdiction,
          editorRole: record.role,
        };
      })
    );

    return jurisdictions.filter(Boolean);
  },
});

// ============================================
// SEED FUNCTIONS
// ============================================

export const seedUSStates = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    const US_STATES = [
      { name: "Alabama", abbreviation: "AL", fipsCode: "01" },
      { name: "Alaska", abbreviation: "AK", fipsCode: "02" },
      { name: "Arizona", abbreviation: "AZ", fipsCode: "04" },
      { name: "Arkansas", abbreviation: "AR", fipsCode: "05" },
      { name: "California", abbreviation: "CA", fipsCode: "06" },
      { name: "Colorado", abbreviation: "CO", fipsCode: "08" },
      { name: "Connecticut", abbreviation: "CT", fipsCode: "09" },
      { name: "Delaware", abbreviation: "DE", fipsCode: "10" },
      { name: "Florida", abbreviation: "FL", fipsCode: "12" },
      { name: "Georgia", abbreviation: "GA", fipsCode: "13" },
      { name: "Hawaii", abbreviation: "HI", fipsCode: "15" },
      { name: "Idaho", abbreviation: "ID", fipsCode: "16" },
      { name: "Illinois", abbreviation: "IL", fipsCode: "17" },
      { name: "Indiana", abbreviation: "IN", fipsCode: "18" },
      { name: "Iowa", abbreviation: "IA", fipsCode: "19" },
      { name: "Kansas", abbreviation: "KS", fipsCode: "20" },
      { name: "Kentucky", abbreviation: "KY", fipsCode: "21" },
      { name: "Louisiana", abbreviation: "LA", fipsCode: "22" },
      { name: "Maine", abbreviation: "ME", fipsCode: "23" },
      { name: "Maryland", abbreviation: "MD", fipsCode: "24" },
      { name: "Massachusetts", abbreviation: "MA", fipsCode: "25" },
      { name: "Michigan", abbreviation: "MI", fipsCode: "26" },
      { name: "Minnesota", abbreviation: "MN", fipsCode: "27" },
      { name: "Mississippi", abbreviation: "MS", fipsCode: "28" },
      { name: "Missouri", abbreviation: "MO", fipsCode: "29" },
      { name: "Montana", abbreviation: "MT", fipsCode: "30" },
      { name: "Nebraska", abbreviation: "NE", fipsCode: "31" },
      { name: "Nevada", abbreviation: "NV", fipsCode: "32" },
      { name: "New Hampshire", abbreviation: "NH", fipsCode: "33" },
      { name: "New Jersey", abbreviation: "NJ", fipsCode: "34" },
      { name: "New Mexico", abbreviation: "NM", fipsCode: "35" },
      { name: "New York", abbreviation: "NY", fipsCode: "36" },
      { name: "North Carolina", abbreviation: "NC", fipsCode: "37" },
      { name: "North Dakota", abbreviation: "ND", fipsCode: "38" },
      { name: "Ohio", abbreviation: "OH", fipsCode: "39" },
      { name: "Oklahoma", abbreviation: "OK", fipsCode: "40" },
      { name: "Oregon", abbreviation: "OR", fipsCode: "41" },
      { name: "Pennsylvania", abbreviation: "PA", fipsCode: "42" },
      { name: "Rhode Island", abbreviation: "RI", fipsCode: "44" },
      { name: "South Carolina", abbreviation: "SC", fipsCode: "45" },
      { name: "South Dakota", abbreviation: "SD", fipsCode: "46" },
      { name: "Tennessee", abbreviation: "TN", fipsCode: "47" },
      { name: "Texas", abbreviation: "TX", fipsCode: "48" },
      { name: "Utah", abbreviation: "UT", fipsCode: "49" },
      { name: "Vermont", abbreviation: "VT", fipsCode: "50" },
      { name: "Virginia", abbreviation: "VA", fipsCode: "51" },
      { name: "Washington", abbreviation: "WA", fipsCode: "53" },
      { name: "West Virginia", abbreviation: "WV", fipsCode: "54" },
      { name: "Wisconsin", abbreviation: "WI", fipsCode: "55" },
      { name: "Wyoming", abbreviation: "WY", fipsCode: "56" },
      { name: "District of Columbia", abbreviation: "DC", fipsCode: "11" },
    ];

    const created: string[] = [];
    const skipped: string[] = [];

    for (const state of US_STATES) {
      const existing = await ctx.db
        .query("jurisdictions")
        .withIndex("by_abbreviation", (q) => q.eq("abbreviation", state.abbreviation))
        .first();

      if (existing) {
        skipped.push(state.abbreviation);
        continue;
      }

      await ctx.db.insert("jurisdictions", {
        name: state.name,
        type: "state",
        abbreviation: state.abbreviation,
        fipsCode: state.fipsCode,
        createdAt: now,
        updatedAt: now,
      });

      created.push(state.abbreviation);
    }

    return { created, skipped };
  },
});

export const seedSampleRules = mutation({
  args: {},
  handler: async (ctx) => {
    const session = await requireAuthSession(ctx);
    const now = Date.now();

    // Get IL and PA jurisdictions
    const illinois = await ctx.db
      .query("jurisdictions")
      .withIndex("by_abbreviation", (q) => q.eq("abbreviation", "IL"))
      .first();

    const pennsylvania = await ctx.db
      .query("jurisdictions")
      .withIndex("by_abbreviation", (q) => q.eq("abbreviation", "PA"))
      .first();

    if (!illinois || !pennsylvania) {
      throw new Error("Please seed US states first");
    }

    const sampleRules = [
      {
        jurisdictionId: illinois._id,
        category: "dimension_limit" as const,
        title: "Standard Overwidth Permit Required",
        summary: "Loads exceeding 8'6\" width require an overwidth permit. Maximum permit width is 16' on designated routes.",
        conditions: {
          minWidthFt: 8.5,
          maxWidthFt: 16,
          permitType: "single_trip",
        },
      },
      {
        jurisdictionId: illinois._id,
        category: "escort_requirement" as const,
        title: "Escort Vehicles for Wide Loads",
        summary: "Loads over 12' wide require front escort vehicle. Loads over 14' require front and rear escorts.",
        conditions: {
          minWidthFt: 12,
          escortsRequired: {
            front: true,
            rear: false,
            numberOfEscorts: 1,
          },
        },
      },
      {
        jurisdictionId: illinois._id,
        category: "time_restriction" as const,
        title: "Rush Hour Curfew - Chicago Metro",
        summary: "Oversize loads prohibited on Chicago-area expressways during rush hours (6-9 AM, 3-7 PM weekdays).",
        conditions: {
          minWidthFt: 10,
          timeOfDay: {
            forbidden: ["rush_hour", "weekdays_6am_9am", "weekdays_3pm_7pm"],
          },
        },
      },
      {
        jurisdictionId: pennsylvania._id,
        category: "dimension_limit" as const,
        title: "Maximum Height Limit",
        summary: "Maximum legal height is 13'6\". Loads exceeding this require special permit and route survey.",
        conditions: {
          maxHeightFt: 13.5,
          permitType: "single_trip",
        },
      },
      {
        jurisdictionId: pennsylvania._id,
        category: "escort_requirement" as const,
        title: "Height Pole Vehicle Required",
        summary: "Loads over 14' high require a height pole vehicle to verify bridge clearances.",
        conditions: {
          minHeightFt: 14,
          escortsRequired: {
            front: true,
            heightPole: true,
            numberOfEscorts: 1,
          },
        },
      },
      {
        jurisdictionId: pennsylvania._id,
        category: "permit_requirement" as const,
        title: "Superload Classification",
        summary: "Loads exceeding 16' wide, 15' high, 150' long, or 201,000 lbs gross weight are classified as superloads.",
        conditions: {
          minWidthFt: 16,
          minHeightFt: 15,
          minLengthFt: 150,
          maxGrossWeightLbs: 201000,
          permitType: "superload",
        },
      },
    ];

    const created: string[] = [];

    for (const rule of sampleRules) {
      const ruleId = await ctx.db.insert("complianceRules", {
        ...rule,
        status: "published",
        geometryScopeType: "whole_jurisdiction",
        createdBy: session.sub,
        updatedBy: session.sub,
        createdAt: now,
        updatedAt: now,
      });
      created.push(ruleId);
    }

    return { created };
  },
});

// ============================================
// DISTRICT & COUNTY FUNCTIONS
// ============================================

export const createDistrict = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    parentId: v.id("jurisdictions"),
    countyIds: v.array(v.id("jurisdictions")),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Verify parent is a state
    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.type !== "state") {
      throw new Error("Parent must be a state");
    }

    // Verify all counties exist and belong to the same state
    for (const countyId of args.countyIds) {
      const county = await ctx.db.get(countyId);
      if (!county || county.type !== "county" || county.parentId !== args.parentId) {
        throw new Error("All counties must belong to the same state");
      }
    }

    const districtId = await ctx.db.insert("jurisdictions", {
      name: args.name,
      type: "district",
      code: args.code,
      abbreviation: `D${args.code}`,
      parentId: args.parentId,
      composedOf: args.countyIds,
      createdAt: now,
      updatedAt: now,
    });

    return districtId;
  },
});

export const updateDistrict = mutation({
  args: {
    districtId: v.id("jurisdictions"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    countyIds: v.optional(v.array(v.id("jurisdictions"))),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);
    const { districtId, countyIds, ...updates } = args;

    const district = await ctx.db.get(districtId);
    if (!district || district.type !== "district") {
      throw new Error("Not a district");
    }

    const patchData: any = {
      ...updates,
      updatedAt: Date.now(),
    };

    if (countyIds !== undefined) {
      patchData.composedOf = countyIds;
    }

    if (updates.code) {
      patchData.abbreviation = `D${updates.code}`;
    }

    await ctx.db.patch(districtId, patchData);
    return districtId;
  },
});

export const deleteDistrict = mutation({
  args: {
    districtId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    await requireAuthSession(ctx);

    const district = await ctx.db.get(args.districtId);
    if (!district || district.type !== "district") {
      throw new Error("Not a district");
    }

    // Check for rules using this district
    const rules = await ctx.db
      .query("complianceRules")
      .withIndex("by_jurisdiction", (q) => q.eq("jurisdictionId", args.districtId))
      .first();

    if (rules) {
      throw new Error("Cannot delete district with associated rules");
    }

    await ctx.db.delete(args.districtId);
    return args.districtId;
  },
});

export const getDistrictDetails = query({
  args: {
    districtId: v.id("jurisdictions"),
  },
  handler: async (ctx, args) => {
    const district = await ctx.db.get(args.districtId);
    if (!district || district.type !== "district") {
      return null;
    }

    // Get the counties this district is composed of
    const counties = [];
    if (district.composedOf) {
      for (const countyId of district.composedOf) {
        const county = await ctx.db.get(countyId);
        if (county) {
          counties.push(county);
        }
      }
    }

    // Get parent state
    const state = district.parentId ? await ctx.db.get(district.parentId) : null;

    return {
      ...district,
      counties,
      state,
    };
  },
});

export const seedPennsylvaniaCounties = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Get Pennsylvania
    const pa = await ctx.db
      .query("jurisdictions")
      .withIndex("by_abbreviation", (q) => q.eq("abbreviation", "PA"))
      .first();

    if (!pa) {
      throw new Error("Pennsylvania not found. Please seed US states first.");
    }

    // Pennsylvania counties with FIPS codes and district assignments
    const PA_COUNTIES = [
      // District 1
      { name: "Crawford", fipsCode: "42039", district: 1 },
      { name: "Erie", fipsCode: "42049", district: 1 },
      { name: "Forest", fipsCode: "42053", district: 1 },
      { name: "Mercer", fipsCode: "42085", district: 1 },
      { name: "Venango", fipsCode: "42121", district: 1 },
      { name: "Warren", fipsCode: "42123", district: 1 },
      // District 2
      { name: "Cameron", fipsCode: "42023", district: 2 },
      { name: "Centre", fipsCode: "42027", district: 2 },
      { name: "Clearfield", fipsCode: "42033", district: 2 },
      { name: "Clinton", fipsCode: "42035", district: 2 },
      { name: "Elk", fipsCode: "42047", district: 2 },
      { name: "Jefferson", fipsCode: "42065", district: 2 },
      { name: "McKean", fipsCode: "42083", district: 2 },
      { name: "Potter", fipsCode: "42105", district: 2 },
      // District 3
      { name: "Bradford", fipsCode: "42015", district: 3 },
      { name: "Columbia", fipsCode: "42037", district: 3 },
      { name: "Lycoming", fipsCode: "42081", district: 3 },
      { name: "Montour", fipsCode: "42093", district: 3 },
      { name: "Northumberland", fipsCode: "42097", district: 3 },
      { name: "Snyder", fipsCode: "42109", district: 3 },
      { name: "Sullivan", fipsCode: "42113", district: 3 },
      { name: "Tioga", fipsCode: "42117", district: 3 },
      { name: "Union", fipsCode: "42119", district: 3 },
      // District 4
      { name: "Lackawanna", fipsCode: "42069", district: 4 },
      { name: "Luzerne", fipsCode: "42079", district: 4 },
      { name: "Pike", fipsCode: "42103", district: 4 },
      { name: "Susquehanna", fipsCode: "42115", district: 4 },
      { name: "Wayne", fipsCode: "42127", district: 4 },
      { name: "Wyoming", fipsCode: "42131", district: 4 },
      // District 5
      { name: "Berks", fipsCode: "42011", district: 5 },
      { name: "Carbon", fipsCode: "42025", district: 5 },
      { name: "Lehigh", fipsCode: "42077", district: 5 },
      { name: "Monroe", fipsCode: "42089", district: 5 },
      { name: "Northampton", fipsCode: "42095", district: 5 },
      { name: "Schuylkill", fipsCode: "42107", district: 5 },
      // District 6
      { name: "Bucks", fipsCode: "42017", district: 6 },
      { name: "Chester", fipsCode: "42029", district: 6 },
      { name: "Delaware", fipsCode: "42045", district: 6 },
      { name: "Montgomery", fipsCode: "42091", district: 6 },
      { name: "Philadelphia", fipsCode: "42101", district: 6 },
      // District 8
      { name: "Adams", fipsCode: "42001", district: 8 },
      { name: "Cumberland", fipsCode: "42041", district: 8 },
      { name: "Dauphin", fipsCode: "42043", district: 8 },
      { name: "Franklin", fipsCode: "42055", district: 8 },
      { name: "Lancaster", fipsCode: "42071", district: 8 },
      { name: "Lebanon", fipsCode: "42075", district: 8 },
      { name: "Perry", fipsCode: "42099", district: 8 },
      { name: "York", fipsCode: "42133", district: 8 },
      // District 9
      { name: "Bedford", fipsCode: "42009", district: 9 },
      { name: "Blair", fipsCode: "42013", district: 9 },
      { name: "Cambria", fipsCode: "42021", district: 9 },
      { name: "Fulton", fipsCode: "42057", district: 9 },
      { name: "Huntingdon", fipsCode: "42061", district: 9 },
      { name: "Juniata", fipsCode: "42067", district: 9 },
      { name: "Mifflin", fipsCode: "42087", district: 9 },
      { name: "Somerset", fipsCode: "42111", district: 9 },
      // District 10
      { name: "Armstrong", fipsCode: "42005", district: 10 },
      { name: "Beaver", fipsCode: "42007", district: 10 },
      { name: "Butler", fipsCode: "42019", district: 10 },
      { name: "Clarion", fipsCode: "42031", district: 10 },
      { name: "Indiana", fipsCode: "42063", district: 10 },
      { name: "Lawrence", fipsCode: "42073", district: 10 },
      // District 11
      { name: "Allegheny", fipsCode: "42003", district: 11 },
      // District 12
      { name: "Fayette", fipsCode: "42051", district: 12 },
      { name: "Greene", fipsCode: "42059", district: 12 },
      { name: "Washington", fipsCode: "42125", district: 12 },
      { name: "Westmoreland", fipsCode: "42129", district: 12 },
    ];

    const createdCounties: string[] = [];
    const skippedCounties: string[] = [];
    const countyIdsByDistrict = new Map<number, string[]>();

    // Create all counties
    for (const county of PA_COUNTIES) {
      // Check if county already exists
      const existing = await ctx.db
        .query("jurisdictions")
        .withIndex("by_fips", (q) => q.eq("fipsCode", county.fipsCode))
        .first();

      let countyId: string;
      if (existing) {
        skippedCounties.push(county.name);
        countyId = existing._id;
      } else {
        countyId = await ctx.db.insert("jurisdictions", {
          name: `${county.name} County`,
          type: "county",
          parentId: pa._id,
          fipsCode: county.fipsCode,
          createdAt: now,
          updatedAt: now,
        });
        createdCounties.push(county.name);
      }

      // Track county IDs by district
      const districtCounties = countyIdsByDistrict.get(county.district) || [];
      districtCounties.push(countyId);
      countyIdsByDistrict.set(county.district, districtCounties);
    }

    return {
      createdCounties,
      skippedCounties,
      totalCounties: PA_COUNTIES.length,
    };
  },
});

export const seedPennsylvaniaDistricts = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthSession(ctx);
    const now = Date.now();

    // Get Pennsylvania
    const pa = await ctx.db
      .query("jurisdictions")
      .withIndex("by_abbreviation", (q) => q.eq("abbreviation", "PA"))
      .first();

    if (!pa) {
      throw new Error("Pennsylvania not found. Please seed US states first.");
    }

    // Get all PA counties
    const paCounties = await ctx.db
      .query("jurisdictions")
      .withIndex("by_parent", (q) => q.eq("parentId", pa._id))
      .collect();

    let counties = paCounties.filter(c => c.type === "county");

    // If no counties exist, seed them first
    if (counties.length === 0) {
      // Seed PA counties inline
      const PA_COUNTIES = [
        { name: "Crawford", fipsCode: "42039", district: 1 },
        { name: "Erie", fipsCode: "42049", district: 1 },
        { name: "Forest", fipsCode: "42053", district: 1 },
        { name: "Mercer", fipsCode: "42085", district: 1 },
        { name: "Venango", fipsCode: "42121", district: 1 },
        { name: "Warren", fipsCode: "42123", district: 1 },
        { name: "Cameron", fipsCode: "42023", district: 2 },
        { name: "Centre", fipsCode: "42027", district: 2 },
        { name: "Clearfield", fipsCode: "42033", district: 2 },
        { name: "Clinton", fipsCode: "42035", district: 2 },
        { name: "Elk", fipsCode: "42047", district: 2 },
        { name: "Jefferson", fipsCode: "42065", district: 2 },
        { name: "McKean", fipsCode: "42083", district: 2 },
        { name: "Potter", fipsCode: "42105", district: 2 },
        { name: "Bradford", fipsCode: "42015", district: 3 },
        { name: "Columbia", fipsCode: "42037", district: 3 },
        { name: "Lycoming", fipsCode: "42081", district: 3 },
        { name: "Montour", fipsCode: "42093", district: 3 },
        { name: "Northumberland", fipsCode: "42097", district: 3 },
        { name: "Snyder", fipsCode: "42109", district: 3 },
        { name: "Sullivan", fipsCode: "42113", district: 3 },
        { name: "Tioga", fipsCode: "42117", district: 3 },
        { name: "Union", fipsCode: "42119", district: 3 },
        { name: "Lackawanna", fipsCode: "42069", district: 4 },
        { name: "Luzerne", fipsCode: "42079", district: 4 },
        { name: "Pike", fipsCode: "42103", district: 4 },
        { name: "Susquehanna", fipsCode: "42115", district: 4 },
        { name: "Wayne", fipsCode: "42127", district: 4 },
        { name: "Wyoming", fipsCode: "42131", district: 4 },
        { name: "Berks", fipsCode: "42011", district: 5 },
        { name: "Carbon", fipsCode: "42025", district: 5 },
        { name: "Lehigh", fipsCode: "42077", district: 5 },
        { name: "Monroe", fipsCode: "42089", district: 5 },
        { name: "Northampton", fipsCode: "42095", district: 5 },
        { name: "Schuylkill", fipsCode: "42107", district: 5 },
        { name: "Bucks", fipsCode: "42017", district: 6 },
        { name: "Chester", fipsCode: "42029", district: 6 },
        { name: "Delaware", fipsCode: "42045", district: 6 },
        { name: "Montgomery", fipsCode: "42091", district: 6 },
        { name: "Philadelphia", fipsCode: "42101", district: 6 },
        { name: "Adams", fipsCode: "42001", district: 8 },
        { name: "Cumberland", fipsCode: "42041", district: 8 },
        { name: "Dauphin", fipsCode: "42043", district: 8 },
        { name: "Franklin", fipsCode: "42055", district: 8 },
        { name: "Lancaster", fipsCode: "42071", district: 8 },
        { name: "Lebanon", fipsCode: "42075", district: 8 },
        { name: "Perry", fipsCode: "42099", district: 8 },
        { name: "York", fipsCode: "42133", district: 8 },
        { name: "Bedford", fipsCode: "42009", district: 9 },
        { name: "Blair", fipsCode: "42013", district: 9 },
        { name: "Cambria", fipsCode: "42021", district: 9 },
        { name: "Fulton", fipsCode: "42057", district: 9 },
        { name: "Huntingdon", fipsCode: "42061", district: 9 },
        { name: "Juniata", fipsCode: "42067", district: 9 },
        { name: "Mifflin", fipsCode: "42087", district: 9 },
        { name: "Somerset", fipsCode: "42111", district: 9 },
        { name: "Armstrong", fipsCode: "42005", district: 10 },
        { name: "Beaver", fipsCode: "42007", district: 10 },
        { name: "Butler", fipsCode: "42019", district: 10 },
        { name: "Clarion", fipsCode: "42031", district: 10 },
        { name: "Indiana", fipsCode: "42063", district: 10 },
        { name: "Lawrence", fipsCode: "42073", district: 10 },
        { name: "Allegheny", fipsCode: "42003", district: 11 },
        { name: "Fayette", fipsCode: "42051", district: 12 },
        { name: "Greene", fipsCode: "42059", district: 12 },
        { name: "Washington", fipsCode: "42125", district: 12 },
        { name: "Westmoreland", fipsCode: "42129", district: 12 },
      ];

      for (const county of PA_COUNTIES) {
        const countyId = await ctx.db.insert("jurisdictions", {
          name: `${county.name} County`,
          type: "county",
          parentId: pa._id,
          fipsCode: county.fipsCode,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Refetch counties
      const refreshedCounties = await ctx.db
        .query("jurisdictions")
        .withIndex("by_parent", (q) => q.eq("parentId", pa._id))
        .collect();
      counties = refreshedCounties.filter(c => c.type === "county");
    }

    // District definitions with county names
    const DISTRICTS = [
      { number: 1, counties: ["Crawford", "Erie", "Forest", "Mercer", "Venango", "Warren"] },
      { number: 2, counties: ["Cameron", "Centre", "Clearfield", "Clinton", "Elk", "Jefferson", "McKean", "Potter"] },
      { number: 3, counties: ["Bradford", "Columbia", "Lycoming", "Montour", "Northumberland", "Snyder", "Sullivan", "Tioga", "Union"] },
      { number: 4, counties: ["Lackawanna", "Luzerne", "Pike", "Susquehanna", "Wayne", "Wyoming"] },
      { number: 5, counties: ["Berks", "Carbon", "Lehigh", "Monroe", "Northampton", "Schuylkill"] },
      { number: 6, counties: ["Bucks", "Chester", "Delaware", "Montgomery", "Philadelphia"] },
      { number: 8, counties: ["Adams", "Cumberland", "Dauphin", "Franklin", "Lancaster", "Lebanon", "Perry", "York"] },
      { number: 9, counties: ["Bedford", "Blair", "Cambria", "Fulton", "Huntingdon", "Juniata", "Mifflin", "Somerset"] },
      { number: 10, counties: ["Armstrong", "Beaver", "Butler", "Clarion", "Indiana", "Lawrence"] },
      { number: 11, counties: ["Allegheny"] },
      { number: 12, counties: ["Fayette", "Greene", "Washington", "Westmoreland"] },
    ];

    const createdDistricts: string[] = [];
    const skippedDistricts: string[] = [];

    for (const district of DISTRICTS) {
      // Check if district already exists
      const existingDistrict = await ctx.db
        .query("jurisdictions")
        .withIndex("by_parent", (q) => q.eq("parentId", pa._id))
        .collect();

      const existing = existingDistrict.find(
        d => d.type === "district" && d.code === String(district.number)
      );

      if (existing) {
        skippedDistricts.push(`District ${district.number}`);
        continue;
      }

      // Find county IDs
      const countyIds = district.counties.map(countyName => {
        const county = counties.find(
          c => c.name === `${countyName} County` || c.name === countyName
        );
        return county?._id;
      }).filter((id): id is typeof counties[0]["_id"] => id !== undefined);

      if (countyIds.length !== district.counties.length) {
        console.warn(`District ${district.number}: Some counties not found`);
      }

      await ctx.db.insert("jurisdictions", {
        name: `District ${district.number}-0`,
        type: "district",
        code: String(district.number),
        abbreviation: `D${district.number}`,
        parentId: pa._id,
        composedOf: countyIds,
        createdAt: now,
        updatedAt: now,
      });

      createdDistricts.push(`District ${district.number}`);
    }

    return {
      createdDistricts,
      skippedDistricts,
    };
  },
});
