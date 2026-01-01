/**
 * Conflict Detection Engine (Policy-Based)
 * 
 * Uses a facet-based resolution approach:
 * - Policies feed into facets (policy domains like Escort, Permit, Speed)
 * - Merge policies (MAX, MIN, UNION) handle combining at the facet level
 * - Most "conflicts" are auto-resolved through facet merging
 * - Only explicit policy relationships (exempts_from, modifies) need special handling
 * 
 * Conflict types detected:
 * - Type overlaps (multiple policies of same type - info only for most)
 * - Condition overlaps (policies with overlapping condition ranges)
 * - Output contradictions (policies with conflicting outputs that can't auto-merge)
 */

import {
  MatchedPolicy,
  ConflictGroup,
  ConflictAnalysis,
  ConflictType,
  ConflictSeverity,
  PolicyType,
  RuleAttribute,
  EscortRequirement,
  UtilityNoticeRequirement,
  PermitRequirement,
  SpeedRequirement,
  HoursRequirement,
  RouteRequirement,
  DimensionRequirement,
  PolicyOutput,
  isEscortRequirement,
  isUtilityNoticeRequirement,
  isPermitRequirement,
  FACETS,
  DEFAULT_MERGE_POLICIES,
  type FacetKey,
  type MergeStrategy,
} from './compliance';

