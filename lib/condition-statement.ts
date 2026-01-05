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
  /** Law citation for this condition (e.g., "67 Pa. Code § 179.3") */
  sourceRegulation?: string;
  /** Expiry date for the regulation (optional) */
  expiryDate?: string;
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
 * @returns Human-readable statement with each condition on a separate line
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
  const connector = conditionLogic === 'AND' ? 'AND' : 'OR';

  // Format each condition on its own line with the connector between them
  const lines: string[] = [];
  phrases.forEach((phrase, i) => {
    if (i > 0) {
      lines.push(connector);
    }
    lines.push(`• ${phrase}`);
  });
  return lines.join('\n');
}

/**
 * Structured condition item for rendering with citation fields
 */
export interface ConditionDisplayItem {
  phrase: string;
  sourceRegulation?: string;
  expiryDate?: string;
}

/**
 * Generates structured condition items for rendering with citation fields
 * @param conditions - Array of condition data objects
 * @param conditionLogic - How conditions are combined: 'AND' or 'OR'
 * @returns Array of structured condition items with connector info
 */
export function generateConditionItems(
  conditions: ConditionData[],
  conditionLogic: 'AND' | 'OR' = 'AND'
): { items: ConditionDisplayItem[]; connector: string } {
  if (conditions.length === 0) {
    return { items: [], connector: conditionLogic };
  }

  const items: ConditionDisplayItem[] = conditions.map((condition) => ({
    phrase: conditionToPhrase(condition),
    sourceRegulation: condition.sourceRegulation,
    expiryDate: condition.expiryDate,
  }));

  return { items, connector: conditionLogic };
}

/**
 * Output field configuration for human-readable labels by policy type
 */
interface OutputFieldConfig {
  label: string;
  pluralLabel?: string;
  type: 'number' | 'boolean' | 'select' | 'text' | 'time';
  unit?: string;
  formatValue?: (value: any) => string;
}

const OUTPUT_FIELD_CONFIG: Record<string, Record<string, OutputFieldConfig>> = {
  escort: {
    frontPilots: { label: 'front pilot', pluralLabel: 'front pilots', type: 'number' },
    rearPilots: { label: 'rear pilot', pluralLabel: 'rear pilots', type: 'number' },
    heightPole: { label: 'height pole', type: 'boolean' },
    policeRequired: { label: 'police escort', type: 'boolean' },
  },
  permit: {
    permitType: {
      label: 'permit',
      type: 'select',
      formatValue: (v) => {
        const typeMap: Record<string, string> = {
          'single_trip': 'single-trip permit',
          'annual': 'annual permit',
          'superload': 'superload permit',
          'special': 'special permit',
        };
        return typeMap[v] || `${v} permit`;
      }
    },
    estimatedCost: { label: 'estimated cost', type: 'number', unit: '$' },
    processingDays: { label: 'day', pluralLabel: 'days', type: 'number', unit: 'processing' },
  },
  speed: {
    maxSpeed: { label: 'maximum speed', type: 'number', unit: 'mph' },
    minSpeed: { label: 'minimum speed', type: 'number', unit: 'mph' },
  },
  hours: {
    startHour: { label: 'start time', type: 'time' },
    endHour: { label: 'end time', type: 'time' },
    excludeWeekends: { label: 'no weekend travel', type: 'boolean' },
    excludeHolidays: { label: 'no holiday travel', type: 'boolean' },
  },
  route: {
    restriction: {
      label: 'route restriction',
      type: 'select',
      formatValue: (v) => {
        const restrictionMap: Record<string, string> = {
          'prohibited': 'route prohibited',
          'requires_approval': 'requires route approval',
          'requires_survey': 'requires route survey',
        };
        return restrictionMap[v] || v;
      }
    },
    reason: { label: 'reason', type: 'text' },
  },
  utility: {
    noticeHours: { label: 'hour', pluralLabel: 'hours', type: 'number', unit: 'notice required' },
    utilityTypes: { label: 'utility coordination', type: 'text' },
  },
  dimension: {
    maxValue: { label: 'maximum', type: 'number' },
    unit: { label: 'unit', type: 'select' },
  },
};

/**
 * Formats a single output field into a human-readable phrase
 * @returns The formatted phrase or null if the value is empty/zero
 */
