"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Shield, Settings, FileText, Save, Sparkles, Car, Gauge, Clock, MapPin, Zap, Ruler, Send, Loader2, AlertTriangle, Trash2, Scale } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type PolicyType, POLICY_TYPES } from "@/lib/compliance";
import { type ConditionDisplayItem } from "@/lib/condition-statement";

export interface PolicyCenterNodeData {
  id?: string;
  /** Convex document ID for existing policies */
  _id?: string;
  policyType: PolicyType;
  name: string;
  description?: string;
  status?: "draft" | "published" | "archived";
  baseOutput?: Record<string, any>;
  /** Whether this is a new unsaved policy */
  isNew?: boolean;
  /** Jurisdiction ID for new policies */
  jurisdictionId?: string;
  /** Callback to save new policy */
  onSave?: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Callback to publish a draft policy */
  onPublish?: () => void;
  /** Whether publish is in progress */
  isPublishing?: boolean;
  /** Number of connected conditions */
  conditionCount?: number;
  /** How to combine conditions:
   * - AND: all must match
   * - OR: any must match
   * - ACCUMULATE: evaluate each independently, merge outputs
   */
  conditionLogic?: "AND" | "OR" | "ACCUMULATE";
  /** Whether this published policy has pending (unsaved) changes */
  hasPendingChanges?: boolean;
  /** Callback to save changes as a new draft version */
  onSaveAsDraft?: () => void;
  /** Whether "save as draft" is in progress */
  isSavingAsDraft?: boolean;
  /** Callback to delete a draft policy */
  onDelete?: () => void;
  /** Whether delete is in progress */
  isDeleting?: boolean;
  /** Auto-generated statement of conditions (read-only display) */
  conditionStatement?: string;
  /** Auto-generated output statement (read-only display) */
  outputStatement?: string;
  /** Structured condition items for rendering with citations */
  conditionItems?: ConditionDisplayItem[];
  /** Connector between conditions (AND/OR) for display */
  conditionConnector?: string;
}

// Policy icon mapping
const POLICY_ICONS: Record<PolicyType, React.ElementType> = {
  escort: Car,
  permit: FileText,
  speed: Gauge,
  hours: Clock,
  route: MapPin,
  utility: Zap,
  dimension: Ruler,
};

