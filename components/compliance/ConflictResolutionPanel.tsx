"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Check,
  X,
  Scale,
  Layers,
  Trophy,
  Combine,
  UserCheck,
  ChevronRight,
  ChevronDown,
  Info,
} from "lucide-react";
import {
  type ConflictGroup,
  type MatchedRule,
  type ResolutionStrategy,
  type EscortRequirement,
  isEscortRequirement,
} from "@/lib/compliance";
import {
  resolveConflict,
  mergeEscortRequirements,
} from "@/lib/conflict-detection";

interface ConflictResolutionPanelProps {
  conflict: ConflictGroup;
  onResolve?: (resolution: {
    conflictId: string;
    strategy: ResolutionStrategy;
    winningRuleId?: string;
    resolvedRequirement?: any;
  }) => void;
  onCancel?: () => void;
}

const STRATEGY_INFO: Record<
  ResolutionStrategy,
  { label: string; description: string; icon: React.ElementType }
> = {
  priority: {
    label: "Priority-based",
    description: "Higher priority rule takes precedence",
    icon: Trophy,
  },
  specificity: {
    label: "Specificity-based",
    description: "Rule with more conditions (more specific) takes precedence",
    icon: Scale,
  },
  cumulative: {
    label: "Cumulative",
    description: "Combine requirements (e.g., take max escort count)",
    icon: Combine,
  },
  manual: {
    label: "Manual Selection",
    description: "Choose which rule should apply",
    icon: UserCheck,
  },
};

export function ConflictResolutionPanel({
  conflict,
  onResolve,
  onCancel,
}: ConflictResolutionPanelProps) {
  const [selectedStrategy, setSelectedStrategy] =
    useState<ResolutionStrategy>("priority");
  const [manualWinnerId, setManualWinnerId] = useState<string | null>(null);
  const [showRuleDetails, setShowRuleDetails] = useState<Set<string>>(
    new Set()
  );

  const toggleRuleDetails = (id: string) => {
    setShowRuleDetails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Calculate resolution preview based on selected strategy
  const resolutionPreview = (() => {
    if (selectedStrategy === "manual" && !manualWinnerId) {
      return null;
    }

    if (selectedStrategy === "cumulative") {
      // For cumulative, merge the requirements
      const escortRequirements = conflict.rules
        .filter(
          (r) => r.requirement && isEscortRequirement(r.requirement as any)
        )
        .map((r) => r.requirement as EscortRequirement);

      if (escortRequirements.length > 0) {
        return {
          type: "merged",
          result: mergeEscortRequirements(escortRequirements),
        };
      }
      return null;
    }

    const winner = resolveConflict(conflict, selectedStrategy, manualWinnerId || undefined);
    return winner ? { type: "winner", result: winner } : null;
  })();

  const handleResolve = () => {
    if (!onResolve) return;

    if (selectedStrategy === "cumulative" && resolutionPreview?.type === "merged") {
      onResolve({
        conflictId: conflict.id,
        strategy: selectedStrategy,
        resolvedRequirement: resolutionPreview.result,
      });
    } else if (resolutionPreview?.type === "winner") {
      onResolve({
        conflictId: conflict.id,
        strategy: selectedStrategy,
        winningRuleId: (resolutionPreview.result as MatchedRule).id,
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Resolve Conflict</h3>
              <p className="text-sm text-gray-600">{conflict.description}</p>
            </div>
          </div>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Conflicting Rules */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Conflicting Rules ({conflict.rules.length})
          </h4>
          <div className="space-y-2">
            {conflict.rules.map((rule) => {
              const isExpanded = showRuleDetails.has(rule.id);
              const isSelected =
                selectedStrategy === "manual" && manualWinnerId === rule.id;

              return (
                <div
                  key={rule.id}
                  className={`border rounded-lg overflow-hidden transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleRuleDetails(rule.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {rule.title}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          {rule.jurisdictionName && (
                            <span>{rule.jurisdictionName}</span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {rule.category.replace("_", " ")}
                          </Badge>
                          {rule.priority !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              Priority: {rule.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedStrategy === "manual" && (
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setManualWinnerId(isSelected ? null : rule.id);
                        }}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Selected
                          </>
                        ) : (
                          "Select"
                        )}
                      </Button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                      <p className="text-sm text-gray-600 mt-3 mb-2">
                        {rule.summary}
                      </p>
                      {rule.requirement && (
                        <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                          <span className="text-xs font-medium text-gray-500">
                            Requirement:
                          </span>
                          <pre className="text-xs text-gray-700 mt-1 overflow-auto">
                            {JSON.stringify(rule.requirement, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Resolution Strategy */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Resolution Strategy
          </h4>
          <RadioGroup
            value={selectedStrategy}
            onValueChange={(v) => {
              setSelectedStrategy(v as ResolutionStrategy);
              setManualWinnerId(null);
            }}
            className="space-y-2"
          >
            {(
              Object.entries(STRATEGY_INFO) as [
                ResolutionStrategy,
                typeof STRATEGY_INFO[ResolutionStrategy]
              ][]
            ).map(([strategy, info]) => {
              const Icon = info.icon;
              return (
                <div
                  key={strategy}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStrategy === strategy
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedStrategy(strategy);
                    setManualWinnerId(null);
                  }}
                >
                  <RadioGroupItem value={strategy} id={strategy} />
                  <Icon className="h-4 w-4 text-gray-500" />
                  <Label
                    htmlFor={strategy}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium text-gray-900">
                      {info.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {info.description}
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Resolution Preview */}
        {resolutionPreview && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">
                Resolution Preview
              </span>
            </div>
            {resolutionPreview.type === "winner" ? (
              <div className="text-sm text-green-700">
                <strong>Winning Rule:</strong>{" "}
                {(resolutionPreview.result as MatchedRule).title}
              </div>
            ) : (
              <div className="text-sm text-green-700">
                <strong>Merged Requirement:</strong>
                <pre className="text-xs mt-1 bg-white p-2 rounded border border-green-200 overflow-auto">
                  {JSON.stringify(resolutionPreview.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Manual selection hint */}
        {selectedStrategy === "manual" && !manualWinnerId && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <span className="text-sm text-blue-700">
              Click "Select" on one of the rules above to choose which rule
              should take precedence.
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleResolve}
          disabled={
            !resolutionPreview ||
            (selectedStrategy === "manual" && !manualWinnerId)
          }
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Check className="h-4 w-4 mr-1" />
          Apply Resolution
        </Button>
      </div>
    </Card>
  );
}