function formatOutputField(
  outputType: string,
  key: string,
  value: any
): string | null {
  // Skip empty, null, undefined, or zero values
  if (value === null || value === undefined || value === '' || value === 0 || value === false) {
    return null;
  }

  const config = OUTPUT_FIELD_CONFIG[outputType]?.[key];
  if (!config) {
    // Fallback for unknown fields
    return `${key}: ${value}`;
  }

  // Handle custom formatValue function
  if (config.formatValue) {
    return config.formatValue(value);
  }

  switch (config.type) {
    case 'number': {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num) || num === 0) return null;

      // Handle unit prefix (like $ for cost)
      if (config.unit === '$') {
        return `$${num.toLocaleString()} estimated cost`;
      }

      // Handle count-based fields (pilots, days, hours)
      const label = num === 1 ? config.label : (config.pluralLabel || config.label);

      // Handle unit suffix (like mph, or "processing" for days)
      if (config.unit === 'mph') {
        return `${config.label} of ${num} mph`;
      }
      if (config.unit === 'processing') {
        return `${num} ${label} processing`;
      }
      if (config.unit === 'notice required') {
        return `${num} ${label} notice required`;
      }

      return `${num} ${label}`;
    }

    case 'boolean': {
      return value === true ? config.label : null;
    }

    case 'time': {
      const hour = typeof value === 'number' ? value : parseInt(value);
      if (isNaN(hour)) return null;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:00 ${period}`;
    }

    case 'text': {
      return typeof value === 'string' && value.trim() ? value.trim() : null;
    }

    case 'select': {
      return typeof value === 'string' && value ? value.replace(/_/g, ' ') : null;
    }

    default:
      return String(value);
  }
}

/**
 * Output data structure for statement generation
 */
export interface OutputData {
  outputType: string;
  output: Record<string, any>;
}

/**
 * Generates a natural language output statement from output data
 * @param outputType - The policy type (escort, permit, speed, etc.)
 * @param output - The output field values
 * @returns Human-readable statement like "1 rear pilot with height pole required"
 */
export function generateOutputStatement(
  outputType: string,
  output: Record<string, any>
): string {
  if (!output || Object.keys(output).length === 0) {
    return '';
  }

  const config = OUTPUT_FIELD_CONFIG[outputType];
  if (!config) {
    return '';
  }

  // Special handling for hours policy type (time range)
  if (outputType === 'hours') {
    const parts: string[] = [];

    // Handle time range
    if (output.startHour !== undefined && output.endHour !== undefined) {
      const startTime = formatOutputField(outputType, 'startHour', output.startHour);
      const endTime = formatOutputField(outputType, 'endHour', output.endHour);
      if (startTime && endTime) {
        parts.push(`Travel allowed ${startTime} to ${endTime}`);
      }
    }

    // Handle weekend/holiday restrictions
    const restrictions: string[] = [];
    if (output.excludeWeekends) restrictions.push('weekends');
    if (output.excludeHolidays) restrictions.push('holidays');
    if (restrictions.length > 0) {
      parts.push(`No travel on ${restrictions.join(' or ')}`);
    }

    return parts.join('. ');
  }

  // General handling for other policy types
  const phrases: string[] = [];

  // Process fields in a specific order for natural reading
  const fieldOrder = Object.keys(config);

  for (const key of fieldOrder) {
    const phrase = formatOutputField(outputType, key, output[key]);
    if (phrase) {
      phrases.push(phrase);
    }
  }

  if (phrases.length === 0) {
    return '';
  }

  // Format based on policy type
  if (outputType === 'escort') {
    // Join with commas and "and", add "required" at the end
    if (phrases.length === 1) {
      return `${capitalizeFirst(phrases[0])} required`;
    }
    const lastPhrase = phrases.pop()!;
    return `${capitalizeFirst(phrases.join(', '))} and ${lastPhrase} required`;
  }

  if (outputType === 'speed') {
    return capitalizeFirst(phrases.join(', '));
  }

  if (outputType === 'permit') {
    return capitalizeFirst(phrases.join(', '));
  }

  if (outputType === 'route') {
    return capitalizeFirst(phrases.join(': '));
  }

  // Default: join with commas
  return capitalizeFirst(phrases.join(', '));
}

/**
 * Capitalizes the first letter of a string
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