export const PolicyCenterNode = memo(function PolicyCenterNode({
  id,
  data,
  selected,
}: NodeProps & { data: PolicyCenterNodeData }) {
  const { setNodes } = useReactFlow();
  const [expandedSection, setExpandedSection] = useState<string | null>("details");

  const policyConfig = POLICY_TYPES.find((p) => p.key === data.policyType);
  const PolicyIcon = POLICY_ICONS[data.policyType] || Shield;
  const isNew = data.isNew === true;

  // Update node data
  const updateData = useCallback((updates: Partial<PolicyCenterNodeData>) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [id, setNodes]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const hasPendingChanges = data.status === "published" && data.hasPendingChanges;

  return (
    <div
      className={`
        w-[400px] rounded-xl border-2 shadow-lg transition-all
        ${isNew
          ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-dashed"
          : hasPendingChanges
            ? "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50"
            : "bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50"
        }
        ${hasPendingChanges
          ? "border-orange-400 shadow-xl ring-2 ring-orange-200"
          : selected
            ? isNew
              ? "border-amber-500 shadow-xl ring-2 ring-amber-200"
              : "border-indigo-600 shadow-xl ring-2 ring-indigo-200"
            : isNew
              ? "border-amber-400"
              : "border-indigo-400"
        }
      `}
    >
      {/* Multiple Input Handles on the left (for multiple outputs) */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-4 !h-4 !border-2 !border-white ${isNew ? "!bg-gradient-to-br !from-amber-500 !to-orange-500" : "!bg-gradient-to-br !from-indigo-500 !to-purple-500"}`}
        id="input"
        style={{ top: "50%" }}
      />

      {/* New Policy Indicator */}
      {isNew && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0.5 shadow-md">
            <Sparkles className="h-3 w-3 mr-1" />
            New Policy
          </Badge>
        </div>
      )}

      {/* Pending Changes Indicator */}
      {hasPendingChanges && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-orange-500 text-white text-[10px] px-2 py-0.5 shadow-md animate-pulse">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending Changes
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className={`px-4 py-3 border-b rounded-t-xl ${isNew ? "border-amber-200 bg-gradient-to-r from-amber-100/50 to-orange-100/50" : "border-indigo-200 bg-gradient-to-r from-indigo-100/50 to-purple-100/50"}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg text-white shadow-md ${isNew ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`}>
            <PolicyIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={data.name}
              onChange={(e) => updateData({ name: e.target.value })}
              className="h-7 text-base font-semibold bg-transparent border-none shadow-none p-0 focus-visible:ring-0"
              placeholder="Policy Name..."
            />
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 bg-white/80 text-gray-700 border-gray-300"
              >
                {policyConfig?.label || data.policyType}
              </Badge>
              {!isNew && (
                <Badge
                  variant={data.status === "published" ? "default" : "secondary"}
                  className={`text-[10px] h-4 px-1.5 ${
                    data.status === "published"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {data.status || "draft"}
                </Badge>
              )}
              {data.conditionCount !== undefined && (
                <Badge
                  variant="outline"
                  className={`text-[10px] h-4 px-1.5 ${
                    data.conditionCount === 0
                      ? "bg-amber-100 text-amber-700 border-amber-400"
                      : "bg-white/80 text-gray-700 border-gray-300"
                  }`}
                >
                  {data.conditionCount === 0
                    ? "No conditions"
                    : `${data.conditionCount} condition${data.conditionCount !== 1 ? "s" : ""}`
                  }
                </Badge>
              )}
              {/* AND/OR/ACCUMULATE Logic Toggle - show when conditions exist */}
              {(data.conditionCount ?? 0) > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateData({ conditionLogic: "AND" });
                        }}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                          (data.conditionLogic || "AND") === "AND"
                            ? "bg-white shadow-sm text-blue-700"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        AND
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateData({ conditionLogic: "OR" });
                        }}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                          data.conditionLogic === "OR"
                            ? "bg-white shadow-sm text-orange-700"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        OR
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateData({ conditionLogic: "ACCUMULATE" });
                        }}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                          data.conditionLogic === "ACCUMULATE"
                            ? "bg-white shadow-sm text-green-700"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        ACC
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="text-xs space-y-1">
                      <p><strong>AND:</strong> All conditions must match</p>
                      <p><strong>OR:</strong> Any condition can match</p>
                      <p><strong>ACC:</strong> Accumulate - evaluate each condition independently, merge all triggered outputs</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="flex flex-col">
        {/* Details Section */}
        <div className="border-b border-indigo-100">
          <button
            onClick={() => toggleSection("details")}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50/50"
          >
            {expandedSection === "details" ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            <FileText className="h-4 w-4 text-indigo-500" />
            Details
          </button>
          {expandedSection === "details" && (
            <div className="px-4 pb-3 space-y-3">
              {/* Output Statement (Auto-generated, read-only) - shown above conditions */}
              {data.outputStatement && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    Then
                  </label>
                  <div className="p-3 rounded-lg border text-sm leading-relaxed bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-gray-700">
                    {data.outputStatement}
                  </div>
                </div>
              )}
              {/* Statement of Conditions (Auto-generated with citation fields) */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Statement of Conditions
                </label>
                <div className={`
                  rounded-lg border
                  ${data.conditionCount === 0
                    ? "bg-amber-50 border-amber-200"
                    : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200"
                  }
                `}>
                  {data.conditionItems && data.conditionItems.length > 0 ? (
                    <div className="divide-y divide-indigo-100">
                      {data.conditionItems.map((item, index) => (
                        <div key={index}>
                          {/* Show connector between conditions */}
                          {index > 0 && (
                            <div className="px-3 py-1 bg-indigo-100/50 text-center">
                              <span className="text-xs font-semibold text-indigo-600">
                                {data.conditionConnector || "AND"}
                              </span>
                            </div>
                          )}
                          <div className="p-2 flex items-start gap-2">
                            {/* Condition phrase */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-700 flex items-center gap-1.5">
                                <span className="text-indigo-400">•</span>
                                <span className="font-medium">{item.phrase}</span>
                              </div>
                            </div>
                            {/* Citation fields */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    <Scale className="h-3 w-3 text-gray-400 mr-1" />
                                    <Input
                                      value={item.sourceRegulation || ""}
                                      placeholder="Cite law..."
                                      className="h-6 w-[100px] text-[10px] px-1.5 bg-white/80"
                                      readOnly
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>Law citation (e.g., 67 Pa. Code § 179.3)</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 text-gray-400 mr-1" />
                                    <Input
                                      type="date"
                                      value={item.expiryDate || ""}
                                      className="h-6 w-[95px] text-[10px] px-1.5 bg-white/80"
                                      readOnly
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>Expiry date (optional)</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-sm text-amber-700 italic">
                      No conditions connected
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <Select
                  value={data.status || "draft"}
                  onValueChange={(value: "draft" | "published" | "archived") =>
                    updateData({ status: value })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Base Output Section */}
        <div>
          <button
            onClick={() => toggleSection("output")}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50/50"
          >
            {expandedSection === "output" ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            <Settings className="h-4 w-4 text-green-500" />
            Default Output
          </button>
          {expandedSection === "output" && (
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-500 mb-2">
                Fallback values when no conditions match
              </p>
              {Object.entries(data.baseOutput || {}).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(data.baseOutput || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-mono">{key}</span>
                      <span className="text-gray-800">{JSON.stringify(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No default output configured
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={`px-4 py-2 border-t rounded-b-xl ${
        isNew
          ? "border-amber-200 bg-amber-50/50"
          : hasPendingChanges
            ? "border-orange-200 bg-orange-50/50"
            : "border-indigo-200 bg-indigo-50/50"
      }`}>
        {isNew ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <Sparkles className="h-3 w-3" />
              <span>Unsaved Policy</span>
            </div>
            {data.onSave && (
              <Button
                size="sm"
                className="h-7 text-xs bg-amber-500 hover:bg-amber-600"
                onClick={data.onSave}
                disabled={data.isSaving}
              >
                <Save className="h-3 w-3 mr-1" />
                {data.isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        ) : hasPendingChanges ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              <span>Unsaved Changes</span>
            </div>
            {data.onSaveAsDraft && (
              <Button
                size="sm"
                className="h-7 text-xs bg-orange-500 hover:bg-orange-600"
                onClick={data.onSaveAsDraft}
                disabled={data.isSavingAsDraft}
              >
                {data.isSavingAsDraft ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3 w-3 mr-1" />
                )}
                {data.isSavingAsDraft ? "Saving..." : "Save as Draft"}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-indigo-600">
              <Shield className="h-3 w-3" />
              <span>Policy</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Delete button for draft and published policies */}
              {data.onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 w-7 p-0 ${
                        data.status === "published"
                          ? "text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                          : "text-red-500 hover:text-red-700 hover:bg-red-50"
                      }`}
                      onClick={data.onDelete}
                      disabled={data.isDeleting}
                    >
                      {data.isDeleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{data.status === "published" ? "Delete published policy" : "Delete draft policy"}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {/* Publish button for draft policies */}
              {data.status === "draft" && data.onPublish && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        className={`h-7 text-xs ${
                          data.conditionCount === 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                        onClick={data.onPublish}
                        disabled={data.isPublishing || data.conditionCount === 0}
                      >
                        {data.isPublishing ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : data.conditionCount === 0 ? (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        ) : (
                          <Send className="h-3 w-3 mr-1" />
                        )}
                        {data.isPublishing ? "Publishing..." : "Publish"}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {data.conditionCount === 0 && (
                    <TooltipContent>
                      <p>Add conditions before publishing</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export { PolicyCenterNode as default };

