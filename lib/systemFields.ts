/**
 * System Fields - Canonical permit data dictionary
 */

import { Id } from "@/convex/_generated/dataModel";

// Field data types
export const FIELD_DATA_TYPES = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "currency", label: "Currency" },
  { value: "phone", label: "Phone Number" },
  { value: "address", label: "Address" },
] as const;

export type FieldDataType = typeof FIELD_DATA_TYPES[number]["value"];

// Field categories
export const FIELD_CATEGORIES = [
  { value: "permit_info", label: "Permit Information", color: "bg-blue-100 text-blue-800" },
  { value: "dates", label: "Dates & Times", color: "bg-purple-100 text-purple-800" },
  { value: "people", label: "People", color: "bg-green-100 text-green-800" },
  { value: "requestor_address", label: "Requestor Address", color: "bg-orange-100 text-orange-800" },
  { value: "recipient_address", label: "Recipient Address", color: "bg-yellow-100 text-yellow-800" },
  { value: "contact", label: "Contact & Payment", color: "bg-pink-100 text-pink-800" },
  { value: "route_conditions", label: "Route & Conditions", color: "bg-indigo-100 text-indigo-800" },
] as const;

export type FieldCategory = typeof FIELD_CATEGORIES[number]["value"];

// System field type
export interface SystemField {
  _id?: Id<"systemFields">;
  key: string;
  label: string;
  category: FieldCategory;
  dataType: FieldDataType;
  description?: string;
  isRequired: boolean;
  sortOrder: number;
}

// State field mapping type
export interface StateFieldMapping {
  _id?: Id<"stateFieldMappings">;
  jurisdictionId: Id<"jurisdictions">;
  systemFieldId: Id<"systemFields">;
  stateLabel: string;
  stateFieldKey?: string;
  notes?: string;
  isActive: boolean;
}

