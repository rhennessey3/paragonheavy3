/**
 * Compliance Studio types and utilities
 */

import { Id } from "@/convex/_generated/dataModel";

// =============================================================================
// IF/THEN Rule Builder Types (New)
// =============================================================================

// Load/context attributes that rules can evaluate
export type RuleAttribute = 
  | 'width_ft' | 'height_ft' | 'length_ft' | 'combined_length_ft'
  | 'front_overhang_ft' | 'rear_overhang_ft'
  | 'gross_weight_lbs' | 'axle_weight_lbs'
  | 'number_of_axles' | 'axle_spacing_ft'
  | 'road_type' | 'num_lanes_same_direction' | 'travel_heading'
  | 'highway_type' | 'speed_limit_mph' | 'on_restricted_route'
  | 'permit_type' | 'is_mobile_home' | 'is_modular_housing'
  | 'is_superload' | 'is_construction_equipment' | 'vehicle_classification'
  | 'on_bridge' | 'urban_area' | 'time_of_day'
  | 'min_speed_capable_mph' | 'has_police_escort';

export type ConditionOperator = 
  | '>' | '>=' | '<' | '<=' | '=' | '!='
  | 'between' | 'in' | 'not_in';

// Single condition in an IF clause
export interface RuleConditionClause {
  id: string; // For React keys
  attribute: RuleAttribute;
  operator: ConditionOperator;
  value: number | string | boolean | [number, number] | string[];
}

// Escort requirement output (THEN clause)
export interface EscortRequirement {
  front_escorts: number;
  rear_escorts: number;
  front_has_height_pole?: boolean;
  rear_has_height_pole?: boolean;
  
  // Distance ranges for escort positioning (in feet)
  front_distance_min_ft?: number;
  front_distance_max_ft?: number;
  rear_distance_min_ft?: number;
  rear_distance_max_ft?: number;
  
  placement_rule?: 'lead' | 'follow' | 'lead_and_follow';
  
  // Conditional positioning based on road context
  placement_conditions?: {
    when_multilane?: 'lead' | 'follow';      // 2+ lanes same direction
    when_single_lane?: 'lead' | 'follow';     // 1 lane same direction
    when_police_escort?: 'lead' | 'follow';   // if police present
  };
  
  notes?: string;
}

// Utility notice requirement output (THEN clause)
export interface UtilityNoticeRequirement {
  notice_hours: number;           // 24, 48, 72, etc.
  utility_types: string[];        // ['wire', 'pole', 'underground']
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_website?: string;
  estimated_cost_range?: string;  // e.g., "$500-$2000"
  notes?: string;
}

// Permit requirement output (THEN clause)
export interface PermitRequirement {
  permit_type_key: string;              // References permitTypes table or custom
  permit_type_label?: string;           // Display name
  
  // Cost information
  estimated_cost_min?: number;          // Minimum cost in dollars
  estimated_cost_max?: number;          // Maximum cost in dollars
  cost_notes?: string;                  // Additional cost details
  
  // Processing information
  processing_time_days?: number;        // Typical processing time
  processing_notes?: string;            // Processing details
  
  // Application information
  application_url?: string;             // Online application link
  application_method?: 'online' | 'mail' | 'in_person' | 'phone';
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  
  // Requirements
  required_documents?: string[];        // ['proof_of_insurance', 'route_survey', etc.]
  restrictions?: string;                // Special restrictions or conditions
  validity_period_days?: number;        // How long permit is valid
  
  notes?: string;
}

// Complete IF/THEN rule structure
export interface IfThenRule {
  conditions: RuleConditionClause[];  // IF (all must match - AND logic)
  requirement: EscortRequirement | UtilityNoticeRequirement | PermitRequirement;     // THEN
  requirementType: 'escort' | 'utility_notice' | 'permit_requirement';  // Which type of requirement
  priority?: number;                  // For tie-breaking
}

// Attribute configuration for the UI
export interface AttributeConfig {
  value: RuleAttribute;
  label: string;
  type: 'number' | 'enum' | 'boolean';
  unit?: string;
  options?: { value: string; label: string }[];
}

