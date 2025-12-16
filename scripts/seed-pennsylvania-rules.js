/**
 * Seed Pennsylvania Escort Rules
 * 
 * This script creates example Pennsylvania escort rules that demonstrate
 * conditional pilot car positioning based on lane count and road conditions.
 * 
 * Run with: node scripts/seed-pennsylvania-rules.js
 */

const { ConvexHttpClient } = require("convex/browser");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in environment");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function seedPennsylvaniaRules() {
  console.log("🚀 Seeding Pennsylvania escort rules...\n");

  try {
    // First, check if Pennsylvania jurisdiction exists
    const jurisdictions = await client.query("compliance:listJurisdictions");
    const pennsylvania = jurisdictions.find(
      (j) => j.abbreviation === "PA" || j.name === "Pennsylvania"
    );

    if (!pennsylvania) {
      console.error("❌ Pennsylvania jurisdiction not found!");
      console.log("Please ensure Pennsylvania is seeded in the database first.");
      process.exit(1);
    }

    console.log(`✓ Found Pennsylvania jurisdiction (ID: ${pennsylvania._id})\n`);

    // Rule 1: Overwidth Pilot Car Positioning (Width > 13ft)
    console.log("Creating Rule 1: Overwidth Pilot Car Positioning...");
    const rule1 = {
      jurisdictionId: pennsylvania._id,
      category: "escort_requirement",
      title: "Overwidth Pilot Car Positioning (Width > 13ft)",
      summary: `Pilot car positioning for loads exceeding 13 feet in width depends on roadway configuration. 
On multi-lane highways, pilot follows. On single-lane roads, pilot leads. 
When police escort is present, pilot follows regardless of lane count.`,
      source: "PA Code 179.10",
      effectiveFrom: undefined,
      effectiveTo: undefined,
      conditions: {
        ifThen: true,
        conditions: [
          {
            id: "width_condition",
            attribute: "width_ft",
            operator: ">",
            value: 13,
          },
        ],
        requirement: {
          front_escorts: 1,
          rear_escorts: 0,
          front_has_height_pole: false,
          placement_conditions: {
            when_multilane: "follow",
            when_single_lane: "lead",
            when_police_escort: "follow",
          },
          notes: "Pilot car positioning varies based on roadway configuration for safety",
        },
      },
    };

    await client.mutation("compliance:createRule", rule1);
    console.log("✓ Created Rule 1\n");

    // Rule 2: Over-Height with Height Pole (Height > 14ft)
    console.log("Creating Rule 2: Over-Height Escort Requirements...");
    const rule2 = {
      jurisdictionId: pennsylvania._id,
      category: "escort_requirement",
      title: "Over-Height Front Escort with Height Pole (Height > 14ft)",
      summary: `Loads exceeding 14 feet in height require a front escort vehicle equipped with a height pole 
to detect overhead obstructions such as bridges, power lines, and traffic signals.`,
      source: "PA Code 179.12",
      conditions: {
        ifThen: true,
        conditions: [
          {
            id: "height_condition",
            attribute: "height_ft",
            operator: ">",
            value: 14,
          },
        ],
        requirement: {
          front_escorts: 1,
          rear_escorts: 0,
          front_has_height_pole: true,
          notes: "Height pole must extend at least to the height of the load",
        },
      },
    };

    await client.mutation("compliance:createRule", rule2);
    console.log("✓ Created Rule 2\n");

    // Rule 3: Extreme Oversize (Width > 16ft on Single Lane)
    console.log("Creating Rule 3: Extreme Oversize Requirements...");
    const rule3 = {
      jurisdictionId: pennsylvania._id,
      category: "escort_requirement",
      title: "Extreme Overwidth Dual Escorts (Width > 16ft)",
      summary: `Loads exceeding 16 feet in width require both front and rear escorts. 
On single-lane roads, front escort leads and rear escort follows. 
On multi-lane highways, both escorts may follow with appropriate positioning.`,
      source: "PA Code 179.14",
      conditions: {
        ifThen: true,
        conditions: [
          {
            id: "extreme_width",
            attribute: "width_ft",
            operator: ">",
            value: 16,
          },
        ],
        requirement: {
          front_escorts: 1,
          rear_escorts: 1,
          placement_conditions: {
            when_multilane: "follow",
            when_single_lane: "lead",
          },
          notes: "Both escorts required for extreme width. Positioning depends on roadway type.",
        },
      },
    };

    await client.mutation("compliance:createRule", rule3);
    console.log("✓ Created Rule 3\n");

    // Rule 4: Nighttime Travel Restriction
    console.log("Creating Rule 4: Nighttime Travel Restriction...");
    const rule4 = {
      jurisdictionId: pennsylvania._id,
      category: "time_restriction",
      title: "Oversize Nighttime Travel Restriction",
      summary: `Oversize loads exceeding 14 feet in width are prohibited from traveling during nighttime hours 
(30 minutes after sunset to 30 minutes before sunrise) without special permit authorization.`,
      source: "PA Code 179.20",
      conditions: {
        ifThen: true,
        conditions: [
          {
            id: "width_night",
            attribute: "width_ft",
            operator: ">",
            value: 14,
          },
          {
            id: "time_check",
            attribute: "time_of_day",
            operator: "=",
            value: "night",
          },
        ],
        requirement: {
          notes: "Special authorization required for nighttime travel of extreme overwidth loads",
        },
      },
    };

    await client.mutation("compliance:createRule", rule4);
    console.log("✓ Created Rule 4\n");

    console.log("✅ Successfully seeded all Pennsylvania rules!");
    console.log("\n📋 Summary:");
    console.log("  - Rule 1: Overwidth pilot positioning (conditional on lanes)");
    console.log("  - Rule 2: Over-height with height pole requirement");
    console.log("  - Rule 3: Extreme overwidth dual escorts");
    console.log("  - Rule 4: Nighttime travel restriction");
    console.log("\n💡 These rules can now be tested in the Compliance Studio UI");

  } catch (error) {
    console.error("❌ Error seeding rules:", error.message);
    if (error.data) {
      console.error("Details:", error.data);
    }
    process.exit(1);
  }
}

// Run the seeding
seedPennsylvaniaRules()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