// Generate a unique ID for conflict groups
function generateConflictId(): string {
  return `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Main entry point for conflict detection
 * Analyzes a set of matched policies and identifies all conflicts
 * Auto-resolves cumulative types (escort, utility) using max strategy
 */
export function detectConflicts(policies: MatchedPolicy[]): ConflictAnalysis {
  // Always compute resolved outputs, even with fewer than 2 policies
  const resolvedOutputs = computeResolvedOutputs(policies);
  
  if (policies.length < 2) {
    return {
      hasConflicts: false,
      groups: [],
      totalConflictingPolicies: 0,
      typeOverlaps: 0,
      conditionOverlaps: 0,
      outputContradictions: 0,
      resolvedOutputs,
    };
  }

  const groups: ConflictGroup[] = [];
  const conflictingPolicyIds = new Set<string>();

  // Find all three types of conflicts
  // Note: typeOverlaps now skips cumulative types (escort, utility)
  const typeOverlaps = findTypeOverlaps(policies);
  const conditionOverlaps = findConditionOverlaps(policies);
  const outputContradictions = findOutputContradictions(policies);

  // Add all conflict groups and track conflicting policy IDs
  [...typeOverlaps, ...conditionOverlaps, ...outputContradictions].forEach(group => {
    groups.push(group);
    group.policies.forEach(policy => conflictingPolicyIds.add(policy.id));
  });

  return {
    hasConflicts: groups.length > 0,
    groups,
    totalConflictingPolicies: conflictingPolicyIds.size,
    typeOverlaps: typeOverlaps.length,
    conditionOverlaps: conditionOverlaps.length,
    outputContradictions: outputContradictions.length,
    resolvedOutputs,
  };
}

/**
 * Compute auto-resolved outputs using merge strategies
 * Extracts all outputs and merges them by type
 */
function computeResolvedOutputs(policies: MatchedPolicy[]): ConflictAnalysis['resolvedOutputs'] {
  const escortOutputs: EscortRequirement[] = [];
  const utilityOutputs: UtilityNoticeRequirement[] = [];
  const permitOutputs: PermitRequirement[] = [];
  const speedOutputs: SpeedRequirement[] = [];
  const hoursOutputs: HoursRequirement[] = [];
  const routeOutputs: RouteRequirement[] = [];
  const dimensionOutputs: DimensionRequirement[] = [];

  for (const policy of policies) {
    if (!policy.output) continue;
    
    switch (policy.policyType) {
      case 'escort':
        if (isEscortRequirement(policy.output)) {
          escortOutputs.push(policy.output);
        }
        break;
      case 'utility':
        if (isUtilityNoticeRequirement(policy.output)) {
          utilityOutputs.push(policy.output);
        }
        break;
      case 'permit':
        if (isPermitRequirement(policy.output)) {
          permitOutputs.push(policy.output);
        }
        break;
      case 'speed':
        if ('max_speed_mph' in policy.output || 'min_speed_mph' in policy.output) {
          speedOutputs.push(policy.output as SpeedRequirement);
        }
        break;
      case 'hours':
        if ('allowed_start_time' in policy.output || 'blackout_periods' in policy.output) {
          hoursOutputs.push(policy.output as HoursRequirement);
        }
        break;
      case 'route':
        if ('restricted_routes' in policy.output || 'required_routes' in policy.output) {
          routeOutputs.push(policy.output as RouteRequirement);
        }
        break;
      case 'dimension':
        if ('max_width_ft' in policy.output || 'max_height_ft' in policy.output) {
          dimensionOutputs.push(policy.output as DimensionRequirement);
        }
        break;
    }
  }

  const result: ConflictAnalysis['resolvedOutputs'] = {};

  if (escortOutputs.length > 0) {
    result.escort = mergeEscortRequirements(escortOutputs);
  }

  if (utilityOutputs.length > 0) {
    result.utility = mergeUtilityNoticeRequirements(utilityOutputs);
  }

  if (permitOutputs.length > 0) {
    result.permit = mergePermitRequirements(permitOutputs);
  }

  if (speedOutputs.length > 0) {
    result.speed = mergeSpeedRequirements(speedOutputs);
  }

  if (hoursOutputs.length > 0) {
    result.hours = mergeHoursRequirements(hoursOutputs);
  }

  if (routeOutputs.length > 0) {
    result.route = mergeRouteRequirements(routeOutputs);
  }

  if (dimensionOutputs.length > 0) {
    result.dimension = mergeDimensionRequirements(dimensionOutputs);
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// Policy types that naturally stack (cumulative) - don't warn on overlap
// These are auto-resolved using merge strategies
const CUMULATIVE_TYPES: PolicyType[] = ['escort', 'utility'];

/**
 * Find policies that overlap by type
 * Multiple policies of the same type being triggered at once
 * Note: Skips types that use cumulative resolution (escort, utility)
 */
export function findTypeOverlaps(policies: MatchedPolicy[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];
  
  // Group policies by type
  const policiesByType: Record<string, MatchedPolicy[]> = {};
  
  for (const policy of policies) {
    const type = String(policy.policyType);
    if (!policiesByType[type]) {
      policiesByType[type] = [];
    }
    policiesByType[type].push(policy);
  }

  // Create conflict groups for types with multiple policies
  for (const policyType of Object.keys(policiesByType)) {
    const typePolicies = policiesByType[policyType];
    
    // Skip cumulative types - these are auto-resolved, not conflicts
    if (CUMULATIVE_TYPES.includes(policyType as PolicyType)) {
      continue;
    }
    
    if (typePolicies.length > 1) {
      // Determine severity based on policy type
      let severity: ConflictSeverity = 'info';
      if (policyType === 'permit') {
        severity = 'warning';
      }
      if (policyType === 'route') {
        severity = 'critical';
      }

      const facet = FACETS.find(f => f.key === policyType);
      const label = facet?.label || policyType;

      groups.push({
        id: generateConflictId(),
        type: 'type_overlap',
        policies: typePolicies,
        severity,
        description: `${typePolicies.length} ${label} policies triggered`,
        details: `Multiple policies of type "${label}" apply to this load. Review to ensure requirements are not duplicated or contradictory.`,
        suggestedResolution: getSuggestedResolutionForType(policyType as PolicyType),
      });
    }
  }

  return groups;
}

/**
 * Find policies with overlapping condition ranges
 * e.g., width > 12 and width > 14 both match
 */
export function findConditionOverlaps(policies: MatchedPolicy[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < policies.length; i++) {
    for (let j = i + 1; j < policies.length; j++) {
      const policyA = policies[i];
      const policyB = policies[j];
      const pairKey = [policyA.id, policyB.id].sort().join('_');

      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const overlaps = findConditionOverlapsBetweenPolicies(policyA, policyB);
      
      if (overlaps.length > 0) {
        groups.push({
          id: generateConflictId(),
          type: 'condition_overlap',
          policies: [policyA, policyB],
          severity: 'info',
          description: `Overlapping conditions on: ${overlaps.join(', ')}`,
          details: `These policies have overlapping conditions that both triggered for the same load values.`,
          overlappingAttributes: overlaps as RuleAttribute[],
          suggestedResolution: 'Consider if both policies should apply or if one is more specific.',
        });
      }
    }
  }

  return groups;
}

/**
 * Find policies with contradictory outputs
 * Note: Escort and utility outputs are NOT flagged as contradictions
 * because they use cumulative max auto-resolution strategy
 */
export function findOutputContradictions(policies: MatchedPolicy[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];
  
  // Group policies by type for comparison
  const permitPolicies = policies.filter(p => p.policyType === 'permit');

  // Note: Escort and utility policies are auto-resolved using merge strategies,
  // so they don't create contradictions anymore

  // Check permit output contradictions (these still need review)
  if (permitPolicies.length > 1) {
    const permitContradictions = findPermitContradictions(permitPolicies);
    groups.push(...permitContradictions);
  }

  return groups;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find overlapping conditions between two policies
 */
function findConditionOverlapsBetweenPolicies(policyA: MatchedPolicy, policyB: MatchedPolicy): string[] {
  const overlaps: string[] = [];
  
  // Get condition attributes from both policies
  const attrsA = policyA.conditions.map(c => c.attribute);
  const attrsB = policyB.conditions.map(c => c.attribute);
  
  // Find common attributes
  for (const attr of attrsA) {
    if (attrsB.includes(attr)) {
      overlaps.push(attr);
    }
  }

  return overlaps;
}

/**
 * Find contradictions in permit outputs
 */
function findPermitContradictions(policies: MatchedPolicy[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];
  const contradictions: ConflictGroup['contradictions'] = [];

  const permitOutputs = policies
    .filter(p => p.output && isPermitRequirement(p.output))
    .map(p => ({ policy: p, output: p.output as PermitRequirement }));

  if (permitOutputs.length < 2) return groups;

  // Check for different permit types
  const permitTypeValues = new Map<string, { policyId: string; policyName: string }[]>();
  for (const { policy, output } of permitOutputs) {
    const type = output.permit_type_key;
    const existing = permitTypeValues.get(type) || [];
    existing.push({ policyId: policy.id, policyName: policy.name });
    permitTypeValues.set(type, existing);
  }

  if (permitTypeValues.size > 1) {
    contradictions.push({
      field: 'permit_type',
      values: Array.from(permitTypeValues.entries()).flatMap(([value, policies]) =>
        policies.map(p => ({ ...p, value }))
      ),
    });
  }

  if (contradictions.length > 0) {
    groups.push({
      id: generateConflictId(),
      type: 'output_contradiction',
      policies: policies,
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
 * Get suggested resolution text based on policy type
 */
function getSuggestedResolutionForType(type: PolicyType): string {
  switch (type) {
    case 'escort':
      return 'Apply the most restrictive escort requirement (highest number of escorts).';
    case 'permit':
      return 'Verify if multiple permits are needed or if one supersedes another.';
    case 'hours':
      return 'Apply all time restrictions cumulatively.';
    case 'dimension':
      return 'Apply the most restrictive dimension limit.';
    case 'route':
      return 'All route restrictions must be observed.';
    case 'speed':
      return 'Apply the lowest speed limit.';
    case 'utility':
      return 'Use the longest notice period to satisfy all requirements.';
    default:
      return 'Review both policies to determine which applies.';
  }
}

/**
 * Get the effective output after applying a resolution strategy
 */
export function resolveConflict(
  conflictGroup: ConflictGroup,
  strategy: 'priority' | 'specificity' | 'merge' | 'manual',
  manualWinnerId?: string
): MatchedPolicy | null {
  const { policies, type } = conflictGroup;

  if (policies.length === 0) return null;
  if (policies.length === 1) return policies[0];

  switch (strategy) {
    case 'priority':
      // Sort by priority (higher = wins), return highest
      return [...policies].sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];

    case 'specificity':
      // Count conditions - more conditions = more specific
      return [...policies].sort((a, b) => {
        const countA = a.conditions.length;
        const countB = b.conditions.length;
        return countB - countA;
      })[0];

    case 'manual':
      // Return the manually selected policy
      return policies.find(p => p.id === manualWinnerId) || policies[0];

    case 'merge':
      // For merge, we don't pick a winner - caller should merge outputs
      return null;

    default:
      return policies[0];
  }
}

// =============================================================================
// Merge Functions
// =============================================================================

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

/**
 * Merge permit requirements (union of all permit types)
 */
export function mergePermitRequirements(
  requirements: PermitRequirement[]
): PermitRequirement {
  // Take the permit with the longest processing time and highest cost as the base
  const sorted = [...requirements].sort((a, b) => {
    const costA = a.estimated_cost_max || a.estimated_cost_min || 0;
    const costB = b.estimated_cost_max || b.estimated_cost_min || 0;
    return costB - costA;
  });

  const base = sorted[0];
  const allDocs = new Set<string>();
  
  for (const req of requirements) {
    if (req.required_documents) {
      req.required_documents.forEach(d => allDocs.add(d));
    }
  }

  return {
    ...base,
    required_documents: allDocs.size > 0 ? Array.from(allDocs) : undefined,
    notes: requirements.map(r => r.notes).filter(Boolean).join('; ') || undefined,
  };
}

/**
 * Merge speed requirements (take the most restrictive)
 */
export function mergeSpeedRequirements(
  requirements: SpeedRequirement[]
): SpeedRequirement {
  let minMaxSpeed: number | undefined;
  let maxMinSpeed: number | undefined;

  for (const req of requirements) {
    if (req.max_speed_mph !== undefined) {
      minMaxSpeed = minMaxSpeed === undefined 
        ? req.max_speed_mph 
        : Math.min(minMaxSpeed, req.max_speed_mph);
    }
    if (req.min_speed_mph !== undefined) {
      maxMinSpeed = maxMinSpeed === undefined 
        ? req.min_speed_mph 
        : Math.max(maxMinSpeed, req.min_speed_mph);
    }
  }

  return {
    max_speed_mph: minMaxSpeed,
    min_speed_mph: maxMinSpeed,
    notes: requirements.map(r => r.notes).filter(Boolean).join('; ') || undefined,
  };
}

/**
 * Merge hours requirements (intersection of allowed times)
 */
export function mergeHoursRequirements(
  requirements: HoursRequirement[]
): HoursRequirement {
  // Combine all blackout periods
  const allBlackouts: HoursRequirement['blackout_periods'] = [];
  
  for (const req of requirements) {
    if (req.blackout_periods) {
      allBlackouts.push(...req.blackout_periods);
    }
  }

  // Take the most restrictive allowed times
  const allowedDaysArrays = requirements
    .filter(r => r.allowed_days)
    .map(r => r.allowed_days!);
  
  let intersectedDays: string[] | undefined;
  if (allowedDaysArrays.length > 0) {
    intersectedDays = allowedDaysArrays.reduce((acc, days) => 
      acc.filter(d => days.includes(d))
    );
  }

  return {
    allowed_start_time: requirements
      .map(r => r.allowed_start_time)
      .filter(Boolean)
      .sort()
      .pop(), // Latest start time
    allowed_end_time: requirements
      .map(r => r.allowed_end_time)
      .filter(Boolean)
      .sort()[0], // Earliest end time
    allowed_days: intersectedDays,
    blackout_periods: allBlackouts.length > 0 ? allBlackouts : undefined,
    notes: requirements.map(r => r.notes).filter(Boolean).join('; ') || undefined,
  };
}

/**
 * Merge route requirements (union of all restrictions)
 */
export function mergeRouteRequirements(
  requirements: RouteRequirement[]
): RouteRequirement {
  const restricted = new Set<string>();
  const required = new Set<string>();
  let bridgeRestricted = false;
  let tunnelRestricted = false;

  for (const req of requirements) {
    if (req.restricted_routes) {
      req.restricted_routes.forEach(r => restricted.add(r));
    }
    if (req.required_routes) {
      req.required_routes.forEach(r => required.add(r));
    }
    if (req.bridge_restrictions) bridgeRestricted = true;
    if (req.tunnel_restrictions) tunnelRestricted = true;
  }

  return {
    restricted_routes: restricted.size > 0 ? Array.from(restricted) : undefined,
    required_routes: required.size > 0 ? Array.from(required) : undefined,
    bridge_restrictions: bridgeRestricted || undefined,
    tunnel_restrictions: tunnelRestricted || undefined,
    notes: requirements.map(r => r.notes).filter(Boolean).join('; ') || undefined,
  };
}

/**
 * Merge dimension requirements (take the most restrictive)
 */
export function mergeDimensionRequirements(
  requirements: DimensionRequirement[]
): DimensionRequirement {
  let minWidth: number | undefined;
  let minHeight: number | undefined;
  let minLength: number | undefined;
  let minWeight: number | undefined;

  for (const req of requirements) {
    if (req.max_width_ft !== undefined) {
      minWidth = minWidth === undefined 
        ? req.max_width_ft 
        : Math.min(minWidth, req.max_width_ft);
    }
    if (req.max_height_ft !== undefined) {
      minHeight = minHeight === undefined 
        ? req.max_height_ft 
        : Math.min(minHeight, req.max_height_ft);
    }
    if (req.max_length_ft !== undefined) {
      minLength = minLength === undefined 
        ? req.max_length_ft 
        : Math.min(minLength, req.max_length_ft);
    }
    if (req.max_weight_lbs !== undefined) {
      minWeight = minWeight === undefined 
        ? req.max_weight_lbs 
        : Math.min(minWeight, req.max_weight_lbs);
    }
  }

  return {
    max_width_ft: minWidth,
    max_height_ft: minHeight,
    max_length_ft: minLength,
    max_weight_lbs: minWeight,
    notes: requirements.map(r => r.notes).filter(Boolean).join('; ') || undefined,
  };
}

// =============================================================================
// Facet-Based Resolution System
// =============================================================================

/**
 * Policy relationship that modifies how policies interact
 */
export interface PolicyRelationship {
  sourcePolicyId: string;
  targetPolicyId: string;
  relationshipType: 'requires' | 'exempts_from' | 'modifies' | 'conflicts_with';
  modification?: Partial<PolicyOutput>;
  notes?: string;
}

/**
 * Result of facet-based merging for a single facet
 */
export interface FacetMergeResult {
  facetKey: FacetKey;
  facetLabel: string;
  inputPolicies: MatchedPolicy[];
  mergedValues: Record<string, any>;
  appliedStrategies: Record<string, string>;
}

/**
 * Complete result of facet-based conflict resolution
 */
export interface FacetBasedResolution {
  /** Merged outputs per facet */
  facetResults: FacetMergeResult[];
  /** Policies that were excluded due to relationships */
  excludedPolicies: { policy: MatchedPolicy; reason: string; byPolicy: string }[];
  /** Warnings about relationships that affect the output */
  warnings: string[];
  /** Final merged outputs */
  finalOutputs: {
    escort?: EscortRequirement;
    utility?: UtilityNoticeRequirement;
    permit?: PermitRequirement;
    speed?: SpeedRequirement;
    hours?: HoursRequirement;
    route?: RouteRequirement;
    dimension?: DimensionRequirement;
  };
}

/**
 * Group policies by their type (which maps to facets)
 */
export function groupPoliciesByType(policies: MatchedPolicy[]): Map<FacetKey, MatchedPolicy[]> {
  const grouped = new Map<FacetKey, MatchedPolicy[]>();
  
  for (const policy of policies) {
    const facetKey = policy.policyType as FacetKey;
    const existing = grouped.get(facetKey) || [];
    existing.push(policy);
    grouped.set(facetKey, existing);
  }
  
  return grouped;
}

/**
 * Apply relationships to filter/modify policies before merging
 */
export function applyRelationships(
  policies: MatchedPolicy[],
  relationships: PolicyRelationship[]
): { 
  activePolicies: MatchedPolicy[]; 
  excluded: { policy: MatchedPolicy; reason: string; byPolicy: string }[];
  warnings: string[];
} {
  const excluded: { policy: MatchedPolicy; reason: string; byPolicy: string }[] = [];
  const warnings: string[] = [];
  const policyMap = new Map(policies.map(p => [p.id, p]));
  const excludedIds = new Set<string>();
  
  for (const rel of relationships) {
    const sourcePolicy = policyMap.get(rel.sourcePolicyId);
    const targetPolicy = policyMap.get(rel.targetPolicyId);
    
    if (!sourcePolicy || !targetPolicy) continue;
    
    switch (rel.relationshipType) {
      case 'exempts_from':
        // Source exempts from target - exclude target requirements for this load
        if (!excludedIds.has(rel.targetPolicyId)) {
          excluded.push({ 
            policy: targetPolicy, 
            reason: 'Exempted by another policy',
            byPolicy: sourcePolicy.name 
          });
          excludedIds.add(rel.targetPolicyId);
        }
        break;
        
      case 'modifies':
        // Source modifies target - apply modification (handled during merge)
        warnings.push(
          `Policy "${sourcePolicy.name}" modifies "${targetPolicy.name}"`
        );
        break;
        
      case 'conflicts_with':
        // Policies conflict - warn and use priority
        warnings.push(
          `Policies "${sourcePolicy.name}" and "${targetPolicy.name}" conflict. ` +
          `Using higher priority policy.`
        );
        const lowerPriorityPolicy = (sourcePolicy.priority || 0) >= (targetPolicy.priority || 0) 
          ? targetPolicy 
          : sourcePolicy;
        if (!excludedIds.has(lowerPriorityPolicy.id)) {
          excluded.push({ 
            policy: lowerPriorityPolicy, 
            reason: 'Conflicts with higher priority policy',
            byPolicy: lowerPriorityPolicy === sourcePolicy ? targetPolicy.name : sourcePolicy.name
          });
          excludedIds.add(lowerPriorityPolicy.id);
        }
        break;
        
      case 'requires':
        // Source requires target - no exclusion, just note the dependency
        break;
    }
  }
  
  const activePolicies = policies.filter(p => !excludedIds.has(p.id));
  
  return { activePolicies, excluded, warnings };
}

/**
 * Apply merge strategy to a list of values
 */
export function applyMergeStrategy(
  values: any[],
  strategy: MergeStrategy
): any {
  if (values.length === 0) return undefined;
  if (values.length === 1) return values[0];
  
  switch (strategy) {
    case 'MAX':
      return Math.max(...values.filter(v => typeof v === 'number'));
    case 'MIN':
      return Math.min(...values.filter(v => typeof v === 'number'));
    case 'UNION':
      if (Array.isArray(values[0])) {
        const allValues = new Set<string>();
        for (const arr of values) {
          if (Array.isArray(arr)) arr.forEach(v => allValues.add(String(v)));
        }
        return Array.from(allValues);
      }
      return Array.from(new Set(values.map(String)));
    case 'INTERSECTION':
      if (Array.isArray(values[0])) {
        let result = new Set(values[0].map(String));
        for (const arr of values.slice(1)) {
          if (Array.isArray(arr)) {
            const current = new Set(arr.map(String));
            result = new Set(Array.from(result).filter(x => current.has(x)));
          }
        }
        return Array.from(result);
      }
      return values[0];
    case 'FIRST':
      return values[0];
    case 'LAST':
      return values[values.length - 1];
    case 'OR':
      return values.some(v => Boolean(v));
    default:
      return values[0];
  }
}

/**
 * Resolve policies using facet-based merging
 * This is the main function for policy resolution
 */
export function resolveWithFacets(
  policies: MatchedPolicy[],
  relationships: PolicyRelationship[] = [],
  customStrategies?: Record<string, Record<string, string>>
): FacetBasedResolution {
  // Apply relationships first
  const { activePolicies, excluded, warnings } = applyRelationships(policies, relationships);
  
  // Group by type
  const policiesByType = groupPoliciesByType(activePolicies);
  
  // Merge each facet
  const facetResults: FacetMergeResult[] = [];
  const mergeStrategies = { ...DEFAULT_MERGE_POLICIES, ...customStrategies };
  
  for (const [facetKey, facetPolicies] of Array.from(policiesByType.entries())) {
    const facetConfig = FACETS.find(f => f.key === facetKey);
    if (!facetConfig) continue;
    
    const strategies = mergeStrategies[facetKey] || {};
    const mergedValues: Record<string, any> = {};
    
    // Collect all values for each field
    const fieldValues: Record<string, any[]> = {};
    
    for (const policy of facetPolicies) {
      const output = policy.output;
      if (!output) continue;
      
      // Extract all fields from the output
      for (const [key, value] of Object.entries(output)) {
        if (value !== undefined && value !== null) {
          if (!fieldValues[key]) fieldValues[key] = [];
          fieldValues[key].push(value);
        }
      }
    }
    
    // Apply merge strategies
    for (const [field, values] of Object.entries(fieldValues)) {
      const strategy = (strategies[field] || 'MAX') as MergeStrategy;
      mergedValues[field] = applyMergeStrategy(values, strategy);
    }
    
    facetResults.push({
      facetKey,
      facetLabel: facetConfig.label,
      inputPolicies: facetPolicies,
      mergedValues,
      appliedStrategies: strategies,
    });
  }
  
  // Build final outputs
  const finalOutputs: FacetBasedResolution['finalOutputs'] = {};
  
  for (const result of facetResults) {
    if (Object.keys(result.mergedValues).length === 0) continue;
    
    switch (result.facetKey) {
      case 'escort':
        finalOutputs.escort = result.mergedValues as EscortRequirement;
        break;
      case 'utility':
        finalOutputs.utility = result.mergedValues as UtilityNoticeRequirement;
        break;
      case 'permit':
        finalOutputs.permit = result.mergedValues as PermitRequirement;
        break;
      case 'speed':
        finalOutputs.speed = result.mergedValues as SpeedRequirement;
        break;
      case 'hours':
        finalOutputs.hours = result.mergedValues as HoursRequirement;
        break;
      case 'route':
        finalOutputs.route = result.mergedValues as RouteRequirement;
        break;
      case 'dimension':
        finalOutputs.dimension = result.mergedValues as DimensionRequirement;
        break;
    }
  }
  
  return {
    facetResults,
    excludedPolicies: excluded,
    warnings,
    finalOutputs,
  };
}

/**
 * Detect conflicts with facet awareness
 * This version considers that most conflicts are auto-resolved by facet merging
 */
export function detectConflictsWithFacets(
  policies: MatchedPolicy[],
  relationships: PolicyRelationship[] = [],
  customStrategies?: Record<string, Record<string, string>>
): ConflictAnalysis & { facetResolution: FacetBasedResolution } {
  // First resolve using facets
  const facetResolution = resolveWithFacets(policies, relationships, customStrategies);
  
  // Then detect remaining conflicts
  const analysis = detectConflicts(policies);
  
  // Override resolved outputs with facet-based results
  if (Object.keys(facetResolution.finalOutputs).length > 0) {
    analysis.resolvedOutputs = facetResolution.finalOutputs;
  }
  
  return {
    ...analysis,
    facetResolution,
  };
}


