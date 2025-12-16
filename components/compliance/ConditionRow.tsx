"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DimensionInput } from "@/components/ui/dimension-input";
import { X } from "lucide-react";
import { 
  RuleConditionClause, 
  RuleAttribute, 
  ConditionOperator,
  RULE_ATTRIBUTES,
  getAttributeConfig,
  getOperatorsForAttribute,
} from "@/lib/compliance";

interface ConditionRowProps {
  condition: RuleConditionClause;
  onChange: (condition: RuleConditionClause) => void;
  onRemove: () => void;
  showAndLabel?: boolean;
}

export function ConditionRow({ condition, onChange, onRemove, showAndLabel }: ConditionRowProps) {
  const attributeConfig = getAttributeConfig(condition.attribute);
  const operators = getOperatorsForAttribute(condition.attribute);
  
  const handleAttributeChange = (value: string) => {
    const newAttribute = value as RuleAttribute;
    const newConfig = getAttributeConfig(newAttribute);
    const newOperators = getOperatorsForAttribute(newAttribute);
    
    // Reset value and operator when attribute changes
    let defaultValue: any = '';
    if (newConfig?.type === 'boolean') {
      defaultValue = true;
    } else if (newConfig?.type === 'enum') {
      defaultValue = newConfig.options?.[0]?.value || '';
    }
    
    onChange({
      ...condition,
      attribute: newAttribute,
      operator: newOperators[0]?.value || '=',
      value: defaultValue,
    });
  };

  const handleOperatorChange = (value: string) => {
    const newOperator = value as ConditionOperator;
    let newValue = condition.value;
    
    // Adjust value structure for 'between' operator
    if (newOperator === 'between' && !Array.isArray(condition.value)) {
      newValue = [typeof condition.value === 'number' ? condition.value : 0, 0];
    } else if (newOperator !== 'between' && Array.isArray(condition.value)) {
      newValue = condition.value[0] || 0;
    }
    
    onChange({
      ...condition,
      operator: newOperator,
      value: newValue,
    });
  };

  const handleValueChange = (value: any) => {
    onChange({
      ...condition,
      value,
    });
  };

  const renderValueInput = () => {
    if (!attributeConfig) return null;

    // Check if this is a dimensional attribute (feet-based measurement)
    const isDimensionalAttribute = attributeConfig.unit === 'ft' && attributeConfig.type === 'number';

    // Boolean type
    if (attributeConfig.type === 'boolean') {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={(v) => handleValueChange(v === 'true')}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Enum type
    if (attributeConfig.type === 'enum' && attributeConfig.options) {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {attributeConfig.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Number type with 'between' operator
    if (condition.operator === 'between') {
      const [min, max] = Array.isArray(condition.value) ? condition.value : [0, 0];
      
      // Use DimensionInput for dimensional attributes
      if (isDimensionalAttribute) {
        return (
          <div className="flex items-center gap-2">
            <DimensionInput
              value={min}
              onChange={(newMin) => handleValueChange([newMin, max])}
            />
            <span className="text-sm text-gray-500">and</span>
            <DimensionInput
              value={max}
              onChange={(newMax) => handleValueChange([min, newMax])}
            />
          </div>
        );
      }
      
      // Regular number input for non-dimensional attributes
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            className="w-20"
            value={min}
            onChange={(e) => handleValueChange([parseFloat(e.target.value) || 0, max])}
          />
          <span className="text-sm text-gray-500">and</span>
          <Input
            type="number"
            className="w-20"
            value={max}
            onChange={(e) => handleValueChange([min, parseFloat(e.target.value) || 0])}
          />
          {attributeConfig.unit && (
            <span className="text-sm text-gray-500">{attributeConfig.unit}</span>
          )}
        </div>
      );
    }

    // Number type (default)
    // Use DimensionInput for dimensional attributes
    if (isDimensionalAttribute) {
      return (
        <DimensionInput
          value={typeof condition.value === 'number' ? condition.value : 0}
          onChange={handleValueChange}
        />
      );
    }
    
    // Regular number input for non-dimensional attributes
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          className="w-24"
          value={typeof condition.value === 'number' ? condition.value : ''}
          onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
        />
        {attributeConfig.unit && (
          <span className="text-sm text-gray-500">{attributeConfig.unit}</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {showAndLabel && (
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">AND</span>
        </div>
      )}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        {/* Attribute selector */}
        <Select
          value={condition.attribute}
          onValueChange={handleAttributeChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {RULE_ATTRIBUTES.map((attr) => (
              <SelectItem key={attr.value} value={attr.value}>
                {attr.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Operator selector */}
        <Select
          value={condition.operator}
          onValueChange={handleOperatorChange}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value input */}
        {renderValueInput()}

        {/* Remove button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="ml-auto text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
          title="Remove condition"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
