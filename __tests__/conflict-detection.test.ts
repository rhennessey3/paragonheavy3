/**
 * Tests for the Conflict Detection Engine
 */

import {
  detectConflicts,
  findCategoryOverlaps,
  findConditionOverlaps,
  findRequirementContradictions,
  resolveConflict,
  mergeEscortRequirements,
  mergeUtilityNoticeRequirements,
} from '../lib/conflict-detection';
import { MatchedRule, EscortRequirement, UtilityNoticeRequirement } from '../lib/compliance';

// Helper to create a mock matched rule
function createMockRule(overrides: Partial<MatchedRule>): MatchedRule {
  return {
    id: `rule_${Math.random().toString(36).substring(7)}`,
    title: 'Test Rule',
    category: 'escort_requirement',
    summary: 'A test rule',
    severity: 'restriction',
    conditions: {},
    ...overrides,
  };
}

describe('detectConflicts', () => {
  it('returns no conflicts for empty rules array', () => {
    const result = detectConflicts([]);
    expect(result.hasConflicts).toBe(false);
    expect(result.groups).toHaveLength(0);
    expect(result.totalConflictingRules).toBe(0);
  });

  it('returns no conflicts for single rule', () => {
    const rules = [createMockRule({ id: 'rule1' })];
    const result = detectConflicts(rules);
    expect(result.hasConflicts).toBe(false);
    expect(result.groups).toHaveLength(0);
  });

  it('detects conflicts when multiple rules of same category exist', () => {
    const rules = [
      createMockRule({ id: 'rule1', category: 'escort_requirement' }),
      createMockRule({ id: 'rule2', category: 'escort_requirement' }),
    ];
    const result = detectConflicts(rules);
    expect(result.hasConflicts).toBe(true);
    expect(result.categoryOverlaps).toBeGreaterThan(0);
  });
});

describe('findCategoryOverlaps', () => {
  it('groups rules by category', () => {
    const rules = [
      createMockRule({ id: 'rule1', category: 'escort_requirement' }),
      createMockRule({ id: 'rule2', category: 'escort_requirement' }),
      createMockRule({ id: 'rule3', category: 'permit_requirement' }),
    ];
    
    const overlaps = findCategoryOverlaps(rules);
    
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].type).toBe('category_overlap');
    expect(overlaps[0].rules).toHaveLength(2);
    expect(overlaps[0].rules.map(r => r.id)).toContain('rule1');
    expect(overlaps[0].rules.map(r => r.id)).toContain('rule2');
  });

  it('returns empty array when no category overlaps', () => {
    const rules = [
      createMockRule({ id: 'rule1', category: 'escort_requirement' }),
      createMockRule({ id: 'rule2', category: 'permit_requirement' }),
      createMockRule({ id: 'rule3', category: 'time_restriction' }),
    ];
    
    const overlaps = findCategoryOverlaps(rules);
    expect(overlaps).toHaveLength(0);
  });

  it('creates multiple overlap groups for multiple overlapping categories', () => {
    const rules = [
      createMockRule({ id: 'rule1', category: 'escort_requirement' }),
      createMockRule({ id: 'rule2', category: 'escort_requirement' }),
      createMockRule({ id: 'rule3', category: 'permit_requirement' }),
      createMockRule({ id: 'rule4', category: 'permit_requirement' }),
    ];
    
    const overlaps = findCategoryOverlaps(rules);
    expect(overlaps).toHaveLength(2);
  });

  it('sets critical severity for route_restriction overlaps', () => {
    const rules = [
      createMockRule({ id: 'rule1', category: 'route_restriction' }),
      createMockRule({ id: 'rule2', category: 'route_restriction' }),
    ];
    
    const overlaps = findCategoryOverlaps(rules);
    expect(overlaps[0].severity).toBe('critical');
  });
});

describe('findConditionOverlaps', () => {
  it('detects overlapping legacy conditions on width', () => {
    const rules = [
      createMockRule({
        id: 'rule1',
        conditions: { minWidthFt: 12 },
      }),
      createMockRule({
        id: 'rule2',
        conditions: { minWidthFt: 14 },
      }),
    ];
    
    const overlaps = findConditionOverlaps(rules);
    
    // Both rules trigger when width >= 14, so they overlap
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].overlappingAttributes).toContain('width');
  });

  it('detects overlapping IfThen conditions', () => {
    const rules = [
      createMockRule({
        id: 'rule1',
        conditions: {
          ifThen: true,
          conditions: [{ id: '1', attribute: 'width_ft', operator: '>', value: 12 }],
        },
      }),
      createMockRule({
        id: 'rule2',
        conditions: {
          ifThen: true,
          conditions: [{ id: '2', attribute: 'width_ft', operator: '>', value: 14 }],
        },
      }),
    ];
    
    const overlaps = findConditionOverlaps(rules);
    
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].overlappingAttributes).toContain('width_ft');
  });

  it('returns empty when conditions do not overlap', () => {
    const rules = [
      createMockRule({
        id: 'rule1',
        conditions: { minWidthFt: 12, maxWidthFt: 14 },
      }),
      createMockRule({
        id: 'rule2',
        conditions: { minHeightFt: 14 },
      }),
    ];
    
    const overlaps = findConditionOverlaps(rules);
    expect(overlaps).toHaveLength(0);
  });
});

