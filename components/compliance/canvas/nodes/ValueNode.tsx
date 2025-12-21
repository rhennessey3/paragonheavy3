"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hash, List, ToggleLeft, X } from "lucide-react";

export interface ValueNodeData {
  id: string;
  valueType: "number" | "range" | "enum" | "boolean";
  value: any;
  unit?: string;
  enumOptions?: string[];
  // For dimension values, store feet and inches separately
  useFeetInches?: boolean;
  feet?: number;
  inches?: number;
}

// Number input with local state to prevent jumping while typing
function StableNumberInput({ 
  value, 
  onChange,
  className = "",
  placeholder = "",
  min,
  max,
}: { 
  value: number | undefined; 
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  const [localValue, setLocalValue] = useState<string>(value?.toString() ?? "0");
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
      className={`nodrag ${className}`}
      placeholder={placeholder}
      min={min}
      max={max}
    />
  );
}

// Feet and Inches input component
function FeetInchesInput({
  feet,
  inches,
  onChange,
}: {
  feet: number;
  inches: number;
  onChange: (feet: number, inches: number, totalFeet: number) => void;
}) {
  const [localFeet, setLocalFeet] = useState<string>(feet?.toString() ?? "0");
  const [localInches, setLocalInches] = useState<string>(inches?.toString() ?? "0");
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external values when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalFeet(feet?.toString() ?? "0");
      setLocalInches(inches?.toString() ?? "0");
    }
  }, [feet, inches, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const feetNum = parseInt(localFeet) || 0;
    let inchesNum = parseInt(localInches) || 0;
    
    // Handle inches overflow (e.g., 14 inches -> 1 foot 2 inches)
    const extraFeet = Math.floor(inchesNum / 12);
    inchesNum = inchesNum % 12;
    const totalFeetNum = feetNum + extraFeet;
    
    // Calculate decimal feet value
    const totalDecimalFeet = totalFeetNum + (inchesNum / 12);
    
    setLocalFeet(totalFeetNum.toString());
    setLocalInches(inchesNum.toString());
    onChange(totalFeetNum, inchesNum, totalDecimalFeet);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        <Input
          type="number"
          value={localFeet}
          onChange={(e) => setLocalFeet(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8 w-14 text-sm text-center font-mono nodrag rounded-r-none"
          min={0}
          placeholder="0"
        />
        <span className="h-8 px-1.5 flex items-center bg-gray-100 border border-l-0 text-xs text-gray-600 font-medium">
          ft
        </span>
      </div>
      <div className="flex items-center">
        <Input
          type="number"
          value={localInches}
          onChange={(e) => setLocalInches(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8 w-12 text-sm text-center font-mono nodrag rounded-r-none"
          min={0}
          max={11}
          placeholder="0"
        />
        <span className="h-8 px-1.5 flex items-center bg-gray-100 border border-l-0 rounded-r-md text-xs text-gray-600 font-medium">
          in
        </span>
      </div>
    </div>
  );
}

export const ValueNode = memo(function ValueNode({
  id,
  data,
  selected,
}: NodeProps & { data: ValueNodeData }) {
  const { setNodes, deleteElements } = useReactFlow();
  
  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  // Update node data
  const updateValue = useCallback((newValue: any) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, value: newValue } }
          : node
      )
    );
  }, [id, setNodes]);

  // Toggle feet/inches mode
  const toggleFeetInches = useCallback(() => {
    const newUseFeetInches = !data.useFeetInches;
    if (newUseFeetInches) {
      // Convert decimal feet to feet + inches
      const totalFeet = data.value || 0;
      const feet = Math.floor(totalFeet);
      const inches = Math.round((totalFeet - feet) * 12);
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  useFeetInches: true,
                  feet,
                  inches,
                } 
              }
            : node
        )
      );
    } else {
      // Convert feet + inches to decimal feet
      const totalFeet = (data.feet || 0) + ((data.inches || 0) / 12);
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  useFeetInches: false,
                  value: totalFeet,
                } 
              }
            : node
        )
      );
    }
  }, [data.useFeetInches, data.value, data.feet, data.inches, id, setNodes]);

  // Handle feet/inches change
  const handleFeetInchesChange = useCallback((feet: number, inches: number, totalFeet: number) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                feet,
                inches,
                value: totalFeet, // Also store as decimal for serialization
              } 
            }
          : node
      )
    );
  }, [id, setNodes]);

  const renderValueInput = () => {
    switch (data.valueType) {
      case "number":
        return (
          <div className="space-y-2">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={toggleFeetInches}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                  data.useFeetInches 
                    ? "bg-green-200 text-green-800" 
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {data.useFeetInches ? "ft + in" : "Decimal"}
              </button>
            </div>
            
            {data.useFeetInches ? (
              <FeetInchesInput
                feet={data.feet || 0}
                inches={data.inches || 0}
                onChange={handleFeetInchesChange}
              />
            ) : (
              <div className="flex items-center gap-2">
                <StableNumberInput
                  value={data.value || 0}
                  onChange={(newValue) => updateValue(newValue)}
                  className="h-8 w-24 text-sm text-center font-mono"
                />
                {data.unit && (
                  <span className="text-xs text-gray-500">{data.unit}</span>
                )}
              </div>
            )}
          </div>
        );

      case "range":
        const rangeValue = Array.isArray(data.value) ? data.value : [0, 100];
        return (
          <div className="flex items-center gap-1">
            <StableNumberInput
              value={rangeValue[0] || 0}
              onChange={(newValue) => updateValue([newValue, rangeValue[1]])}
              className="h-8 w-16 text-sm text-center font-mono"
            />
            <span className="text-gray-400">to</span>
            <StableNumberInput
              value={rangeValue[1] || 100}
              onChange={(newValue) => updateValue([rangeValue[0], newValue])}
              className="h-8 w-16 text-sm text-center font-mono"
            />
          </div>
        );

      case "enum":
        return (
          <Select
            value={String(data.value || "")}
            onValueChange={(value) => updateValue(value)}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {(data.enumOptions || ["Option 1", "Option 2", "Option 3"]).map(
                (opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        );

      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(data.value)}
              onCheckedChange={(checked) => updateValue(checked)}
            />
            <span className="text-sm font-medium text-gray-700">
              {data.value ? "True" : "False"}
            </span>
          </div>
        );

      default:
        return (
          <Input
            value={String(data.value || "")}
            onChange={(e) => updateValue(e.target.value)}
            className="h-8 w-32 text-sm"
          />
        );
    }
  };

  const getIcon = () => {
    switch (data.valueType) {
      case "number":
      case "range":
        return Hash;
      case "enum":
        return List;
      case "boolean":
        return ToggleLeft;
      default:
        return Hash;
    }
  };

  const Icon = getIcon();

  return (
    <div
      className={`
        min-w-[160px] rounded-lg border-2 shadow-sm transition-all relative group
        bg-gradient-to-br from-green-50 to-emerald-50
        ${selected ? "border-indigo-500 shadow-md" : "border-green-400"}
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

      {/* Input Handle - receives from Operator */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-white !bg-green-500"
        id="input"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-green-200">
        <Icon className="h-4 w-4 text-green-600" />
        <span className="text-xs font-medium text-green-700 capitalize">
          {data.valueType} Value
        </span>
      </div>

      {/* Value Input */}
      <div className="px-3 py-2.5">
        {renderValueInput()}
      </div>

      {/* Output Handle - connects to Output */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !border-white !bg-green-500"
        id="output"
      />
    </div>
  );
});

export { ValueNode as default };

