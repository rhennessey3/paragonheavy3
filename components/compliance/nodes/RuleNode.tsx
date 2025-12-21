"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { FileCheck } from "lucide-react";

export interface RuleNodeData {
  id: string;
  name: string;
  description?: string;
  /** Type of rule */
  ruleType?: string;
  /** Is the rule active */
  isActive?: boolean;
  /** Callback */
  onEdit?: () => void;
}

interface RuleNodeProps {
  data: RuleNodeData;
  selected?: boolean;
}

function RuleNodeComponent({ data, selected }: RuleNodeProps) {
  return (
    <div
      className={`
        relative rounded-lg border-2 shadow-md min-w-[180px] max-w-[220px]
        transition-all duration-200 bg-amber-50 border-amber-400
        ${selected ? "ring-2 ring-amber-400 shadow-lg" : "hover:shadow-lg"}
      `}
    >
      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-white !border-2 !border-amber-500 !rounded-full"
      />

      {/* Content */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1 rounded bg-amber-100 text-amber-600">
            <FileCheck className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium text-amber-700">Rule</span>
          {data.isActive !== undefined && (
            <Badge
              variant="outline"
              className={`text-[9px] px-1 py-0 h-4 ${
                data.isActive
                  ? "bg-green-50 text-green-600 border-green-300"
                  : "bg-gray-50 text-gray-500 border-gray-300"
              }`}
            >
              {data.isActive ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>
        <h4 className="font-medium text-sm text-gray-800 truncate">
          {data.name}
        </h4>
        {data.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {data.description}
          </p>
        )}
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-white !rounded-full"
      />
    </div>
  );
}

export const RuleNode = memo(RuleNodeComponent);

