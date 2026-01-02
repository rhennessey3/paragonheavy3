"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  X,
  AlertTriangle,
  ArrowLeftRight,
  FileText,
  MapPin,
  Settings,
  CheckCircle2,
  XCircle,
  Info,
  GitBranch,
  Layers,
  ArrowRight,
  Ban,
  Copy,
} from "lucide-react";
import {
  type MatchedRule,
  type ConflictGroup,
  type ConflictSeverity,
  type RuleConditionClause,
  type EscortRequirement,
  type UtilityNoticeRequirement,
  type PermitRequirement,
  type RuleRelationshipType,
  isEscortRequirement,
  isUtilityNoticeRequirement,
  isPermitRequirement,
  RULE_ATTRIBUTES,
  getCategoryInfo,
  RULE_RELATIONSHIP_TYPES,
} from "@/lib/compliance";

interface ConflictComparisonPanelProps {
  /** The rule being viewed (the one user clicked on) */
  sourceRule: {
    _id: string;
    title: string;
    category: string;
    jurisdictionName?: string;
    jurisdictionId?: string;
    summary: string;
    conditions?: any;
  };
  /** Conflict groups this rule is involved in */
  conflictGroups: ConflictGroup[];
  /** Callback when panel is closed */
  onClose: () => void;
  /** Callback when user wants to view a specific rule */
  onViewRule?: (ruleId: string) => void;
  /** Callback to open the relationship graph */
  onOpenGraph?: () => void;
  /** Callback to create a relationship between rules */
  onCreateRelationship?: (
    sourceRuleId: string,
    targetRuleId: string,
    relationshipType: RuleRelationshipType,
    notes?: string
  ) => void;
}

const SeverityBadge = ({ severity }: { severity: ConflictSeverity }) => {
  const styles = {
    critical: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <Badge className={`${styles[severity]} border`} variant="outline">
      {severity === "critical" && "Critical"}
      {severity === "warning" && "Warning"}
      {severity === "info" && "Info"}
    </Badge>
  );
};

const ConflictTypeBadge = ({ type }: { type: ConflictGroup["type"] }) => {
  const labels = {
    category_overlap: "Category Overlap",
    condition_overlap: "Condition Overlap",
    requirement_contradiction: "Requirement Conflict",
  };

  const colors = {
    category_overlap: "bg-purple-100 text-purple-700",
    condition_overlap: "bg-cyan-100 text-cyan-700",
    requirement_contradiction: "bg-red-100 text-red-700",
  };

  return (
    <Badge className={colors[type]} variant="secondary">
      {labels[type]}
    </Badge>
  );
};

/** Format a condition clause for display */
function formatCondition(clause: RuleConditionClause): string {
  const attr = RULE_ATTRIBUTES.find((a) => a.value === clause.attribute);
  const attrLabel = attr?.label || clause.attribute;
  const unit = attr?.unit ? ` ${attr.unit}` : "";

  const opLabels: Record<string, string> = {
    ">": ">",
    ">=": "≥",
    "<": "<",
    "<=": "≤",
    "=": "=",
    "!=": "≠",
    between: "between",
    in: "in",
    not_in: "not in",
  };

  const op = opLabels[clause.operator] || clause.operator;

  if (clause.operator === "between" && Array.isArray(clause.value)) {
    return `${attrLabel} ${op} ${clause.value[0]}${unit} and ${clause.value[1]}${unit}`;
  }

  if ((clause.operator === "in" || clause.operator === "not_in") && Array.isArray(clause.value)) {
    return `${attrLabel} ${op} [${clause.value.join(", ")}]`;
  }

  return `${attrLabel} ${op} ${clause.value}${unit}`;
}