// Available attributes for rule conditions
export const RULE_ATTRIBUTES: AttributeConfig[] = [
  { value: 'height_ft', label: 'Height', type: 'number', unit: 'ft' },
  { value: 'width_ft', label: 'Width', type: 'number', unit: 'ft' },
  { value: 'length_ft', label: 'Load Length', type: 'number', unit: 'ft' },
  { value: 'combined_length_ft', label: 'Combined Length (Vehicle + Load)', type: 'number', unit: 'ft' },
  { value: 'front_overhang_ft', label: 'Front Overhang', type: 'number', unit: 'ft' },
  { value: 'rear_overhang_ft', label: 'Rear Overhang', type: 'number', unit: 'ft' },
  { value: 'gross_weight_lbs', label: 'Gross Weight', type: 'number', unit: 'lbs' },
  { value: 'axle_weight_lbs', label: 'Axle Weight', type: 'number', unit: 'lbs' },
  { value: 'number_of_axles', label: 'Number of Axles', type: 'number', unit: 'axles' },
  { value: 'axle_spacing_ft', label: 'Axle Spacing', type: 'number', unit: 'ft' },
  { value: 'min_speed_capable_mph', label: 'Min Speed Capable', type: 'number', unit: 'mph' },
  { value: 'speed_limit_mph', label: 'Road Speed Limit', type: 'number', unit: 'mph' },
  { 
    value: 'road_type', 
    label: 'Road Type', 
    type: 'enum', 
    options: [
      { value: 'two_lane', label: 'Two Lane' },
      { value: 'multi_lane', label: 'Multi Lane' },
      { value: 'interstate', label: 'Interstate' },
      { value: 'all', label: 'All Roads' },
    ]
  },
  { 
    value: 'num_lanes_same_direction', 
    label: 'Lanes (Same Direction)', 
    type: 'enum',
    options: [
      { value: '1', label: '1 Lane' },
      { value: '2', label: '2 Lanes' },
      { value: '3', label: '3 Lanes' },
      { value: '4+', label: '4+ Lanes' },
    ]
  },
  { 
    value: 'travel_heading', 
    label: 'Travel Direction', 
    type: 'enum',
    options: [
      { value: 'N', label: 'North' },
      { value: 'NE', label: 'Northeast' },
      { value: 'E', label: 'East' },
      { value: 'SE', label: 'Southeast' },
      { value: 'S', label: 'South' },
      { value: 'SW', label: 'Southwest' },
      { value: 'W', label: 'West' },
      { value: 'NW', label: 'Northwest' },
    ]
  },
  { 
    value: 'highway_type', 
    label: 'Highway Type', 
    type: 'enum',
    options: [
      { value: 'interstate', label: 'Interstate' },
      { value: 'us_highway', label: 'US Highway' },
      { value: 'state_highway', label: 'State Highway' },
      { value: 'county_road', label: 'County Road' },
      { value: 'local_road', label: 'Local Road' },
    ]
  },
  { 
    value: 'permit_type', 
    label: 'Permit Type', 
    type: 'enum', 
    options: [
      { value: 'oversize', label: 'Oversize' },
      { value: 'overweight', label: 'Overweight' },
      { value: 'mobile_home', label: 'Mobile Home' },
      { value: 'superload', label: 'Superload' },
    ]
  },
  { 
    value: 'time_of_day', 
    label: 'Time of Day', 
    type: 'enum', 
    options: [
      { value: 'day', label: 'Daytime' },
      { value: 'night', label: 'Nighttime' },
      { value: 'all', label: 'Any Time' },
    ]
  },
  { 
    value: 'vehicle_classification', 
    label: 'Vehicle Classification', 
    type: 'enum',
    options: [
      { value: 'mobile_home', label: 'Mobile Home' },
      { value: 'modular_housing', label: 'Modular Housing' },
      { value: 'construction_equipment', label: 'Construction Equipment' },
      { value: 'manufactured_housing', label: 'Manufactured Housing' },
      { value: 'agricultural_equipment', label: 'Agricultural Equipment' },
      { value: 'industrial_equipment', label: 'Industrial Equipment' },
      { value: 'other', label: 'Other' },
    ]
  },
  { value: 'on_bridge', label: 'On Bridge', type: 'boolean' },
  { value: 'urban_area', label: 'Urban Area', type: 'boolean' },
  { value: 'on_restricted_route', label: 'On Restricted Route', type: 'boolean' },
  { value: 'is_mobile_home', label: 'Is Mobile Home', type: 'boolean' },
  { value: 'is_modular_housing', label: 'Is Modular Housing', type: 'boolean' },
  { value: 'is_superload', label: 'Is Superload', type: 'boolean' },
  { value: 'is_construction_equipment', label: 'Is Construction Equipment', type: 'boolean' },
  { value: 'has_police_escort', label: 'Has Police Escort', type: 'boolean' },
];

