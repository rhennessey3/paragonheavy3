"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface StateFieldItemProps {
  id: Id<"stateFields">;
  fieldKey: string;
  label?: string;
  dataType: string;
  isMapped: boolean;
}

export function StateFieldItem({
  id,
  fieldKey,
  label,
  dataType,
  isMapped,
}: StateFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: {
      stateFieldId: id,
      key: fieldKey,
      label,
      dataType,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-white border rounded-md transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-blue-500",
        isMapped && "border-green-300 bg-green-50/30",
        !isDragging && "hover:bg-gray-50"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none text-gray-400 hover:text-gray-600"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-gray-900 truncate">
            {fieldKey}
          </span>
          {isMapped && (
            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Mapped" />
          )}
        </div>
        {label && label !== fieldKey && (
          <span className="text-xs text-gray-500 truncate block">{label}</span>
        )}
      </div>
      <Badge variant="outline" className="text-xs flex-shrink-0">
        {dataType}
      </Badge>
    </div>
  );
}
