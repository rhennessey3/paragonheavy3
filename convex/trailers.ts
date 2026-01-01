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

// Helper to generate axle weights for trailers based on axle count and empty weight
function generateTrailerAxleConfig(axles: number, emptyWeight: number) {
  const weightPerAxle = Math.round(emptyWeight / axles);
  const axleWeights = [];
  const axleDistances = [];
  
  for (let i = 1; i <= axles; i++) {
    axleWeights.push({ position: i, weight: weightPerAxle });
    if (i < axles) {
      // Standard trailer axle spacing is typically 4'0" to 4'6"
      axleDistances.push({ fromPosition: i, toPosition: i + 1, distance: "4'6\"" });
    }
  }
  
  return { axleWeights, axleDistances };
}

// Default trailer seed data with axle configurations
const DEFAULT_TRAILERS = [
  { name: "Flatbed", axles: 2, deckHeight: "5'0\"", emptyWeight: 12000, ...generateTrailerAxleConfig(2, 12000) },
  { name: "Step Deck", axles: 2, deckHeight: "3'6\"", emptyWeight: 13000, ...generateTrailerAxleConfig(2, 13000) },
  { name: "Drop Deck", axles: 2, deckHeight: "1'10\"", emptyWeight: 15000, ...generateTrailerAxleConfig(2, 15000) },
  { name: "Step Deck Low Profile", axles: 2, deckHeight: "3'0\"", emptyWeight: 15000, ...generateTrailerAxleConfig(2, 15000) },
  { name: "Double Drop Deck", axles: 2, deckHeight: "1'10\"", emptyWeight: 16000, ...generateTrailerAxleConfig(2, 16000) },
  { name: "RGN / Lowboy", axles: 2, deckHeight: "1'8\"", emptyWeight: 16000, ...generateTrailerAxleConfig(2, 16000) },
  { name: "Flatbed Extendable", axles: 2, deckHeight: "5'0\"", emptyWeight: 17000, ...generateTrailerAxleConfig(2, 17000) },
  { name: "Step Deck Extendable", axles: 2, deckHeight: "3'6\"", emptyWeight: 17000, ...generateTrailerAxleConfig(2, 17000) },
  { name: "Double Drop Stretch", axles: 2, deckHeight: "2'0\"", emptyWeight: 20000, ...generateTrailerAxleConfig(2, 20000) },
  { name: "RGN / Lowboy", axles: 3, deckHeight: "1'10\"", emptyWeight: 20000, ...generateTrailerAxleConfig(3, 20000) },
  { name: "RGN / Lowboy", axles: 3, deckHeight: "1'8\"", emptyWeight: 21000, ...generateTrailerAxleConfig(3, 21000) },
  { name: "Double Drop", axles: 3, deckHeight: "1'10\"", emptyWeight: 21000, ...generateTrailerAxleConfig(3, 21000) },
  { name: "RGN / Lowboy Stretch", axles: 3, deckHeight: "1'10\"", emptyWeight: 25000, ...generateTrailerAxleConfig(3, 25000) },
  { name: "Double Drop Stretch", axles: 3, deckHeight: "2'0\"", emptyWeight: 25000, ...generateTrailerAxleConfig(3, 25000) },
  { name: "RGN / Lowboy", axles: 4, deckHeight: "1'8\"", emptyWeight: 28000, ...generateTrailerAxleConfig(4, 28000) },
  { name: "Double Drop", axles: 4, deckHeight: "1'10\"", emptyWeight: 28000, ...generateTrailerAxleConfig(4, 28000) },
  { name: "Double Drop", axles: 5, deckHeight: "1'10\"", emptyWeight: 35000, ...generateTrailerAxleConfig(5, 35000) },
  { name: "RGN / Lowboy", axles: 5, deckHeight: "1'8\"", emptyWeight: 35000, ...generateTrailerAxleConfig(5, 35000) },
  { name: "Double Drop", axles: 6, deckHeight: "1'10\"", emptyWeight: 45000, ...generateTrailerAxleConfig(6, 45000) },
  { name: "RGN / Lowboy", axles: 6, deckHeight: "1'8\"", emptyWeight: 45000, ...generateTrailerAxleConfig(6, 45000) },
];

// Get all trailers for an organization
export const getTrailers = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const trailers = await ctx.db
      .query("trailers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Sort by name, then by axles
    return trailers.sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return a.axles - b.axles;
    });
  },
});

// Create new trailer
export const createTrailer = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    axles: v.number(),
    deckHeight: v.string(),
    emptyWeight: v.number(),
    plateNumber: v.optional(v.string()),
    vinNumber: v.optional(v.string()),
    registrationState: v.optional(v.string()),
    axleWeights: v.optional(v.array(axleWeightValidator)),
    axleDistances: v.optional(v.array(axleDistanceValidator)),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const trailerId = await ctx.db.insert("trailers", {
      name: args.name,
      axles: args.axles,
      deckHeight: args.deckHeight,
      emptyWeight: args.emptyWeight,
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

    return trailerId;
  },
});

// Update existing trailer
export const updateTrailer = mutation({
  args: {
    trailerId: v.id("trailers"),
    name: v.string(),
    axles: v.number(),
    deckHeight: v.string(),
    emptyWeight: v.number(),
    plateNumber: v.optional(v.string()),
    vinNumber: v.optional(v.string()),
    registrationState: v.optional(v.string()),
    axleWeights: v.optional(v.array(axleWeightValidator)),
    axleDistances: v.optional(v.array(axleDistanceValidator)),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.trailerId);
    if (!existing) {
      throw new Error("Trailer not found");
    }

    await ctx.db.patch(args.trailerId, {
      name: args.name,
      axles: args.axles,
      deckHeight: args.deckHeight,
      emptyWeight: args.emptyWeight,
      plateNumber: args.plateNumber,
      vinNumber: args.vinNumber,
      registrationState: args.registrationState,
      axleWeights: args.axleWeights,
      axleDistances: args.axleDistances,
      updatedAt: Date.now(),
    });

    return args.trailerId;
  },
});

// Delete trailer
export const deleteTrailer = mutation({
  args: { trailerId: v.id("trailers") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.trailerId);
    if (!existing) {
      throw new Error("Trailer not found");
    }

    await ctx.db.delete(args.trailerId);
    return { success: true };
  },
});

// Seed default trailers for an organization
export const seedDefaultTrailers = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const now = Date.now();
    let created = 0;

    for (const trailer of DEFAULT_TRAILERS) {
      await ctx.db.insert("trailers", {
        name: trailer.name,
        axles: trailer.axles,
        deckHeight: trailer.deckHeight,
        emptyWeight: trailer.emptyWeight,
        axleWeights: trailer.axleWeights,
        axleDistances: trailer.axleDistances,
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

// Remove all default trailers for an organization
export const removeDefaultTrailers = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const trailers = await ctx.db
      .query("trailers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    let removed = 0;
    for (const trailer of trailers) {
      if (trailer.isDefault) {
        await ctx.db.delete(trailer._id);
        removed++;
      }
    }

    return { removed };
  },
});

// Get count of default trailers
export const getDefaultTrailerCount = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const trailers = await ctx.db
      .query("trailers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    return trailers.filter((t) => t.isDefault).length;
  },
});