// Operators available for each attribute type
export const OPERATORS_BY_TYPE: Record<string, { value: ConditionOperator; label: string }[]> = {
  number: [
    { value: '>', label: 'greater than' },
    { value: '>=', label: 'greater than or equal' },
    { value: '<', label: 'less than' },
    { value: '<=', label: 'less than or equal' },
    { value: '=', label: 'equals' },
    { value: 'between', label: 'between' },
  ],
  enum: [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: 'in', label: 'is one of' },
  ],
  boolean: [
    { value: '=', label: 'is' },
  ],
};

// Placement rule options
export const PLACEMENT_RULES = [
  { value: 'lead', label: 'Lead (Front)' },
  { value: 'follow', label: 'Follow (Rear)' },
  { value: 'lead_and_follow', label: 'Lead and Follow' },
] as const;

// Utility types for utility notice requirements
export const UTILITY_TYPES = [
  { value: 'wire', label: 'Wire Relocation' },
  { value: 'pole', label: 'Pole Relocation' },
  { value: 'underground_cable', label: 'Underground Cable' },
  { value: 'overhead_line', label: 'Overhead Line' },
  { value: 'transformer', label: 'Transformer' },
  { value: 'traffic_signal', label: 'Traffic Signal' },
  { value: 'street_light', label: 'Street Light' },
  { value: 'other', label: 'Other' },
] as const;

// Common notice periods (in hours)
export const COMMON_NOTICE_PERIODS = [
  { value: 24, label: '24 Hours (1 Day)' },
  { value: 48, label: '48 Hours (2 Days)' },
  { value: 72, label: '72 Hours (3 Days)' },
  { value: 168, label: '1 Week' },
  { value: 336, label: '2 Weeks' },
  { value: 720, label: '1 Month' },
] as const;

// Helper to get attribute config
export function getAttributeConfig(attribute: RuleAttribute): AttributeConfig | undefined {
  return RULE_ATTRIBUTES.find(a => a.value === attribute);
}

// Helper to get operators for an attribute
export function getOperatorsForAttribute(attribute: RuleAttribute) {
  const config = getAttributeConfig(attribute);
  if (!config) return OPERATORS_BY_TYPE.number;
  return OPERATORS_BY_TYPE[config.type] || OPERATORS_BY_TYPE.number;
}

// =============================================================================
// Legacy Rule Condition Types (keeping for backward compatibility)
// =============================================================================

// Rule condition structure for machine-readable compliance logic
export type RuleCondition = {
  vehicleClasses?: string[];
  minWidthFt?: number;
  maxWidthFt?: number;
  minHeightFt?: number;
  maxHeightFt?: number;
  minLengthFt?: number;
  maxLengthFt?: number;
  maxGrossWeightLbs?: number;
  maxAxleWeightLbs?: number;
  escortsRequired?: {
    front?: boolean;
    rear?: boolean;
    heightPole?: boolean;
    numberOfEscorts?: number;
  };
  timeOfDay?: {
    allowed?: string[];
    forbidden?: string[];
  };
  permitType?: "single_trip" | "annual" | "superload";
  notes?: string;
};

// Load parameters for compliance checking
export type LoadParams = {
  widthFt: number;
  heightFt: number;
  lengthFt: number;
  grossWeightLbs: number;
  axleCount?: number;
  vehicleClass?: string;
};

// Rule categories
export const RULE_CATEGORIES = [
  { value: "dimension_limit", label: "Dimension Limit" },
  { value: "escort_requirement", label: "Escort Requirement" },
  { value: "time_restriction", label: "Time Restriction" },
  { value: "permit_requirement", label: "Permit Requirement" },
  { value: "speed_limit", label: "Speed Limit" },
  { value: "route_restriction", label: "Route Restriction" },
  { value: "utility_notice", label: "Utility Notice" },
] as const;

