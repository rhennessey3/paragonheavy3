import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Axle weight and distance types for validation
const axleWeightValidator = v.object({
  position: v.number(),
  weight: v.optional(v.number()),
});

const axleDistanceValidator = v.object({
  fromPosition: v.number(),
  toPosition: v.number(),
  distance: v.string(),
});

// Default truck seed data with axle configurations
const DEFAULT_TRUCKS = [
  { 
    name: "Day Cab", make: "Peterbilt", model: "389", axles: 2, emptyWeight: 16000,
    axleWeights: [
      { position: 1, weight: 12000 }, // Steer axle
      { position: 2, weight: 4000 },  // Drive axle
    ],
    axleDistances: [
      { fromPosition: 1, toPosition: 2, distance: "18'6\"" },
    ],
  },
  { 
    name: "Day Cab", make: "Kenworth", model: "W900", axles: 2, emptyWeight: 16500,
    axleWeights: [
      { position: 1, weight: 12500 },
      { position: 2, weight: 4000 },
    ],
    axleDistances: [
      { fromPosition: 1, toPosition: 2, distance: "19'0\"" },
    ],
  },
  { 
    name: "Day Cab", make: "Freightliner", model: "Cascadia", axles: 2, emptyWeight: 15500,
    axleWeights: [
      { position: 1, weight: 11500 },
      { position: 2, weight: 4000 },
    ],
    axleDistances: [
      { fromPosition: 1, toPosition: 2, distance: "18'0\"" },
    ],
  },
  { 
    name: "Sleeper", make: "Peterbilt", model: "389", axles: 2, emptyWeight: 19000,
    axleWeights: [
      { position: 1, weight: 13000 },
      { position: 2, weight: 6000 },
    ],
    axleDistances: [
      { fromPosition: 1, toPosition: 2, distance: "20'0\"" },
    ],
  },
  { 
    name: "Sleeper", make: "Kenworth", model: "W900", axles: 2, emptyWeight: 19500,
    axleWeights: [
      { position: 1, weight: 13500 },
      { position: 2, weight: 6000 },
    ],
    axleDistances: [
      { fromPosition: 1, toPosition: 2, distance: "20'6\"" },
    ],
  },
  { 
    name: "Sleeper", make: "Freightliner", model: "Cascadia", axles: 2, emptyWeight: 18500,
    axleWeights: [
      { position: 1, weight: 12500 },
      { position: 2, weight: 6000 },
    ],
    axleDistances: [
      { fromPosition: 1, toPosition: 2, distance: "19'6\"" },
    ],
  },
  { 
    name: "Heavy Haul Day Cab", make: "Peterbilt", model: "389", axles: 3, emptyWeight: 20000,
    axleWeights: [
      { position: 1, weight: 12000 },
      { position: 2, weight: 4000 },
      { position: 3, weight: 4000 },
    ],
    axleDistances: [
      { fromPosition: 1, toPosition: 2, distance: "16'0\"" },
      { fromPosition: 2, toPosition: 3, distance: "4'6\"" },
    ],
  },
  { 
    name: "Heavy Haul Day Cab", make: "Kenworth", model: "W900", axles: 3, emptyWeight: 20500,
    axleWeights: [
      { position: 1, weight: 12500 },
      { position: 2, weight: 4000 },
      { position: 3, weight: 4000 },
    ],
    axleDistances: [
      { fromPosition: 1, toPosition: 2, distance: "16'6\"" },
      { fromPosition: 2, toPosition: 3, distance: "4'6\"" },
    ],
  },
  { 
    name: "Heavy Haul Sleeper", make: "Peterbilt", model: "389", axles: 3, emptyWeight: 23000,
    axleWeights: [
      { position: 1, weight: 13000 },
      { position: 2, weight: 5000 },
      { position: 3, weight: 5000 },
    ],
    axleDistances: [
      { fromPosition: 1, toPosition: 2, distance: "18'0\"" },
      { fromPosition: 2, toPosition: 3, distance: "4'6\"" },
    ],
  },
  { 
    name: "Heavy Haul Sleeper", make: "Kenworth", model: "W900", axles: 3, emptyWeight: 23500,
    axleWeights: [
      { position: 1, weight: 13500 },
      { position: 2, weight: 5000 },
      { position: 3, weight: 5000 },
    ],
    axleDistances: [
      { fromPosition: 1, toPosition: 2, distance: "18'6\"" },
      { fromPosition: 2, toPosition: 3, distance: "4'6\"" },
    ],
  },
];

