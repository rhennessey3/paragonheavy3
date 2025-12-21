"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Car, FileText, Gauge, Clock, MapPin, Zap, Ruler, X } from "lucide-react";

export interface OutputNodeData {
  id: string;
  outputType: string;
  label: string;
  output: Record<string, any>;
}

const OUTPUT_ICONS: Record<string, React.ElementType> = {
  escort: Car,
  permit: FileText,
  speed: Gauge,
  hours: Clock,
  route: MapPin,
  utility: Zap,
  dimension: Ruler,
};

const OUTPUT_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  escort: { bg: "from-orange-50 to-amber-50", border: "border-orange-400", text: "text-orange-700", icon: "bg-orange-100 text-orange-600" },
  permit: { bg: "from-amber-50 to-yellow-50", border: "border-amber-400", text: "text-amber-700", icon: "bg-amber-100 text-amber-600" },
  speed: { bg: "from-red-50 to-rose-50", border: "border-red-400", text: "text-red-700", icon: "bg-red-100 text-red-600" },
  hours: { bg: "from-violet-50 to-purple-50", border: "border-violet-400", text: "text-violet-700", icon: "bg-violet-100 text-violet-600" },
  route: { bg: "from-blue-50 to-cyan-50", border: "border-blue-400", text: "text-blue-700", icon: "bg-blue-100 text-blue-600" },
  utility: { bg: "from-yellow-50 to-lime-50", border: "border-yellow-400", text: "text-yellow-700", icon: "bg-yellow-100 text-yellow-600" },
  dimension: { bg: "from-purple-50 to-fuchsia-50", border: "border-purple-400", text: "text-purple-700", icon: "bg-purple-100 text-purple-600" },
};

// Number input component with local state to prevent jumping
function NumberInput({ 
  value, 
  onChange 
}: { 
  value: number | undefined; 
  onChange: (value: number) => void;
}) {
  const [localValue, setLocalValue] = useState<string>(value?.toString() ?? "");
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external value when not focused
  useEffect(() => {
    if (!isFocused && value !== undefined) {
      setLocalValue(value.toString());
    }
  }, [value, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else {
      setLocalValue(value?.toString() ?? "0");
      onChange(value ?? 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="h-7 w-20 text-xs text-right font-mono nodrag"
      min={0}
    />
  );
}

// Output field configurations by type
const OUTPUT_FIELDS: Record<string, { key: string; label: string; type: "number" | "boolean" | "select" | "text"; options?: string[] }[]> = {
  escort: [
    { key: "frontPilots", label: "Front Pilots", type: "number" },
    { key: "rearPilots", label: "Rear Pilots", type: "number" },
    { key: "heightPole", label: "Height Pole", type: "boolean" },
    { key: "policeRequired", label: "Police Required", type: "boolean" },
  ],
  permit: [
    { key: "permitType", label: "Permit Type", type: "select", options: ["single_trip", "annual", "superload", "special"] },
    { key: "estimatedCost", label: "Est. Cost ($)", type: "number" },
    { key: "processingDays", label: "Processing Days", type: "number" },
  ],
  speed: [
    { key: "maxSpeed", label: "Max Speed (mph)", type: "number" },
    { key: "minSpeed", label: "Min Speed (mph)", type: "number" },
  ],
  hours: [
    { key: "startHour", label: "Start Hour", type: "number" },
    { key: "endHour", label: "End Hour", type: "number" },
    { key: "excludeWeekends", label: "Exclude Weekends", type: "boolean" },
    { key: "excludeHolidays", label: "Exclude Holidays", type: "boolean" },
  ],
  route: [
    { key: "restriction", label: "Restriction", type: "select", options: ["prohibited", "requires_approval", "requires_survey"] },
    { key: "reason", label: "Reason", type: "text" },
  ],
  utility: [
    { key: "noticeHours", label: "Notice Hours", type: "number" },
    { key: "utilityTypes", label: "Utility Types", type: "text" },
  ],
  dimension: [
    { key: "maxValue", label: "Max Value", type: "number" },
    { key: "unit", label: "Unit", type: "select", options: ["ft", "in", "lbs"] },
  ],
};

export const OutputNode = memo(function OutputNode({
  id,
  data,
  selected,
}: NodeProps & { data: OutputNodeData }) {
  const { setNodes, deleteElements } = useReactFlow();
  const [expanded, setExpanded] = useState(true);

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const Icon = OUTPUT_ICONS[data.outputType] || FileText;
  const colors = OUTPUT_COLORS[data.outputType] || OUTPUT_COLORS.permit;
  const fields = OUTPUT_FIELDS[data.outputType] || [];

  // Update output field
  const updateField = useCallback((key: string, value: any) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                output: { ...node.data.output, [key]: value },
              },
            }
          : node
      )
    );
  }, [id, setNodes]);

  const renderField = (field: typeof fields[0]) => {
    const value = data.output?.[field.key];

    switch (field.type) {
      case "number":
        return (
          <NumberInput
            value={value}
            onChange={(newValue) => updateField(field.key, newValue)}
          />
        );

      case "boolean":
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => updateField(field.key, checked)}
          />
        );

      case "select":
        return (
          <Select
            value={String(value || "")}
            onValueChange={(v) => updateField(field.key, v)}
          >
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">
                  {opt.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "text":
        return (
          <Input
            value={String(value || "")}
            onChange={(e) => updateField(field.key, e.target.value)}
            className="h-7 w-28 text-xs"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`
        min-w-[200px] max-w-[280px] rounded-lg border-2 shadow-sm transition-all relative group
        bg-gradient-to-br ${colors.bg}
        ${selected ? "border-indigo-500 shadow-md" : colors.border}
      `}
    >
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
        title="Delete node"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Input Handle - receives from Value */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-white !bg-orange-500"
        id="input"
      />

      {/* Header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b ${colors.border.replace("border-", "border-")}/30`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`p-1.5 rounded-md ${colors.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${colors.text} truncate`}>
            {data.label}
          </div>
          <div className="text-[10px] text-gray-500">
            {Object.keys(data.output || {}).length} fields set
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Fields (expandable) */}
      {expanded && (
        <div className="px-3 py-2 space-y-2">
          {fields.map((field) => (
            <div key={field.key} className="flex items-center justify-between gap-2">
              <label className="text-xs text-gray-600 whitespace-nowrap">
                {field.label}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>
      )}

      {/* Output Handle - connects to Policy Center */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !border-white !bg-orange-500"
        id="output"
      />
    </div>
  );
});

export { OutputNode as default };

