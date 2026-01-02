/**
 * Tests for the Conflict Detection Engine (Policy-Based)
 */

import {
  detectConflicts,
  findTypeOverlaps,
  findConditionOverlaps,
  findOutputContradictions,
  resolveConflict,
  mergeEscortRequirements,
  mergeUtilityNoticeRequirements,
} from '../lib/conflict-detection';
import { 
  MatchedPolicy, 
  EscortRequirement, 
  UtilityNoticeRequirement,
  PolicyType,
  PolicyCondition,
} from '../lib/compliance';

// Helper to create a mock matched policy
function createMockPolicy(overrides: Partial<MatchedPolicy>): MatchedPolicy {
  return {
    id: `policy_${Math.random().toString(36).substring(7)}`,
    name: 'Test Policy',
    policyType: 'escort',
    description: 'A test policy',
    severity: 'restriction',
    conditions: [],
    ...overrides,
  };
}

describe('detectConflicts', () => {
  it('returns no conflicts for empty policies array', () => {
    const result = detectConflicts([]);
    expect(result.hasConflicts).toBe(false);
    expect(result.groups).toHaveLength(0);
    expect(result.totalConflictingPolicies).toBe(0);
  });

  it('returns no conflicts for single policy', () => {
    const policies = [createMockPolicy({ id: 'policy1' })];
    const result = detectConflicts(policies);
    expect(result.hasConflicts).toBe(false);
    expect(result.groups).toHaveLength(0);
  });

  it('does NOT detect conflicts for escort policies (cumulative type)', () => {
    const policies = [
      createMockPolicy({ id: 'policy1', policyType: 'escort' }),
      createMockPolicy({ id: 'policy2', policyType: 'escort' }),
    ];
    const result = detectConflicts(policies);
    // Escort policies are cumulative - they auto-merge, not conflict
    expect(result.typeOverlaps).toBe(0);
  });

  it('detects type overlaps for permit policies', () => {
    const policies = [
      createMockPolicy({ id: 'policy1', policyType: 'permit' }),
      createMockPolicy({ id: 'policy2', policyType: 'permit' }),
    ];
    const result = detectConflicts(policies);
    expect(result.hasConflicts).toBe(true);
    expect(result.typeOverlaps).toBeGreaterThan(0);
  });
});

describe('findTypeOverlaps', () => {
  it('groups policies by type', () => {
    const policies = [
      createMockPolicy({ id: 'policy1', policyType: 'permit' }),
      createMockPolicy({ id: 'policy2', policyType: 'permit' }),
      createMockPolicy({ id: 'policy3', policyType: 'speed' }),
    ];
    
    const overlaps = findTypeOverlaps(policies);
    
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].type).toBe('type_overlap');
    expect(overlaps[0].policies).toHaveLength(2);
    expect(overlaps[0].policies.map(p => p.id)).toContain('policy1');
    expect(overlaps[0].policies.map(p => p.id)).toContain('policy2');
  });

  it('returns empty array when no type overlaps', () => {
    const policies = [
      createMockPolicy({ id: 'policy1', policyType: 'permit' }),
      createMockPolicy({ id: 'policy2', policyType: 'speed' }),
      createMockPolicy({ id: 'policy3', policyType: 'hours' }),
    ];
    
    const overlaps = findTypeOverlaps(policies);
    expect(overlaps).toHaveLength(0);
  });

  it('skips cumulative types (escort, utility)', () => {
    const policies = [
      createMockPolicy({ id: 'policy1', policyType: 'escort' }),
      createMockPolicy({ id: 'policy2', policyType: 'escort' }),
      createMockPolicy({ id: 'policy3', policyType: 'utility' }),
      createMockPolicy({ id: 'policy4', policyType: 'utility' }),
    ];
    
    const overlaps = findTypeOverlaps(policies);
    // Escort and utility are cumulative - they don't create type overlaps
    expect(overlaps).toHaveLength(0);
  });

  it('sets critical severity for route overlaps', () => {
    const policies = [
      createMockPolicy({ id: 'policy1', policyType: 'route' }),
      createMockPolicy({ id: 'policy2', policyType: 'route' }),
    ];
    
    const overlaps = findTypeOverlaps(policies);
    expect(overlaps[0].severity).toBe('critical');
  });
});

