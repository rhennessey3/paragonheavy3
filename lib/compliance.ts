/**
 * Compliance Studio types and utilities
 */

import { Id } from "@/convex/_generated/dataModel";

// =============================================================================
// IF/THEN Rule Builder Types (New)
// =============================================================================

// Load/context attributes that rules can evaluate
export type RuleAttribute = 
  | 'width_ft' | 'height_ft' | 'length_ft'
  | 'front_overhang_ft' | 'rear_overhang_ft'
  | 'gross_weight_lbs' | 'axle_weight_lbs'
  | 'road_type' | 'num_lanes_same_direction'
  | 'permit_type' | 'is_mobile_home' | 'is_modular_housing'
  | 'on_bridge' | 'urban_area' | 'time_of_day'
  | 'min_speed_capable_mph';

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
  placement_rule?: 'lead' | 'follow' | 'lead_and_follow';
  notes?: string;
}

// Complete IF/THEN rule structure
export interface IfThenRule {
  conditions: RuleConditionClause[];  // IF (all must match - AND logic)
  requirement: EscortRequirement;     // THEN
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
  { value: 'width_ft', label: 'Width', type: 'number', unit: 'ft' },
  { value: 'height_ft', label: 'Height', type: 'number', unit: 'ft' },
  { value: 'length_ft', label: 'Combined Length', type: 'number', unit: 'ft' },
  { value: 'front_overhang_ft', label: 'Front Overhang', type: 'number', unit: 'ft' },
  { value: 'rear_overhang_ft', label: 'Rear Overhang', type: 'number', unit: 'ft' },
  { value: 'gross_weight_lbs', label: 'Gross Weight', type: 'number', unit: 'lbs' },
  { value: 'axle_weight_lbs', label: 'Axle Weight', type: 'number', unit: 'lbs' },
  { value: 'min_speed_capable_mph', label: 'Min Speed Capable', type: 'number', unit: 'mph' },
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
  { value: 'on_bridge', label: 'On Bridge', type: 'boolean' },
  { value: 'urban_area', label: 'Urban Area', type: 'boolean' },
  { value: 'is_mobile_home', label: 'Is Mobile Home', type: 'boolean' },
  { value: 'is_modular_housing', label: 'Is Modular Housing', type: 'boolean' },
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