describe('findRequirementContradictions', () => {
  it('detects contradictory escort requirements', () => {
    const rules = [
      createMockRule({
        id: 'rule1',
        requirementType: 'escort',
        requirement: { front_escorts: 1, rear_escorts: 0 } as EscortRequirement,
      }),
      createMockRule({
        id: 'rule2',
        requirementType: 'escort',
        requirement: { front_escorts: 2, rear_escorts: 1 } as EscortRequirement,
      }),
    ];
    
    const contradictions = findRequirementContradictions(rules);
    
    expect(contradictions).toHaveLength(1);
    expect(contradictions[0].type).toBe('requirement_contradiction');
    expect(contradictions[0].contradictions).toBeDefined();
    expect(contradictions[0].contradictions?.some(c => c.field === 'front_escorts')).toBe(true);
  });

  it('detects contradictory utility notice periods', () => {
    const rules = [
      createMockRule({
        id: 'rule1',
        requirementType: 'utility_notice',
        requirement: { notice_hours: 24, utility_types: ['wire'] } as UtilityNoticeRequirement,
      }),
      createMockRule({
        id: 'rule2',
        requirementType: 'utility_notice',
        requirement: { notice_hours: 48, utility_types: ['pole'] } as UtilityNoticeRequirement,
      }),
    ];
    
    const contradictions = findRequirementContradictions(rules);
    
    expect(contradictions).toHaveLength(1);
    expect(contradictions[0].contradictions?.some(c => c.field === 'notice_hours')).toBe(true);
  });

  it('returns empty when requirements do not contradict', () => {
    const rules = [
      createMockRule({
        id: 'rule1',
        requirementType: 'escort',
        requirement: { front_escorts: 1, rear_escorts: 0 } as EscortRequirement,
      }),
      createMockRule({
        id: 'rule2',
        requirementType: 'escort',
        requirement: { front_escorts: 1, rear_escorts: 0 } as EscortRequirement,
      }),
    ];
    
    const contradictions = findRequirementContradictions(rules);
    expect(contradictions).toHaveLength(0);
  });
});

describe('resolveConflict', () => {
  it('resolves by priority - higher priority wins', () => {
    const rules = [
      createMockRule({ id: 'rule1', priority: 10 }),
      createMockRule({ id: 'rule2', priority: 20 }),
      createMockRule({ id: 'rule3', priority: 5 }),
    ];
    
    const conflictGroup = {
      id: 'conflict1',
      type: 'category_overlap' as const,
      rules,
      severity: 'warning' as const,
      description: 'Test conflict',
    };
    
    const winner = resolveConflict(conflictGroup, 'priority');
    expect(winner?.id).toBe('rule2');
  });

  it('resolves by specificity - more conditions wins', () => {
    const rules = [
      createMockRule({
        id: 'rule1',
        conditions: {
          ifThen: true,
          conditions: [{ id: '1', attribute: 'width_ft', operator: '>', value: 12 }],
        },
      }),
      createMockRule({
        id: 'rule2',
        conditions: {
          ifThen: true,
          conditions: [
            { id: '1', attribute: 'width_ft', operator: '>', value: 12 },
            { id: '2', attribute: 'height_ft', operator: '>', value: 14 },
          ],
        },
      }),
    ];
    
    const conflictGroup = {
      id: 'conflict1',
      type: 'category_overlap' as const,
      rules,
      severity: 'warning' as const,
      description: 'Test conflict',
    };
    
    const winner = resolveConflict(conflictGroup, 'specificity');
    expect(winner?.id).toBe('rule2');
  });

  it('resolves by manual selection', () => {
    const rules = [
      createMockRule({ id: 'rule1' }),
      createMockRule({ id: 'rule2' }),
    ];
    
    const conflictGroup = {
      id: 'conflict1',
      type: 'category_overlap' as const,
      rules,
      severity: 'warning' as const,
      description: 'Test conflict',
    };
    
    const winner = resolveConflict(conflictGroup, 'manual', 'rule2');
    expect(winner?.id).toBe('rule2');
  });

  it('returns null for cumulative strategy', () => {
    const rules = [
      createMockRule({ id: 'rule1' }),
      createMockRule({ id: 'rule2' }),
    ];
    
    const conflictGroup = {
      id: 'conflict1',
      type: 'category_overlap' as const,
      rules,
      severity: 'warning' as const,
      description: 'Test conflict',
    };
    
    const winner = resolveConflict(conflictGroup, 'cumulative');
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

