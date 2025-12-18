"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Layers,
  Filter,
  RefreshCw,
  X,
} from "lucide-react";
import {
  type ConflictAnalysis,
  type ConflictGroup,
  type ConflictSeverity,
} from "@/lib/compliance";
import { ConflictResolutionPanel } from "./ConflictResolutionPanel";

interface ConflictDashboardProps {
  conflicts: ConflictAnalysis;
  jurisdictionName?: string;
  onRefresh?: () => void;
  onResolveConflict?: (resolution: {
    conflictId: string;
    strategy: string;
    winningRuleId?: string;
    resolvedRequirement?: any;
  }) => void;
}

const SEVERITY_COLORS: Record<ConflictSeverity, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
};

const CONFLICT_TYPE_LABELS = {
  category_overlap: "Category Overlap",
  condition_overlap: "Condition Overlap",
  requirement_contradiction: "Requirement Conflict",
};

export function ConflictDashboard({
  conflicts,
  jurisdictionName,
  onRefresh,
  onResolveConflict,
}: ConflictDashboardProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(
    new Set()
  );
  const [resolvingConflict, setResolvingConflict] =
    useState<ConflictGroup | null>(null);

  // Filter conflicts
  const filteredConflicts = useMemo(() => {
    let filtered = [...conflicts.groups];

    if (filterSeverity !== "all") {
      filtered = filtered.filter((c) => c.severity === filterSeverity);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((c) => c.type === filterType);
    }

    return filtered;
  }, [conflicts.groups, filterSeverity, filterType]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: conflicts.groups.length,
      critical: conflicts.groups.filter((c) => c.severity === "critical")
        .length,
      warning: conflicts.groups.filter((c) => c.severity === "warning").length,
      info: conflicts.groups.filter((c) => c.severity === "info").length,
      byType: {
        category_overlap: conflicts.groups.filter(
          (c) => c.type === "category_overlap"
        ).length,
        condition_overlap: conflicts.groups.filter(
          (c) => c.type === "condition_overlap"
        ).length,
        requirement_contradiction: conflicts.groups.filter(
          (c) => c.type === "requirement_contradiction"
        ).length,
      },
    };
  }, [conflicts.groups]);

  const toggleConflict = (id: string) => {
    setExpandedConflicts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleResolve = (resolution: {
    conflictId: string;
    strategy: string;
    winningRuleId?: string;
    resolvedRequirement?: any;
  }) => {
    if (onResolveConflict) {
      onResolveConflict(resolution);
    }
    setResolvingConflict(null);
  };

  // If resolving a specific conflict, show the resolution panel
  if (resolvingConflict) {
    return (
      <ConflictResolutionPanel
        conflict={resolvingConflict}
        onResolve={handleResolve}
        onCancel={() => setResolvingConflict(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-600" />
            Conflict Dashboard
            {jurisdictionName && (
              <span className="font-normal text-gray-500 text-base">
                for {jurisdictionName}
              </span>
            )}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {conflicts.totalConflictingRules} rules involved in{" "}
            {conflicts.groups.length} conflicts
          </p>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Conflicts</div>
        </Card>
        <Card className={`p-4 ${stats.critical > 0 ? "bg-red-50" : ""}`}>
          <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
          <div className="text-sm text-red-600">Critical</div>
        </Card>
        <Card className={`p-4 ${stats.warning > 0 ? "bg-amber-50" : ""}`}>
          <div className="text-2xl font-bold text-amber-700">{stats.warning}</div>
          <div className="text-sm text-amber-600">Warning</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-700">{stats.info}</div>
          <div className="text-sm text-blue-600">Info</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="category_overlap">Category Overlap</SelectItem>
              <SelectItem value="condition_overlap">
                Condition Overlap
              </SelectItem>
              <SelectItem value="requirement_contradiction">
                Requirement Conflict
              </SelectItem>
            </SelectContent>
          </Select>
          {(filterSeverity !== "all" || filterType !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterSeverity("all");
                setFilterType("all");
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Conflict List */}
      {filteredConflicts.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {conflicts.groups.length === 0
              ? "No Conflicts Detected"
              : "No Conflicts Match Filters"}
          </h3>
          <p className="text-gray-500">
            {conflicts.groups.length === 0
              ? "All rules are compatible with each other."
              : "Try adjusting your filters to see more conflicts."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredConflicts.map((conflict) => {
            const isExpanded = expandedConflicts.has(conflict.id);
            return (
              <Card
                key={conflict.id}
                className={`overflow-hidden border ${
                  SEVERITY_COLORS[conflict.severity].split(" ")[2]
                }`}
              >
                {/* Conflict Header */}
                <button
                  className={`w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 ${
                    isExpanded ? "border-b border-gray-200" : ""
                  }`}
                  onClick={() => toggleConflict(conflict.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {conflict.description}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {conflict.rules.length} rules •{" "}
                        {CONFLICT_TYPE_LABELS[conflict.type]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={SEVERITY_COLORS[conflict.severity]}
                      variant="secondary"
                    >
                      {conflict.severity}
                    </Badge>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-4">
                      {conflict.details}
                    </p>

                    {/* Conflicting Rules */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Conflicting Rules:
                      </h4>
                      <div className="space-y-2">
                        {conflict.rules.map((rule) => (
                          <div
                            key={rule.id}
                            className="p-3 bg-white rounded border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900">
                                {rule.title}
                              </div>
                              <div className="flex items-center gap-2">
                                {rule.jurisdictionName && (
                                  <span className="text-sm text-gray-500">
                                    {rule.jurisdictionName}
                                  </span>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {rule.category.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {rule.summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contradictions */}
                    {conflict.contradictions &&
                      conflict.contradictions.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Contradicting Values:
                          </h4>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            {conflict.contradictions.map((c, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span className="font-medium text-gray-700">
                                  {c.field}:
                                </span>
                                {c.values.map((v, j) => (
                                  <span
                                    key={j}
                                    className="inline-flex items-center gap-1"
                                  >
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {String(v.value)}
                                    </Badge>
                                    <span className="text-gray-400">
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
                        </div>
                      )}

                    {/* Suggested Resolution */}
                    {conflict.suggestedResolution && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                        <div className="text-sm font-medium text-blue-800 mb-1">
                          Suggested Resolution:
                        </div>
                        <div className="text-sm text-blue-700">
                          {conflict.suggestedResolution}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end">
                      <Button
                        onClick={() => setResolvingConflict(conflict)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Resolve Conflict
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary by Type */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Conflicts by Type
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {stats.byType.category_overlap}
            </div>
            <div className="text-sm text-gray-500">Category Overlaps</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {stats.byType.condition_overlap}
            </div>
            <div className="text-sm text-gray-500">Condition Overlaps</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {stats.byType.requirement_contradiction}
            </div>
            <div className="text-sm text-gray-500">Requirement Conflicts</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