/** Display conditions from a rule */
function ConditionsDisplay({ conditions }: { conditions: any }) {
  if (!conditions) {
    return <p className="text-sm text-gray-500 italic">No conditions defined</p>;
  }

  // Handle ifThen style conditions
  if (conditions.ifThen && Array.isArray(conditions.conditions)) {
    return (
      <div className="space-y-1">
        {conditions.conditions.map((clause: RuleConditionClause, idx: number) => (
          <div
            key={clause.id || idx}
            className="text-sm bg-gray-100 px-2 py-1 rounded flex items-center gap-2"
          >
            <span className="text-gray-600">IF</span>
            <span className="font-medium text-gray-800">{formatCondition(clause)}</span>
          </div>
        ))}
      </div>
    );
  }

  // Handle legacy conditions
  const legacyConditions: string[] = [];
  if (conditions.minWidthFt !== undefined)
    legacyConditions.push(`Width ≥ ${conditions.minWidthFt} ft`);
  if (conditions.maxWidthFt !== undefined)
    legacyConditions.push(`Width ≤ ${conditions.maxWidthFt} ft`);
  if (conditions.minHeightFt !== undefined)
    legacyConditions.push(`Height ≥ ${conditions.minHeightFt} ft`);
  if (conditions.maxHeightFt !== undefined)
    legacyConditions.push(`Height ≤ ${conditions.maxHeightFt} ft`);
  if (conditions.minLengthFt !== undefined)
    legacyConditions.push(`Length ≥ ${conditions.minLengthFt} ft`);
  if (conditions.maxLengthFt !== undefined)
    legacyConditions.push(`Length ≤ ${conditions.maxLengthFt} ft`);
  if (conditions.maxGrossWeightLbs !== undefined)
    legacyConditions.push(`Weight ≤ ${conditions.maxGrossWeightLbs.toLocaleString()} lbs`);

  if (legacyConditions.length === 0) {
    return <p className="text-sm text-gray-500 italic">No conditions defined</p>;
  }

  return (
    <div className="space-y-1">
      {legacyConditions.map((cond, idx) => (
        <div key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded">
          {cond}
        </div>
      ))}
    </div>
  );
}

/** Display requirement from a rule */
function RequirementDisplay({ conditions }: { conditions: any }) {
  if (!conditions) return null;

  const requirement = conditions.requirement;
  const requirementType = conditions.requirementType;

  if (!requirement) {
    // Check for legacy escort requirements
    if (conditions.escortsRequired) {
      const escorts = conditions.escortsRequired;
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Escort Requirement:</div>
          <div className="text-sm bg-blue-50 p-2 rounded border border-blue-200">
            {escorts.front && <div>✓ Front escort required</div>}
            {escorts.rear && <div>✓ Rear escort required</div>}
            {escorts.heightPole && <div>✓ Height pole required</div>}
            {escorts.numberOfEscorts && <div>Total: {escorts.numberOfEscorts} escorts</div>}
          </div>
        </div>
      );
    }
    return null;
  }

  if (requirementType === "escort" || isEscortRequirement(requirement)) {
    const escort = requirement as EscortRequirement;
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Escort Requirement:</div>
        <div className="text-sm bg-blue-50 p-2 rounded border border-blue-200 space-y-1">
          <div className="flex justify-between">
            <span>Front escorts:</span>
            <span className="font-medium">{escort.front_escorts || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Rear escorts:</span>
            <span className="font-medium">{escort.rear_escorts || 0}</span>
          </div>
          {escort.front_has_height_pole && (
            <div className="text-blue-700">✓ Front height pole required</div>
          )}
          {escort.rear_has_height_pole && (
            <div className="text-blue-700">✓ Rear height pole required</div>
          )}
          {escort.notes && <div className="text-xs text-gray-600 mt-1">{escort.notes}</div>}
        </div>
      </div>
    );
  }

  if (requirementType === "utility_notice" || isUtilityNoticeRequirement(requirement)) {
    const notice = requirement as UtilityNoticeRequirement;
    const hours = notice.notice_hours;
    let timeStr = `${hours} hours`;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      if (hours % 24 === 0) {
        timeStr = days === 1 ? "1 day" : `${days} days`;
      }
    }
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Utility Notice Requirement:</div>
        <div className="text-sm bg-amber-50 p-2 rounded border border-amber-200 space-y-1">
          <div className="flex justify-between">
            <span>Notice period:</span>
            <span className="font-medium">{timeStr}</span>
          </div>
          {notice.utility_types.length > 0 && (
            <div className="flex justify-between">
              <span>Utility types:</span>
              <span className="font-medium">{notice.utility_types.join(", ")}</span>
            </div>
          )}
          {notice.notes && <div className="text-xs text-gray-600 mt-1">{notice.notes}</div>}
        </div>
      </div>
    );
  }

  if (requirementType === "permit_requirement" || isPermitRequirement(requirement)) {
    const permit = requirement as PermitRequirement;
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Permit Requirement:</div>
        <div className="text-sm bg-green-50 p-2 rounded border border-green-200 space-y-1">
          <div className="flex justify-between">
            <span>Permit type:</span>
            <span className="font-medium">{permit.permit_type_label || permit.permit_type_key}</span>
          </div>
          {(permit.estimated_cost_min !== undefined || permit.estimated_cost_max !== undefined) && (
            <div className="flex justify-between">
              <span>Estimated cost:</span>
              <span className="font-medium">
                ${permit.estimated_cost_min || 0}
                {permit.estimated_cost_max && ` - $${permit.estimated_cost_max}`}
              </span>
            </div>
          )}
          {permit.processing_time_days && (
            <div className="flex justify-between">
              <span>Processing time:</span>
              <span className="font-medium">{permit.processing_time_days} days</span>
            </div>
          )}
          {permit.notes && <div className="text-xs text-gray-600 mt-1">{permit.notes}</div>}
        </div>
      </div>
    );
  }

  return null;
}

