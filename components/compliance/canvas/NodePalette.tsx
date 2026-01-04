"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  GitMerge,
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
  { value: ">", label: "Greater Than", shortLabel: "MORE THAN", symbol: ">", description: "Matches when input is strictly greater than the value" },
  { value: ">=", label: "Greater or Equal", shortLabel: "AT LEAST", symbol: "≥", description: "Matches when input is greater than or equal to the value" },
  { value: "<", label: "Less Than", shortLabel: "LESS THAN", symbol: "<", description: "Matches when input is strictly less than the value" },
  { value: "<=", label: "Less or Equal", shortLabel: "AT MOST", symbol: "≤", description: "Matches when input is less than or equal to the value" },
  { value: "=", label: "Equals", shortLabel: "EQUALS", symbol: "=", description: "Matches when input exactly equals the value" },
  { value: "!=", label: "Not Equals", shortLabel: "NOT EQUAL", symbol: "≠", description: "Matches when input does not equal the value" },
  { value: "between", label: "Between", shortLabel: "BETWEEN", symbol: "↔", description: "Matches when input falls within a range (inclusive)" },
  { value: "in", label: "In Set", shortLabel: "IS ONE OF", symbol: "∈", description: "Matches when input is one of the specified values" },
];

// Logical operators for combining conditions
const LOGICAL_OPERATORS = [
  { value: "AND", label: "All Match (AND)", shortLabel: "AND", symbol: "&", color: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100", description: "All conditions must be true for the policy to trigger" },
  { value: "OR", label: "Any Match (OR)", shortLabel: "OR", symbol: "|", color: "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100", description: "Any condition being true will trigger the policy" },
];

// Merge strategies for combining multiple outputs
const MERGE_STRATEGIES = [
  { value: "max", label: "Maximum", shortLabel: "MAX", description: "Use the highest value from all matching outputs" },
  { value: "min", label: "Minimum", shortLabel: "MIN", description: "Use the lowest value from all matching outputs" },
  { value: "sum", label: "Sum", shortLabel: "SUM", description: "Add all values from matching outputs together" },
  { value: "first", label: "First Match", shortLabel: "1ST", description: "Use the value from the first matching output" },
  { value: "last", label: "Last Match", shortLabel: "LST", description: "Use the value from the last matching output" },
  { value: "union", label: "Union", shortLabel: "ALL", description: "Combine all values from matching outputs" },
];

// Value type definitions
const VALUE_TYPES = [
  { id: "number", label: "Number Value", icon: Hash, description: "A single numeric value (e.g., 14.5 feet)", data: { valueType: "number", value: 0, useFeetInches: true, feet: 0, inches: 0 } },
  { id: "range", label: "Range Value", icon: null, symbol: "[ ]", description: "A min/max range for 'between' comparisons", data: { valueType: "range", value: [0, 100] } },
  { id: "enum", label: "Selection Value", icon: List, description: "Choose from predefined options", data: { valueType: "enum", value: "" } },
  { id: "boolean", label: "Boolean Value", icon: ToggleLeft, description: "True/false condition", data: { valueType: "boolean", value: true } },
];

// Output type definitions based on policy type
const OUTPUT_TYPES: Record<PolicyType, { id: string; label: string; icon: React.ElementType; description: string }[]> = {
  escort: [
    { id: "escort", label: "Escort Requirement", icon: Car, description: "Specify front/rear escort vehicle requirements" },
  ],
  permit: [
    { id: "permit", label: "Permit Requirement", icon: FileText, description: "Define permit type and application details" },
  ],
  speed: [
    { id: "speed", label: "Speed Limit", icon: Gauge, description: "Set maximum/minimum speed restrictions" },
  ],
  hours: [
    { id: "hours", label: "Time Restriction", icon: Clock, description: "Define allowed travel times and blackout periods" },
  ],
  route: [
    { id: "route", label: "Route Restriction", icon: MapPin, description: "Specify restricted or required routes" },
  ],
  utility: [
    { id: "utility", label: "Utility Notice", icon: Zap, description: "Set utility notification requirements" },
  ],
  dimension: [
    { id: "dimension", label: "Dimension Limit", icon: Ruler, description: "Define maximum dimension limits" },
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
    <TooltipProvider delayDuration={300}>
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
                    <Tooltip key={pt.key}>
                      <TooltipTrigger asChild>
                        <div>
                          <DraggableItem
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
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        <p className="max-w-xs">{pt.description}</p>
                      </TooltipContent>
                    </Tooltip>
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
                      <Tooltip key={attrKey}>
                        <TooltipTrigger asChild>
                          <div>
                            <DraggableItem
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
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          <p className="max-w-xs">{attrConfig.description}</p>
                        </TooltipContent>
                      </Tooltip>
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

            {/* Condition Logic */}
            <CollapsibleSection title="Condition Logic" icon={GitMerge}>
              <div className="space-y-1.5">
                {LOGICAL_OPERATORS.map((logic) => (
                  <Tooltip key={logic.value}>
                    <TooltipTrigger asChild>
                      <div>
                        <DraggableItem
                          type="conditionLogic"
                          data={{
                            conditionLogic: logic.value,
                            label: logic.label,
                          }}
                        >
                          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${logic.color}`}>
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                              logic.value === 'AND' ? 'bg-blue-200 text-blue-800' : 'bg-orange-200 text-orange-800'
                            }`}>
                              {logic.shortLabel}
                            </div>
                            <div className="flex-1">
                              <div className={`text-xs font-semibold uppercase tracking-wide ${
                                logic.value === 'AND' ? 'text-blue-800' : 'text-orange-800'
                              }`}>
                                {logic.value === 'AND' ? 'All Match' : 'Any Match'}
                              </div>
                              <div className={`text-[10px] ${
                                logic.value === 'AND' ? 'text-blue-500' : 'text-orange-500'
                              }`}>
                                {logic.value === 'AND' ? 'All conditions must be true' : 'Any condition can be true'}
                              </div>
                            </div>
                          </div>
                        </DraggableItem>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p className="max-w-xs">{logic.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CollapsibleSection>

            {/* Merge Strategy */}
            <CollapsibleSection title="Merge Strategy" icon={GitMerge}>
              <div className="space-y-1.5">
                {MERGE_STRATEGIES.map((strategy) => (
                  <Tooltip key={strategy.value}>
                    <TooltipTrigger asChild>
                      <div>
                        <DraggableItem
                          type="mergeStrategy"
                          data={{
                            strategy: strategy.value,
                            label: strategy.label,
                          }}
                        >
                          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-100">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs bg-teal-200 text-teal-800">
                              {strategy.shortLabel}
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-teal-800 uppercase tracking-wide">
                                {strategy.label}
                              </div>
                              <div className="text-[10px] text-teal-500 line-clamp-1">
                                {strategy.description}
                              </div>
                            </div>
                          </div>
                        </DraggableItem>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p className="max-w-xs">{strategy.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CollapsibleSection>

            {/* Operators */}
            <CollapsibleSection title="Operators" icon={Calculator}>
              <div className="space-y-1.5">
                {filteredOperators.map((op) => (
                  <Tooltip key={op.value}>
                    <TooltipTrigger asChild>
                      <div>
                        <DraggableItem
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
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p className="max-w-xs">{op.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CollapsibleSection>

            {/* Values */}
            <CollapsibleSection title="Values" icon={Hash}>
              <div className="space-y-1">
                {VALUE_TYPES.map((vt) => (
                  <Tooltip key={vt.id}>
                    <TooltipTrigger asChild>
                      <div>
                        <DraggableItem
                          type="value"
                          data={vt.data}
                        >
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs bg-green-100 text-green-700 border border-transparent hover:border-green-300 transition-colors">
                            {vt.icon ? (
                              <vt.icon className="h-3 w-3" />
                            ) : (
                              <span className="font-mono text-[10px]">{vt.symbol}</span>
                            )}
                            <span>{vt.label}</span>
                          </div>
                        </DraggableItem>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p className="max-w-xs">{vt.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
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
                  <Tooltip key={output.id}>
                    <TooltipTrigger asChild>
                      <div>
                        <DraggableItem
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
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p className="max-w-xs">{output.description}</p>
                    </TooltipContent>
                  </Tooltip>
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
    </TooltipProvider>
  );
}

