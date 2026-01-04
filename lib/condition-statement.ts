/**
 * Utility functions for generating natural language condition statements
 * Used by the PolicyCenterNode to display auto-generated condition descriptions
 */

/**
 * Set of attributes that represent dimension values in feet
 * These will use feet/inches formatting
 */
export const DIMENSION_ATTRIBUTES = new Set([
  'width_ft',
  'height_ft',
  'length_ft',
  'combined_length_ft',
  'front_overhang_ft',
  'rear_overhang_ft',
  'left_overhang_ft',
  'right_overhang_ft',
  'axle_spacing_ft',
]);

/**
 * Set of attributes that represent weight values in pounds
 */
export const WEIGHT_ATTRIBUTES = new Set([
  'gross_weight_lbs',
  'axle_weight_lbs',
  'total_weight_lbs',
]);

/**
 * Converts a decimal feet value to a human-readable feet and inches string
 * @param value - Decimal feet value (e.g., 12.5)
 * @returns Formatted string (e.g., "12ft 6in")
 */
export function formatFeetInches(value: number): string {
  const feet = Math.floor(value);
  const inches = Math.round((value - feet) * 12);

  if (inches === 0) {
    return `${feet}ft`;
  } else if (feet === 0) {
    return `${inches}in`;
  }
  return `${feet}ft ${inches}in`;
}

/**
 * Checks if an attribute represents a dimension value
 */
export function isDimensionAttribute(attribute: string): boolean {
  return DIMENSION_ATTRIBUTES.has(attribute);
}

/**
 * Checks if an attribute represents a weight value
 */
export function isWeightAttribute(attribute: string): boolean {
  return WEIGHT_ATTRIBUTES.has(attribute);
}

/**
 * Converts operator symbols to natural language phrases
 */
export function operatorToNaturalLanguage(operator: string): string {
  const operatorMap: Record<string, string> = {
    '>': 'exceeds',
    '>=': 'is at least',
    '<': 'is less than',
    '<=': 'is at most',
    '=': 'equals',
    '==': 'equals',
    '!=': 'does not equal',
    'between': 'is between',
    'in': 'is one of',
    'not_in': 'is not one of',
  };
  return operatorMap[operator] || operator;
}

/**
 * Converts attribute keys to human-readable names
 */
export function attributeToDisplayName(attribute: string): string {
  const nameMap: Record<string, string> = {
    // Dimension attributes
    'width_ft': 'Width',
    'height_ft': 'Height',
    'length_ft': 'Length',
    'combined_length_ft': 'Combined Length',
    'front_overhang_ft': 'Front Overhang',
    'rear_overhang_ft': 'Rear Overhang',
    'left_overhang_ft': 'Left Overhang',
    'right_overhang_ft': 'Right Overhang',
    'axle_spacing_ft': 'Axle Spacing',

    // Weight attributes
    'gross_weight_lbs': 'Gross Weight',
    'axle_weight_lbs': 'Axle Weight',
    'total_weight_lbs': 'Total Weight',

    // Axle attributes
    'number_of_axles': 'Number of Axles',
    'axle_count': 'Axle Count',

    // Boolean attributes
    'is_mobile_home': 'Mobile Home',
    'is_superload': 'Superload',
    'divisible_load': 'Divisible Load',
    'requires_pilot_car': 'Requires Pilot Car',

    // Type attributes
    'vehicle_type': 'Vehicle Type',
    'cargo_type': 'Cargo Type',
    'road_type': 'Road Type',
    'permit_type': 'Permit Type',
  };

  // Return mapped name or convert snake_case to Title Case
  return nameMap[attribute] ||
    attribute
      .replace(/_ft$/, '') // Remove _ft suffix for dimensions
      .replace(/_lbs$/, '') // Remove _lbs suffix for weights
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formats a condition value based on the attribute type
 */
export function formatConditionValue(attribute: string, value: unknown): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return 'N/A';
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Handle arrays (for 'between' or 'in' operators)
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      // Range for 'between' operator
      if (isDimensionAttribute(attribute)) {
        return `${formatFeetInches(value[0])} and ${formatFeetInches(value[1])}`;
      }
      if (isWeightAttribute(attribute)) {
        return `${value[0].toLocaleString()} lbs and ${value[1].toLocaleString()} lbs`;
      }
      return `${value[0]} and ${value[1]}`;
    }
    // List for 'in' operator
    return value.join(', ');
  }

  // Handle dimension values
  if (typeof value === 'number' && isDimensionAttribute(attribute)) {
    return formatFeetInches(value);
  }

  // Handle weight values
  if (typeof value === 'number' && isWeightAttribute(attribute)) {
    return `${value.toLocaleString()} lbs`;
  }

  // Handle other numbers
  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  // Default string conversion
  return String(value);
}

/**
 * Condition data structure for statement generation
 */
export interface ConditionData {
  attribute: string;
  operator: string;
  value: unknown;
}

/**
 * Converts a single condition to a natural language phrase
 */
export function conditionToPhrase(condition: ConditionData): string {
  const displayName = attributeToDisplayName(condition.attribute);
  const operatorPhrase = operatorToNaturalLanguage(condition.operator);
  const formattedValue = formatConditionValue(condition.attribute, condition.value);

  return `${displayName} ${operatorPhrase} ${formattedValue}`;
}

/**
 * Generates a complete statement of conditions from an array of conditions
 * @param conditions - Array of condition data objects
 * @param conditionLogic - How conditions are combined: 'AND' or 'OR'
 * @returns Human-readable statement like "When Width exceeds 12ft AND Height exceeds 14ft"
 */
export function generateConditionStatement(
  conditions: ConditionData[],
  conditionLogic: 'AND' | 'OR' = 'AND'
): string {
  if (conditions.length === 0) {
    return 'No conditions connected';
  }

  if (conditions.length === 1) {
    return `When ${conditionToPhrase(conditions[0])}`;
  }

  const phrases = conditions.map(conditionToPhrase);
  const joinWord = conditionLogic === 'AND' ? ' AND ' : ' OR ';

  return `When ${phrases.join(joinWord)}`;
}
