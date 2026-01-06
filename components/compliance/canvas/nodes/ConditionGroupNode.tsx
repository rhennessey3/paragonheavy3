"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { X, Plus, GitBranch, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConditionGroupNodeData {
  id: string;
  label: string;
  branches: { id: string; label: string }[];
}

const DEFAULT_BRANCHES = [
  { id: "branch_1", label: "Branch 1" },
  { id: "branch_2", label: "Branch 2" },
];

export const ConditionGroupNode = memo(function ConditionGroupNode({
  id,
  data,
  selected,
}: NodeProps & { data: ConditionGroupNodeData }) {
  const { setNodes, deleteElements } = useReactFlow();

  const branches = data.branches || DEFAULT_BRANCHES;

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  type Branch = { id: string; label: string };

  const addBranch = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          const currentBranches = (node.data.branches as Branch[]) || DEFAULT_BRANCHES;
          const newBranchNum = currentBranches.length + 1;
          return {
            ...node,
            data: {
              ...node.data,
              branches: [
                ...currentBranches,
                { id: `branch_${newBranchNum}`, label: `Branch ${newBranchNum}` },
              ],
            },
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const removeBranch = useCallback((branchId: string) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          const currentBranches = (node.data.branches as Branch[]) || DEFAULT_BRANCHES;
          if (currentBranches.length <= 2) return node; // Keep minimum 2 branches
          return {
            ...node,
            data: {
              ...node.data,
              branches: currentBranches.filter((b) => b.id !== branchId),
            },
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const updateBranchLabel = useCallback((branchId: string, label: string) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          const currentBranches = (node.data.branches as Branch[]) || DEFAULT_BRANCHES;
          return {
            ...node,
            data: {
              ...node.data,
              branches: currentBranches.map((b) =>
                b.id === branchId ? { ...b, label } : b
              ),
            },
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  return (
    <div className="relative group">
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
        title="Delete node"
      >
        <X className="h-3 w-3" />
      </button>

      <div
        className={`
          min-w-[200px] rounded-lg border-2 shadow-sm transition-all
          bg-gradient-to-br from-cyan-50 to-teal-50
          ${selected ? "border-indigo-500 shadow-md" : "border-cyan-400"}
        `}
      >
        {/* Input Handle - receives from Value node (parent condition) */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !border-2 !border-white !bg-cyan-500"
          id="input"
        />

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-cyan-200 bg-cyan-100/50 rounded-t-lg">
          <GitBranch className="h-4 w-4 text-cyan-600" />
          <span className="text-sm font-semibold text-cyan-800">
            IF Parent Condition...
          </span>
        </div>

        {/* Instructions */}
        <div className="px-3 py-2 text-xs text-cyan-600 bg-cyan-50/50 border-b border-cyan-100">
          Connect parent condition to left input. Each branch adds a sub-condition.
        </div>

        {/* Branches */}
        <div className="px-3 py-2 space-y-2">
          {branches.map((branch, index) => (
            <div
              key={branch.id}
              className="flex items-center gap-2 relative"
            >
              {/* Branch connector line */}
              <div className="absolute left-0 top-1/2 w-3 h-px bg-cyan-300" />

              {/* Branch content */}
              <div className="flex-1 flex items-center gap-2 pl-4">
                <span className="text-xs font-medium text-cyan-700 min-w-[20px]">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={branch.label}
                  onChange={(e) => updateBranchLabel(branch.id, e.target.value)}
                  className="flex-1 text-xs px-2 py-1.5 rounded border border-cyan-200 bg-white focus:border-cyan-400 focus:outline-none nodrag"
                  placeholder={`Branch ${index + 1} label`}
                />
                {branches.length > 2 && (
                  <button
                    onClick={() => removeBranch(branch.id)}
                    className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    title="Remove branch"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Branch output handle */}
              <Handle
                type="source"
                position={Position.Right}
                className="!w-2.5 !h-2.5 !border-2 !border-white !bg-cyan-500"
                id={branch.id}
                style={{ top: `${((index + 1) / (branches.length + 1)) * 100}%` }}
              />
            </div>
          ))}
        </div>

        {/* Add Branch Button */}
        <div className="px-3 py-2 border-t border-cyan-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={addBranch}
            className="w-full h-7 text-xs text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Branch
          </Button>
        </div>

        {/* Help text */}
        <div className="px-3 py-2 text-[10px] text-cyan-500 bg-cyan-50/30 rounded-b-lg border-t border-cyan-100">
          Connect each branch → AND node → sub-condition → Output
        </div>
      </div>
    </div>
  );
});

export { ConditionGroupNode as default };
