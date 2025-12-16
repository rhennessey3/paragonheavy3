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
  { value: "load_dimensions", label: "Load Dimensions", color: "bg-teal-100 text-teal-800" },
  { value: "axle_configuration", label: "Axle Configuration", color: "bg-amber-100 text-amber-800" },
  { value: "vehicle_equipment", label: "Vehicle Equipment", color: "bg-cyan-100 text-cyan-800" },
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

// The 44 canonical system fields
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
  { key: "date_move_begins", label: "Date Move Begins", category: "dates", dataType: "date", isRequired: false, sortOrder: 12.5, description: "Date the physical move/transport is scheduled to begin" },
  { key: "date_move_ends", label: "Date Move Ends", category: "dates", dataType: "date", isRequired: false, sortOrder: 12.6, description: "Date the physical move/transport is scheduled to end" },

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

  // Route & Conditions (10 fields)
  { key: "allowable_route", label: "Allowable Route", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 28, description: "Approved route for travel" },
  { key: "general_conditions", label: "General Conditions", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 29, description: "General conditions and restrictions" },
  { key: "route_description", label: "Route Description", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 30, description: "Formatted list of route numbers with travel direction (e.g., I-80E, I-81N)" },
  { key: "interim_routes", label: "Interim Routes", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 31, description: "Non-state/local routes (listed in parentheses on permit forms)" },
  { key: "total_miles", label: "Total Miles", category: "route_conditions", dataType: "number", isRequired: false, sortOrder: 32, description: "Total distance in miles for the route" },
  { key: "route_origin_city", label: "Route Origin City", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 33, description: "Starting city for the permit route" },
  { key: "route_origin_state", label: "Route Origin State", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 34, description: "Starting state for the permit route (2-letter code)" },
  { key: "route_destination_city", label: "Route Destination City", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 35, description: "Destination city for the permit route" },
  { key: "route_destination_state", label: "Route Destination State", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 36, description: "Destination state for the permit route (2-letter code)" },
  { key: "counties_traversed", label: "Counties Traversed", category: "route_conditions", dataType: "string", isRequired: false, sortOrder: 37, description: "Comma-separated list of counties the route passes through" },

  // Load Dimensions (15 fields)
  { key: "gross_weight", label: "Gross Weight (lbs)", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 38, description: "Maximum gross vehicle weight in pounds" },
  { key: "legal_weight", label: "Legal Weight (lbs)", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 39, description: "Legal weight limit in pounds" },
  { key: "total_length_ft", label: "Total Length (ft)", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 40, description: "Total length in feet" },
  { key: "total_length_in", label: "Total Length (in)", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 41, description: "Total length additional inches" },
  { key: "total_width_ft", label: "Total Width (ft)", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 42, description: "Total width in feet" },
  { key: "total_width_in", label: "Total Width (in)", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 43, description: "Total width additional inches" },
  { key: "body_width_ft", label: "Body Width 63A/63B (ft)", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 44, description: "Body width per 63A/63B in feet" },
  { key: "body_width_in", label: "Body Width 63A/63B (in)", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 45, description: "Body width per 63A/63B additional inches" },
  { key: "total_height_ft", label: "Total Height (ft)", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 46, description: "Total height in feet" },
  { key: "total_height_in", label: "Total Height (in)", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 47, description: "Total height additional inches" },
  { key: "load_quantity", label: "Load Quantity", category: "load_dimensions", dataType: "number", isRequired: false, sortOrder: 48, description: "Number of loads/items" },
  { key: "serial_id", label: "Serial ID (Last 6 Digits)", category: "load_dimensions", dataType: "string", isRequired: false, sortOrder: 49, description: "Last six digits of serial identification" },
  { key: "bol", label: "BOL", category: "load_dimensions", dataType: "string", isRequired: false, sortOrder: 50, description: "Bill of Lading number" },
  { key: "type_code", label: "Type Code", category: "load_dimensions", dataType: "string", isRequired: false, sortOrder: 51, description: "Load type classification code" },
  { key: "load_description", label: "Load Description", category: "load_dimensions", dataType: "string", isRequired: false, sortOrder: 52, description: "Detailed description of the load" },

  // Axle Configuration (5 fields)
  { key: "total_axle_count", label: "Total Axle Count", category: "axle_configuration", dataType: "number", isRequired: false, sortOrder: 53, description: "Combined total axle count (power unit + drawn unit)" },
  { key: "power_unit_axles", label: "Power Unit Axles", category: "axle_configuration", dataType: "number", isRequired: false, sortOrder: 54, description: "Number of axles on the truck/tractor" },
  { key: "drawn_unit_axles", label: "Drawn Unit Axles", category: "axle_configuration", dataType: "number", isRequired: false, sortOrder: 55, description: "Number of axles on the trailer(s)" },
  { key: "axle_weights_summary", label: "Axle Weights", category: "axle_configuration", dataType: "string", isRequired: false, sortOrder: 56, description: "Formatted summary of individual axle weights (e.g., 'Front: 12000, 2nd: 34000, 3rd: 34000')" },
  { key: "axle_distances_summary", label: "Axle Distances", category: "axle_configuration", dataType: "string", isRequired: false, sortOrder: 57, description: "Formatted summary of axle spacings (e.g., '1-2: 18\\'6\", 2-3: 4\\'6\"')" },

  // Vehicle Equipment (12 fields)
  { key: "vehicle_count", label: "Number of Vehicles", category: "vehicle_equipment", dataType: "number", isRequired: false, sortOrder: 58, description: "Total number of vehicles in the combination" },
  { key: "power_unit_type", label: "Power Unit Type", category: "vehicle_equipment", dataType: "string", isRequired: false, sortOrder: 59, description: "Type of power unit (e.g., Day Cab, Sleeper, Heavy Haul)" },
  { key: "power_unit_usdot", label: "Power Unit US DOT #", category: "vehicle_equipment", dataType: "string", isRequired: false, sortOrder: 60, description: "US DOT number for the power unit" },
  { key: "power_unit_plate", label: "Power Unit Plate #", category: "vehicle_equipment", dataType: "string", isRequired: false, sortOrder: 61, description: "License plate number for the power unit" },
  { key: "power_unit_vin", label: "Power Unit VIN #", category: "vehicle_equipment", dataType: "string", isRequired: false, sortOrder: 62, description: "VIN (or last 6 digits) for the power unit" },
  { key: "power_unit_state", label: "Power Unit State", category: "vehicle_equipment", dataType: "string", isRequired: false, sortOrder: 63, description: "Registration state for the power unit (2-letter code)" },
  { key: "drawn_unit_type", label: "Drawn Unit Type", category: "vehicle_equipment", dataType: "string", isRequired: false, sortOrder: 64, description: "Type of drawn unit (e.g., Flatbed, Step Deck, RGN)" },
  { key: "drawn_unit_plate", label: "Drawn Unit Plate #", category: "vehicle_equipment", dataType: "string", isRequired: false, sortOrder: 65, description: "License plate number for the drawn unit" },
  { key: "drawn_unit_vin", label: "Drawn Unit VIN #", category: "vehicle_equipment", dataType: "string", isRequired: false, sortOrder: 66, description: "VIN (or last 6 digits) for the drawn unit" },
  { key: "drawn_unit_state", label: "Drawn Unit State", category: "vehicle_equipment", dataType: "string", isRequired: false, sortOrder: 67, description: "Registration state for the drawn unit (2-letter code)" },
  { key: "drawn_unit_axles", label: "Drawn Unit Axle Count", category: "vehicle_equipment", dataType: "number", isRequired: false, sortOrder: 68, description: "Number of axles on the drawn unit" },
  { key: "equipment_description", label: "Equipment Description", category: "vehicle_equipment", dataType: "string", isRequired: false, sortOrder: 69, description: "Full description of all vehicles in the combination" },
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