// Get all trucks for an organization
export const getTrucks = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const trucks = await ctx.db
      .query("trucks")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Sort by name, then by make
    return trucks.sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return (a.make || "").localeCompare(b.make || "");
    });
  },
});

// Create new truck
export const createTruck = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    axles: v.number(),
    emptyWeight: v.number(),
    usDotNumber: v.optional(v.string()),
    plateNumber: v.optional(v.string()),
    vinNumber: v.optional(v.string()),
    registrationState: v.optional(v.string()),
    axleWeights: v.optional(v.array(axleWeightValidator)),
    axleDistances: v.optional(v.array(axleDistanceValidator)),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const truckId = await ctx.db.insert("trucks", {
      name: args.name,
      make: args.make,
      model: args.model,
      axles: args.axles,
      emptyWeight: args.emptyWeight,
      usDotNumber: args.usDotNumber,
      plateNumber: args.plateNumber,
      vinNumber: args.vinNumber,
      registrationState: args.registrationState,
      axleWeights: args.axleWeights,
      axleDistances: args.axleDistances,
      orgId: args.orgId,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });

    return truckId;
  },
});

// Update existing truck
export const updateTruck = mutation({
  args: {
    truckId: v.id("trucks"),
    name: v.string(),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    axles: v.number(),
    emptyWeight: v.number(),
    usDotNumber: v.optional(v.string()),
    plateNumber: v.optional(v.string()),
    vinNumber: v.optional(v.string()),
    registrationState: v.optional(v.string()),
    axleWeights: v.optional(v.array(axleWeightValidator)),
    axleDistances: v.optional(v.array(axleDistanceValidator)),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.truckId);
    if (!existing) {
      throw new Error("Truck not found");
    }

    await ctx.db.patch(args.truckId, {
      name: args.name,
      make: args.make,
      model: args.model,
      axles: args.axles,
      emptyWeight: args.emptyWeight,
      usDotNumber: args.usDotNumber,
      plateNumber: args.plateNumber,
      vinNumber: args.vinNumber,
      registrationState: args.registrationState,
      axleWeights: args.axleWeights,
      axleDistances: args.axleDistances,
      updatedAt: Date.now(),
    });

    return args.truckId;
  },
});

// Delete truck
export const deleteTruck = mutation({
  args: { truckId: v.id("trucks") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.truckId);
    if (!existing) {
      throw new Error("Truck not found");
    }

    await ctx.db.delete(args.truckId);
    return { success: true };
  },
});

// Seed default trucks for an organization
export const seedDefaultTrucks = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const now = Date.now();
    let created = 0;

    for (const truck of DEFAULT_TRUCKS) {
      await ctx.db.insert("trucks", {
        name: truck.name,
        make: truck.make,
        model: truck.model,
        axles: truck.axles,
        emptyWeight: truck.emptyWeight,
        axleWeights: truck.axleWeights,
        axleDistances: truck.axleDistances,
        orgId: args.orgId,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }

    return { created };
  },
});

// Remove all default trucks for an organization
export const removeDefaultTrucks = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const trucks = await ctx.db
      .query("trucks")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    let removed = 0;
    for (const truck of trucks) {
      if (truck.isDefault) {
        await ctx.db.delete(truck._id);
        removed++;
      }
    }

    return { removed };
  },
});

// Get count of default trucks
export const getDefaultTruckCount = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const trucks = await ctx.db
      .query("trucks")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    return trucks.filter((t) => t.isDefault).length;
  },
});





