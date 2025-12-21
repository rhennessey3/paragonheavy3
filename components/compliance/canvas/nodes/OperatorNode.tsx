"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { X } from "lucide-react";

export interface OperatorNodeData {
  id: string;
  operator: string;
  label: string;
  symbol: string;
}

export const OperatorNode = memo(function OperatorNode({
  id,
  data,
  selected,
}: NodeProps & { data: OperatorNodeData }) {
  const { deleteElements } = useReactFlow();

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
          flex items-center justify-center
          w-14 h-14 rounded-full
          bg-gradient-to-br from-purple-100 to-purple-200
          border-2 shadow-sm transition-all
          ${selected ? "border-indigo-500 shadow-md scale-105" : "border-purple-400"}
        `}
      >
        {/* Input Handle - receives from Attribute */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !border-2 !border-white !bg-purple-500"
          id="input"
        />

        {/* Operator Symbol */}
        <span className="text-xl font-bold text-purple-700 select-none">
          {data.symbol}
        </span>

        {/* Output Handle - connects to Value */}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !border-2 !border-white !bg-purple-500"
          id="output"
        />
      </div>

      {/* Label Tooltip */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded shadow-sm">
          {data.label}
        </span>
      </div>
    </div>
  );
});

export { OperatorNode as default };