export type RuleCategory = typeof RULE_CATEGORIES[number]["value"];

// Rule statuses
export const RULE_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "in_review", label: "In Review", color: "bg-yellow-100 text-yellow-800" },
  { value: "published", label: "Published", color: "bg-green-100 text-green-800" },
  { value: "archived", label: "Archived", color: "bg-red-100 text-red-800" },
] as const;

export type RuleStatus = typeof RULE_STATUSES[number]["value"];

// Severity levels for compliance results
export type RuleSeverity = "info" | "requires_permit" | "restriction" | "prohibited";

// Compliance segment for route analysis
export type ComplianceSegment = {
  segmentId: string;
  fromMile: number;
  toMile: number;
  jurisdictions: string[];
  rules: {
    id: string;
    category: RuleCategory;
    title: string;
    severity: RuleSeverity;
    summary: string;
    conditions: RuleCondition;
  }[];
};

// Full compliance response for a route
export type ComplianceResponse = {
  routeId: string;
  aggregatedSummary: {
    totalJurisdictions: number;
    totalRules: number;
    escortRequired: boolean;
    escortDetails?: string;
    curfewsDetected: boolean;
    permitsRequired: string[];
  };
  segments: ComplianceSegment[];
  jurisdictionRules: {
    jurisdictionId: string;
    jurisdictionName: string;
    rules: {
      id: string;
      category: RuleCategory;
      title: string;
      severity: RuleSeverity;
      summary: string;
      conditions: RuleCondition;
    }[];
  }[];
};

// US States data for seeding
export const US_STATES = [
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
] as const;

// Check if a load triggers a rule based on conditions
export function evaluateRuleConditions(
  conditions: RuleCondition,
  load: LoadParams
): { triggered: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check width limits
  if (conditions.maxWidthFt && load.widthFt > conditions.maxWidthFt) {
    reasons.push(`Width ${load.widthFt}' exceeds max ${conditions.maxWidthFt}'`);
  }
  if (conditions.minWidthFt && load.widthFt >= conditions.minWidthFt) {
    reasons.push(`Width ${load.widthFt}' meets/exceeds threshold ${conditions.minWidthFt}'`);
  }

  // Check height limits
  if (conditions.maxHeightFt && load.heightFt > conditions.maxHeightFt) {
    reasons.push(`Height ${load.heightFt}' exceeds max ${conditions.maxHeightFt}'`);
  }
  if (conditions.minHeightFt && load.heightFt >= conditions.minHeightFt) {
    reasons.push(`Height ${load.heightFt}' meets/exceeds threshold ${conditions.minHeightFt}'`);
  }

  // Check length limits
  if (conditions.maxLengthFt && load.lengthFt > conditions.maxLengthFt) {
    reasons.push(`Length ${load.lengthFt}' exceeds max ${conditions.maxLengthFt}'`);
  }
  if (conditions.minLengthFt && load.lengthFt >= conditions.minLengthFt) {
    reasons.push(`Length ${load.lengthFt}' meets/exceeds threshold ${conditions.minLengthFt}'`);
  }

  // Check weight limits
  if (conditions.maxGrossWeightLbs && load.grossWeightLbs > conditions.maxGrossWeightLbs) {
    reasons.push(`Weight ${load.grossWeightLbs.toLocaleString()} lbs exceeds max ${conditions.maxGrossWeightLbs.toLocaleString()} lbs`);
  }

  // Check vehicle class
  if (conditions.vehicleClasses && load.vehicleClass) {
    if (conditions.vehicleClasses.includes(load.vehicleClass)) {
      reasons.push(`Vehicle class "${load.vehicleClass}" matches rule`);
    }
  }

  return {
    triggered: reasons.length > 0,
    reasons,
  };
}

// Determine severity based on rule category and conditions
export function determineSeverity(
  category: RuleCategory,
  conditions: RuleCondition
): RuleSeverity {
  if (category === "route_restriction") {
    return "prohibited";
  }
  if (category === "permit_requirement") {
    return "requires_permit";
  }
  if (category === "escort_requirement" || category === "time_restriction") {
    return "restriction";
  }
  return "info";
}

