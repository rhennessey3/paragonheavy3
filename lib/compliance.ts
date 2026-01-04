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
  | 'front_overhang_ft' | 'rear_overhang_ft' | 'left_overhang_ft' | 'right_overhang_ft'
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

// Logical operator for combining conditions
export type LogicalOperator = 'AND' | 'OR';

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
  conditions: RuleConditionClause[];  // IF clauses
  conditionLogic?: LogicalOperator;   // How to combine conditions (default: AND)
  requirement: EscortRequirement | UtilityNoticeRequirement | PermitRequirement;     // THEN
  requirementType: 'escort' | 'utility_notice' | 'permit_requirement';  // Which type of requirement
  priority?: number;                  // For tie-breaking
}

// Attribute configuration for the UI
export interface AttributeConfig {
  value: RuleAttribute;
  label: string;
  description: string;
  type: 'number' | 'enum' | 'boolean';
  unit?: string;
  options?: { value: string; label: string }[];
}

// Available attributes for rule conditions
export const RULE_ATTRIBUTES: AttributeConfig[] = [
  { value: 'height_ft', label: 'Height', description: 'Vertical clearance from ground to highest point of the load', type: 'number', unit: 'ft' },
  { value: 'width_ft', label: 'Width', description: 'Total width of the load including any side overhang', type: 'number', unit: 'ft' },
  { value: 'length_ft', label: 'Load Length', description: 'Length of the load being transported', type: 'number', unit: 'ft' },
  { value: 'combined_length_ft', label: 'Combined Length (Vehicle + Load)', description: 'Total length of vehicle plus load from front bumper to rear', type: 'number', unit: 'ft' },
  { value: 'front_overhang_ft', label: 'Front Overhang', description: 'Distance load extends beyond front of vehicle', type: 'number', unit: 'ft' },
  { value: 'rear_overhang_ft', label: 'Rear Overhang', description: 'Distance load extends beyond rear of vehicle', type: 'number', unit: 'ft' },
  { value: 'left_overhang_ft', label: 'Left Overhang (Driver Side)', description: 'Distance load extends beyond left side of vehicle', type: 'number', unit: 'ft' },
  { value: 'right_overhang_ft', label: 'Right Overhang (Passenger Side)', description: 'Distance load extends beyond right side of vehicle', type: 'number', unit: 'ft' },
  { value: 'gross_weight_lbs', label: 'Gross Weight', description: 'Total weight of vehicle plus load', type: 'number', unit: 'lbs' },
  { value: 'axle_weight_lbs', label: 'Axle Weight', description: 'Weight distributed per axle', type: 'number', unit: 'lbs' },
  { value: 'number_of_axles', label: 'Number of Axles', description: 'Total count of axles on the vehicle', type: 'number', unit: 'axles' },
  { value: 'axle_spacing_ft', label: 'Axle Spacing', description: 'Distance between axles', type: 'number', unit: 'ft' },
  { value: 'min_speed_capable_mph', label: 'Min Speed Capable', description: 'Minimum speed the loaded vehicle can maintain', type: 'number', unit: 'mph' },
  { value: 'speed_limit_mph', label: 'Road Speed Limit', description: 'Posted speed limit of the road being traveled', type: 'number', unit: 'mph' },
  {
    value: 'road_type',
    label: 'Road Type',
    description: 'Classification of the road being traveled',
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
    description: 'Number of lanes traveling in the same direction',
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
    description: 'Compass direction of travel',
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
    description: 'Federal, state, or local road classification',
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
    description: 'Type of permit required for the load',
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
    description: 'Time period when travel occurs',
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
    description: 'Category of vehicle or equipment being transported',
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
  { value: 'on_bridge', label: 'On Bridge', description: 'Whether the route crosses any bridges', type: 'boolean' },
  { value: 'urban_area', label: 'Urban Area', description: 'Whether traveling through an urban/city area', type: 'boolean' },
  { value: 'on_restricted_route', label: 'On Restricted Route', description: 'Whether on a route with special restrictions', type: 'boolean' },
  { value: 'is_mobile_home', label: 'Is Mobile Home', description: 'Load is classified as a mobile home', type: 'boolean' },
  { value: 'is_modular_housing', label: 'Is Modular Housing', description: 'Load is classified as modular housing', type: 'boolean' },
  { value: 'is_superload', label: 'Is Superload', description: 'Load exceeds superload thresholds', type: 'boolean' },
  { value: 'is_construction_equipment', label: 'Is Construction Equipment', description: 'Load is construction equipment', type: 'boolean' },
  { value: 'has_police_escort', label: 'Has Police Escort', description: 'Whether police escort is present', type: 'boolean' },
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
// Load Parameters (for compliance evaluation)
// =============================================================================

// Load parameters for compliance checking
export type LoadParams = {
  widthFt: number;
  heightFt: number;
  lengthFt: number;
  grossWeightLbs: number;
  axleCount?: number;
  vehicleClass?: string;
};

// Severity levels for compliance results
export type PolicySeverity = "info" | "requires_permit" | "restriction" | "prohibited";

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

// =============================================================================
// Facet-Based Resolution System
// =============================================================================

/**
 * Facets are policy domains.
 * Policies don't conflict with each other directly - they feed into facets
 * where merge policies determine how to combine multiple policy outputs.
 */
export const FACETS = [
  { key: 'escort', label: 'Escort Policy' },
  { key: 'permit', label: 'Permit Policy' },
  { key: 'speed', label: 'Speed Policy' },
  { key: 'hours', label: 'Hours Policy' },
  { key: 'route', label: 'Route Policy' },
  { key: 'utility', label: 'Utility Policy' },
  { key: 'dimension', label: 'Dimension Policy' },
] as const;

export type FacetKey = typeof FACETS[number]['key'];

/**
 * Default merge policies for each facet.
 * These define how multiple rule outputs are combined within a facet.
 */
export const DEFAULT_MERGE_POLICIES: Record<string, Record<string, string>> = {
  escort: { 
    rear_escorts: 'MAX', 
    front_escorts: 'MAX', 
    height_pole: 'OR',
    front_distance_min_ft: 'MIN',
    front_distance_max_ft: 'MAX',
    rear_distance_min_ft: 'MIN',
    rear_distance_max_ft: 'MAX',
  },
  permit: { 
    types: 'UNION',
    estimated_cost: 'MAX',
    processing_days: 'MAX',
  },
  speed: { 
    max: 'MIN',
    min: 'MAX',
  },
  hours: { 
    windows: 'INTERSECTION',
    blackout_periods: 'UNION',
  },
  utility: { 
    notice_hours: 'MAX', 
    types: 'UNION',
  },
  route: {
    restrictions: 'UNION',
  },
  dimension: {
    max_width: 'MIN',
    max_height: 'MIN',
    max_length: 'MIN',
    max_weight: 'MIN',
  },
};

/**
 * Get facet configuration by key
 */
export function getFacetConfig(key: FacetKey) {
  return FACETS.find(f => f.key === key);
}

/**
 * Merge strategies for facet fields
 */
export const MERGE_STRATEGIES = [
  { value: 'MAX', label: 'Maximum', description: 'Take the highest value (e.g., most escorts)' },
  { value: 'MIN', label: 'Minimum', description: 'Take the lowest value (e.g., strictest speed limit)' },
  { value: 'UNION', label: 'Union', description: 'Combine all values (e.g., all permit types needed)' },
  { value: 'INTERSECTION', label: 'Intersection', description: 'Common to all (e.g., allowed time windows)' },
  { value: 'FIRST', label: 'First', description: 'Use the first applicable rule\'s value' },
  { value: 'LAST', label: 'Last', description: 'Use the last applicable rule\'s value' },
  { value: 'OR', label: 'Boolean OR', description: 'True if any rule requires it' },
] as const;

export type MergeStrategy = typeof MERGE_STRATEGIES[number]['value'];

// =============================================================================
// Policy-Centric Model Types
// =============================================================================

/**
 * Policy types define what kind of output a policy produces.
 * These align with facets but are the organizing principle in the policy-centric model.
 */
export const POLICY_TYPES = [
  { 
    key: 'escort', 
    label: 'Escort Policy', 
    description: 'Defines escort vehicle requirements',
    icon: 'car',
    color: 'blue',
  },
  { 
    key: 'permit', 
    label: 'Permit Policy', 
    description: 'Defines permit requirements and types',
    icon: 'file-text',
    color: 'green',
  },
  { 
    key: 'speed', 
    label: 'Speed Policy', 
    description: 'Defines speed restrictions',
    icon: 'gauge',
    color: 'red',
  },
  { 
    key: 'hours', 
    label: 'Hours Policy', 
    description: 'Defines time-of-day travel restrictions',
    icon: 'clock',
    color: 'amber',
  },
  { 
    key: 'route', 
    label: 'Route Policy', 
    description: 'Defines route restrictions and requirements',
    icon: 'map-pin',
    color: 'orange',
  },
  { 
    key: 'utility', 
    label: 'Utility Policy', 
    description: 'Defines utility notification requirements',
    icon: 'zap',
    color: 'cyan',
  },
  { 
    key: 'dimension', 
    label: 'Dimension Policy', 
    description: 'Defines dimension limits',
    icon: 'ruler',
    color: 'purple',
  },
] as const;

export type PolicyType = typeof POLICY_TYPES[number]['key'];

/**
 * A condition within a policy that triggers output when matched.
 * Conditions are the "IF" part of the policy logic.
 */
export interface PolicyCondition {
  id: string;                           // Unique ID for React keys
  attribute: RuleAttribute;             // What to evaluate (width_ft, etc.)
  operator: ConditionOperator;          // How to compare (>, >=, etc.)
  value: number | string | boolean | [number, number] | string[];
  sourceRegulation?: string;            // Regulatory reference (e.g., "PA DOT 67.1.2")
  notes?: string;                       // Additional context
  priority?: number;                    // For ordering/precedence within policy
  // The output this specific condition contributes when matched
  output?: Partial<EscortRequirement | PermitRequirement | UtilityNoticeRequirement | SpeedRequirement | HoursRequirement | RouteRequirement | DimensionRequirement>;
}

/**
 * Speed restriction output
 */
export interface SpeedRequirement {
  max_speed_mph?: number;
  min_speed_mph?: number;
  notes?: string;
}

/**
 * Hours/time restriction output
 */
export interface HoursRequirement {
  allowed_start_time?: string;  // "06:00"
  allowed_end_time?: string;    // "18:00"
  allowed_days?: string[];      // ["monday", "tuesday", ...]
  blackout_periods?: Array<{
    start: string;
    end: string;
    reason?: string;
  }>;
  notes?: string;
}

/**
 * Route restriction output
 */
export interface RouteRequirement {
  restricted_routes?: string[];
  required_routes?: string[];
  bridge_restrictions?: boolean;
  tunnel_restrictions?: boolean;
  notes?: string;
}

/**
 * Dimension limit output
 */
export interface DimensionRequirement {
  max_width_ft?: number;
  max_height_ft?: number;
  max_length_ft?: number;
  max_weight_lbs?: number;
  notes?: string;
}

/**
 * Union type for all policy outputs
 */
export type PolicyOutput = 
  | EscortRequirement 
  | PermitRequirement 
  | UtilityNoticeRequirement 
  | SpeedRequirement 
  | HoursRequirement 
  | RouteRequirement 
  | DimensionRequirement;

/**
 * The main Policy type - the central organizing unit in the policy-centric model.
 * A policy contains conditions that flow INTO it, and produces an output.
 */
export interface CompliancePolicy {
  _id: string;
  jurisdictionId: string;
  policyType: PolicyType;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  
  // Conditions that trigger this policy
  conditions: PolicyCondition[];

  // How to combine conditions: AND (all must match) or OR (any must match)
  conditionLogic?: LogicalOperator;  // Default: AND

  // Base output when any condition matches (conditions can add to this)
  baseOutput?: PolicyOutput;
  
  // How to merge outputs from multiple matching conditions
  mergeStrategies?: Record<string, MergeStrategy>;
  
  // Effective date range
  effectiveFrom?: number;
  effectiveTo?: number;
  
  // Metadata
  createdBy: string;
  updatedBy: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Policy relationship types - how policies interact with each other
 */
export const POLICY_RELATIONSHIP_TYPES = [
  { 
    value: 'requires', 
    label: 'Requires', 
    description: 'This policy requires the target policy to also apply' 
  },
  { 
    value: 'exempts_from', 
    label: 'Exempts From', 
    description: 'This policy exempts from the target policy requirements' 
  },
  { 
    value: 'modifies', 
    label: 'Modifies', 
    description: 'This policy modifies the target policy output' 
  },
  { 
    value: 'conflicts_with', 
    label: 'Conflicts With', 
    description: 'These policies cannot both apply' 
  },
] as const;

export type PolicyRelationshipType = typeof POLICY_RELATIONSHIP_TYPES[number]['value'];

/**
 * Relationship between two policies
 */
export interface PolicyRelationship {
  _id: string;
  jurisdictionId: string;
  sourcePolicyId: string;
  targetPolicyId: string;
  relationshipType: PolicyRelationshipType;
  modification?: Partial<PolicyOutput>;  // For "modifies" type
  notes?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get policy type configuration by key
 */
export function getPolicyTypeConfig(key: PolicyType) {
  return POLICY_TYPES.find(p => p.key === key);
}

/**
 * Get default merge strategies for a policy type
 */
export function getDefaultMergeStrategiesForPolicyType(type: PolicyType): Record<string, MergeStrategy> {
  return DEFAULT_MERGE_POLICIES[type] || {};
}

/**
 * Create an empty policy condition
 */
export function createEmptyPolicyCondition(): PolicyCondition {
  return {
    id: Math.random().toString(36).substring(2, 9),
    attribute: 'width_ft',
    operator: '>',
    value: 0,
  };
}

/**
 * Create a default base output for a policy type
 */
export function createDefaultBaseOutput(type: PolicyType): PolicyOutput {
  switch (type) {
    case 'escort':
      return { front_escorts: 0, rear_escorts: 0 };
    case 'permit':
      return { permit_type_key: '', permit_type_label: '' };
    case 'utility':
      return { notice_hours: 24, utility_types: [] };
    case 'speed':
      return { max_speed_mph: undefined, min_speed_mph: undefined };
    case 'hours':
      return { allowed_start_time: '06:00', allowed_end_time: '18:00' };
    case 'route':
      return { restricted_routes: [], required_routes: [] };
    case 'dimension':
      return { max_width_ft: undefined, max_height_ft: undefined, max_length_ft: undefined };
    default:
      return {};
  }
}

/**
 * Type guard for policy output types
 */
export function isPolicyOutputType<T extends PolicyOutput>(
  output: PolicyOutput,
  type: PolicyType
): output is T {
  switch (type) {
    case 'escort':
      return 'front_escorts' in output || 'rear_escorts' in output;
    case 'permit':
      return 'permit_type_key' in output;
    case 'utility':
      return 'notice_hours' in output;
    case 'speed':
      return 'max_speed_mph' in output || 'min_speed_mph' in output;
    case 'hours':
      return 'allowed_start_time' in output || 'blackout_periods' in output;
    case 'route':
      return 'restricted_routes' in output || 'required_routes' in output;
    case 'dimension':
      return 'max_width_ft' in output || 'max_height_ft' in output || 'max_length_ft' in output;
    default:
      return false;
  }
}

// =============================================================================
// Condition Evaluation Functions
// =============================================================================

/**
 * Evaluate a single condition against a load's attribute value
 */
export function evaluateCondition(
  operator: ConditionOperator,
  conditionValue: number | string | boolean | [number, number] | string[],
  actualValue: number | string | boolean | undefined
): boolean {
  if (actualValue === undefined) return false;

  switch (operator) {
    case '>':
      return typeof actualValue === 'number' && typeof conditionValue === 'number' && actualValue > conditionValue;
    case '>=':
      return typeof actualValue === 'number' && typeof conditionValue === 'number' && actualValue >= conditionValue;
    case '<':
      return typeof actualValue === 'number' && typeof conditionValue === 'number' && actualValue < conditionValue;
    case '<=':
      return typeof actualValue === 'number' && typeof conditionValue === 'number' && actualValue <= conditionValue;
    case '=':
      return actualValue === conditionValue;
    case '!=':
      return actualValue !== conditionValue;
    case 'between':
      if (typeof actualValue === 'number' && Array.isArray(conditionValue) && conditionValue.length === 2) {
        const [min, max] = conditionValue;
        return actualValue >= min && actualValue <= max;
      }
      return false;
    case 'in':
      if (Array.isArray(conditionValue)) {
        return conditionValue.includes(actualValue as string);
      }
      return false;
    case 'not_in':
      if (Array.isArray(conditionValue)) {
        return !conditionValue.includes(actualValue as string);
      }
      return false;
    default:
      return false;
  }
}

/**
 * Evaluate all conditions in a policy against a load's attributes.
 * Uses conditionLogic to determine AND/OR evaluation.
 */
export function evaluatePolicyConditions(
  conditions: PolicyCondition[],
  loadAttributes: Partial<Record<RuleAttribute, number | string | boolean>>,
  conditionLogic: LogicalOperator = 'AND'
): boolean {
  if (conditions.length === 0) return false;

  const results = conditions.map(condition => {
    const actualValue = loadAttributes[condition.attribute];
    return evaluateCondition(condition.operator, condition.value, actualValue);
  });

  if (conditionLogic === 'OR') {
    // Any condition must match
    return results.some(result => result);
  } else {
    // All conditions must match (AND - default)
    return results.every(result => result);
  }
}

/**
 * Check if a policy matches the given load attributes
 */
export function policyMatchesLoad(
  policy: CompliancePolicy,
  loadAttributes: Partial<Record<RuleAttribute, number | string | boolean>>
): boolean {
  return evaluatePolicyConditions(
    policy.conditions,
    loadAttributes,
    policy.conditionLogic || 'AND'
  );
}

// =============================================================================
// Conflict Detection Types (Policy-Based)
// =============================================================================

// Types of conflicts that can occur between policies
export type ConflictType = 
  | 'type_overlap'               // Multiple policies of same type triggered
  | 'condition_overlap'          // Policies with overlapping condition ranges
  | 'output_contradiction';      // Policies with conflicting outputs

// Severity levels for conflicts
export type ConflictSeverity = 'info' | 'warning' | 'critical';

// A policy that has been matched/triggered during compliance checking
export interface MatchedPolicy {
  id: string;
  name: string;
  policyType: PolicyType;
  description?: string;
  severity: PolicySeverity;
  conditions: PolicyCondition[];
  jurisdictionId?: string;
  jurisdictionName?: string;
  priority?: number;
  // The output from the matched policy
  output?: PolicyOutput;
}

// A group of policies that conflict with each other
export interface ConflictGroup {
  id: string;
  type: ConflictType;
  policies: MatchedPolicy[];
  severity: ConflictSeverity;
  description: string;
  details?: string;
  suggestedResolution?: string;
  // For condition overlaps, the specific attributes that overlap
  overlappingAttributes?: RuleAttribute[];
  // For output contradictions, what specifically contradicts
  contradictions?: {
    field: string;
    values: Array<{ policyId: string; policyName: string; value: any }>;
  }[];
}

// Result of conflict analysis
export interface ConflictAnalysis {
  hasConflicts: boolean;
  groups: ConflictGroup[];
  totalConflictingPolicies: number;
  // Summary counts by type
  typeOverlaps: number;
  conditionOverlaps: number;
  outputContradictions: number;
  // Auto-resolved outputs using merge strategies
  resolvedOutputs?: {
    escort?: EscortRequirement;
    permit?: PermitRequirement;
    utility?: UtilityNoticeRequirement;
    speed?: SpeedRequirement;
    hours?: HoursRequirement;
    route?: RouteRequirement;
    dimension?: DimensionRequirement;
  };
}

// Resolution strategies for conflicts
export type ResolutionStrategy = 
  | 'priority'      // Higher priority policy wins
  | 'specificity'   // More specific conditions win
  | 'merge'         // Merge using strategies (e.g., take max escorts)
  | 'manual';       // User chooses per conflict

// Resolution record for a specific conflict
export interface ConflictResolution {
  conflictGroupId: string;
  strategy: ResolutionStrategy;
  winningPolicyId?: string;  // For priority/specificity/manual strategies
  resolvedBy?: string;
  resolvedAt?: number;
  notes?: string;
}
