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
  Pencil,
  Zap,
  Phone,
  Mail,
  Globe,
  DollarSign
} from "lucide-react";
import { 
  getAttributeConfig,
  type RuleConditionClause,
  type EscortRequirement,
  type UtilityNoticeRequirement,
  type PermitRequirement,
  isUtilityNoticeRequirement,
  isPermitRequirement,
  UTILITY_TYPES,
  COMMON_PERMIT_DOCUMENTS,
  APPLICATION_METHODS,
  formatUtilityNoticeRequirements,
  formatPermitRequirements,
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
  utility_notice: { label: "Utility Notice", icon: Zap, color: "bg-amber-100 text-amber-700" },
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
  const requirement: EscortRequirement | UtilityNoticeRequirement | PermitRequirement | null = isIfThenRule ? rule.conditions.requirement : null;
  const requirementType = rule.conditions?.requirementType || 
    (requirement && isUtilityNoticeRequirement(requirement) ? 'utility_notice' : 
     requirement && isPermitRequirement(requirement) ? 'permit_requirement' : 'escort');

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
              
              {requirementType === 'permit_requirement' && isPermitRequirement(requirement) ? (
                <div className="space-y-3">
                  {/* Permit Type */}
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {requirement.permit_type_label || requirement.permit_type_key}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatPermitRequirements(requirement)}
                      </div>
                    </div>
                  </div>

                  {/* Cost Information */}
                  {(requirement.estimated_cost_min !== undefined || requirement.estimated_cost_max !== undefined) && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div className="font-medium text-gray-900">Estimated Cost:</div>
                      </div>
                      <div className="ml-6 text-sm text-gray-700">
                        {requirement.estimated_cost_min === requirement.estimated_cost_max 
                          ? `$${requirement.estimated_cost_min}`
                          : `$${requirement.estimated_cost_min || 0} - $${requirement.estimated_cost_max || requirement.estimated_cost_min}`
                        }
                      </div>
                      {requirement.cost_notes && (
                        <div className="ml-6 text-xs text-gray-500 mt-1">{requirement.cost_notes}</div>
                      )}
                    </div>
                  )}

                  {/* Processing Information */}
                  {(requirement.processing_time_days || requirement.validity_period_days) && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div className="font-medium text-gray-900">Timeframes:</div>
                      </div>
                      <div className="ml-6 space-y-1 text-sm text-gray-700">
                        {requirement.processing_time_days && (
                          <div>Processing: {requirement.processing_time_days} day{requirement.processing_time_days > 1 ? 's' : ''}</div>
                        )}
                        {requirement.validity_period_days && (
                          <div>Valid for: {requirement.validity_period_days} day{requirement.validity_period_days > 1 ? 's' : ''}</div>
                        )}
                      </div>
                      {requirement.processing_notes && (
                        <div className="ml-6 text-xs text-gray-500 mt-1">{requirement.processing_notes}</div>
                      )}
                    </div>
                  )}

                  {/* Application Method & Contact */}
                  {(requirement.application_method || requirement.application_url || requirement.contact_name) && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="font-medium text-gray-900 mb-2">Application Information:</div>
                      <div className="space-y-1 ml-2">
                        {requirement.application_method && (
                          <div className="text-sm text-gray-700">
                            Method: {APPLICATION_METHODS.find(m => m.value === requirement.application_method)?.label || requirement.application_method}
                          </div>
                        )}
                        {requirement.application_url && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Globe className="h-3 w-3" />
                            <a href={requirement.application_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              Apply Online
                            </a>
                          </div>
                        )}
                        {requirement.contact_name && (
                          <div className="text-sm text-gray-700">{requirement.contact_name}</div>
                        )}
                        {requirement.contact_phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            {requirement.contact_phone}
                          </div>
                        )}
                        {requirement.contact_email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${requirement.contact_email}`} className="text-blue-600 hover:underline">
                              {requirement.contact_email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Required Documents */}
                  {requirement.required_documents && requirement.required_documents.length > 0 && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-indigo-600" />
                        <div className="font-medium text-gray-900">Required Documents:</div>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-6">
                        {requirement.required_documents.map(doc => {
                          const docLabel = COMMON_PERMIT_DOCUMENTS.find(d => d.value === doc)?.label || doc;
                          return (
                            <Badge key={doc} variant="outline" className="text-xs">
                              {docLabel}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Restrictions */}
                  {requirement.restrictions && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <div className="font-medium text-red-900">Restrictions:</div>
                      </div>
                      <div className="ml-6 text-sm text-red-800">{requirement.restrictions}</div>
                    </div>
                  )}
                </div>
              ) : requirementType === 'utility_notice' && isUtilityNoticeRequirement(requirement) ? (
                <div className="space-y-3">
                  {/* Notice Period */}
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {requirement.notice_hours} hours prior notice required
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatUtilityNoticeRequirements(requirement)}
                      </div>
                    </div>
                  </div>

                  {/* Utility Types */}
                  {requirement.utility_types && requirement.utility_types.length > 0 && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <div className="font-medium text-gray-900">Affected Utilities:</div>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-6">
                        {requirement.utility_types.map(type => {
                          const utilityLabel = UTILITY_TYPES.find(ut => ut.value === type)?.label || type;
                          return (
                            <Badge key={type} variant="outline" className="text-xs">
                              {utilityLabel}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {(requirement.contact_name || requirement.contact_phone || requirement.contact_email || requirement.contact_website) && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="font-medium text-gray-900 mb-2">Contact Information:</div>
                      <div className="space-y-1 ml-2">
                        {requirement.contact_name && (
                          <div className="text-sm text-gray-700">{requirement.contact_name}</div>
                        )}
                        {requirement.contact_phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            {requirement.contact_phone}
                          </div>
                        )}
                        {requirement.contact_email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${requirement.contact_email}`} className="text-blue-600 hover:underline">
                              {requirement.contact_email}
                            </a>
                          </div>
                        )}
                        {requirement.contact_website && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Globe className="h-3 w-3" />
                            <a href={requirement.contact_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {requirement.contact_website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cost Estimate */}
                  {requirement.estimated_cost_range && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">Estimated Cost:</div>
                        <div className="text-sm text-gray-600">{requirement.estimated_cost_range}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Front Escorts */}
                  {!isUtilityNoticeRequirement(requirement) && requirement.front_escorts > 0 && (
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
                  {!isUtilityNoticeRequirement(requirement) && requirement.rear_escorts > 0 && (
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
                  {!isUtilityNoticeRequirement(requirement) && requirement.front_escorts === 0 && requirement.rear_escorts === 0 && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>No escort requirements specified</span>
                    </div>
                  )}
                </div>
              )}
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
