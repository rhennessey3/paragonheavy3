"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Ruler,
  Scale,
  MapPin,
  ToggleLeft,
  ChevronDown,
  ChevronRight,
  Calculator,
  Hash,
  List,
  Car,
  FileText,
  Gauge,
  Clock,
  Zap,
  GripVertical,
  Shield,
} from "lucide-react";
import { type PolicyType, RULE_ATTRIBUTES, POLICY_TYPES } from "@/lib/compliance";

interface NodePaletteProps {
  policyType: PolicyType;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

// Categorize attributes for the palette
const ATTRIBUTE_CATEGORIES = [
  {
    id: "dimensions",
    label: "Dimensions",
    icon: Ruler,
    color: "text-purple-600 bg-purple-100",
    attributes: ["width_ft", "height_ft", "length_ft", "combined_length_ft", "front_overhang_ft", "rear_overhang_ft", "left_overhang_ft", "right_overhang_ft"],
  },
  {
    id: "weight",
    label: "Weight",
    icon: Scale,
    color: "text-orange-600 bg-orange-100",
    attributes: ["gross_weight_lbs", "axle_weight_lbs", "number_of_axles", "axle_spacing_ft"],
  },
  {
    id: "road",
    label: "Road Context",
    icon: MapPin,
    color: "text-blue-600 bg-blue-100",
    attributes: ["road_type", "num_lanes_same_direction", "travel_heading", "highway_type", "speed_limit_mph"],
  },
  {
    id: "boolean",
    label: "Conditions",
    icon: ToggleLeft,
    color: "text-green-600 bg-green-100",
    attributes: ["on_bridge", "urban_area", "on_restricted_route", "is_mobile_home", "is_modular_housing", "is_superload", "is_construction_equipment", "has_police_escort"],
  },
];

// Operator definitions with clear labels
const OPERATORS = [
  { value: ">", label: "Greater Than", shortLabel: "MORE THAN", symbol: ">" },
  { value: ">=", label: "Greater or Equal", shortLabel: "AT LEAST", symbol: "≥" },
  { value: "<", label: "Less Than", shortLabel: "LESS THAN", symbol: "<" },
  { value: "<=", label: "Less or Equal", shortLabel: "AT MOST", symbol: "≤" },
  { value: "=", label: "Equals", shortLabel: "EQUALS", symbol: "=" },
  { value: "!=", label: "Not Equals", shortLabel: "NOT EQUAL", symbol: "≠" },
  { value: "between", label: "Between", shortLabel: "BETWEEN", symbol: "↔" },
  { value: "in", label: "In Set", shortLabel: "IS ONE OF", symbol: "∈" },
];

// Output type definitions based on policy type
const OUTPUT_TYPES: Record<PolicyType, { id: string; label: string; icon: React.ElementType }[]> = {
  escort: [
    { id: "escort", label: "Escort Requirement", icon: Car },
  ],
  permit: [
    { id: "permit", label: "Permit Requirement", icon: FileText },
  ],
  speed: [
    { id: "speed", label: "Speed Limit", icon: Gauge },
  ],
  hours: [
    { id: "hours", label: "Time Restriction", icon: Clock },
  ],
  route: [
    { id: "route", label: "Route Restriction", icon: MapPin },
  ],
  utility: [
    { id: "utility", label: "Utility Notice", icon: Zap },
  ],
  dimension: [
    { id: "dimension", label: "Dimension Limit", icon: Ruler },
  ],
};

// Policy icon mapping
function getPolicyIcon(policyType: PolicyType): React.ElementType {
  const icons: Record<PolicyType, React.ElementType> = {
    escort: Car,
    permit: FileText,
    speed: Gauge,
    hours: Clock,
    route: MapPin,
    utility: Zap,
    dimension: Ruler,
  };
  return icons[policyType] || Shield;
}

// Policy color mapping (tailwind classes)
function getPolicyColor(policyType: PolicyType): string {
  const colors: Record<PolicyType, string> = {
    escort: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:border-blue-400",
    permit: "bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400",
    speed: "bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400",
    hours: "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400",
    route: "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 hover:border-orange-400",
    utility: "bg-cyan-50 text-cyan-700 border-cyan-300 hover:bg-cyan-100 hover:border-cyan-400",
    dimension: "bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100 hover:border-purple-400",
  };
  return colors[policyType] || "bg-gray-50 text-gray-700 border-gray-300";
}

// Draggable palette item component
function DraggableItem({
  type,
  data,
  children,
  className = "",
}: {
  type: string;
  data: any;
  children: React.ReactNode;
  className?: string;
}) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ type, data })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`cursor-grab active:cursor-grabbing select-none ${className}`}
    >
      {children}
    </div>
  );
}

