"use client";

import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  FileText,
  Gauge,
  Clock,
  MapPin,
  Zap,
  Ruler,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { type PolicyType, type MergeStrategy, MERGE_STRATEGIES } from "@/lib/compliance";

export interface PolicyNodeData {
  id: string;
  policyType: PolicyType;
  name: string;
  description?: string;
  status: "draft" | "published" | "archived";
  conditionsCount: number;
  /** Merge strategies for this policy's output fields */
  mergeStrategies?: Record<string, MergeStrategy>;
  /** Preview of current output */
  outputPreview?: Record<string, any>;
  /** Callbacks */
  onEdit?: () => void;
  onAddCondition?: () => void;
}

interface PolicyNodeProps {
  data: PolicyNodeData;
  selected?: boolean;
}

const policyIcons: Record<PolicyType, React.ReactNode> = {
  escort: <Car className="h-5 w-5" />,
  permit: <FileText className="h-5 w-5" />,
  speed: <Gauge className="h-5 w-5" />,
  hours: <Clock className="h-5 w-5" />,
  route: <MapPin className="h-5 w-5" />,
  utility: <Zap className="h-5 w-5" />,
  dimension: <Ruler className="h-5 w-5" />,
};

const policyColors: Record<PolicyType, { bg: string; border: string; text: string; headerBg: string }> = {
  escort: { 
    bg: "bg-blue-50", 
    border: "border-blue-400", 
    text: "text-blue-700",
    headerBg: "bg-gradient-to-r from-blue-500 to-blue-600",
  },
  permit: { 
    bg: "bg-green-50", 
    border: "border-green-400", 
    text: "text-green-700",
    headerBg: "bg-gradient-to-r from-green-500 to-green-600",
  },
  speed: { 
    bg: "bg-red-50", 
    border: "border-red-400", 
    text: "text-red-700",
    headerBg: "bg-gradient-to-r from-red-500 to-red-600",
  },
  hours: { 
    bg: "bg-amber-50", 
    border: "border-amber-400", 
    text: "text-amber-700",
    headerBg: "bg-gradient-to-r from-amber-500 to-amber-600",
  },
  route: { 
    bg: "bg-orange-50", 
    border: "border-orange-400", 
    text: "text-orange-700",
    headerBg: "bg-gradient-to-r from-orange-500 to-orange-600",
  },
  utility: { 
    bg: "bg-cyan-50", 
    border: "border-cyan-400", 
    text: "text-cyan-700",
    headerBg: "bg-gradient-to-r from-cyan-500 to-cyan-600",
  },
  dimension: { 
    bg: "bg-purple-50", 
    border: "border-purple-400", 
    text: "text-purple-700",
    headerBg: "bg-gradient-to-r from-purple-500 to-purple-600",
  },
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-600",
};

const policyLabels: Record<PolicyType, string> = {
  escort: "Escort Policy",
  permit: "Permit Policy",
  speed: "Speed Policy",
  hours: "Hours Policy",
  route: "Route Policy",
  utility: "Utility Policy",
  dimension: "Dimension Policy",
};

function getMergeStrategyLabel(strategy: string): string {
  const found = MERGE_STRATEGIES.find((s) => s.value === strategy);
  return found?.label || strategy;
}

function PolicyNodeComponent({ data, selected }: PolicyNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = policyColors[data.policyType] || policyColors.dimension;
  
  const mergeEntries = Object.entries(data.mergeStrategies || {});
  const hasOutput = data.outputPreview && Object.keys(data.outputPreview).length > 0;

  return (
    <div
      className={`
        relative rounded-xl border-2 shadow-lg min-w-[300px] max-w-[380px]
        transition-all duration-200
        ${colors.bg} ${colors.border}
        ${selected ? "ring-2 ring-blue-400 shadow-xl scale-[1.02]" : "hover:shadow-xl"}
      `}
    >
      {/* Target handles (top) - receives from condition nodes */}
      <Handle
        type="target"
        position={Position.Top}
        id="conditions"
        className="!w-4 !h-4 !bg-white !border-2 !border-blue-500 !rounded-full"
      />

      {/* Header with policy type */}
      <div className={`px-4 py-3 rounded-t-lg ${colors.headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 text-white">
              {policyIcons[data.policyType]}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                {policyLabels[data.policyType]}
              </h3>
              <p className="text-white/80 text-xs truncate max-w-[180px]">
                {data.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={`text-[9px] px-1.5 py-0 h-4 ${statusColors[data.status]}`}>
              {data.status}
            </Badge>
            {data.onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onEdit?.();
                }}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conditions Summary */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
            Conditions
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {data.conditionsCount} {data.conditionsCount === 1 ? "condition" : "conditions"}
            </Badge>
            {data.onAddCondition && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onAddCondition?.();
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600">
          {data.conditionsCount === 0 
            ? "No conditions defined yet" 
            : `${data.conditionsCount} condition${data.conditionsCount === 1 ? "" : "s"} flow into this policy`}
        </p>
      </div>

      {/* Merge Strategies */}
      {mergeEntries.length > 0 && (
        <div className="px-4 py-2 space-y-1.5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
              Merge Strategies
            </span>
            {mergeEntries.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> More
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            {(expanded ? mergeEntries : mergeEntries.slice(0, 3)).map(([field, strategy]) => (
              <div
                key={field}
                className="flex items-center justify-between text-xs bg-white/60 px-2 py-1 rounded"
              >
                <span className="text-gray-600 truncate max-w-[140px]">
                  {field.replace(/_/g, " ")}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 h-4 bg-white"
                >
                  {getMergeStrategyLabel(strategy)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output Preview */}
      {hasOutput && (
        <div className="px-4 py-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium block mb-1">
            Output Preview
          </span>
          <div className="space-y-0.5">
            {Object.entries(data.outputPreview!).slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-500 truncate max-w-[120px]">
                  {key.replace(/_/g, " ")}:
                </span>
                <span className={`font-medium ${colors.text}`}>
                  {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source handle (bottom) - for connecting to other policies */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="relationships"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !rounded-full"
      />

      {/* Side handles for policy-to-policy relationships */}
      <Handle
        type="target"
        position={Position.Left}
        id="incoming-relationship"
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white !rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="outgoing-relationship"
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white !rounded-full"
      />
    </div>
  );
}

export const PolicyNode = memo(PolicyNodeComponent);



