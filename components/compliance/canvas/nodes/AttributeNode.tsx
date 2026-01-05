"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Ruler, Scale, MapPin, ToggleLeft, Info, X, Calendar } from "lucide-react";

// Attribute type to category mapping
const ATTRIBUTE_ICONS: Record<string, React.ElementType> = {
  width_ft: Ruler,
  height_ft: Ruler,
  length_ft: Ruler,
  combined_length_ft: Ruler,
  front_overhang_ft: Ruler,
  rear_overhang_ft: Ruler,
  left_overhang_ft: Ruler,
  right_overhang_ft: Ruler,
  gross_weight_lbs: Scale,
  axle_weight_lbs: Scale,
  number_of_axles: Scale,
  axle_spacing_ft: Scale,
  road_type: MapPin,
  num_lanes_same_direction: MapPin,
  travel_heading: MapPin,
  highway_type: MapPin,
  speed_limit_mph: MapPin,
  on_bridge: ToggleLeft,
  urban_area: ToggleLeft,
  on_restricted_route: ToggleLeft,
  is_mobile_home: ToggleLeft,
  is_modular_housing: ToggleLeft,
  is_superload: ToggleLeft,
  is_construction_equipment: ToggleLeft,
  has_police_escort: ToggleLeft,
};

const ATTRIBUTE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  dimension: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700" },
  weight: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700" },
  road: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
  boolean: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700" },
};

function getAttributeCategory(attribute: string): string {
  if (attribute.includes("weight") || attribute.includes("axle")) return "weight";
  if (attribute.includes("road") || attribute.includes("lane") || attribute.includes("highway") || attribute.includes("heading") || attribute.includes("speed_limit")) return "road";
  if (attribute.startsWith("on_") || attribute.startsWith("is_") || attribute.startsWith("has_") || attribute === "urban_area") return "boolean";
  return "dimension";
}

export interface AttributeNodeData {
  id: string;
  attribute: string;
  label: string;
  attributeType?: string;
  unit?: string;
  sourceRegulation?: string;
  expiryDate?: string;
  notes?: string;
}

export const AttributeNode = memo(function AttributeNode({
  id,
  data,
  selected,
}: NodeProps & { data: AttributeNodeData }) {
  const [showNotes, setShowNotes] = useState(false);
  const { deleteElements, setNodes } = useReactFlow();

  // Update node data
  const updateData = useCallback((updates: Partial<AttributeNodeData>) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [id, setNodes]);

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const Icon = ATTRIBUTE_ICONS[data.attribute] || Ruler;
  const category = getAttributeCategory(data.attribute);
  const colors = ATTRIBUTE_COLORS[category] || ATTRIBUTE_COLORS.dimension;

  return (
    <div
      className={`
        min-w-[180px] rounded-lg border-2 shadow-sm transition-all relative group
        ${colors.bg} ${selected ? "border-indigo-500 shadow-md" : colors.border}
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

      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${colors.border}`}>
        <div className={`p-1.5 rounded-md ${colors.bg} ${colors.text}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${colors.text} truncate`}>
            {data.label}
          </div>
          {data.unit && (
            <div className="text-[10px] text-gray-500">Unit: {data.unit}</div>
          )}
        </div>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`p-1 rounded hover:bg-white/50 ${showNotes ? colors.text : "text-gray-400"}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Citation Section (expandable) */}
      {showNotes && (
        <div className="px-3 py-2 border-b border-gray-200 bg-white/50 space-y-2">
          <div>
            <label className="text-[10px] text-gray-500 mb-0.5 block flex items-center gap-1">
              <Scale className="h-2.5 w-2.5" />
              Law Citation
            </label>
            <Input
              value={data.sourceRegulation || ""}
              onChange={(e) => updateData({ sourceRegulation: e.target.value })}
              placeholder="e.g., 67 Pa. Code § 179.3"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-0.5 block flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              Expiry Date (optional)
            </label>
            <Input
              type="date"
              value={data.expiryDate || ""}
              onChange={(e) => updateData({ expiryDate: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-1.5">
        <div className="text-[9px] text-gray-400 font-mono">
          {data.attribute}
        </div>
      </div>

      {/* Output Handle - connects to Operator */}
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-3 !h-3 !border-2 !border-white !bg-indigo-500`}
        id="output"
      />
    </div>
  );
});

export { AttributeNode as default };

