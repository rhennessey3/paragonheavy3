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
      segments: v.optional(v.array(v.object({
        startIndex: v.number(),         // index in snappedCoordinates
        endIndex: v.number(),
        distance: v.number(),           // meters
        duration: v.number(),           // seconds
        roadClass: v.optional(v.string()), // 'motorway', 'trunk', 'primary', etc.
        lanes: v.optional(v.number()),  // estimated lanes in travel direction
        heading: v.optional(v.number()), // 0-360 degrees
        roadName: v.optional(v.string()),
      }))),
    })),
    // Combined axle configuration for this load (power unit + drawn unit)
    axleConfiguration: v.optional(v.object({
      powerUnit: v.object({
        truckId: v.optional(v.id("trucks")),
        axleCount: v.number(),
        axleWeights: v.array(v.object({
          position: v.number(),
          weight: v.number(),           // Actual loaded weight in lbs
        })),
        axleDistances: v.array(v.object({
          fromPosition: v.number(),
          toPosition: v.number(),
          distance: v.string(),         // "Ft'In\"" format
        })),
      }),
      drawnUnit: v.optional(v.object({
        trailerId: v.optional(v.id("trailers")),
        axleCount: v.number(),
        axleWeights: v.array(v.object({
          position: v.number(),
          weight: v.number(),           // Actual loaded weight in lbs
        })),
        axleDistances: v.array(v.object({
          fromPosition: v.number(),
          toPosition: v.number(),
          distance: v.string(),         // "Ft'In\"" format
        })),
      })),
      // Distance from last power unit axle to first drawn unit axle
      kingpinToFirstAxle: v.optional(v.string()),
      totalAxles: v.number(),
      grossWeight: v.number(),          // Total of all axle weights
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

  // Jurisdiction Editors (who can manage policies for which jurisdictions)
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
    jurisdictionId: v.optional(v.id("jurisdictions")), // null = global, otherwise state-specific
    key: v.string(),           // "single_trip", "annual", "superload"
    label: v.string(),         // "Single Trip Permit"
    description: v.optional(v.string()),
    typical_cost_min: v.optional(v.number()),        // Typical minimum cost
    typical_cost_max: v.optional(v.number()),        // Typical maximum cost
    typical_processing_days: v.optional(v.number()), // Typical processing time
    application_url: v.optional(v.string()),         // Online application URL
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_jurisdiction", ["jurisdictionId"])
    .index("by_jurisdiction_key", ["jurisdictionId", "key"]),

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

  // Trucks (Tractors)
  trucks: defineTable({
    name: v.string(),                    // "Day Cab", "Sleeper", "Heavy Haul Day Cab"
    make: v.optional(v.string()),        // "Peterbilt", "Kenworth", "Freightliner"
    model: v.optional(v.string()),       // "389", "W900", "Cascadia"
    axles: v.number(),                   // 2, 3, 4
    emptyWeight: v.number(),             // Weight in lbs
    orgId: v.id("organizations"),        // Multi-tenant support
    isDefault: v.optional(v.boolean()),  // Track seeded defaults
    // Vehicle registration fields
    usDotNumber: v.optional(v.string()), // US DOT number
    plateNumber: v.optional(v.string()), // License plate number
    vinNumber: v.optional(v.string()),   // VIN (last 6 or full)
    registrationState: v.optional(v.string()), // State of registration (2-letter code)
    // Axle configuration (per-axle weights and distances)
    axleWeights: v.optional(v.array(v.object({
      position: v.number(),              // 1-based index (1 = front/steer axle)
      weight: v.optional(v.number()),    // Empty weight per axle in lbs
    }))),
    axleDistances: v.optional(v.array(v.object({
      fromPosition: v.number(),          // Starting axle position
      toPosition: v.number(),            // Ending axle position
      distance: v.string(),              // Distance in "Ft'In\"" format (e.g., "4'6\"")
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_name", ["orgId", "name"]),

  // Trailers
  trailers: defineTable({
    name: v.string(),                    // "Flatbed", "Step Deck", "RGN / Lowboy"
    axles: v.number(),                   // 2, 3, 4, 5, 6
    deckHeight: v.string(),              // "5'0\"", "3'6\"", "1'10\""
    emptyWeight: v.number(),             // Weight in lbs (32000, 33000, etc.)
    orgId: v.id("organizations"),        // Multi-tenant support
    isDefault: v.optional(v.boolean()),  // Track seeded defaults
    // Vehicle registration fields
    plateNumber: v.optional(v.string()), // License plate number
    vinNumber: v.optional(v.string()),   // VIN (last 6 or full)
    registrationState: v.optional(v.string()), // State of registration (2-letter code)
    // Axle configuration (per-axle weights and distances)
    axleWeights: v.optional(v.array(v.object({
      position: v.number(),              // 1-based index (1 = first trailer axle)
      weight: v.optional(v.number()),    // Empty weight per axle in lbs
    }))),
    axleDistances: v.optional(v.array(v.object({
      fromPosition: v.number(),          // Starting axle position
      toPosition: v.number(),            // Ending axle position
      distance: v.string(),              // Distance in "Ft'In\"" format (e.g., "4'6\"")
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_name", ["orgId", "name"]),

  // ==========================================================================
  // POLICY-CENTRIC COMPLIANCE MODEL
  // ==========================================================================

  // Facet merge policies - how values combine per jurisdiction per facet
  facetMergePolicies: defineTable({
    jurisdictionId: v.id("jurisdictions"),
    facet: v.string(), // "escort", "permit", "speed", "hours", "utility_notice"
    field: v.string(), // "rear_escorts", "front_escorts", "permit_types", "max_speed"
    mergeStrategy: v.union(
      v.literal("MAX"),    // Take highest (escorts)
      v.literal("MIN"),    // Take lowest (speed)
      v.literal("UNION"),  // Combine all (permit types)
      v.literal("FIRST"),  // First applicable
      v.literal("LAST"),   // Last applicable
      v.literal("INTERSECTION"), // Common to all (time windows)
      v.literal("OR")      // Boolean OR (height pole required)
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jurisdiction", ["jurisdictionId"])
    .index("by_jurisdiction_facet", ["jurisdictionId", "facet"])
    .index("by_jurisdiction_facet_field", ["jurisdictionId", "facet", "field"]),
  // Policies are the central organizing unit. Conditions flow INTO policies,
  // and policies define outputs with merge strategies.

  compliancePolicies: defineTable({
    jurisdictionId: v.id("jurisdictions"),
    
    // Policy type determines what kind of output this policy produces
    policyType: v.union(
      v.literal("escort"),
      v.literal("permit"),
      v.literal("speed"),
      v.literal("hours"),
      v.literal("route"),
      v.literal("utility"),
      v.literal("dimension")
    ),
    
    name: v.string(),  // "PA Escort Policy", "PA Permit Requirements"
    description: v.optional(v.string()),
    
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    
    // Conditions that trigger this policy (the IF clauses)
    // Each condition can have its own output contribution
    conditions: v.array(v.object({
      id: v.string(),                           // Unique ID for React keys
      attribute: v.string(),                    // "width_ft", "length_ft", etc.
      operator: v.string(),                     // ">", ">=", "<", "<=", "=", "between"
      value: v.any(),                           // number, string, boolean, or [min, max]
      sourceRegulation: v.optional(v.string()), // "PA DOT 67.1.2" - regulatory reference
      notes: v.optional(v.string()),            // Additional context
      priority: v.optional(v.number()),         // For ordering/precedence
      // The output this specific condition contributes
      output: v.optional(v.any()),              // Partial output when this condition matches
    })),
    
    // Default/base output for the policy (applied when any condition matches)
    baseOutput: v.optional(v.any()),
    
    // Merge strategies for combining outputs from multiple matching conditions
    mergeStrategies: v.optional(v.object({
      // Each field in the output can have its own merge strategy
      // e.g., { front_escorts: "MAX", rear_escorts: "MAX", height_pole: "OR" }
    })),
    
    // Effective date range
    effectiveFrom: v.optional(v.number()),
    effectiveTo: v.optional(v.number()),
    
    // Metadata
    createdBy: v.string(),
    updatedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jurisdiction", ["jurisdictionId"])
    .index("by_jurisdiction_type", ["jurisdictionId", "policyType"])
    .index("by_status", ["status"])
    .index("by_type", ["policyType"]),

  // Policy relationships - how policies interact with each other
  policyRelationships: defineTable({
    jurisdictionId: v.id("jurisdictions"),
    sourcePolicyId: v.id("compliancePolicies"),
    targetPolicyId: v.id("compliancePolicies"),
    relationshipType: v.union(
      v.literal("requires"),           // Source policy requires target policy
      v.literal("exempts_from"),       // Source policy exempts from target policy
      v.literal("modifies"),           // Source policy modifies target policy output
      v.literal("conflicts_with")      // Policies cannot both apply
    ),
    // For "modifies" type, what modification to apply
    modification: v.optional(v.any()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
    updatedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jurisdiction", ["jurisdictionId"])
    .index("by_source", ["sourcePolicyId"])
    .index("by_target", ["targetPolicyId"]),
});