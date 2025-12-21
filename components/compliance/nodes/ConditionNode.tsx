"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Ruler, 
  Scale, 
  ArrowUpDown, 
  Clock, 
  MapPin, 
  Truck,
  Edit2,
  X,
  GitBranch,
} from "lucide-react";
import { 
  type RuleAttribute, 
  type ConditionOperator,
  RULE_ATTRIBUTES,
  OPERATORS_BY_TYPE,
} from "@/lib/compliance";

export interface ConditionNodeData {
  id: string;
  attribute: RuleAttribute;
  operator: ConditionOperator;
  value: number | string | boolean | [number, number] | string[];
  sourceRegulation?: string;
  notes?: string;
  priority?: number;
  /** Connected to which policy */
  targetPolicyId?: string;
  targetPolicyType?: string;
  /** Callbacks */
  onEdit?: () => void;
  onRemove?: () => void;
}

interface ConditionNodeProps {
  data: ConditionNodeData;
  selected?: boolean;
}

// Get attribute configuration for display
function getAttributeInfo(attribute: RuleAttribute) {
  return RULE_ATTRIBUTES.find(a => a.value === attribute);
}

// Get operator label
function getOperatorLabel(operator: ConditionOperator, attrType: string): string {
  const ops = OPERATORS_BY_TYPE[attrType] || OPERATORS_BY_TYPE.number;
  const found = ops.find(o => o.value === operator);
  return found?.label || operator;
}

// Format the condition value for display
function formatValue(value: any, attrInfo: ReturnType<typeof getAttributeInfo>): string {
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === 'number') {
      // Range value
      const unit = attrInfo?.unit || '';
      return `${value[0]} - ${value[1]}${unit ? ` ${unit}` : ''}`;
    }
    // Multiple values
    return value.join(', ');
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  const unit = attrInfo?.unit || '';
  return `${value}${unit ? ` ${unit}` : ''}`;
}

// Get icon based on attribute type
function getAttributeIcon(attribute: RuleAttribute) {
  if (attribute.includes('width') || attribute.includes('height') || attribute.includes('length') || attribute.includes('overhang')) {
    return <Ruler className="h-3.5 w-3.5" />;
  }
  if (attribute.includes('weight')) {
    return <Scale className="h-3.5 w-3.5" />;
  }
  if (attribute.includes('axle') || attribute.includes('spacing')) {
    return <ArrowUpDown className="h-3.5 w-3.5" />;
  }
  if (attribute.includes('time') || attribute.includes('hours')) {
    return <Clock className="h-3.5 w-3.5" />;
  }
  if (attribute.includes('road') || attribute.includes('route') || attribute.includes('lane')) {
    return <MapPin className="h-3.5 w-3.5" />;
  }
  return <Truck className="h-3.5 w-3.5" />;
}

// Get color based on attribute category
function getAttributeColor(attribute: RuleAttribute): string {
  if (attribute.includes('width') || attribute.includes('height') || attribute.includes('length')) {
    return 'bg-purple-100 border-purple-300 text-purple-700';
  }
  if (attribute.includes('weight')) {
    return 'bg-orange-100 border-orange-300 text-orange-700';
  }
  if (attribute.includes('road') || attribute.includes('lane') || attribute.includes('highway')) {
    return 'bg-blue-100 border-blue-300 text-blue-700';
  }
  if (attribute.includes('time')) {
    return 'bg-amber-100 border-amber-300 text-amber-700';
  }
  return 'bg-gray-100 border-gray-300 text-gray-700';
}

function ConditionNodeComponent({ data, selected }: ConditionNodeProps) {
  const attrInfo = getAttributeInfo(data.attribute);
  const attrType = attrInfo?.type || 'number';
  const operatorLabel = getOperatorLabel(data.operator, attrType);
  const formattedValue = formatValue(data.value, attrInfo);
  const colorClass = getAttributeColor(data.attribute);

  return (
    <div
      className={`
        relative rounded-lg border-2 shadow-md min-w-[180px] max-w-[240px]
        transition-all duration-200 bg-white
        ${selected ? "border-blue-500 ring-2 ring-blue-200 shadow-lg" : "border-gray-200 hover:border-gray-300"}
      `}
    >
      {/* Source handle (bottom) - connects to policy */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Header with attribute category */}
      <div className={`px-3 py-2 rounded-t-md border-b ${colorClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {getAttributeIcon(data.attribute)}
            <span className="text-xs font-medium">
              {attrInfo?.label || data.attribute}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {data.onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onEdit?.();
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            {data.onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-60 hover:opacity-100 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onRemove?.();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Condition expression */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">{operatorLabel}</span>
          <span className="font-semibold text-gray-900">{formattedValue}</span>
        </div>
      </div>

      {/* Source regulation reference */}
      {data.sourceRegulation && (
        <div className="px-3 pb-2">
          <Badge 
            variant="outline" 
            className="text-[9px] px-1.5 py-0 h-4 bg-gray-50 font-normal"
          >
            <GitBranch className="h-2.5 w-2.5 mr-1" />
            {data.sourceRegulation}
          </Badge>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-gray-500 line-clamp-2">{data.notes}</p>
        </div>
      )}

      {/* Priority indicator */}
      {data.priority !== undefined && data.priority > 0 && (
        <div className="absolute -top-1 -right-1">
          <Badge className="text-[9px] px-1 py-0 h-4 bg-amber-500 text-white">
            P{data.priority}
          </Badge>
        </div>
      )}
    </div>
  );
}

export const ConditionNode = memo(ConditionNodeComponent);

