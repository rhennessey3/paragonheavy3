import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthSession } from "./auth";

export const createLoad = mutation({
  args: {
    loadNumber: v.string(),
    orgId: v.id("organizations"),
    origin: v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
    }),
    destination: v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
    }),
    dimensions: v.object({
      height: v.number(),
      width: v.number(),
      length: v.number(),
      weight: v.number(),
      description: v.optional(v.string()),
    }),
    pickupDate: v.optional(v.number()),
    deliveryDate: v.optional(v.number()),
    specialRequirements: v.optional(v.string()),
    contactInfo: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      email: v.string(),
    })),
    route: v.optional(v.object({
      waypoints: v.array(v.object({
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()),
        order: v.number(),
      })),
      snappedCoordinates: v.array(v.array(v.number())),
    })),
  },
  handler: async (ctx, args) => {
    const session = await requireAuthSession(ctx);
    const now = Date.now();

    const loadId = await ctx.db.insert("loads", {
      loadNumber: args.loadNumber,
      orgId: args.orgId,
      createdBy: session.sub, // Clerk user ID
      status: "draft",
      origin: args.origin,
      destination: args.destination,
      dimensions: args.dimensions,
      pickupDate: args.pickupDate,
      deliveryDate: args.deliveryDate,
      specialRequirements: args.specialRequirements,
      contactInfo: args.contactInfo,
      route: args.route,
      createdAt: now,
      updatedAt: now,
    });

    return loadId;
  },
});

export const getLoad = query({
  args: {
    loadId: v.id("loads"),
  },
  handler: async (ctx, args) => {
    const load = await ctx.db.get(args.loadId);
    return load;
  },
});

export const getOrganizationLoads = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("available"),
      v.literal("assigned"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("loads")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const loads = await query.collect();
    return loads;
  },
});

// New: Get loads scoped to specific user within their org
export const getUserLoads = query({
  args: {
    userId: v.string(), // Clerk user ID
    orgId: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("available"),
      v.literal("assigned"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    // Get all loads for this organization (created by this org)
    let ownLoads = await ctx.db
      .query("loads")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Filter for user's loads OR loads without createdBy (legacy support)
    ownLoads = ownLoads.filter(load =>
      !load.createdBy || load.createdBy === args.userId
    );

    // Get loads assigned to this organization as carrier
    const carrierLoads = await ctx.db
      .query("loads")
      .withIndex("by_carrier", (q) => q.eq("carrierOrgId", args.orgId))
      .collect();

    // Get loads assigned to this organization as escort (no index, so filter manually)
    const allLoads = await ctx.db.query("loads").collect();
    const escortLoads = allLoads.filter(load => load.escortOrgId === args.orgId);

    // Combine all loads and remove duplicates
    const allLoadIds = new Set<string>();
    const combinedLoads = [...ownLoads, ...carrierLoads, ...escortLoads].filter(load => {
      if (allLoadIds.has(load._id)) {
        return false;
      }
      allLoadIds.add(load._id);
      return true;
    });

    // Apply status filter if provided
    if (args.status) {
      return combinedLoads.filter(load => load.status === args.status);
    }

    return combinedLoads;
  },
});

export const getAvailableLoads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const loads = await ctx.db
      .query("loads")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .take(args.limit || 100);

    return loads;
  },
});

export const getCarrierLoads = query({
  args: {
    carrierOrgId: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("available"),
      v.literal("assigned"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("loads")
      .withIndex("by_carrier", (q) => q.eq("carrierOrgId", args.carrierOrgId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const loads = await query.collect();
    return loads;
  },
});

export const assignLoadToOrganization = mutation({
  args: {
    loadId: v.id("loads"),
    carrierOrgId: v.optional(v.id("organizations")),
    escortOrgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const load = await ctx.db.get(args.loadId);
    if (!load) {
      throw new Error("Load not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    // Update carrier assignment
    if (args.carrierOrgId !== undefined) {
      updates.carrierOrgId = args.carrierOrgId;
      // Auto-update status to "assigned" when carrier is assigned
      if (args.carrierOrgId && load.status === "draft") {
        updates.status = "available";
      }
    }

    // Update escort assignment
    if (args.escortOrgId !== undefined) {
      updates.escortOrgId = args.escortOrgId;
    }

    await ctx.db.patch(args.loadId, updates);
    return args.loadId;
  },
});

export const updateLoadStatus = mutation({
  args: {
    loadId: v.id("loads"),
    status: v.union(
      v.literal("draft"),
      v.literal("available"),
      v.literal("assigned"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    carrierOrgId: v.optional(v.id("organizations")),
    escortOrgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const { loadId, status, carrierOrgId, escortOrgId } = args;

    const load = await ctx.db.get(loadId);
    if (!load) {
      throw new Error("Load not found");
    }

    const updates: any = {
      status,
      updatedAt: Date.now(),
    };

    if (carrierOrgId !== undefined) {
      updates.carrierOrgId = carrierOrgId;
    }

    if (escortOrgId !== undefined) {
      updates.escortOrgId = escortOrgId;
    }

    await ctx.db.patch(loadId, updates);

    return loadId;
  },
});

export const updateLoad = mutation({
  args: {
    loadId: v.id("loads"),
    loadNumber: v.optional(v.string()),
    origin: v.optional(v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
    })),
    destination: v.optional(v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
    })),
    dimensions: v.optional(v.object({
      height: v.number(),
      width: v.number(),
      length: v.number(),
      weight: v.number(),
      description: v.optional(v.string()),
    })),
    pickupDate: v.optional(v.number()),
    deliveryDate: v.optional(v.number()),
    specialRequirements: v.optional(v.string()),
    contactInfo: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      email: v.string(),
    })),
    route: v.optional(v.object({
      waypoints: v.array(v.object({
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()),
        order: v.number(),
      })),
      snappedCoordinates: v.array(v.array(v.number())),
    })),
  },
  handler: async (ctx, args) => {
    const { loadId, ...updates } = args;

    const load = await ctx.db.get(loadId);
    if (!load) {
      throw new Error("Load not found");
    }

    await ctx.db.patch(loadId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return loadId;
  },
});

export const deleteLoad = mutation({
  args: {
    loadId: v.id("loads"),
  },
  handler: async (ctx, args) => {
    const load = await ctx.db.get(args.loadId);
    if (!load) {
      throw new Error("Load not found");
    }

    // Only allow deletion of draft loads
    if (load.status !== "draft") {
      throw new Error("Can only delete draft loads");
    }

    await ctx.db.delete(args.loadId);
    return args.loadId;
  },
});

export const assignLoadToCarrier = mutation({
  args: {
    loadId: v.id("loads"),
    carrierOrgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const load = await ctx.db.get(args.loadId);
    if (!load) {
      throw new Error("Load not found");
    }

    if (load.status !== "available") {
      throw new Error("Load is not available for assignment");
    }

    await ctx.db.patch(args.loadId, {
      status: "assigned",
      carrierOrgId: args.carrierOrgId,
      updatedAt: Date.now(),
    });

    return args.loadId;
  },
});