import { mutation } from "./_generated/server";

/**
 * Seed/Update function for the PA Escort Policy using ACCUMULATE mode
 *
 * This implements Pennsylvania's pilot car escort requirements using the
 * Parallel Accumulator pattern where multiple condition streams evaluate
 * independently and their outputs are merged using MAX/OR strategies.
 *
 * Run via Convex dashboard or CLI: npx convex run seedPAEscortPolicy:seedPAEscortPolicy
 */
export const seedPAEscortPolicy = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Find the PA jurisdiction
    const paJurisdiction = await ctx.db
      .query("jurisdictions")
      .withIndex("by_abbreviation", (q) => q.eq("abbreviation", "PA"))
      .first();

    if (!paJurisdiction) {
      throw new Error("Pennsylvania jurisdiction not found. Please create it first.");
    }

    const jurisdictionId = paJurisdiction._id;
    const now = Date.now();

    // Define all conditions using the Parallel Accumulator pattern
    // Each condition evaluates independently and contributes its output
    const conditions = [
      // =========================================================================
      // STREAM A: FRONT PILOT CONDITIONS (outputs { frontPilots: 1 })
      // =========================================================================

      // A1: Height > 14'6" → front pilot with height pole
      {
        id: "height_front",
        attribute: "height_ft",
        operator: ">",
        value: 14.5,
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "Pilot car precedes by 1,000-3,000 ft with height pole/device",
        priority: 1,
        output: { frontPilots: 1 },
      },

      // A2: Bridge solo/occupy on two-way → front pilot
      {
        id: "bridge_solo_two_way_front",
        attribute: "restriction_solo_occupy",
        operator: "=",
        value: true,
        subConditions: [
          { attribute: "bridge_traffic_direction", operator: "=", value: "two_way" },
        ],
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "Two-direction bridges: pilot cars precede + follow",
        priority: 2,
        output: { frontPilots: 1 },
      },

      // A3: Width > 13' on single lane (no police) → front pilot
      {
        id: "width_single_lane_front",
        attribute: "width_ft",
        operator: ">",
        value: 13,
        subConditions: [
          { attribute: "num_lanes_same_direction", operator: "=", value: 1 },
          { attribute: "police_escort", operator: "=", value: false },
        ],
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "Highway has 1 lane same direction → pilot car precedes",
        priority: 3,
        output: { frontPilots: 1 },
      },

      // =========================================================================
      // STREAM B: REAR PILOT CONDITIONS (outputs { rearPilots: 1 })
      // =========================================================================

      // B1: Length > 90' → rear pilot
      {
        id: "length_rear",
        attribute: "length_ft",
        operator: ">",
        value: 90,
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "Total length (incl load) > 90 ft - pilot car follows on all highways",
        priority: 4,
        output: { rearPilots: 1 },
      },

      // B2: Rear overhang > 15' → rear pilot
      {
        id: "overhang_rear",
        attribute: "rear_overhang_ft",
        operator: ">",
        value: 15,
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "Load extends > 15 ft beyond rear - pilot car follows",
        priority: 5,
        output: { rearPilots: 1 },
      },

      // B3: Bridge reduced speed → rear pilot
      {
        id: "bridge_reduced_speed_rear",
        attribute: "restriction_reduced_speed",
        operator: "=",
        value: true,
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "Permit requires reduced speeds on bridges - pilot car follows while reduced-speed",
        priority: 6,
        output: { rearPilots: 1 },
      },

      // B4: Bridge solo/occupy on two-way → rear pilot
      {
        id: "bridge_solo_two_way_rear",
        attribute: "restriction_solo_occupy",
        operator: "=",
        value: true,
        subConditions: [
          { attribute: "bridge_traffic_direction", operator: "=", value: "two_way" },
        ],
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "Two-direction bridges: pilot cars precede + follow",
        priority: 7,
        output: { rearPilots: 1 },
      },

      // B5: Bridge solo/occupy on one-way → rear pilot only
      {
        id: "bridge_solo_one_way_rear",
        attribute: "restriction_solo_occupy",
        operator: "=",
        value: true,
        subConditions: [
          { attribute: "bridge_traffic_direction", operator: "=", value: "one_way" },
        ],
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "One-direction bridges: pilot car follows only (no front pilot needed)",
        priority: 8,
        output: { rearPilots: 1 },
      },

      // B6: Width > 13' on multi-lane → rear pilot
      {
        id: "width_multi_lane_rear",
        attribute: "width_ft",
        operator: ">",
        value: 13,
        subConditions: [
          { attribute: "num_lanes_same_direction", operator: ">=", value: 2 },
        ],
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "Highway has 2+ lanes same direction → pilot car follows",
        priority: 9,
        output: { rearPilots: 1 },
      },

      // B7: Width > 13' with police escort → rear pilot (displacement rule)
      {
        id: "width_police_rear",
        attribute: "width_ft",
        operator: ">",
        value: 13,
        subConditions: [
          { attribute: "police_escort", operator: "=", value: true },
        ],
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "Police escort present → pilot car follows (displaced from front position)",
        priority: 10,
        output: { rearPilots: 1 },
      },

      // =========================================================================
      // STREAM C: EQUIPMENT CONDITIONS (outputs { heightPole: true })
      // =========================================================================

      // C1: Height > 14'6" → height pole required
      {
        id: "height_equipment",
        attribute: "height_ft",
        operator: ">",
        value: 14.5,
        sourceRegulation: "67 Pa. Code § 179.3",
        notes: "Height pole/device required; utilities must be notified ≥24 hours prior for wire relocation",
        priority: 11,
        output: { heightPole: true },
      },
    ];

    // Base output (defaults when no conditions match)
    const baseOutput = {
      frontPilots: 0,
      rearPilots: 0,
      heightPole: false,
    };

    // Merge strategies for ACCUMULATE mode
    // MAX: Take highest value (prevents duplicate escorts when multiple conditions fire)
    // OR: Take true if any condition sets true
    const mergeStrategies = {
      frontPilots: "MAX",
      rearPilots: "MAX",
      heightPole: "OR",
    };

    // 2. Check if PA escort policy already exists
    const existingPolicies = await ctx.db
      .query("compliancePolicies")
      .withIndex("by_jurisdiction_type", (q) =>
        q.eq("jurisdictionId", jurisdictionId).eq("policyType", "escort")
      )
      .collect();

    if (existingPolicies.length > 0) {
      // Update existing policy
      const existingPolicy = existingPolicies[0];
      await ctx.db.patch(existingPolicy._id, {
        name: "PA Escort Policy",
        description:
          "Pennsylvania pilot car/escort requirements for oversized loads per PA DOT regulations. Uses ACCUMULATE mode where each condition evaluates independently and outputs are merged.",
        conditions,
        conditionLogic: "ACCUMULATE",
        baseOutput,
        mergeStrategies,
        updatedBy: "system_seed",
        updatedAt: now,
      });

      return {
        success: true,
        policyId: existingPolicy._id,
        action: "updated",
        message: `PA Escort Policy updated with ${conditions.length} conditions (ACCUMULATE mode)`,
        conditionCount: {
          frontPilot: 3,
          rearPilot: 7,
          equipment: 1,
          total: conditions.length,
        },
      };
    }

    // 3. Create new PA Escort Policy
    const policyId = await ctx.db.insert("compliancePolicies", {
      jurisdictionId,
      policyType: "escort",
      name: "PA Escort Policy",
      description:
        "Pennsylvania pilot car/escort requirements for oversized loads per PA DOT regulations. Uses ACCUMULATE mode where each condition evaluates independently and outputs are merged.",
      status: "draft",
      conditionLogic: "ACCUMULATE",
      conditions,
      baseOutput,
      mergeStrategies,
      createdBy: "system_seed",
      updatedBy: "system_seed",
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      policyId,
      action: "created",
      message: `PA Escort Policy created with ${conditions.length} conditions (ACCUMULATE mode)`,
      conditionCount: {
        frontPilot: 3,
        rearPilot: 7,
        equipment: 1,
        total: conditions.length,
      },
    };
  },
});