describe('findConditionOverlaps', () => {
  it('detects overlapping conditions on same attribute', () => {
    const policies = [
      createMockPolicy({
        id: 'policy1',
        conditions: [{ id: '1', attribute: 'width_ft', operator: '>', value: 12 }],
      }),
      createMockPolicy({
        id: 'policy2',
        conditions: [{ id: '2', attribute: 'width_ft', operator: '>', value: 14 }],
      }),
    ];
    
    const overlaps = findConditionOverlaps(policies);
    
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].overlappingAttributes).toContain('width_ft');
  });

  it('returns empty when conditions do not overlap', () => {
    const policies = [
      createMockPolicy({
        id: 'policy1',
        conditions: [{ id: '1', attribute: 'width_ft', operator: '>', value: 12 }],
      }),
      createMockPolicy({
        id: 'policy2',
        conditions: [{ id: '2', attribute: 'height_ft', operator: '>', value: 14 }],
      }),
    ];
    
    const overlaps = findConditionOverlaps(policies);
    expect(overlaps).toHaveLength(0);
  });
});

describe('findOutputContradictions', () => {
  it('detects contradictory permit outputs', () => {
    const policies = [
      createMockPolicy({
        id: 'policy1',
        policyType: 'permit',
        output: { permit_type_key: 'single_trip', permit_type_label: 'Single Trip' },
      }),
      createMockPolicy({
        id: 'policy2',
        policyType: 'permit',
        output: { permit_type_key: 'superload', permit_type_label: 'Superload' },
      }),
    ];
    
    const contradictions = findOutputContradictions(policies);
    
    expect(contradictions).toHaveLength(1);
    expect(contradictions[0].type).toBe('output_contradiction');
    expect(contradictions[0].contradictions).toBeDefined();
    expect(contradictions[0].contradictions?.some(c => c.field === 'permit_type')).toBe(true);
  });

  it('does NOT flag escort outputs as contradictions (auto-merged)', () => {
    const policies = [
      createMockPolicy({
        id: 'policy1',
        policyType: 'escort',
        output: { front_escorts: 1, rear_escorts: 0 } as EscortRequirement,
      }),
      createMockPolicy({
        id: 'policy2',
        policyType: 'escort',
        output: { front_escorts: 2, rear_escorts: 1 } as EscortRequirement,
      }),
    ];
    
    const contradictions = findOutputContradictions(policies);
    // Escort outputs are auto-merged, not contradictions
    expect(contradictions).toHaveLength(0);
  });

  it('returns empty when outputs do not contradict', () => {
    const policies = [
      createMockPolicy({
        id: 'policy1',
        policyType: 'permit',
        output: { permit_type_key: 'single_trip', permit_type_label: 'Single Trip' },
      }),
      createMockPolicy({
        id: 'policy2',
        policyType: 'permit',
        output: { permit_type_key: 'single_trip', permit_type_label: 'Single Trip' },
      }),
    ];
    
    const contradictions = findOutputContradictions(policies);
    expect(contradictions).toHaveLength(0);
  });
});