/** Single rule card for comparison */
function RuleCard({
  rule,
  isSource = false,
  onViewRule,
}: {
  rule: { _id?: string; id?: string; title: string; category: string; jurisdictionName?: string; summary: string; conditions?: any };
  isSource?: boolean;
  onViewRule?: (ruleId: string) => void;
}) {
  const ruleId = rule._id || rule.id;
  const categoryInfo = getCategoryInfo(rule.category as any);

  return (
    <Card className={`p-4 ${isSource ? "border-blue-300 bg-blue-50/30" : "border-gray-200"}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isSource && (
                <Badge className="bg-blue-100 text-blue-700 text-xs">Current Rule</Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {categoryInfo.label}
              </Badge>
            </div>
            <h4 className="font-medium text-gray-900">{rule.title}</h4>
          </div>
          {!isSource && ruleId && onViewRule && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewRule(ruleId)}
              className="text-blue-600 text-xs"
            >
              View
            </Button>
          )}
        </div>

        {/* Jurisdiction */}
        {rule.jurisdictionName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-3 w-3" />
            <span>{rule.jurisdictionName}</span>
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-gray-600">{rule.summary}</p>

        {/* Conditions */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-3 w-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase">Conditions</span>
          </div>
          <ConditionsDisplay conditions={rule.conditions} />
        </div>

        {/* Requirement */}
        <RequirementDisplay conditions={rule.conditions} />
      </div>
    </Card>
  );
}

/** Comparison view showing differences between two rules */
function ComparisonDiff({
  sourceRule,
  conflictingRule,
  conflict,
}: {
  sourceRule: any;
  conflictingRule: MatchedRule;
  conflict: ConflictGroup;
}) {
  // Find specific contradictions between these two rules
  const relevantContradictions = conflict.contradictions?.filter(
    (c) =>
      c.values.some((v) => v.ruleId === sourceRule._id || v.ruleId === sourceRule.id) &&
      c.values.some((v) => v.ruleId === conflictingRule.id)
  );

  return (
    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <span className="font-medium text-amber-800">Conflict Details</span>
      </div>

      {conflict.type === "category_overlap" && (
        <div className="text-sm text-amber-700">
          <p className="mb-2">
            Both rules belong to the same category and may trigger simultaneously for the same load.
          </p>
          <p className="text-xs text-amber-600">{conflict.details}</p>
        </div>
      )}

      {conflict.type === "condition_overlap" && (
        <div className="text-sm text-amber-700">
          <p className="mb-2">These rules have overlapping conditions:</p>
          {conflict.overlappingAttributes && (
            <div className="flex flex-wrap gap-1 mb-2">
              {conflict.overlappingAttributes.map((attr) => {
                const attrConfig = RULE_ATTRIBUTES.find((a) => a.value === attr);
                return (
                  <Badge key={attr} variant="outline" className="text-xs bg-white">
                    {attrConfig?.label || attr}
                  </Badge>
                );
              })}
            </div>
          )}
          <p className="text-xs text-amber-600">{conflict.details}</p>
        </div>
      )}

      {conflict.type === "requirement_contradiction" && relevantContradictions && (
        <div className="text-sm text-amber-700 space-y-2">
          <p>These rules have conflicting requirements:</p>
          {relevantContradictions.map((contradiction, idx) => (
            <div key={idx} className="bg-white p-2 rounded border border-amber-200">
              <span className="font-medium">{contradiction.field}:</span>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {contradiction.values.map((v, vIdx) => (
                  <span key={vIdx} className="inline-flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {String(v.value)}
                    </Badge>
                    <span className="text-xs text-gray-500">({v.ruleTitle})</span>
                    {vIdx < contradiction.values.length - 1 && (
                      <span className="text-amber-600 mx-1">vs</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {conflict.suggestedResolution && (
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-medium text-blue-800">Suggested Resolution:</span>
              <p className="text-sm text-blue-700">{conflict.suggestedResolution}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Quick action buttons for creating rule relationships */
function QuickActions({
  sourceRule,
  conflictingRule,
  onCreateRelationship,
}: {
  sourceRule: { _id: string; title: string };
  conflictingRule: MatchedRule;
  onCreateRelationship?: (
    sourceRuleId: string,
    targetRuleId: string,
    relationshipType: RuleRelationshipType,
    notes?: string
  ) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  if (!onCreateRelationship) return null;

  const actions = [
    {
      type: "co_apply" as RuleRelationshipType,
      label: "Mark as Co-apply (Additive)",
      description: "Both rules should stack together",
      icon: <Layers className="h-4 w-4" />,
      color: "text-green-600 hover:bg-green-50",
    },
    {
      type: "overrides" as RuleRelationshipType,
      label: `${sourceRule.title} overrides ${conflictingRule.title}`,
      description: "Source rule takes precedence",
      icon: <ArrowRight className="h-4 w-4" />,
      color: "text-blue-600 hover:bg-blue-50",
    },
    {
      type: "exception_of" as RuleRelationshipType,
      label: `${conflictingRule.title} is exception to ${sourceRule.title}`,
      description: "Target is a more specific exception",
      icon: <GitBranch className="h-4 w-4" />,
      color: "text-amber-600 hover:bg-amber-50",
    },
    {
      type: "redundant" as RuleRelationshipType,
      label: "Mark as Redundant",
      description: "One rule makes the other unnecessary",
      icon: <Copy className="h-4 w-4" />,
      color: "text-gray-600 hover:bg-gray-50",
    },
    {
      type: "mutually_exclusive" as RuleRelationshipType,
      label: "Mark as Mutually Exclusive",
      description: "These rules cannot both apply",
      icon: <Ban className="h-4 w-4" />,
      color: "text-red-600 hover:bg-red-50",
    },
  ];

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <button
        onClick={() => setShowActions(!showActions)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <GitBranch className="h-4 w-4" />
        Quick Actions
        <Badge variant="outline" className="text-[10px] ml-1">
          Define Relationship
        </Badge>
      </button>

      {showActions && (
        <div className="mt-3 space-y-2">
          {actions.map((action) => (
            <button
              key={action.type}
              onClick={() => {
                onCreateRelationship(
                  sourceRule._id,
                  conflictingRule.id,
                  action.type
                );
                setShowActions(false);
              }}
              className={`w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 transition-colors ${action.color}`}
            >
              {action.icon}
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{action.label}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConflictComparisonPanel({
  sourceRule,
  conflictGroups,
  onClose,
  onViewRule,
  onOpenGraph,
  onCreateRelationship,
}: ConflictComparisonPanelProps) {
  // Get all unique conflicting rules from all conflict groups
  const conflictingRules = useMemo(() => {
    const uniqueRules = new Map<string, { rule: MatchedRule; conflicts: ConflictGroup[] }>();

    for (const group of conflictGroups) {
      for (const rule of group.rules) {
        // Skip the source rule itself
        if (rule.id === sourceRule._id) continue;

        const existing = uniqueRules.get(rule.id);
        if (existing) {
          existing.conflicts.push(group);
        } else {
          uniqueRules.set(rule.id, { rule, conflicts: [group] });
        }
      }
    }

    return Array.from(uniqueRules.values());
  }, [conflictGroups, sourceRule._id]);

  const totalConflicts = conflictGroups.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Conflict Comparison
              </h2>
              <p className="text-sm text-gray-600">
                {totalConflicts} {totalConflicts === 1 ? "conflict" : "conflicts"} involving{" "}
                <span className="font-medium">{sourceRule.title}</span>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {conflictingRules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
              <p>No conflicting rules found in the conflict groups.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {conflictingRules.map(({ rule: conflictingRule, conflicts }) => (
                <div key={conflictingRule.id} className="space-y-4">
                  {/* Conflict header */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <div className="flex items-center gap-2">
                      {conflicts.map((c) => (
                        <div key={c.id} className="flex items-center gap-1">
                          <SeverityBadge severity={c.severity} />
                          <ConflictTypeBadge type={c.type} />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Side by side comparison */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Source rule */}
                    <RuleCard
                      rule={sourceRule}
                      isSource={true}
                      onViewRule={onViewRule}
                    />

                    {/* Conflicting rule */}
                    <RuleCard
                      rule={{
                        id: conflictingRule.id,
                        title: conflictingRule.title,
                        category: conflictingRule.category,
                        jurisdictionName: conflictingRule.jurisdictionName,
                        summary: conflictingRule.summary,
                        conditions: conflictingRule.conditions,
                      }}
                      onViewRule={onViewRule}
                    />
                  </div>

                  {/* Conflict details */}
                  {conflicts.map((conflict) => (
                    <ComparisonDiff
                      key={conflict.id}
                      sourceRule={sourceRule}
                      conflictingRule={conflictingRule}
                      conflict={conflict}
                    />
                  ))}

                  {/* Quick Actions for creating relationships */}
                  <QuickActions
                    sourceRule={sourceRule}
                    conflictingRule={conflictingRule}
                    onCreateRelationship={onCreateRelationship}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          <div>
            {onOpenGraph && (
              <Button
                variant="outline"
                onClick={onOpenGraph}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Open in Relationship Graph
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onViewRule && (
              <Button
                onClick={() => onViewRule(sourceRule._id)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Full Rule Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