// The 29 canonical system fields
export const CANONICAL_SYSTEM_FIELDS: Omit<SystemField, "_id">[] = [
  // Permit Information (6 fields)
  { key: "permit_number", label: "Permit Number", category: "permit_info", dataType: "string", isRequired: true, sortOrder: 1, description: "Unique identifier for the permit" },
  { key: "permit_type", label: "Permit Type", category: "permit_info", dataType: "string", isRequired: true, sortOrder: 2, description: "Type of permit (single trip, annual, superload, etc.)" },
  { key: "permit_fee", label: "Permit Fee", category: "permit_info", dataType: "currency", isRequired: false, sortOrder: 3, description: "Base permit fee amount" },
  { key: "other_fee", label: "Other Fee", category: "permit_info", dataType: "currency", isRequired: false, sortOrder: 4, description: "Additional fees (processing, expedite, etc.)" },
  { key: "total_permit_cost", label: "Total Permit Cost", category: "permit_info", dataType: "currency", isRequired: false, sortOrder: 5, description: "Total cost including all fees" },
  { key: "permit_service", label: "Permit Service", category: "permit_info", dataType: "string", isRequired: false, sortOrder: 6, description: "Service level or permit service provider" },

  // Dates & Times (6 fields)
  { key: "requested_start_date", label: "Requested Start Date", category: "dates", dataType: "date", isRequired: false, sortOrder: 7, description: "Date requested for permit to begin" },
  { key: "start_date", label: "Start Date", category: "dates", dataType: "date", isRequired: true, sortOrder: 8, description: "Effective start date of permit" },
  { key: "end_date", label: "End Date", category: "dates", dataType: "date", isRequired: true, sortOrder: 9, description: "Expiration date of permit" },
  { key: "date_issued", label: "Date Issued", category: "dates", dataType: "date", isRequired: false, sortOrder: 10, description: "Date the permit was issued" },
  { key: "time_issued", label: "Time Issued", category: "dates", dataType: "string", isRequired: false, sortOrder: 11, description: "Time the permit was issued" },
  { key: "travel_times", label: "Travel Times", category: "dates", dataType: "string", isRequired: false, sortOrder: 12, description: "Allowed travel times/restrictions" },

  // People (4 fields)
  { key: "issuer_name", label: "Issuer Name", category: "people", dataType: "string", isRequired: false, sortOrder: 13, description: "Name of the permit issuer/agency" },
  { key: "requestor", label: "Requestor", category: "people", dataType: "string", isRequired: true, sortOrder: 14, description: "Name of person/company requesting permit" },
  { key: "contact", label: "Contact", category: "people", dataType: "string", isRequired: false, sortOrder: 15, description: "Primary contact person" },
  { key: "recipient_name", label: "Recipient Name", category: "people", dataType: "string", isRequired: false, sortOrder: 16, description: "Name of permit recipient if different from requestor" },

  // Requestor Address (4 fields)
  { key: "requestor_street_address", label: "Requestor Street Address", category: "requestor_address", dataType: "address", isRequired: false, sortOrder: 17, description: "Street address of requestor" },
  { key: "requestor_city", label: "Requestor City", category: "requestor_address", dataType: "string", isRequired: false, sortOrder: 18, description: "City of requestor" },
  { key: "requestor_state", label: "Requestor State", category: "requestor_address", dataType: "string", isRequired: false, sortOrder: 19, description: "State of requestor" },
  { key: "requestor_zip_code", label: "Requestor Zip Code", category: "requestor_address", dataType: "string", isRequired: false, sortOrder: 20, description: "Zip code of requestor" },

  // Recipient Address (4 fields)
  { key: "recipient_street_address", label: "Recipient Street Address", category: "recipient_address", dataType: "address", isRequired: false, sortOrder: 21, description: "Street address of recipient" },
  { key: "recipient_city", label: "Recipient City", category: "recipient_address", dataType: "string", isRequired: false, sortOrder: 22, description: "City of recipient" },
  { key: "recipient_state", label: "Recipient State", category: "recipient_address", dataType: "string", isRequired: false, sortOrder: 23, description: "State of recipient" },
  { key: "recipient_zip_code", label: "Recipient Zip Code", category: "recipient_address", dataType: "string", isRequired: false, sortOrder: 24, description: "Zip code of recipient" },

  // Contact & Payment (3 fields)
  { key: "telephone_number", label: "Telephone Number", category: "contact", dataType: "phone", isRequired: false, sortOrder: 25, description: "Contact phone number" },
  { key: "usdot", label: "USDOT", category: "contact", dataType: "string", isRequired: false, sortOrder: 26, description: "USDOT number" },
  { key: "payment_method", label: "Payment Method", category: "contact", dataType: "string", isRequired: false, sortOrder: 27, description: "Method of payment for permit" },

  // Route & Conditions (2 fields)
  { key: "allowable_route", label: "Allowable Route", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 28, description: "Approved route for travel" },
  { key: "general_conditions", label: "General Conditions", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 29, description: "General conditions and restrictions" },
];

// Helper functions
export function getCategoryInfo(category: FieldCategory) {
  return FIELD_CATEGORIES.find(c => c.value === category) || { value: category, label: category, color: "bg-gray-100 text-gray-800" };
}

export function getDataTypeInfo(dataType: FieldDataType) {
  return FIELD_DATA_TYPES.find(t => t.value === dataType) || { value: dataType, label: dataType };
}

export function getFieldsByCategory(fields: SystemField[]): Map<FieldCategory, SystemField[]> {
  const grouped = new Map<FieldCategory, SystemField[]>();
  
  for (const category of FIELD_CATEGORIES) {
    grouped.set(category.value, []);
  }
  
  for (const field of fields) {
    const existing = grouped.get(field.category) || [];
    existing.push(field);
    grouped.set(field.category, existing);
  }
  
  // Sort fields within each category by sortOrder
  grouped.forEach((categoryFields, category) => {
    grouped.set(category, categoryFields.sort((a: SystemField, b: SystemField) => a.sortOrder - b.sortOrder));
  });
  
  return grouped;
}

// Get mapping coverage stats for a jurisdiction
export function getMappingCoverage(
  totalFields: number,
  mappedCount: number
): { percentage: number; status: "complete" | "partial" | "none" } {
  if (mappedCount === 0) return { percentage: 0, status: "none" };
  if (mappedCount >= totalFields) return { percentage: 100, status: "complete" };
  return { percentage: Math.round((mappedCount / totalFields) * 100), status: "partial" };
}
