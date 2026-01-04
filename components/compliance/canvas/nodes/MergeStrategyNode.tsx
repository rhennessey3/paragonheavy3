"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { GitMerge, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type MergeStrategy = "max" | "min" | "sum" | "first" | "last" | "union";

export interface MergeStrategyNodeData {
  id: string;
  strategy: MergeStrategy;
  label?: string;
}

const MERGE_STRATEGIES: { value: MergeStrategy; label: string; description: string }[] = [
  { value: "max", label: "Maximum", description: "Highest value wins" },
  { value: "min", label: "Minimum", description: "Lowest value wins" },
  { value: "sum", label: "Sum", description: "Add all values" },
  { value: "first", label: "First", description: "First match wins" },
  { value: "last", label: "Last", description: "Last match wins" },
  { value: "union", label: "Union", description: "Combine all" },
];

export const MergeStrategyNode = memo(function MergeStrategyNode({
  id,
  data,
  selected,
}: NodeProps & { data: MergeStrategyNodeData }) {
  const { deleteElements, setNodes } = useReactFlow();

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const updateStrategy = useCallback((strategy: MergeStrategy) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, strategy } }
          : node
      )
    );
  }, [id, setNodes]);

  const currentStrategy = MERGE_STRATEGIES.find(s => s.value === data.strategy) || MERGE_STRATEGIES[0];

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
          min-w-[140px] rounded-lg border-2 shadow-sm transition-all
          bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-400
          ${selected ? "border-teal-600 shadow-md scale-105" : ""}
        `}
      >
        {/* Input Handle - receives from Output nodes (top) */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !border-2 !border-white !bg-teal-500"
          id="input-top"
        />

        {/* Input Handle - receives from Output nodes (left) */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !border-2 !border-white !bg-teal-500"
          id="input-left"
        />

        {/* Input Handle - receives from Output nodes (bottom) */}
        <Handle
          type="target"
          position={Position.Bottom}
          className="!w-3 !h-3 !border-2 !border-white !bg-teal-500"
          id="input-bottom"
        />

        {/* Content */}
        <div className="px-3 py-2 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-teal-700">
            <GitMerge className="h-4 w-4" />
            <span className="text-xs font-semibold">Merge</span>
          </div>

          <Select
            value={data.strategy}
            onValueChange={(value: MergeStrategy) => updateStrategy(value)}
          >
            <SelectTrigger className="h-7 w-full text-xs bg-white/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MERGE_STRATEGIES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  <div className="flex flex-col">
                    <span className="font-medium">{s.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Output Handle - connects to PolicyCenter (right side) */}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !border-2 !border-white !bg-teal-500"
          id="output"
        />
      </div>
    </div>
  );
});

export { MergeStrategyNode as default };
