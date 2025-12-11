"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronDown, ChevronRight, Code } from "lucide-react";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface MappedStateField {
  _id: Id<"stateFields">;
  key: string;
  label?: string;
  dataType: string;
}

interface SystemFieldCardProps {
  id: string;
  fieldKey: string;
  label: string;
  dataType: string;
  description?: string;
  isRequired: boolean;
  category: string;
  categoryColor: string;
  mappedStateField?: MappedStateField | null;
  onUnlink?: () => void;
}

export function SystemFieldCard({
  id,
  fieldKey,
  label,
  dataType,
  description,
  isRequired,
  category,
  categoryColor,
  mappedStateField,
  onUnlink,
}: SystemFieldCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isOver, setNodeRef } = useDroppable({ id });

  const isMapped = !!mappedStateField;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border rounded-lg bg-white transition-all duration-200",
        isOver && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50",
        isMapped && "border-green-300 bg-green-50/30"
      )}
    >
      {/* Header */}
      <button
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{label}</span>
              {isMapped && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs font-mono">
                {dataType}
              </Badge>
            </div>
          </div>
        </div>
        <Badge className={cn("text-xs", categoryColor)}>{category}</Badge>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Field Key:</span>
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                {fieldKey}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Label:</span>
              <span className="text-gray-900">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Type:</span>
              <span className="text-gray-900">{dataType}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Required:</span>
              {isRequired ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="h-3 w-3" /> Yes
                </span>
              ) : (
                <span className="text-gray-500">No</span>
              )}
            </div>
            {description && (
              <div>
                <span className="text-gray-500">Description:</span>
                <p className="text-gray-700 mt-1">{description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drop zone / Mapped field */}
      <div className="px-4 pb-4">
        {isMapped ? (
          <div className="flex items-center justify-between bg-blue-100 border border-blue-200 rounded-md p-2">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {mappedStateField.label || mappedStateField.key}
              </span>
              <Badge variant="outline" className="text-xs">
                {mappedStateField.dataType}
              </Badge>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlink?.();
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Remove mapping"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "border-2 border-dashed rounded-md p-3 text-center transition-colors",
              isOver
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-400"
            )}
          >
            <span className="text-sm">
              {isOver ? "Drop to map field" : "Drop field here"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
