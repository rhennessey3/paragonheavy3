/**
 * Conflict Detection Engine
 * 
 * Detects conflicts between compliance rules including:
 * - Category overlaps (multiple rules of same category triggered)
 * - Condition overlaps (rules with overlapping condition ranges)
 * - Requirement contradictions (rules with conflicting outputs)
 */

import {
  MatchedRule,
  ConflictGroup,
  ConflictAnalysis,
  ConflictType,
  ConflictSeverity,
  RuleCategory,
  RuleAttribute,
  EscortRequirement,
  UtilityNoticeRequirement,
  PermitRequirement,
  isEscortRequirement,
  isUtilityNoticeRequirement,
  isPermitRequirement,
  getCategoryInfo,
} from './compliance';

// Generate a unique ID for conflict groups
function generateConflictId(): string {
  return `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Main entry point for conflict detection
 * Analyzes a set of matched rules and identifies all conflicts
 * Auto-resolves cumulative categories (escort, utility notice) using max strategy
 */
export function detectConflicts(rules: MatchedRule[]): ConflictAnalysis {
  // Always compute resolved requirements, even with fewer than 2 rules
  const resolvedRequirements = computeResolvedRequirements(rules);
  
  if (rules.length < 2) {
    return {
      hasConflicts: false,
      groups: [],
      totalConflictingRules: 0,
      categoryOverlaps: 0,
      conditionOverlaps: 0,
      requirementContradictions: 0,
      resolvedRequirements,
    };
  }

  const groups: ConflictGroup[] = [];
  const conflictingRuleIds = new Set<string>();

  // Find all three types of conflicts
  // Note: categoryOverlaps now skips cumulative categories (escort, utility_notice)
  const categoryOverlaps = findCategoryOverlaps(rules);
  const conditionOverlaps = findConditionOverlaps(rules);
  const requirementContradictions = findRequirementContradictions(rules);

  // Add all conflict groups and track conflicting rule IDs
  [...categoryOverlaps, ...conditionOverlaps, ...requirementContradictions].forEach(group => {
    groups.push(group);
    group.rules.forEach(rule => conflictingRuleIds.add(rule.id));
  });

  return {
    hasConflicts: groups.length > 0,
    groups,
    totalConflictingRules: conflictingRuleIds.size,
    categoryOverlaps: categoryOverlaps.length,
    conditionOverlaps: conditionOverlaps.length,
    requirementContradictions: requirementContradictions.length,
    resolvedRequirements,
  };
}

/**
 * Compute auto-resolved requirements using cumulative max strategy
 * Extracts all escort and utility notice requirements and merges them
 */
function computeResolvedRequirements(rules: MatchedRule[]): ConflictAnalysis['resolvedRequirements'] {
  const escortRequirements: EscortRequirement[] = [];
  const utilityRequirements: UtilityNoticeRequirement[] = [];

  for (const rule of rules) {
    // Extract escort requirements
    if (rule.requirement && isEscortRequirement(rule.requirement)) {
      escortRequirements.push(rule.requirement);
    } else if (rule.conditions?.escortsRequired) {
      // Legacy format
      const legacy = rule.conditions.escortsRequired;
      escortRequirements.push({
        front_escorts: legacy.front ? 1 : 0,
        rear_escorts: legacy.rear ? 1 : 0,
        front_has_height_pole: legacy.heightPole,
      });
    }

    // Extract utility notice requirements
    if (rule.requirement && isUtilityNoticeRequirement(rule.requirement)) {
      utilityRequirements.push(rule.requirement);
    }
  }

  const result: ConflictAnalysis['resolvedRequirements'] = {};

  if (escortRequirements.length > 0) {
    result.escort = mergeEscortRequirements(escortRequirements);
  }

  if (utilityRequirements.length > 0) {
    result.utilityNotice = mergeUtilityNoticeRequirements(utilityRequirements);
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// Categories that naturally stack (cumulative) - don't warn on overlap
// These are auto-resolved using cumulative max strategy
const CUMULATIVE_CATEGORIES = ['escort_requirement', 'utility_notice'];

/**
 * Find rules that overlap by category
 * Multiple rules of the same category being triggered at once
 * Note: Skips categories that use cumulative resolution (escort, utility notice)
 */
export function findCategoryOverlaps(rules: MatchedRule[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];
  
  // Group rules by category using a plain object for better compatibility
  const rulesByCategory: Record<string, MatchedRule[]> = {};
  
  for (const rule of rules) {
    const cat = String(rule.category);
    if (!rulesByCategory[cat]) {
      rulesByCategory[cat] = [];
    }
    rulesByCategory[cat].push(rule);
  }

  // Create conflict groups for categories with multiple rules
  for (const category of Object.keys(rulesByCategory)) {
    const categoryRules = rulesByCategory[category];
    
    // Skip cumulative categories - these are auto-resolved, not conflicts
    if (CUMULATIVE_CATEGORIES.includes(category)) {
      continue;
    }
    
    if (categoryRules.length > 1) {
      const categoryInfo = getCategoryInfo(category as RuleCategory);
      
      // Determine severity based on category type
      let severity: ConflictSeverity = 'info';
      if (category === 'permit_requirement') {
        severity = 'warning';
      }
      if (category === 'route_restriction') {
        severity = 'critical';
      }

      groups.push({
        id: generateConflictId(),
        type: 'category_overlap',
        rules: categoryRules,
        severity,
        description: `${categoryRules.length} ${categoryInfo.label} rules triggered`,
        details: `Multiple rules in the "${categoryInfo.label}" category apply to this load. Review to ensure requirements are not duplicated or contradictory.`,
        suggestedResolution: getSuggestedResolutionForCategory(category as RuleCategory),
      });
    }
  }

  return groups;
}

/**
 * Find rules with overlapping condition ranges
 * e.g., width > 12 and width > 14 both match
 */
export function findConditionOverlaps(rules: MatchedRule[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const ruleA = rules[i];
      const ruleB = rules[j];
      const pairKey = [ruleA.id, ruleB.id].sort().join('_');

      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const overlaps = findConditionOverlapsBetweenRules(ruleA, ruleB);
      
      if (overlaps.length > 0) {
        groups.push({
          id: generateConflictId(),
          type: 'condition_overlap',
          rules: [ruleA, ruleB],
          severity: 'info',
          description: `Overlapping conditions on: ${overlaps.join(', ')}`,
          details: `These rules have overlapping conditions that both triggered for the same load values.`,
          overlappingAttributes: overlaps as RuleAttribute[],
          suggestedResolution: 'Consider if both rules should apply or if one is more specific.',
        });
      }
    }
  }

  return groups;
}

/**
 * Find rules with contradictory requirements
 * Note: Escort and utility notice requirements are NOT flagged as contradictions
 * because they use cumulative max auto-resolution strategy
 */
export function findRequirementContradictions(rules: MatchedRule[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];
  
  // Group rules by requirement type for comparison
  const permitRules = rules.filter(r => r.requirementType === 'permit_requirement');

  // Note: Escort and utility notice rules are auto-resolved using cumulative max,
  // so they don't create contradictions anymore

  // Check permit requirement contradictions (these still need review)
  if (permitRules.length > 1) {
    const permitContradictions = findPermitContradictions(permitRules);
    groups.push(...permitContradictions);
  }

  return groups;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find overlapping conditions between two rules
 */
function findConditionOverlapsBetweenRules(ruleA: MatchedRule, ruleB: MatchedRule): string[] {
  const overlaps: string[] = [];
  const conditionsA = ruleA.conditions || {};
  const conditionsB = ruleB.conditions || {};

  // Check IfThen style conditions
  if (conditionsA.ifThen && conditionsB.ifThen) {
    const clausesA: any[] = Array.isArray(conditionsA.conditions) ? conditionsA.conditions : [];
    const clausesB: any[] = Array.isArray(conditionsB.conditions) ? conditionsB.conditions : [];
    
    // Find attributes used in both rules
    const attrsA = clausesA.map((c: any) => String(c.attribute));
    const attrsB = clausesB.map((c: any) => String(c.attribute));
    
    for (const attr of attrsA) {
      if (attrsB.includes(attr)) {
        overlaps.push(attr);
      }
    }
  } else {
    // Legacy conditions - check dimension attributes
    const dimensionAttrs = [
      { attr: 'width', minKey: 'minWidthFt', maxKey: 'maxWidthFt' },
      { attr: 'height', minKey: 'minHeightFt', maxKey: 'maxHeightFt' },
      { attr: 'length', minKey: 'minLengthFt', maxKey: 'maxLengthFt' },
      { attr: 'weight', maxKey: 'maxGrossWeightLbs' },
    ];

    for (const { attr, minKey, maxKey } of dimensionAttrs) {
      const aHasMin = minKey && conditionsA[minKey] !== undefined;
      const aHasMax = maxKey && conditionsA[maxKey] !== undefined;
      const bHasMin = minKey && conditionsB[minKey] !== undefined;
      const bHasMax = maxKey && conditionsB[maxKey] !== undefined;

      if ((aHasMin || aHasMax) && (bHasMin || bHasMax)) {
        // Both rules have conditions on this attribute
        if (doRangesOverlap(
          aHasMin ? conditionsA[minKey!] : 0,
          aHasMax ? conditionsA[maxKey!] : Infinity,
          bHasMin ? conditionsB[minKey!] : 0,
          bHasMax ? conditionsB[maxKey!] : Infinity
        )) {
          overlaps.push(attr);
        }
      }
    }
  }

  return overlaps;
}

/**
 * Check if two numeric ranges overlap
 */
function doRangesOverlap(minA: number, maxA: number, minB: number, maxB: number): boolean {
  return minA <= maxB && minB <= maxA;
}

/**
 * Find contradictions in escort requirements
 */
function findEscortContradictions(rules: MatchedRule[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];
  const contradictions: ConflictGroup['contradictions'] = [];

  // Extract escort requirements from each rule
  const escortRequirements = rules.map(rule => {
    if (rule.requirement && isEscortRequirement(rule.requirement)) {
      return { rule, req: rule.requirement };
    }
    // Legacy format
    if (rule.conditions?.escortsRequired) {
      const legacy = rule.conditions.escortsRequired;
      return {
        rule,
        req: {
          front_escorts: legacy.front ? 1 : 0,
          rear_escorts: legacy.rear ? 1 : 0,
          front_has_height_pole: legacy.heightPole,
        } as EscortRequirement,
      };
    }
    return null;
  }).filter((e): e is { rule: MatchedRule; req: EscortRequirement } => e !== null);

  if (escortRequirements.length < 2) return groups;

  // Check for different front escort counts
  const frontEscortValues = new Map<number, { ruleId: string; ruleTitle: string }[]>();
  for (const { rule, req } of escortRequirements) {
    const count = req.front_escorts || 0;
    const existing = frontEscortValues.get(count) || [];
    existing.push({ ruleId: rule.id, ruleTitle: rule.title });
    frontEscortValues.set(count, existing);
  }
  
  if (frontEscortValues.size > 1) {
    contradictions.push({
      field: 'front_escorts',
      values: Array.from(frontEscortValues.entries()).flatMap(([value, rules]) =>
        rules.map(r => ({ ...r, value }))
      ),
    });
  }

  // Check for different rear escort counts
  const rearEscortValues = new Map<number, { ruleId: string; ruleTitle: string }[]>();
  for (const { rule, req } of escortRequirements) {
    const count = req.rear_escorts || 0;
    const existing = rearEscortValues.get(count) || [];
    existing.push({ ruleId: rule.id, ruleTitle: rule.title });
    rearEscortValues.set(count, existing);
  }
  
  if (rearEscortValues.size > 1) {
    contradictions.push({
      field: 'rear_escorts',
      values: Array.from(rearEscortValues.entries()).flatMap(([value, rules]) =>
        rules.map(r => ({ ...r, value }))
      ),
    });
  }

  // Check for different height pole requirements
  const heightPoleValues = new Map<boolean, { ruleId: string; ruleTitle: string }[]>();
  for (const { rule, req } of escortRequirements) {
    const hasHeightPole = req.front_has_height_pole || req.rear_has_height_pole || false;
    const existing = heightPoleValues.get(hasHeightPole) || [];
    existing.push({ ruleId: rule.id, ruleTitle: rule.title });
    heightPoleValues.set(hasHeightPole, existing);
  }
  
  if (heightPoleValues.size > 1) {
    contradictions.push({
      field: 'height_pole',
      values: Array.from(heightPoleValues.entries()).flatMap(([value, rules]) =>
        rules.map(r => ({ ...r, value }))
      ),
    });
  }

  if (contradictions.length > 0) {
    groups.push({
      id: generateConflictId(),
      type: 'requirement_contradiction',
      rules: rules,
      severity: 'warning',
      description: `Conflicting escort requirements: ${contradictions.map(c => c.field).join(', ')}`,
      details: 'These rules specify different escort requirements. Consider using the most restrictive requirement or setting priorities.',
      contradictions,
      suggestedResolution: 'Use the rule requiring the most escorts (cumulative/max strategy) or set rule priorities.',
    });
  }

  return groups;
}

/**
 * Find contradictions in utility notice requirements
 */
function findUtilityNoticeContradictions(rules: MatchedRule[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];
  const contradictions: ConflictGroup['contradictions'] = [];

  const utilityRequirements = rules.map(rule => {
    if (rule.requirement && isUtilityNoticeRequirement(rule.requirement)) {
      return { rule, req: rule.requirement };
    }
    return null;
  }).filter((e): e is { rule: MatchedRule; req: UtilityNoticeRequirement } => e !== null);

  if (utilityRequirements.length < 2) return groups;

  // Check for different notice hours
  const noticeHourValues = new Map<number, { ruleId: string; ruleTitle: string }[]>();
  for (const { rule, req } of utilityRequirements) {
    const hours = req.notice_hours;
    const existing = noticeHourValues.get(hours) || [];
    existing.push({ ruleId: rule.id, ruleTitle: rule.title });
    noticeHourValues.set(hours, existing);
  }

  if (noticeHourValues.size > 1) {
    contradictions.push({
      field: 'notice_hours',
      values: Array.from(noticeHourValues.entries()).flatMap(([value, rules]) =>
        rules.map(r => ({ ...r, value }))
      ),
    });
  }

  if (contradictions.length > 0) {
    groups.push({
      id: generateConflictId(),
      type: 'requirement_contradiction',
      rules: rules,
      severity: 'info',
      description: `Different utility notice periods: ${Array.from(noticeHourValues.keys()).map(h => `${h}h`).join(', ')}`,
      details: 'These rules specify different notice periods. Consider using the longest notice period.',
      contradictions,
      suggestedResolution: 'Use the longest notice period to satisfy all requirements.',
    });
  }

  return groups;
}

/**
 * Find contradictions in permit requirements
 */
function findPermitContradictions(rules: MatchedRule[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];
  const contradictions: ConflictGroup['contradictions'] = [];

  const permitRequirements = rules.map(rule => {
    if (rule.requirement && isPermitRequirement(rule.requirement)) {
      return { rule, req: rule.requirement };
    }
    return null;
  }).filter((e): e is { rule: MatchedRule; req: PermitRequirement } => e !== null);

  if (permitRequirements.length < 2) return groups;

  // Check for different permit types
  const permitTypeValues = new Map<string, { ruleId: string; ruleTitle: string }[]>();
  for (const { rule, req } of permitRequirements) {
    const type = req.permit_type_key;
    const existing = permitTypeValues.get(type) || [];
    existing.push({ ruleId: rule.id, ruleTitle: rule.title });
    permitTypeValues.set(type, existing);
  }

  if (permitTypeValues.size > 1) {
    contradictions.push({
      field: 'permit_type',
      values: Array.from(permitTypeValues.entries()).flatMap(([value, rules]) =>
        rules.map(r => ({ ...r, value }))
      ),
    });
  }

  if (contradictions.length > 0) {
    groups.push({
      id: generateConflictId(),
      type: 'requirement_contradiction',
      rules: rules,
      severity: 'warning',
      description: `Different permit types required: ${Array.from(permitTypeValues.keys()).join(', ')}`,
      details: 'Multiple permit types are required. You may need to obtain multiple permits.',
      contradictions,
      suggestedResolution: 'Verify if multiple permits are actually required or if one permit supersedes another.',
    });
  }

  return groups;
}

/**
 * Get suggested resolution text based on category
 */
function getSuggestedResolutionForCategory(category: RuleCategory): string {
  switch (category) {
    case 'escort_requirement':
      return 'Apply the most restrictive escort requirement (highest number of escorts).';
    case 'permit_requirement':
      return 'Verify if multiple permits are needed or if one supersedes another.';
    case 'time_restriction':
      return 'Apply all time restrictions cumulatively.';
    case 'dimension_limit':
      return 'Apply the most restrictive dimension limit.';
    case 'route_restriction':
      return 'All route restrictions must be observed.';
    case 'speed_limit':
      return 'Apply the lowest speed limit.';
    case 'utility_notice':
      return 'Use the longest notice period to satisfy all requirements.';
    default:
      return 'Review both rules to determine which applies.';
  }
}

/**
 * Get the effective requirement after applying a resolution strategy
 * This is useful when you want to determine what the "winning" requirement should be
 */
export function resolveConflict(
  conflictGroup: ConflictGroup,
  strategy: 'priority' | 'specificity' | 'cumulative' | 'manual',
  manualWinnerId?: string
): MatchedRule | null {
  const { rules, type } = conflictGroup;

  if (rules.length === 0) return null;
  if (rules.length === 1) return rules[0];

  switch (strategy) {
    case 'priority':
      // Sort by priority (higher = wins), return highest
      return [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];

    case 'specificity':
      // Count conditions - more conditions = more specific
      return [...rules].sort((a, b) => {
        const countA = countConditions(a);
        const countB = countConditions(b);
        return countB - countA;
      })[0];

    case 'manual':
      // Return the manually selected rule
      return rules.find(r => r.id === manualWinnerId) || rules[0];

    case 'cumulative':
      // For cumulative, we don't pick a winner - caller should merge requirements
      return null;

    default:
      return rules[0];
  }
}

/**
 * Count the number of conditions in a rule (for specificity calculation)
 */
function countConditions(rule: MatchedRule): number {
  const conditions = rule.conditions || {};
  
  if (conditions.ifThen && conditions.conditions) {
    return conditions.conditions.length;
  }
  
  // Legacy format - count non-undefined condition fields
  let count = 0;
  const fields = [
    'minWidthFt', 'maxWidthFt', 'minHeightFt', 'maxHeightFt',
    'minLengthFt', 'maxLengthFt', 'maxGrossWeightLbs', 'maxAxleWeightLbs',
    'vehicleClasses', 'timeOfDay', 'permitType',
  ];
  
  for (const field of fields) {
    if (conditions[field] !== undefined) {
      count++;
    }
  }
  
  return count;
}

/**
 * Merge escort requirements using cumulative strategy (take max)
 */
export function mergeEscortRequirements(requirements: EscortRequirement[]): EscortRequirement {
  return requirements.reduce((merged, req) => ({
    front_escorts: Math.max(merged.front_escorts, req.front_escorts || 0),
    rear_escorts: Math.max(merged.rear_escorts, req.rear_escorts || 0),
    front_has_height_pole: merged.front_has_height_pole || req.front_has_height_pole,
    rear_has_height_pole: merged.rear_has_height_pole || req.rear_has_height_pole,
    front_distance_min_ft: Math.min(
      merged.front_distance_min_ft || Infinity,
      req.front_distance_min_ft || Infinity
    ) === Infinity ? undefined : Math.min(
      merged.front_distance_min_ft || Infinity,
      req.front_distance_min_ft || Infinity
    ),
    front_distance_max_ft: Math.max(
      merged.front_distance_max_ft || 0,
      req.front_distance_max_ft || 0
    ) || undefined,
    rear_distance_min_ft: Math.min(
      merged.rear_distance_min_ft || Infinity,
      req.rear_distance_min_ft || Infinity
    ) === Infinity ? undefined : Math.min(
      merged.rear_distance_min_ft || Infinity,
      req.rear_distance_min_ft || Infinity
    ),
    rear_distance_max_ft: Math.max(
      merged.rear_distance_max_ft || 0,
      req.rear_distance_max_ft || 0
    ) || undefined,
    notes: requirements.map(r => r.notes).filter(Boolean).join('; ') || undefined,
  }), {
    front_escorts: 0,
    rear_escorts: 0,
  } as EscortRequirement);
}

/**
 * Merge utility notice requirements using cumulative strategy (take longest notice)
 */
export function mergeUtilityNoticeRequirements(
  requirements: UtilityNoticeRequirement[]
): UtilityNoticeRequirement {
  const allTypes = new Set<string>();
  let maxHours = 0;
  const notes: string[] = [];

  for (const req of requirements) {
    maxHours = Math.max(maxHours, req.notice_hours);
    req.utility_types.forEach(t => allTypes.add(t));
    if (req.notes) notes.push(req.notes);
  }

  return {
    notice_hours: maxHours,
    utility_types: Array.from(allTypes),
    notes: notes.length > 0 ? notes.join('; ') : undefined,
  };
}

