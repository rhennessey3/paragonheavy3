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
    role: v.string(),
    createdAt: v.number(),
    lastActiveAt: v.optional(v.number()),
    emailVerified: v.optional(v.boolean()),
    onboardingCompleted: v.optional(v.boolean()), // Temporary for migration
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
    route: v.optional(v.object({
      waypoints: v.array(v.object({
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()),
        order: v.number(),
      })),
      snappedCoordinates: v.array(v.array(v.number())), // Array of [lng, lat] pairs for the route line
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
    role: v.string(),
    token: v.string(),
    clerkInvitationId: v.optional(v.string()), // Link to Clerk invitation
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked")),
    invitedBy: v.string(), // clerkUserId
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_orgId", ["orgId"])
    .index("by_email", ["email"])
    .index("by_clerkInvitationId", ["clerkInvitationId"]),

  // Compliance Studio: Jurisdictions (states, counties, districts, custom regions)
  jurisdictions: defineTable({
    name: v.string(), // "Illinois", "Pennsylvania", "District 10"
    type: v.union(
      v.literal("state"),
      v.literal("county"),
      v.literal("city"),
      v.literal("district"),  // Permit district (groups counties)
      v.literal("region"),    // Multi-county region
      v.literal("custom")     // Custom drawn polygon
    ),
    abbreviation: v.optional(v.string()), // "IL", "PA", "D10"
    code: v.optional(v.string()),         // "10" for District 10
    parentId: v.optional(v.id("jurisdictions")), // For hierarchy (county -> state, district -> state)
    composedOf: v.optional(v.array(v.id("jurisdictions"))), // For districts: [county1, county2, ...]
    geometry: v.optional(v.any()), // GeoJSON polygon stored as JSON
    fipsCode: v.optional(v.string()),
    population: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_abbreviation", ["abbreviation"])
    .index("by_parent", ["parentId"])
    .index("by_fips", ["fipsCode"]),

  // Jurisdiction Boundaries (for complex geometries and drawn regions)
  jurisdictionBoundaries: defineTable({
    jurisdictionId: v.id("jurisdictions"),
    geometryType: v.union(
      v.literal("polygon"),
      v.literal("multipolygon")
    ),
    coordinates: v.any(), // GeoJSON coordinates array
    source: v.union(
      v.literal("drawn"),    // User drew on map
      v.literal("imported"), // Uploaded GeoJSON
      v.literal("census"),   // From Census TIGER
      v.literal("computed")  // Union of child geometries
    ),
    simplificationLevel: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jurisdiction", ["jurisdictionId"]),

  // Compliance Rules
  complianceRules: defineTable({
    jurisdictionId: v.id("jurisdictions"),
    status: v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("published"),
      v.literal("archived")
    ),
    category: v.union(
      v.literal("dimension_limit"),
      v.literal("escort_requirement"),
      v.literal("time_restriction"),
      v.literal("permit_requirement"),
      v.literal("speed_limit"),
      v.literal("route_restriction")
    ),
    title: v.string(),
    summary: v.string(),
    source: v.optional(v.string()), // URL or statute reference
    effectiveFrom: v.optional(v.number()),
    effectiveTo: v.optional(v.number()),
    geometryScopeType: v.union(
      v.literal("whole_jurisdiction"),
      v.literal("segment_based"),
      v.literal("point_based")
    ),
    geometry: v.optional(v.any()), // GeoJSON for corridor/point rules
    conditions: v.any(), // JSON: RuleCondition type
    createdBy: v.string(),
    updatedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jurisdiction", ["jurisdictionId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_jurisdiction_status", ["jurisdictionId", "status"]),

  // Jurisdiction Editors (who can manage rules for which jurisdictions)
  jurisdictionEditors: defineTable({
    jurisdictionId: v.id("jurisdictions"),
    orgId: v.id("organizations"),
    role: v.union(
      v.literal("publisher"), // Can publish rules
      v.literal("reviewer"),  // Can propose edits
      v.literal("viewer")     // Read-only
    ),
    createdAt: v.number(),
  })
    .index("by_jurisdiction", ["jurisdictionId"])
    .index("by_org", ["orgId"])
    .index("by_jurisdiction_org", ["jurisdictionId", "orgId"]),

  // Canonical System Fields (permit data dictionary)
  systemFields: defineTable({
    key: v.string(),           // "permit_number", "permit_type", etc.
    label: v.string(),         // "Permit Number", "Permit Type"
    category: v.string(),      // "permit_info", "dates", "requestor", "recipient", "contact"
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"]),

  // State-specific field mappings
  stateFieldMappings: defineTable({
    jurisdictionId: v.id("jurisdictions"),
    systemFieldId: v.id("systemFields"),
    stateFieldId: v.optional(v.id("stateFields")), // Reference to state's field definition
    stateLabel: v.string(),              // What the state calls this field
    stateFieldKey: v.optional(v.string()), // State's internal field key if known
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jurisdiction", ["jurisdictionId"])
    .index("by_system_field", ["systemFieldId"])
    .index("by_jurisdiction_field", ["jurisdictionId", "systemFieldId"])
    .index("by_state_field", ["stateFieldId"]),

  // Permit Types (forms that use system fields)
  permitTypes: defineTable({
    key: v.string(),           // "single_trip", "annual", "superload"
    label: v.string(),         // "Single Trip Permit"
    description: v.optional(v.string()),
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // Junction table: which fields are on which permit type forms
  permitTypeFields: defineTable({
    permitTypeId: v.id("permitTypes"),
    systemFieldId: v.id("systemFields"),
    requirement: v.union(
      v.literal("required"),    // Must be filled
      v.literal("optional"),    // Can be filled
      v.literal("hidden")       // Not shown on this form
    ),
    sortOrder: v.number(),      // Order on the form
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_permit_type", ["permitTypeId"])
    .index("by_system_field", ["systemFieldId"])
    .index("by_permit_field", ["permitTypeId", "systemFieldId"]),

  // State-specific fields (jurisdiction's own field definitions)
  stateFields: defineTable({
    jurisdictionId: v.id("jurisdictions"),
    key: v.string(),              // "pa_highway_class", "escort_required"
    label: v.optional(v.string()), // "PA Highway Class"
    dataType: v.string(),         // "string", "number", "boolean", "date"
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jurisdiction", ["jurisdictionId"])
    .index("by_jurisdiction_key", ["jurisdictionId", "key"]),
});