// Format escort requirements for display
export function formatEscortRequirements(escorts?: RuleCondition["escortsRequired"]): string {
  if (!escorts) return "None";
  
  const parts: string[] = [];
  if (escorts.front) parts.push("Front");
  if (escorts.rear) parts.push("Rear");
  if (escorts.heightPole) parts.push("Height Pole");
  
  if (parts.length === 0) return "None";
  
  let result = parts.join(", ");
  if (escorts.numberOfEscorts && escorts.numberOfEscorts > 1) {
    result += ` (${escorts.numberOfEscorts} total)`;
  }
  
  return result;
}

// Get category display info
export function getCategoryInfo(category: RuleCategory) {
  return RULE_CATEGORIES.find(c => c.value === category) || { value: category, label: category };
}

// Get status display info
export function getStatusInfo(status: RuleStatus) {
  return RULE_STATUSES.find(s => s.value === status) || { value: status, label: status, color: "bg-gray-100 text-gray-800" };
}

// Format utility notice requirements for display
export function formatUtilityNoticeRequirements(notice: UtilityNoticeRequirement): string {
  const hours = notice.notice_hours;
  let timeStr = `${hours} hours`;
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    if (hours % 24 === 0) {
      timeStr = days === 1 ? '1 day' : `${days} days`;
    }
  }
  
  const typesStr = notice.utility_types.length > 0 
    ? notice.utility_types.map(t => UTILITY_TYPES.find(ut => ut.value === t)?.label || t).join(', ')
    : 'All utilities';
  
  return `${timeStr} notice required for ${typesStr}`;
}

// Type guard for escort requirements
export function isEscortRequirement(req: EscortRequirement | UtilityNoticeRequirement | PermitRequirement): req is EscortRequirement {
  return 'front_escorts' in req || 'rear_escorts' in req;
}

// Type guard for utility notice requirements
export function isUtilityNoticeRequirement(req: EscortRequirement | UtilityNoticeRequirement | PermitRequirement): req is UtilityNoticeRequirement {
  return 'notice_hours' in req;
}

// Type guard for permit requirements
export function isPermitRequirement(req: EscortRequirement | UtilityNoticeRequirement | PermitRequirement): req is PermitRequirement {
  return 'permit_type_key' in req;
}

// Common application methods for permits
export const APPLICATION_METHODS = [
  { value: 'online', label: 'Online Application' },
  { value: 'mail', label: 'Mail' },
  { value: 'in_person', label: 'In Person' },
  { value: 'phone', label: 'Phone' },
] as const;

// Common required documents for permits
export const COMMON_PERMIT_DOCUMENTS = [
  { value: 'proof_of_insurance', label: 'Proof of Insurance' },
  { value: 'vehicle_registration', label: 'Vehicle Registration' },
  { value: 'route_survey', label: 'Route Survey' },
  { value: 'engineering_analysis', label: 'Engineering Analysis' },
  { value: 'weight_receipt', label: 'Weight Receipt' },
  { value: 'dimension_certification', label: 'Dimension Certification' },
  { value: 'bond', label: 'Surety Bond' },
  { value: 'indemnity_agreement', label: 'Indemnity Agreement' },
  { value: 'utility_clearance', label: 'Utility Clearance Letters' },
  { value: 'photos', label: 'Vehicle/Load Photos' },
] as const;

// Format permit requirements for display
export function formatPermitRequirements(permit: PermitRequirement): string {
  const parts: string[] = [];
  
  parts.push(permit.permit_type_label || permit.permit_type_key);
  
  if (permit.estimated_cost_min !== undefined || permit.estimated_cost_max !== undefined) {
    const min = permit.estimated_cost_min || 0;
    const max = permit.estimated_cost_max || permit.estimated_cost_min || 0;
    if (min === max) {
      parts.push(`$${min}`);
    } else {
      parts.push(`$${min}-$${max}`);
    }
  }
  
  if (permit.processing_time_days) {
    const days = permit.processing_time_days;
    parts.push(days === 1 ? '1 day' : `${days} days`);
  }
  
  return parts.join(' • ');
}
