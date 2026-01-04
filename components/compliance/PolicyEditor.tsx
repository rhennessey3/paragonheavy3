"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Plus,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Settings,
  FileText,
  Car,
  Gauge,
  Clock,
  MapPin,
  Zap,
  Ruler,
  AlertTriangle,
} from "lucide-react";

import { ConditionRow } from "./ConditionRow";
import { EscortRequirementEditor } from "./EscortRequirementEditor";
import { UtilityNoticeRequirementEditor } from "./UtilityNoticeRequirementEditor";
import { PermitRequirementEditor } from "./PermitRequirementEditor";
import {
  type PolicyType,
  type PolicyCondition,
  type CompliancePolicy,
  type PolicyOutput,
  type MergeStrategy,
  type EscortRequirement,
  type PermitRequirement,
  type UtilityNoticeRequirement,
  type LogicalOperator,
  POLICY_TYPES,
  MERGE_STRATEGIES,
  RULE_ATTRIBUTES,
  getOperatorsForAttribute,
  createEmptyPolicyCondition,
  createDefaultBaseOutput,
  getDefaultMergeStrategiesForPolicyType,
} from "@/lib/compliance";

interface PolicyEditorProps {
  policy?: Partial<CompliancePolicy>;
  policyType: PolicyType;
  onSave: (policy: Partial<CompliancePolicy>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const policyIcons: Record<PolicyType, React.ReactNode> = {
  escort: <Car className="h-4 w-4" />,
  permit: <FileText className="h-4 w-4" />,
  speed: <Gauge className="h-4 w-4" />,
  hours: <Clock className="h-4 w-4" />,
  route: <MapPin className="h-4 w-4" />,
  utility: <Zap className="h-4 w-4" />,
  dimension: <Ruler className="h-4 w-4" />,
};

export function PolicyEditor({
  policy,
  policyType,
  onSave,
  onCancel,
  onDelete,
}: PolicyEditorProps) {
  const [name, setName] = useState(policy?.name || "");
  const [description, setDescription] = useState(policy?.description || "");
  const [conditions, setConditions] = useState<PolicyCondition[]>(
    policy?.conditions || []
  );
  const [baseOutput, setBaseOutput] = useState<PolicyOutput>(
    policy?.baseOutput || createDefaultBaseOutput(policyType)
  );
  const [mergeStrategies, setMergeStrategies] = useState<Record<string, MergeStrategy>>(
    policy?.mergeStrategies || getDefaultMergeStrategiesForPolicyType(policyType)
  );
  const [conditionLogic, setConditionLogic] = useState<LogicalOperator>(
    policy?.conditionLogic || "AND"
  );
  const [activeTab, setActiveTab] = useState<"conditions" | "output" | "merge">("conditions");
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);

  const policyTypeConfig = POLICY_TYPES.find(p => p.key === policyType);

  // Add a new condition
  const addCondition = useCallback(() => {
    const newCondition = createEmptyPolicyCondition();
    setConditions([...conditions, newCondition]);
    setExpandedCondition(newCondition.id);
  }, [conditions]);

  // Update a condition
  const updateCondition = useCallback((index: number, updated: PolicyCondition) => {
    const newConditions = [...conditions];
    newConditions[index] = updated;
    setConditions(newConditions);
  }, [conditions]);

  // Remove a condition
  const removeCondition = useCallback((index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  }, [conditions]);

  // Update merge strategy for a field
  const updateMergeStrategy = useCallback((field: string, strategy: MergeStrategy) => {
    setMergeStrategies({ ...mergeStrategies, [field]: strategy });
  }, [mergeStrategies]);

  // Handle save
  const handleSave = useCallback(() => {
    onSave({
      ...policy,
      policyType,
      name,
      description,
      conditions,
      conditionLogic,
      baseOutput,
      mergeStrategies,
    });
  }, [policy, policyType, name, description, conditions, conditionLogic, baseOutput, mergeStrategies, onSave]);

  // Render output editor based on policy type
  const renderOutputEditor = () => {
    switch (policyType) {
      case "escort":
        return (
          <EscortRequirementEditor
            requirement={baseOutput as EscortRequirement}
            onChange={(req) => setBaseOutput(req)}
          />
        );
      case "permit":
        return (
          <PermitRequirementEditor
            requirement={baseOutput as PermitRequirement}
            onChange={(req) => setBaseOutput(req)}
          />
        );
      case "utility":
        return (
          <UtilityNoticeRequirementEditor
            requirement={baseOutput as UtilityNoticeRequirement}
            onChange={(req) => setBaseOutput(req)}
          />
        );
      case "speed":
        return (
          <div className="space-y-4">
            <div>
              <Label>Maximum Speed (MPH)</Label>
              <Input
                type="number"
                value={(baseOutput as any).max_speed_mph || ""}
                onChange={(e) => setBaseOutput({ ...baseOutput, max_speed_mph: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="e.g., 45"
              />
            </div>
            <div>
              <Label>Minimum Speed (MPH)</Label>
              <Input
                type="number"
                value={(baseOutput as any).min_speed_mph || ""}
                onChange={(e) => setBaseOutput({ ...baseOutput, min_speed_mph: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="e.g., 15"
              />
            </div>
          </div>
        );
      case "hours":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Allowed Start Time</Label>
                <Input
                  type="time"
                  value={(baseOutput as any).allowed_start_time || ""}
                  onChange={(e) => setBaseOutput({ ...baseOutput, allowed_start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Allowed End Time</Label>
                <Input
                  type="time"
                  value={(baseOutput as any).allowed_end_time || ""}
                  onChange={(e) => setBaseOutput({ ...baseOutput, allowed_end_time: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
      case "dimension":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Width (ft)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={(baseOutput as any).max_width_ft || ""}
                  onChange={(e) => setBaseOutput({ ...baseOutput, max_width_ft: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label>Max Height (ft)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={(baseOutput as any).max_height_ft || ""}
                  onChange={(e) => setBaseOutput({ ...baseOutput, max_height_ft: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Length (ft)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={(baseOutput as any).max_length_ft || ""}
                  onChange={(e) => setBaseOutput({ ...baseOutput, max_length_ft: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label>Max Weight (lbs)</Label>
                <Input
                  type="number"
                  value={(baseOutput as any).max_weight_lbs || ""}
                  onChange={(e) => setBaseOutput({ ...baseOutput, max_weight_lbs: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-gray-500 text-sm">
            Output editor for {policyType} coming soon
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            {policyIcons[policyType]}
          </div>
          <div>
            <h2 className="font-semibold text-sm">
              {policy?._id ? "Edit Policy" : "New Policy"}
            </h2>
            <p className="text-xs text-gray-500">{policyTypeConfig?.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onDelete && policy?._id && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Policy Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g., ${policyTypeConfig?.label}`}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this policy does..."
              rows={2}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="conditions" className="flex-1">
              <GitBranch className="h-3 w-3 mr-1" />
              Conditions ({conditions.length})
            </TabsTrigger>
            <TabsTrigger value="output" className="flex-1">
              <FileText className="h-3 w-3 mr-1" />
              Output
            </TabsTrigger>
            <TabsTrigger value="merge" className="flex-1">
              <Settings className="h-3 w-3 mr-1" />
              Merge
            </TabsTrigger>
          </TabsList>

          {/* Conditions Tab */}
          <TabsContent value="conditions" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500">
                  Match
                </p>
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setConditionLogic("AND")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      conditionLogic === "AND"
                        ? "bg-white shadow-sm text-blue-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    ALL (AND)
                  </button>
                  <button
                    onClick={() => setConditionLogic("OR")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      conditionLogic === "OR"
                        ? "bg-white shadow-sm text-orange-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    ANY (OR)
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  conditions
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                className="text-blue-600"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Condition
              </Button>
            </div>

            {conditions.length === 0 ? (
              <Card className="p-6 text-center border-dashed border-amber-300 bg-amber-50">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-amber-700 text-sm font-medium mb-1">No conditions defined</p>
                <p className="text-xs text-amber-600 mb-3">
                  Policies without conditions cannot be published. Add at least one condition to make this policy functional.
                </p>
                <Button variant="outline" size="sm" onClick={addCondition}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add First Condition
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <div key={condition.id}>
                    {index > 0 && (
                      <div className="flex justify-center py-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            conditionLogic === "OR"
                              ? "border-orange-300 text-orange-600 bg-orange-50"
                              : "border-blue-300 text-blue-600 bg-blue-50"
                          }`}
                        >
                          {conditionLogic}
                        </Badge>
                      </div>
                    )}
                  <Card
                    className={`transition-all ${
                      expandedCondition === condition.id ? "ring-2 ring-blue-200" : ""
                    }`}
                  >
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer"
                      onClick={() => setExpandedCondition(
                        expandedCondition === condition.id ? null : condition.id
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">
                          {RULE_ATTRIBUTES.find(a => a.value === condition.attribute)?.label || condition.attribute}
                        </span>
                        <span className="text-gray-400 text-sm">{condition.operator}</span>
                        <span className="text-sm font-medium">{String(condition.value)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {condition.sourceRegulation && (
                          <Badge variant="secondary" className="text-[9px]">
                            {condition.sourceRegulation}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCondition(index);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {expandedCondition === condition.id ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedCondition === condition.id && (
                      <div className="px-3 pb-3 border-t pt-3 space-y-3">
                        <ConditionRow
                          condition={{
                            id: condition.id,
                            attribute: condition.attribute,
                            operator: condition.operator,
                            value: condition.value,
                          }}
                          onChange={(updated) => updateCondition(index, {
                            ...condition,
                            ...updated,
                          })}
                          onRemove={() => removeCondition(index)}
                          showAndLabel={false}
                        />
                        <div>
                          <Label className="text-xs">Source Regulation</Label>
                          <Input
                            value={condition.sourceRegulation || ""}
                            onChange={(e) => updateCondition(index, {
                              ...condition,
                              sourceRegulation: e.target.value,
                            })}
                            placeholder="e.g., PA DOT 67.1.2"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Notes</Label>
                          <Textarea
                            value={condition.notes || ""}
                            onChange={(e) => updateCondition(index, {
                              ...condition,
                              notes: e.target.value,
                            })}
                            placeholder="Additional context..."
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Output Tab */}
          <TabsContent value="output" className="space-y-3 mt-3">
            <p className="text-xs text-gray-500">
              Define the output when conditions match
            </p>
            <Card className="p-4">
              {renderOutputEditor()}
            </Card>
          </TabsContent>

          {/* Merge Strategies Tab */}
          <TabsContent value="merge" className="space-y-3 mt-3">
            <p className="text-xs text-gray-500">
              How to combine outputs when multiple conditions match
            </p>
            <Card className="p-4 space-y-3">
              {Object.entries(mergeStrategies).map(([field, strategy]) => (
                <div key={field} className="flex items-center justify-between">
                  <Label className="text-sm capitalize">
                    {field.replace(/_/g, " ")}
                  </Label>
                  <Select
                    value={strategy}
                    onValueChange={(value) => updateMergeStrategy(field, value as MergeStrategy)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MERGE_STRATEGIES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {Object.keys(mergeStrategies).length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  No merge strategies configured for this policy type
                </p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim()}>
          <Save className="h-4 w-4 mr-1" />
          Save Policy
        </Button>
      </div>
    </div>
  );
}



