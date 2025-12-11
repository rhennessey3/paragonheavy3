/**
 * Permit Types - Form types that use system fields
 */

import { Id } from "@/convex/_generated/dataModel";

// Field requirement levels
export const FIELD_REQUIREMENTS = [
  { value: "required", label: "Required", color: "bg-red-100 text-red-800", description: "Must be filled out" },
  { value: "optional", label: "Optional", color: "bg-blue-100 text-blue-800", description: "Can be filled out" },
  { value: "hidden", label: "Hidden", color: "bg-gray-100 text-gray-500", description: "Not shown on form" },
] as const;

export type FieldRequirement = typeof FIELD_REQUIREMENTS[number]["value"];

// Permit type interface
export interface PermitType {
  _id?: Id<"permitTypes">;
  key: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

// Permit type field configuration
export interface PermitTypeField {
  _id?: Id<"permitTypeFields">;
  permitTypeId: Id<"permitTypes">;
  systemFieldId: Id<"systemFields">;
  requirement: FieldRequirement;
  sortOrder: number;
}

// Common permit types to seed
export const COMMON_PERMIT_TYPES: Omit<PermitType, "_id">[] = [
  {
    key: "single_trip",
    label: "Single Trip Permit",
    description: "One-time permit for a specific route and date range",
    isActive: true,
    sortOrder: 1,
  },
  {
    key: "annual",
    label: "Annual Permit",
    description: "Yearly permit for multiple trips within size/weight limits",
    isActive: true,
    sortOrder: 2,
  },
  {
    key: "superload",
    label: "Superload Permit",
    description: "For loads exceeding standard oversize/overweight limits",
    isActive: true,
    sortOrder: 3,
  },
  {
    key: "oversize",
    label: "Oversize Permit",
    description: "For loads exceeding legal dimension limits",
    isActive: true,
    sortOrder: 4,
  },
  {
    key: "overweight",
    label: "Overweight Permit",
    description: "For loads exceeding legal weight limits",
    isActive: true,
    sortOrder: 5,
  },
];

// Default field configurations by permit type
// Maps permit type key -> array of [field_key, requirement]
export const DEFAULT_FIELD_CONFIGS: Record<string, [string, FieldRequirement][]> = {
  single_trip: [
    ["permit_number", "required"],
    ["permit_type", "required"],
    ["permit_fee", "optional"],
    ["other_fee", "optional"],
    ["total_permit_cost", "optional"],
    ["permit_service", "hidden"],
    ["requested_start_date", "optional"],
    ["start_date", "required"],
    ["end_date", "required"],
    ["date_issued", "optional"],
    ["time_issued", "hidden"],
    ["travel_times", "optional"],
    ["issuer_name", "optional"],
    ["requestor", "required"],
    ["contact", "optional"],
    ["recipient_name", "hidden"],
    ["requestor_street_address", "optional"],
    ["requestor_city", "optional"],
    ["requestor_state", "optional"],
    ["requestor_zip_code", "optional"],
    ["recipient_street_address", "hidden"],
    ["recipient_city", "hidden"],
    ["recipient_state", "hidden"],
    ["recipient_zip_code", "hidden"],
    ["telephone_number", "optional"],
    ["usdot", "optional"],
    ["payment_method", "optional"],
    ["allowable_route", "required"],
    ["general_conditions", "optional"],
  ],
  annual: [
    ["permit_number", "required"],
    ["permit_type", "required"],
    ["permit_fee", "required"],
    ["other_fee", "optional"],
    ["total_permit_cost", "required"],
    ["permit_service", "hidden"],
    ["requested_start_date", "optional"],
    ["start_date", "required"],
    ["end_date", "required"],
    ["date_issued", "optional"],
    ["time_issued", "hidden"],
    ["travel_times", "hidden"],
    ["issuer_name", "optional"],
    ["requestor", "required"],
    ["contact", "optional"],
    ["recipient_name", "hidden"],
    ["requestor_street_address", "required"],
    ["requestor_city", "required"],
    ["requestor_state", "required"],
    ["requestor_zip_code", "required"],
    ["recipient_street_address", "hidden"],
    ["recipient_city", "hidden"],
    ["recipient_state", "hidden"],
    ["recipient_zip_code", "hidden"],
    ["telephone_number", "required"],
    ["usdot", "required"],
    ["payment_method", "required"],
    ["allowable_route", "hidden"],
    ["general_conditions", "optional"],
  ],
  superload: [
    ["permit_number", "required"],
    ["permit_type", "required"],
    ["permit_fee", "required"],
    ["other_fee", "required"],
    ["total_permit_cost", "required"],
    ["permit_service", "optional"],
    ["requested_start_date", "required"],
    ["start_date", "required"],
    ["end_date", "required"],
    ["date_issued", "required"],
    ["time_issued", "optional"],
    ["travel_times", "required"],
    ["issuer_name", "required"],
    ["requestor", "required"],
    ["contact", "required"],
    ["recipient_name", "optional"],
    ["requestor_street_address", "required"],
    ["requestor_city", "required"],
    ["requestor_state", "required"],
    ["requestor_zip_code", "required"],
    ["recipient_street_address", "optional"],
    ["recipient_city", "optional"],
    ["recipient_state", "optional"],
    ["recipient_zip_code", "optional"],
    ["telephone_number", "required"],
    ["usdot", "required"],
    ["payment_method", "required"],
    ["allowable_route", "required"],
    ["general_conditions", "required"],
  ],
  oversize: [
    ["permit_number", "required"],
    ["permit_type", "required"],
    ["permit_fee", "optional"],
    ["other_fee", "optional"],
    ["total_permit_cost", "optional"],
    ["permit_service", "hidden"],
    ["requested_start_date", "optional"],
    ["start_date", "required"],
    ["end_date", "required"],
    ["date_issued", "optional"],
    ["time_issued", "hidden"],
    ["travel_times", "optional"],
    ["issuer_name", "optional"],
    ["requestor", "required"],
    ["contact", "optional"],
    ["recipient_name", "hidden"],
    ["requestor_street_address", "optional"],
    ["requestor_city", "optional"],
    ["requestor_state", "optional"],
    ["requestor_zip_code", "optional"],
    ["recipient_street_address", "hidden"],
    ["recipient_city", "hidden"],
    ["recipient_state", "hidden"],
    ["recipient_zip_code", "hidden"],
    ["telephone_number", "optional"],
    ["usdot", "optional"],
    ["payment_method", "optional"],
    ["allowable_route", "required"],
    ["general_conditions", "optional"],
  ],
  overweight: [
    ["permit_number", "required"],
    ["permit_type", "required"],
    ["permit_fee", "optional"],
    ["other_fee", "optional"],
    ["total_permit_cost", "optional"],
    ["permit_service", "hidden"],
    ["requested_start_date", "optional"],
    ["start_date", "required"],
    ["end_date", "required"],
    ["date_issued", "optional"],
    ["time_issued", "hidden"],
    ["travel_times", "optional"],
    ["issuer_name", "optional"],
    ["requestor", "required"],
    ["contact", "optional"],
    ["recipient_name", "hidden"],
    ["requestor_street_address", "optional"],
    ["requestor_city", "optional"],
    ["requestor_state", "optional"],
    ["requestor_zip_code", "optional"],
    ["recipient_street_address", "hidden"],
    ["recipient_city", "hidden"],
    ["recipient_state", "hidden"],
    ["recipient_zip_code", "hidden"],
    ["telephone_number", "optional"],
    ["usdot", "required"],
    ["payment_method", "optional"],
    ["allowable_route", "required"],
    ["general_conditions", "optional"],
  ],
};

// Helper functions
export function getRequirementInfo(requirement: FieldRequirement) {
  return FIELD_REQUIREMENTS.find(r => r.value === requirement) || FIELD_REQUIREMENTS[2];
}

export function getFieldStats(fields: { requirement: FieldRequirement }[]) {
  const required = fields.filter(f => f.requirement === "required").length;
  const optional = fields.filter(f => f.requirement === "optional").length;
  const hidden = fields.filter(f => f.requirement === "hidden").length;
  const visible = required + optional;
  
  return { required, optional, hidden, visible, total: fields.length };
}