describe('resolveConflict', () => {
  it('resolves by priority - higher priority wins', () => {
    const policies = [
      createMockPolicy({ id: 'policy1', priority: 10 }),
      createMockPolicy({ id: 'policy2', priority: 20 }),
      createMockPolicy({ id: 'policy3', priority: 5 }),
    ];
    
    const conflictGroup = {
      id: 'conflict1',
      type: 'type_overlap' as const,
      policies,
      severity: 'warning' as const,
      description: 'Test conflict',
    };
    
    const winner = resolveConflict(conflictGroup, 'priority');
    expect(winner?.id).toBe('policy2');
  });

  it('resolves by specificity - more conditions wins', () => {
    const policies = [
      createMockPolicy({
        id: 'policy1',
        conditions: [{ id: '1', attribute: 'width_ft', operator: '>', value: 12 }],
      }),
      createMockPolicy({
        id: 'policy2',
        conditions: [
          { id: '1', attribute: 'width_ft', operator: '>', value: 12 },
          { id: '2', attribute: 'height_ft', operator: '>', value: 14 },
        ],
      }),
    ];
    
    const conflictGroup = {
      id: 'conflict1',
      type: 'type_overlap' as const,
      policies,
      severity: 'warning' as const,
      description: 'Test conflict',
    };
    
    const winner = resolveConflict(conflictGroup, 'specificity');
    expect(winner?.id).toBe('policy2');
  });

  it('resolves by manual selection', () => {
    const policies = [
      createMockPolicy({ id: 'policy1' }),
      createMockPolicy({ id: 'policy2' }),
    ];
    
    const conflictGroup = {
      id: 'conflict1',
      type: 'type_overlap' as const,
      policies,
      severity: 'warning' as const,
      description: 'Test conflict',
    };
    
    const winner = resolveConflict(conflictGroup, 'manual', 'policy2');
    expect(winner?.id).toBe('policy2');
  });

  it('returns null for merge strategy', () => {
    const policies = [
      createMockPolicy({ id: 'policy1' }),
      createMockPolicy({ id: 'policy2' }),
    ];
    
    const conflictGroup = {
      id: 'conflict1',
      type: 'type_overlap' as const,
      policies,
      severity: 'warning' as const,
      description: 'Test conflict',
    };
    
    const winner = resolveConflict(conflictGroup, 'merge');
    expect(winner).toBeNull();
  });
});

describe('mergeEscortRequirements', () => {
  it('takes maximum escort counts', () => {
    const requirements: EscortRequirement[] = [
      { front_escorts: 1, rear_escorts: 0 },
      { front_escorts: 2, rear_escorts: 1 },
      { front_escorts: 1, rear_escorts: 2 },
    ];
    
    const merged = mergeEscortRequirements(requirements);
    
    expect(merged.front_escorts).toBe(2);
    expect(merged.rear_escorts).toBe(2);
  });

  it('combines height pole requirements', () => {
    const requirements: EscortRequirement[] = [
      { front_escorts: 1, rear_escorts: 0, front_has_height_pole: true },
      { front_escorts: 1, rear_escorts: 1, rear_has_height_pole: false },
    ];
    
    const merged = mergeEscortRequirements(requirements);
    
    expect(merged.front_has_height_pole).toBe(true);
  });

  it('concatenates notes', () => {
    const requirements: EscortRequirement[] = [
      { front_escorts: 1, rear_escorts: 0, notes: 'Note 1' },
      { front_escorts: 1, rear_escorts: 1, notes: 'Note 2' },
    ];
    
    const merged = mergeEscortRequirements(requirements);
    
    expect(merged.notes).toContain('Note 1');
    expect(merged.notes).toContain('Note 2');
  });
});

describe('mergeUtilityNoticeRequirements', () => {
  it('takes maximum notice hours', () => {
    const requirements: UtilityNoticeRequirement[] = [
      { notice_hours: 24, utility_types: [] },
      { notice_hours: 72, utility_types: [] },
      { notice_hours: 48, utility_types: [] },
    ];
    
    const merged = mergeUtilityNoticeRequirements(requirements);
    
    expect(merged.notice_hours).toBe(72);
  });

  it('combines utility types', () => {
    const requirements: UtilityNoticeRequirement[] = [
      { notice_hours: 24, utility_types: ['wire', 'pole'] },
      { notice_hours: 24, utility_types: ['pole', 'transformer'] },
    ];
    
    const merged = mergeUtilityNoticeRequirements(requirements);
    
    expect(merged.utility_types).toContain('wire');
    expect(merged.utility_types).toContain('pole');
    expect(merged.utility_types).toContain('transformer');
    expect(merged.utility_types).toHaveLength(3); // No duplicates
  });
});



