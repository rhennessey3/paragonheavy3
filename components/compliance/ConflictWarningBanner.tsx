"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  Layers,
  AlertCircle,
  CheckCircle2,
  Car,
  Clock,
} from "lucide-react";
import {
  type ConflictAnalysis,
  type ConflictGroup,
  type ConflictSeverity,
  type EscortRequirement,
  type UtilityNoticeRequirement,
} from "@/lib/compliance";

interface ConflictWarningBannerProps {
  conflicts: ConflictAnalysis;
  jurisdictionName?: string;
  onViewDetails?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

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

const ConflictTypeLabel = ({ type }: { type: ConflictGroup["type"] }) => {
  const labels = {
    category_overlap: "Category Overlap",
    condition_overlap: "Condition Overlap",
    requirement_contradiction: "Requirement Conflict",
  };
  return <span className="text-xs text-gray-500">{labels[type]}</span>;
};

/**
 * Display auto-resolved escort requirements
 */
const ResolvedEscortDisplay = ({ escort }: { escort: EscortRequirement }) => {
  const parts: string[] = [];
  
  if (escort.front_escorts > 0) {
    parts.push(`${escort.front_escorts} front escort${escort.front_escorts > 1 ? 's' : ''}`);
  }
  if (escort.rear_escorts > 0) {
    parts.push(`${escort.rear_escorts} rear escort${escort.rear_escorts > 1 ? 's' : ''}`);
  }
  
  const extras: string[] = [];
  if (escort.front_has_height_pole) extras.push('front height pole');
  if (escort.rear_has_height_pole) extras.push('rear height pole');
  
  return (
    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
      <Car className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-green-800">
            Effective Escort Requirement
          </span>
          <Badge className="bg-green-100 text-green-700 text-xs">Auto-resolved</Badge>
        </div>
        <p className="text-sm text-green-700">
          {parts.length > 0 ? parts.join(', ') : 'No escorts required'}
          {extras.length > 0 && ` (with ${extras.join(', ')})`}
        </p>
        {escort.notes && (
          <p className="text-xs text-green-600 mt-1">{escort.notes}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Display auto-resolved utility notice requirements
 */
const ResolvedUtilityNoticeDisplay = ({ notice }: { notice: UtilityNoticeRequirement }) => {
  const hours = notice.notice_hours;
  let timeStr = `${hours} hours`;
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    if (hours % 24 === 0) {
      timeStr = days === 1 ? '1 day' : `${days} days`;
    }
  }
  
  return (
    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
      <Clock className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-green-800">
            Effective Utility Notice
          </span>
          <Badge className="bg-green-100 text-green-700 text-xs">Auto-resolved</Badge>
        </div>
        <p className="text-sm text-green-700">
          {timeStr} notice required
          {notice.utility_types.length > 0 && ` for ${notice.utility_types.join(', ')}`}
        </p>
        {notice.notes && (
          <p className="text-xs text-green-600 mt-1">{notice.notes}</p>
        )}
      </div>
    </div>
  );
};

export function ConflictWarningBanner({
  conflicts,
  jurisdictionName,
  onViewDetails,
  onDismiss,
  compact = false,
}: ConflictWarningBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const hasResolvedRequirements = conflicts.resolvedRequirements && 
    (conflicts.resolvedRequirements.escort || conflicts.resolvedRequirements.utilityNotice);

  // Show nothing if no conflicts AND no resolved requirements
  if (!conflicts.hasConflicts && !hasResolvedRequirements) {
    return null;
  }

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Count conflicts by severity
  const severityCounts = {
    critical: conflicts.groups.filter((g) => g.severity === "critical").length,
    warning: conflicts.groups.filter((g) => g.severity === "warning").length,
    info: conflicts.groups.filter((g) => g.severity === "info").length,
  };

  const hasCritical = severityCounts.critical > 0;
  const hasWarning = severityCounts.warning > 0;

  const bannerColor = hasCritical
    ? "bg-red-50 border-red-200"
    : hasWarning
    ? "bg-amber-50 border-amber-200"
    : "bg-blue-50 border-blue-200";

  const iconColor = hasCritical
    ? "text-red-600"
    : hasWarning
    ? "text-amber-600"
    : "text-blue-600";

  if (compact) {
    // If only resolved requirements (no conflicts), show a success-style compact banner
    if (!conflicts.hasConflicts && hasResolvedRequirements) {
      return (
        <div className="px-3 py-2 rounded-lg border bg-green-50 border-green-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Requirements auto-resolved
            </span>
          </div>
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetails}
              className="text-xs h-7 text-green-700"
            >
              View Details
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div
        className={`px-3 py-2 rounded-lg border ${bannerColor} flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 ${iconColor}`} />
          <span className="text-sm font-medium">
            {conflicts.groups.length} potential{" "}
            {conflicts.groups.length === 1 ? "conflict" : "conflicts"} detected
          </span>
        </div>
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="text-xs h-7"
          >
            View Details
          </Button>
        )}
      </div>
    );
  }

  // If only resolved requirements (no conflicts), show a success card
  if (!conflicts.hasConflicts && hasResolvedRequirements) {
    return (
      <Card className="overflow-hidden border bg-green-50 border-green-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Requirements Auto-Resolved
                  {jurisdictionName && (
                    <span className="font-normal text-gray-500">
                      {" "}
                      for {jurisdictionName}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  Multiple rules combined using cumulative max strategy
                </p>
              </div>
            </div>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Resolved requirements */}
          <div className="space-y-2">
            {conflicts.resolvedRequirements?.escort && (
              <ResolvedEscortDisplay escort={conflicts.resolvedRequirements.escort} />
            )}
            {conflicts.resolvedRequirements?.utilityNotice && (
              <ResolvedUtilityNoticeDisplay notice={conflicts.resolvedRequirements.utilityNotice} />
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden border ${bannerColor}`}>
      {/* Header */}
      <div className="p-4 border-b border-inherit">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white ${iconColor}`}>
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Rule Conflicts Detected
                {jurisdictionName && (
                  <span className="font-normal text-gray-500">
                    {" "}
                    in {jurisdictionName}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                {conflicts.totalConflictingRules} rules involved in{" "}
                {conflicts.groups.length}{" "}
                {conflicts.groups.length === 1 ? "conflict" : "conflicts"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Severity summary badges */}
            {severityCounts.critical > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {severityCounts.critical} Critical
              </Badge>
            )}
            {severityCounts.warning > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800">
                {severityCounts.warning} Warning
              </Badge>
            )}
            {severityCounts.info > 0 && (
              <Badge className="bg-blue-100 text-blue-800">
                {severityCounts.info} Info
              </Badge>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Resolved requirements summary (when conflicts exist but also have resolved) */}
        {hasResolvedRequirements && (
          <div className="mt-3 space-y-2">
            {conflicts.resolvedRequirements?.escort && (
              <ResolvedEscortDisplay escort={conflicts.resolvedRequirements.escort} />
            )}
            {conflicts.resolvedRequirements?.utilityNotice && (
              <ResolvedUtilityNoticeDisplay notice={conflicts.resolvedRequirements.utilityNotice} />
            )}
          </div>
        )}

        {/* Expand/collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-gray-600"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronRight className="h-4 w-4 mr-1" />
              Show Details
            </>
          )}
        </Button>
      </div>

      {/* Expanded conflict details */}
      {isExpanded && (
        <div className="p-4 max-h-96 overflow-y-auto bg-white/50">
          <div className="space-y-3">
            {conflicts.groups.map((conflict) => {
              const isGroupExpanded = expandedGroups.has(conflict.id);
              return (
                <div
                  key={conflict.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-50 text-left"
                    onClick={() => toggleGroup(conflict.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isGroupExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-800">
                        {conflict.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ConflictTypeLabel type={conflict.type} />
                      <ConflictSeverityBadge severity={conflict.severity} />
                    </div>
                  </button>

                  {isGroupExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mt-3 mb-3">
                        {conflict.details}
                      </p>

                      {/* Conflicting rules list */}
                      <div className="space-y-1 mb-3">
                        <span className="text-xs font-medium text-gray-700">
                          Conflicting Rules:
                        </span>
                        {conflict.rules.map((rule) => (
                          <div
                            key={rule.id}
                            className="text-sm bg-gray-50 rounded px-3 py-2 flex items-center justify-between"
                          >
                            <span className="text-gray-800 font-medium">
                              {rule.title}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {rule.jurisdictionName && (
                                <span>{rule.jurisdictionName}</span>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {rule.category.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Contradictions details */}
                      {conflict.contradictions &&
                        conflict.contradictions.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs font-medium text-gray-700">
                              Contradicting Values:
                            </span>
                            {conflict.contradictions.map((c, i) => (
                              <div
                                key={i}
                                className="mt-1 text-sm flex items-center gap-2 flex-wrap"
                              >
                                <span className="text-gray-600 font-medium">
                                  {c.field}:
                                </span>
                                {c.values.map((v, j) => (
                                  <span
                                    key={j}
                                    className="inline-flex items-center gap-1"
                                  >
                                    <Badge
                                      variant="outline"
                                      className="text-xs py-0"
                                    >
                                      {String(v.value)}
                                    </Badge>
                                    <span className="text-gray-400 text-xs">
                                      ({v.ruleTitle})
                                    </span>
                                    {j < c.values.length - 1 && (
                                      <span className="text-gray-400 mx-1">
                                        vs
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Suggested resolution */}
                      {conflict.suggestedResolution && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <span className="text-xs font-medium text-blue-800">
                                Suggested Resolution:
                              </span>
                              <p className="text-sm text-blue-700 mt-1">
                                {conflict.suggestedResolution}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Simple conflict indicator badge for use in rule lists
 */
export function ConflictIndicatorBadge({
  hasConflict,
  conflictCount,
  severity = "warning",
  onClick,
}: {
  hasConflict: boolean;
  conflictCount?: number;
  severity?: ConflictSeverity;
  onClick?: () => void;
}) {
  if (!hasConflict) return null;

  const colors = {
    critical: "bg-red-100 text-red-700 hover:bg-red-200",
    warning: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    info: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  };

  return (
    <Badge
      className={`${colors[severity]} cursor-pointer transition-colors`}
      onClick={onClick}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      {conflictCount && conflictCount > 1
        ? `${conflictCount} conflicts`
        : "Conflict"}
    </Badge>
  );
}

