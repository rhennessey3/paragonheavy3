"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  X, 
  FileText, 
  Scale, 
  Clock, 
  Car, 
  Route,
  Gauge,
  Calendar,
  ExternalLink,
  Flag,
  AlertCircle,
  Pencil
} from "lucide-react";
import { 
  getAttributeConfig,
  type RuleConditionClause,
  type EscortRequirement,
} from "@/lib/compliance";

interface RuleDetailPanelProps {
  ruleId: Id<"complianceRules">;
  onClose: () => void;
  onEdit?: () => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  dimension_limit: { label: "Dimension Limit", icon: Scale, color: "bg-purple-100 text-purple-700" },
  escort_requirement: { label: "Escort Requirement", icon: Car, color: "bg-orange-100 text-orange-700" },
  time_restriction: { label: "Time Restriction", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  permit_requirement: { label: "Permit Required", icon: FileText, color: "bg-blue-100 text-blue-700" },
  speed_limit: { label: "Speed Limit", icon: Gauge, color: "bg-red-100 text-red-700" },
  route_restriction: { label: "Route Restriction", icon: Route, color: "bg-green-100 text-green-700" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_review: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-700",
};

function formatOperator(op: string): string {
  const operators: Record<string, string> = {
    '>': 'greater than',
    '>=': 'greater than or equal to',
    '<': 'less than',
    '<=': 'less than or equal to',
    '=': 'equals',
    '!=': 'not equals',
    'between': 'between',
    'in': 'is one of',
  };
  return operators[op] || op;
}

function formatValue(value: any, attribute: string): string {
  const config = getAttributeConfig(attribute as any);
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === 'number') {
      return `${value[0]} and ${value[1]}${config?.unit ? ` ${config.unit}` : ''}`;
    }
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return `${value}${config?.unit ? ` ${config.unit}` : ''}`;
}

export function RuleDetailPanel({ ruleId, onClose, onEdit }: RuleDetailPanelProps) {
  const rule = useQuery(api.compliance.getRuleById, { ruleId });

  if (!rule) {
    return (
      <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-gray-200 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[rule.category];
  const CategoryIcon = categoryConfig?.icon || FileText;
  
  // Check if this is an IF/THEN rule
  const isIfThenRule = rule.conditions?.ifThen === true;
  const conditions: RuleConditionClause[] = isIfThenRule ? rule.conditions.conditions : [];
  const requirement: EscortRequirement | null = isIfThenRule ? rule.conditions.requirement : null;

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${categoryConfig?.color || 'bg-gray-100'}`}>
              <CategoryIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">{rule.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={STATUS_COLORS[rule.status]}>
                  {rule.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {categoryConfig?.label || rule.category}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Summary</h3>
            <p className="text-gray-900">{rule.summary}</p>
          </div>

          {/* Effective Dates */}
          {(rule.effectiveFrom || rule.effectiveTo) && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Effective Period</h3>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                {rule.effectiveFrom && (
                  <span>From {new Date(rule.effectiveFrom).toLocaleDateString()}</span>
                )}
                {rule.effectiveFrom && rule.effectiveTo && <span>-</span>}
                {rule.effectiveTo && (
                  <span>Until {new Date(rule.effectiveTo).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          )}

          {/* IF/THEN Conditions Display */}
          {isIfThenRule && conditions.length > 0 && (
            <Card className="p-4 border-blue-200 bg-blue-50/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                  IF
                </span>
                <span className="text-sm text-gray-500">Conditions</span>
              </div>
              <div className="space-y-2">
                {conditions.map((condition, index) => {
                  const attrConfig = getAttributeConfig(condition.attribute);
                  return (
                    <div key={condition.id || index} className="flex items-center gap-2 text-sm">
                      {index > 0 && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">AND</span>
                      )}
                      <span className="font-medium text-gray-700">{attrConfig?.label || condition.attribute}</span>
                      <span className="text-gray-500">{formatOperator(condition.operator)}</span>
                      <span className="font-medium text-gray-900">{formatValue(condition.value, condition.attribute)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* THEN Requirements Display */}
          {isIfThenRule && requirement && (
            <Card className="p-4 border-green-200 bg-green-50/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  THEN
                </span>
                <span className="text-sm text-gray-500">Requirements</span>
              </div>
              <div className="space-y-3">
                {/* Front Escorts */}
                {requirement.front_escorts > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <Car className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {requirement.front_escorts} Front Escort{requirement.front_escorts > 1 ? 's' : ''} (Lead)
                      </div>
                      {requirement.front_has_height_pole && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Flag className="h-3 w-3" />
                          Height pole required
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rear Escorts */}
                {requirement.rear_escorts > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <Car className="h-5 w-5 text-orange-600 rotate-180" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {requirement.rear_escorts} Rear Escort{requirement.rear_escorts > 1 ? 's' : ''} (Follow)
                      </div>
                      {requirement.rear_has_height_pole && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Flag className="h-3 w-3" />
                          Height pole required
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No escorts */}
                {requirement.front_escorts === 0 && requirement.rear_escorts === 0 && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>No escort requirements specified</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Notes - outside THEN block */}
          {isIfThenRule && requirement?.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-gray-700 italic">"{requirement.notes}"</p>
            </div>
          )}

          {/* Source Reference - at the bottom */}
          {rule.source && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Source Reference</h3>
              <a 
                href={rule.source.startsWith('http') ? rule.source : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                {rule.source}
                {rule.source.startsWith('http') && <ExternalLink className="h-3 w-3" />}
              </a>
            </div>
          )}

          {/* Legacy conditions display */}
          {!isIfThenRule && rule.conditions && Object.keys(rule.conditions).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Conditions</h3>
              <Card className="p-4">
                <pre className="text-xs text-gray-700 overflow-auto">
                  {JSON.stringify(rule.conditions, null, 2)}
                </pre>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created {new Date(rule.createdAt).toLocaleDateString()}</span>
          <span>Updated {new Date(rule.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
