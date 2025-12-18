"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight,
  Shield,
  Clock,
  FileText,
  Users,
  X,
  AlertCircle,
  Layers
} from "lucide-react";
import { 
  type ComplianceResponse, 
  type RuleSeverity,
  type ConflictGroup,
  type ConflictSeverity,
  getCategoryInfo,
  formatEscortRequirements
} from "@/lib/compliance";

interface ComplianceRoutePanelProps {
  complianceData: ComplianceResponse | null;
  isLoading: boolean;
  onClose?: () => void;
}

const SeverityIcon = ({ severity }: { severity: RuleSeverity }) => {
  switch (severity) {
    case "prohibited":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "restriction":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "requires_permit":
      return <FileText className="h-4 w-4 text-orange-600" />;
    default:
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
  }
};

const SeverityBadge = ({ severity }: { severity: RuleSeverity }) => {
  const colors = {
    prohibited: "bg-red-100 text-red-800",
    restriction: "bg-yellow-100 text-yellow-800",
    requires_permit: "bg-orange-100 text-orange-800",
    info: "bg-blue-100 text-blue-800",
  };
  
  const labels = {
    prohibited: "Prohibited",
    restriction: "Restriction",
    requires_permit: "Permit Required",
    info: "Info",
  };

  return (
    <Badge className={colors[severity]} variant="secondary">
      {labels[severity]}
    </Badge>
  );
};

const ConflictSeverityBadge = ({ severity }: { severity: ConflictSeverity }) => {
  const colors = {
    critical: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
  };
  
  const labels = {
    critical: "Critical",
    warning: "Warning",
    info: "Info",
  };

  return (
    <Badge className={colors[severity]} variant="secondary">
      {labels[severity]}
    </Badge>
  );
};

const ConflictTypeLabel = ({ type }: { type: ConflictGroup['type'] }) => {
  const labels = {
    category_overlap: "Category Overlap",
    condition_overlap: "Condition Overlap",
    requirement_contradiction: "Requirement Conflict",
  };
  return <span className="text-xs text-gray-500">{labels[type]}</span>;
};

export function ComplianceRoutePanel({ 
  complianceData, 
  isLoading,
  onClose 
}: ComplianceRoutePanelProps) {
  const [expandedJurisdictions, setExpandedJurisdictions] = useState<Set<string>>(new Set());
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [showConflictPanel, setShowConflictPanel] = useState(false);

  const toggleJurisdiction = (id: string) => {
    setExpandedJurisdictions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleConflict = (id: string) => {
    setExpandedConflicts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Checking route compliance...</span>
        </div>
      </Card>
    );
  }

  if (!complianceData) {
    return null;
  }

  const { aggregatedSummary, jurisdictionRules } = complianceData;

  if (jurisdictionRules.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-gray-900">Route Compliance</span>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm">No special requirements detected for this load</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Route Compliance</span>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Jurisdictions:</span>
            <span className="font-medium">{aggregatedSummary.totalJurisdictions}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Rules:</span>
            <span className="font-medium">{aggregatedSummary.totalRules}</span>
          </div>
        </div>

        {/* Alert Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {aggregatedSummary.escortRequired && (
            <Badge className="bg-yellow-100 text-yellow-800">
              <Users className="h-3 w-3 mr-1" />
              Escort Required
            </Badge>
          )}
          {aggregatedSummary.curfewsDetected && (
            <Badge className="bg-orange-100 text-orange-800">
              <Clock className="h-3 w-3 mr-1" />
              Time Restrictions
            </Badge>
          )}
          {aggregatedSummary.permitsRequired.length > 0 && (
            <Badge className="bg-blue-100 text-blue-800">
              <FileText className="h-3 w-3 mr-1" />
              Permits: {aggregatedSummary.permitsRequired.join(", ")}
            </Badge>
          )}
          {aggregatedSummary.hasConflicts && (
            <Badge 
              className="bg-amber-100 text-amber-800 cursor-pointer hover:bg-amber-200"
              onClick={() => setShowConflictPanel(!showConflictPanel)}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {aggregatedSummary.totalConflicts} {aggregatedSummary.totalConflicts === 1 ? 'Conflict' : 'Conflicts'} Detected
            </Badge>
          )}
        </div>
      </div>

      {/* Conflict Warning Panel */}
      {showConflictPanel && complianceData.conflicts && complianceData.conflicts.hasConflicts && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-800">
                <Layers className="h-4 w-4" />
                <span className="font-medium text-sm">Rule Conflicts</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                onClick={() => setShowConflictPanel(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              Multiple rules have been triggered that may conflict with each other. Review the conflicts below to determine the appropriate requirements.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {complianceData.conflicts.groups.map((conflict) => {
                const isExpanded = expandedConflicts.has(conflict.id);
                return (
                  <div 
                    key={conflict.id} 
                    className="bg-white border border-amber-200 rounded-lg overflow-hidden"
                  >
                    <button
                      className="w-full p-2 flex items-center justify-between hover:bg-amber-50 text-left"
                      onClick={() => toggleConflict(conflict.id)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-amber-600" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-amber-600" />
                        )}
                        <span className="text-sm font-medium text-gray-800">
                          {conflict.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ConflictTypeLabel type={conflict.type} />
                        <ConflictSeverityBadge severity={conflict.severity} />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-amber-100">
                        <p className="text-xs text-gray-600 mt-2 mb-2">{conflict.details}</p>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-700">Conflicting Rules:</span>
                          {conflict.rules.map((rule) => (
                            <div 
                              key={rule.id}
                              className="text-xs bg-gray-50 rounded px-2 py-1 flex items-center justify-between"
                            >
                              <span className="text-gray-800">{rule.title}</span>
                              {rule.jurisdictionName && (
                                <span className="text-gray-500">{rule.jurisdictionName}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {conflict.suggestedResolution && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                            <strong>Suggested Resolution:</strong> {conflict.suggestedResolution}
                          </div>
                        )}
                        {conflict.contradictions && conflict.contradictions.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-700">Contradicting Values:</span>
                            {conflict.contradictions.map((c, i) => (
                              <div key={i} className="mt-1 text-xs">
                                <span className="text-gray-600">{c.field}: </span>
                                {c.values.map((v, j) => (
                                  <span key={j} className="inline-flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs py-0 h-5">
                                      {String(v.value)}
                                    </Badge>
                                    <span className="text-gray-500">({v.ruleTitle})</span>
                                    {j < c.values.length - 1 && <span className="mx-1">vs</span>}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Jurisdiction List */}
      <div className="max-h-80 overflow-y-auto">
        {jurisdictionRules.map((jr) => {
          const isExpanded = expandedJurisdictions.has(jr.jurisdictionId);
          const hasHighSeverity = jr.rules.some(
            (r) => r.severity === "prohibited" || r.severity === "restriction"
          );

          return (
            <div key={jr.jurisdictionId} className="border-b border-gray-100 last:border-0">
              <button
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 text-left"
                onClick={() => toggleJurisdiction(jr.jurisdictionId)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900">{jr.jurisdictionName}</span>
                  {hasHighSeverity && (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {jr.rules.length} {jr.rules.length === 1 ? "rule" : "rules"}
                </Badge>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {jr.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <SeverityIcon severity={rule.severity} />
                          <span className="font-medium text-sm text-gray-900">
                            {rule.title}
                          </span>
                        </div>
                        <SeverityBadge severity={rule.severity} />
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rule.summary}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryInfo(rule.category).label}
                        </Badge>
                        {rule.conditions.escortsRequired && (
                          <span>
                            Escorts: {formatEscortRequirements(rule.conditions.escortsRequired)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
