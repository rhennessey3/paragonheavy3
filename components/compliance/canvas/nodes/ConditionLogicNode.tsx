"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { X } from "lucide-react";

export interface ConditionLogicNodeData {
  id: string;
  conditionLogic: "AND" | "OR";
  label: string;
}

export const ConditionLogicNode = memo(function ConditionLogicNode({
  id,
  data,
  selected,
}: NodeProps & { data: ConditionLogicNodeData }) {
  const { deleteElements } = useReactFlow();
  const isAnd = data.conditionLogic === "AND";

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div className="relative group">
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
        title="Delete node"
      >
        <X className="h-3 w-3" />
      </button>

      <div
        className={`
          min-w-[120px] rounded-lg border-2 shadow-sm transition-all
          ${isAnd
            ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400"
            : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-400"}
          ${selected ? "border-indigo-500 shadow-md scale-105" : ""}
        `}
      >
        {/* Input Handle - receives from Value nodes (top) */}
        <Handle
          type="target"
          position={Position.Top}
          className={`!w-3 !h-3 !border-2 !border-white ${isAnd ? "!bg-blue-500" : "!bg-orange-500"}`}
          id="input-top"
        />

        {/* Input Handle - receives from Value nodes (bottom) */}
        <Handle
          type="target"
          position={Position.Bottom}
          className={`!w-3 !h-3 !border-2 !border-white ${isAnd ? "!bg-blue-500" : "!bg-orange-500"}`}
          id="input-bottom"
        />

        {/* Content */}
        <div className="px-4 py-3 flex flex-col items-center">
          <span className={`text-sm font-bold ${isAnd ? "text-blue-800" : "text-orange-800"}`}>
            {data.label || (isAnd ? "All Match (AND)" : "Any Match (OR)")}
          </span>
        </div>

        {/* Output Handle - connects to Output (right side for left-to-right flow) */}
        <Handle
          type="source"
          position={Position.Right}
          className={`!w-3 !h-3 !border-2 !border-white ${isAnd ? "!bg-blue-500" : "!bg-orange-500"}`}
          id="output"
        />
      </div>
    </div>
  );
});

export { ConditionLogicNode as default };