// Collapsible section component
function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
        <Icon className="h-4 w-4" />
        {title}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

export function NodePalette({ 
  policyType,
  initialWidth = 280,
  minWidth = 200,
  maxWidth = 500,
}: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Handle resize drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, minWidth, maxWidth]);

  // Filter attributes based on search
  const filteredCategories = ATTRIBUTE_CATEGORIES.map((category) => ({
    ...category,
    attributes: category.attributes.filter((attrKey) => {
      const attrConfig = RULE_ATTRIBUTES.find((a) => a.value === attrKey);
      if (!attrConfig) return false;
      if (!searchQuery) return true;
      return (
        attrConfig.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attrKey.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }),
  })).filter((c) => c.attributes.length > 0);

  // Filter operators based on search
  const filteredOperators = OPERATORS.filter((op) => {
    if (!searchQuery) return true;
    return (
      op.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.symbol.includes(searchQuery)
    );
  });

  // Get output types for current policy
  const outputTypes = OUTPUT_TYPES[policyType] || [];

  return (
    <div 
      className="border-r bg-gray-50 flex flex-col h-full relative overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="p-3 border-b bg-white shrink-0">
        <h3 className="font-semibold text-sm text-gray-700 mb-2">Node Palette</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {/* Hint */}
          <div className="px-3 py-2 text-xs text-gray-500 bg-blue-50 rounded-lg mb-3">
            Drag nodes onto the canvas to build your policy logic
          </div>

          {/* POLICIES Section */}
          <div className="mb-4">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Policies
            </div>

            <CollapsibleSection title="New Policy" icon={Shield} defaultOpen={true}>
              <div className="space-y-1.5">
                {POLICY_TYPES.map((pt) => {
                  const PolicyIcon = getPolicyIcon(pt.key);
                  return (
                    <DraggableItem
                      key={pt.key}
                      type="policyCenter"
                      data={{
                        policyType: pt.key,
                        name: `New ${pt.label}`,
                        description: pt.description,
                        status: "draft",
                        isNew: true,
                      }}
                    >
                      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${getPolicyColor(pt.key)} cursor-grab active:cursor-grabbing`}>
                        <div className="p-2 rounded-lg bg-white/60">
                          <PolicyIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{pt.label}</div>
                          <div className="text-[10px] opacity-75 line-clamp-1">{pt.description}</div>
                        </div>
                      </div>
                    </DraggableItem>
                  );
                })}
              </div>
            </CollapsibleSection>
          </div>

          {/* INPUTS Section */}
          <div className="mb-4">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Inputs
            </div>

            {/* Attribute Categories */}
            {filteredCategories.map((category) => (
              <CollapsibleSection
                key={category.id}
                title={category.label}
                icon={category.icon}
              >
                <div className="space-y-1">
                  {category.attributes.map((attrKey) => {
                    const attrConfig = RULE_ATTRIBUTES.find((a) => a.value === attrKey);
                    if (!attrConfig) return null;

                    return (
                      <DraggableItem
                        key={attrKey}
                        type="attribute"
                        data={{
                          attribute: attrKey,
                          label: attrConfig.label,
                          attributeType: attrConfig.type,
                          unit: attrConfig.unit,
                        }}
                      >
                        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs border border-transparent hover:border-blue-300 hover:bg-blue-50 transition-colors ${category.color.split(" ")[1]}`}>
                          <div className={`p-1 rounded ${category.color}`}>
                            <category.icon className="h-3 w-3" />
                          </div>
                          <span className="truncate">{attrConfig.label}</span>
                          {attrConfig.unit && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-auto">
                              {attrConfig.unit}
                            </Badge>
                          )}
                        </div>
                      </DraggableItem>
                    );
                  })}
                </div>
              </CollapsibleSection>
            ))}
          </div>

          {/* LOGIC Section */}
          <div className="mb-4">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Logic
            </div>

            {/* Operators */}
            <CollapsibleSection title="Operators" icon={Calculator}>
              <div className="space-y-1.5">
                {filteredOperators.map((op) => (
                  <DraggableItem
                    key={op.value}
                    type="operator"
                    data={{
                      operator: op.value,
                      label: op.label,
                      symbol: op.symbol,
                    }}
                  >
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 border border-transparent hover:border-purple-300 hover:bg-purple-100 transition-colors">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 font-bold text-lg">
                        {op.symbol}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-purple-800 uppercase tracking-wide">
                          {op.shortLabel}
                        </div>
                        <div className="text-[10px] text-purple-500">
                          {op.label}
                        </div>
                      </div>
                    </div>
                  </DraggableItem>
                ))}
              </div>
            </CollapsibleSection>

            {/* Values */}
            <CollapsibleSection title="Values" icon={Hash}>
              <div className="space-y-1">
                <DraggableItem
                  type="value"
                  data={{ valueType: "number", value: 0 }}
                >
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs bg-green-100 text-green-700 border border-transparent hover:border-green-300 transition-colors">
                    <Hash className="h-3 w-3" />
                    <span>Number Value</span>
                  </div>
                </DraggableItem>
                <DraggableItem
                  type="value"
                  data={{ valueType: "range", value: [0, 100] }}
                >
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs bg-green-100 text-green-700 border border-transparent hover:border-green-300 transition-colors">
                    <span className="font-mono text-[10px]">[ ]</span>
                    <span>Range Value</span>
                  </div>
                </DraggableItem>
                <DraggableItem
                  type="value"
                  data={{ valueType: "enum", value: "" }}
                >
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs bg-green-100 text-green-700 border border-transparent hover:border-green-300 transition-colors">
                    <List className="h-3 w-3" />
                    <span>Selection Value</span>
                  </div>
                </DraggableItem>
                <DraggableItem
                  type="value"
                  data={{ valueType: "boolean", value: true }}
                >
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs bg-green-100 text-green-700 border border-transparent hover:border-green-300 transition-colors">
                    <ToggleLeft className="h-3 w-3" />
                    <span>Boolean Value</span>
                  </div>
                </DraggableItem>
              </div>
            </CollapsibleSection>
          </div>

          {/* OUTPUTS Section */}
          <div>
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Outputs
            </div>

            <CollapsibleSection title="Requirements" icon={FileText}>
              <div className="space-y-1">
                {outputTypes.map((output) => (
                  <DraggableItem
                    key={output.id}
                    type="output"
                    data={{
                      outputType: output.id,
                      label: output.label,
                      output: {},
                    }}
                  >
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs bg-orange-100 text-orange-700 border border-transparent hover:border-orange-300 transition-colors">
                      <output.icon className="h-3 w-3" />
                      <span>{output.label}</span>
                    </div>
                  </DraggableItem>
                ))}
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-white text-[10px] text-gray-400 shrink-0">
        Drag items to canvas • Connect with lines
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className={`
          absolute top-0 right-0 w-1.5 h-full cursor-col-resize
          hover:bg-indigo-400 transition-colors group
          ${isResizing ? "bg-indigo-500" : "bg-transparent hover:bg-indigo-200"}
        `}
      >
        <div className="absolute top-1/2 -translate-y-1/2 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-indigo-500 text-white rounded-l px-0.5 py-2">
            <GripVertical className="h-4 w-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

