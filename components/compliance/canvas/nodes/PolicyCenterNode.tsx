"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Shield, Settings, FileText, Merge, Save, Sparkles, Car, Gauge, Clock, MapPin, Zap, Ruler } from "lucide-react";
import { type PolicyType, POLICY_TYPES } from "@/lib/compliance";

export interface PolicyCenterNodeData {
  id?: string;
  /** Convex document ID for existing policies */
  _id?: string;
  policyType: PolicyType;
  name: string;
  description?: string;
  status?: "draft" | "published" | "archived";
  baseOutput?: Record<string, any>;
  mergeStrategies?: Record<string, string>;
  /** Whether this is a new unsaved policy */
  isNew?: boolean;
  /** Jurisdiction ID for new policies */
  jurisdictionId?: string;
  /** Callback to save new policy */
  onSave?: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Number of connected conditions */
  conditionCount?: number;
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

// Merge strategy options
const MERGE_STRATEGIES = [
  { value: "max", label: "Maximum" },
  { value: "min", label: "Minimum" },
  { value: "sum", label: "Sum" },
  { value: "first", label: "First Match" },
  { value: "last", label: "Last Match" },
  { value: "union", label: "Union (combine all)" },
];

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

  return (
    <div
      className={`
        w-[320px] rounded-xl border-2 shadow-lg transition-all
        ${isNew 
          ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-dashed" 
          : "bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50"
        }
        ${selected 
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
                className="text-[10px] h-4 px-1.5 bg-white/50"
              >
                {policyConfig?.label || data.policyType}
              </Badge>
              {!isNew && (
                <Badge
                  variant={data.status === "published" ? "default" : "secondary"}
                  className="text-[10px] h-4 px-1.5"
                >
                  {data.status || "draft"}
                </Badge>
              )}
              {data.conditionCount !== undefined && data.conditionCount > 0 && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-white/50">
                  {data.conditionCount} condition{data.conditionCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <ScrollArea className="max-h-[300px]">
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
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <Textarea
                  value={data.description || ""}
                  onChange={(e) => updateData({ description: e.target.value })}
                  placeholder="Describe what this policy does..."
                  className="min-h-[60px] text-sm resize-none"
                />
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

        {/* Merge Strategies Section */}
        <div className="border-b border-indigo-100">
          <button
            onClick={() => toggleSection("merge")}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50/50"
          >
            {expandedSection === "merge" ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            <Merge className="h-4 w-4 text-purple-500" />
            Merge Strategies
          </button>
          {expandedSection === "merge" && (
            <div className="px-4 pb-3 space-y-2">
              <p className="text-xs text-gray-500 mb-2">
                How to combine outputs when multiple conditions match
              </p>
              {Object.entries(data.mergeStrategies || {}).length > 0 ? (
                Object.entries(data.mergeStrategies || {}).map(([field, strategy]) => (
                  <div key={field} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-600 font-mono">{field}</span>
                    <Select
                      value={strategy}
                      onValueChange={(value) =>
                        updateData({
                          mergeStrategies: { ...data.mergeStrategies, [field]: value },
                        })
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MERGE_STRATEGIES.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Connect outputs to configure merge strategies
                </p>
              )}
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
      </ScrollArea>

      {/* Footer */}
      <div className={`px-4 py-2 border-t rounded-b-xl ${isNew ? "border-amber-200 bg-amber-50/50" : "border-indigo-200 bg-indigo-50/50"}`}>
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
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-indigo-600">
            <Shield className="h-3 w-3" />
            <span>Central Policy Aggregator</span>
          </div>
        )}
      </div>
    </div>
  );
});

export { PolicyCenterNode as default };

