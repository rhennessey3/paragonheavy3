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
} from "lucide-react";
import { type FacetKey, MERGE_STRATEGIES } from "@/lib/compliance";

export interface FacetNodeData {
  facetKey: FacetKey;
  label: string;
  /** Current merge policies for this facet's fields */
  mergePolicies: Record<string, string>;
  /** Count of rules feeding into this facet */
  ruleCount: number;
  /** Preview of merged output */
  outputPreview?: Record<string, any>;
  /** Callback to edit merge policies */
  onEditPolicies?: () => void;
}

interface FacetNodeProps {
  data: FacetNodeData;
  selected?: boolean;
}

const facetIcons: Record<FacetKey, React.ReactNode> = {
  escort: <Car className="h-4 w-4" />,
  permit: <FileText className="h-4 w-4" />,
  speed: <Gauge className="h-4 w-4" />,
  hours: <Clock className="h-4 w-4" />,
  route: <MapPin className="h-4 w-4" />,
  utility: <Zap className="h-4 w-4" />,
  dimension: <Ruler className="h-4 w-4" />,
};

const facetColors: Record<FacetKey, { bg: string; border: string; text: string }> = {
  escort: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
  permit: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700" },
  speed: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700" },
  hours: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" },
  route: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700" },
  utility: { bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-700" },
  dimension: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700" },
};

function getMergeStrategyLabel(strategy: string): string {
  const found = MERGE_STRATEGIES.find((s) => s.value === strategy);
  return found?.label || strategy;
}

function FacetNodeComponent({ data, selected }: FacetNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = facetColors[data.facetKey] || { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700" };
  
  const policyEntries = Object.entries(data.mergePolicies);
  const hasOutput = data.outputPreview && Object.keys(data.outputPreview).length > 0;

  return (
    <div
      className={`
        relative rounded-xl border-2 shadow-lg min-w-[240px] max-w-[300px]
        transition-all duration-200
        ${colors.bg} ${colors.border}
        ${selected ? "ring-2 ring-blue-400 shadow-xl" : "hover:shadow-xl"}
      `}
    >
      {/* Target handle (top) - receives from rules */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-4 !h-4 !bg-white !border-2 !border-blue-500 !rounded-full"
      />

      {/* Header */}
      <div className={`px-4 py-3 border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${colors.text} bg-white/60`}>
              {facetIcons[data.facetKey]}
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${colors.text}`}>{data.label}</h3>
              <p className="text-[10px] text-gray-500">
                {data.ruleCount} {data.ruleCount === 1 ? "rule" : "rules"} feeding in
              </p>
            </div>
          </div>
          {data.onEditPolicies && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                data.onEditPolicies?.();
              }}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Merge Policies */}
      <div className="px-4 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
            Merge Policies
          </span>
          {policyEntries.length > 3 && (
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
          {(expanded ? policyEntries : policyEntries.slice(0, 3)).map(([field, strategy]) => (
            <div
              key={field}
              className="flex items-center justify-between text-xs bg-white/60 px-2 py-1 rounded"
            >
              <span className="text-gray-600 truncate max-w-[120px]">
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

      {/* Output Preview (if available) */}
      {hasOutput && (
        <div className="px-4 py-2 border-t border-dashed border-gray-300">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium block mb-1">
            Merged Output
          </span>
          <div className="space-y-0.5">
            {Object.entries(data.outputPreview!).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-500 truncate max-w-[100px]">
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

      {/* Source handle (bottom) - for chaining if needed */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !rounded-full"
      />
    </div>
  );
}

export const FacetNode = memo(FacetNodeComponent);

