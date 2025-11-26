import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Debug: Log schema definition
console.log("Defining Convex schema with tables: organizations, userProfiles, loads");

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    slug: v.optional(v.string()), // URL-friendly identifier
    type: v.union(v.literal("shipper"), v.literal("carrier"), v.literal("escort")),
    clerkOrgId: v.optional(v.string()), // Legacy / Optional for migration
    createdBy: v.string(), // Clerk User ID of creator
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkOrgId", ["clerkOrgId"])
    .index("by_creator", ["createdBy"])
    .index("by_slug", ["slug"])
    .index("by_type", ["type"]),

  userProfiles: defineTable({
    clerkUserId: v.string(),
    clerkOrgId: v.optional(v.string()), // Legacy
    orgId: v.optional(v.id("organizations")), // Link to internal org
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("operator"),
      v.literal("member"),
      v.literal("dispatcher"),
      v.literal("driver"),
      v.literal("safety"),
      v.literal("accounting"),
      v.literal("escort"),
      v.literal("planner"),
      v.literal("ap")
    ),
    createdAt: v.number(),
    lastActiveAt: v.optional(v.number()),
    emailVerified: v.optional(v.boolean()),
    onboardingCompleted: v.boolean(),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_orgId", ["orgId"])
    .index("by_clerkOrgId", ["clerkOrgId"]),

  loads: defineTable({
    loadNumber: v.string(),
    orgId: v.id("organizations"),
    createdBy: v.optional(v.string()), // Optional for backward compatibility with existing loads
    carrierOrgId: v.optional(v.id("organizations")),
    escortOrgId: v.optional(v.id("organizations")),
    status: v.union(
      v.literal("draft"),
      v.literal("available"),
      v.literal("assigned"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
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
    createdAt: v.number(),
    updatedAt: v.number(),
    specialRequirements: v.optional(v.string()),
    contactInfo: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      email: v.string(),
    })),
  })
    .index("by_orgId", ["orgId"])
    .index("by_createdBy", ["createdBy"])
    .index("by_user_org", ["createdBy", "orgId"]) // User-scoped within org
    .index("by_carrier", ["carrierOrgId"])
    .index("by_status", ["status"])
    .index("by_shipper_available", ["orgId", "status"])
    .index("by_carrier_assigned", ["carrierOrgId", "status"]),

  invitations: defineTable({
    email: v.string(),
    orgId: v.id("organizations"),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("operator"),
      v.literal("member"),
      v.literal("dispatcher"),
      v.literal("driver"),
      v.literal("safety"),
      v.literal("accounting"),
      v.literal("escort"),
      v.literal("planner"),
      v.literal("ap")
    ),
    token: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked")),
    invitedBy: v.string(), // clerkUserId
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_orgId", ["orgId"])
    .index("by_email", ["email"]),
});