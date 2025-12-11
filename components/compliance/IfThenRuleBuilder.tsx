"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ConditionRow } from "./ConditionRow";
import { EscortRequirementEditor } from "./EscortRequirementEditor";
import { 
  RuleConditionClause, 
  EscortRequirement, 
  IfThenRule,
  RULE_ATTRIBUTES,
  getOperatorsForAttribute,
} from "@/lib/compliance";

interface IfThenRuleBuilderProps {
  rule: IfThenRule;
  onChange: (rule: IfThenRule) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function IfThenRuleBuilder({ rule, onChange }: IfThenRuleBuilderProps) {
  const addCondition = () => {
    const defaultAttribute = RULE_ATTRIBUTES[0];
    const defaultOperators = getOperatorsForAttribute(defaultAttribute.value);
    
    const newCondition: RuleConditionClause = {
      id: generateId(),
      attribute: defaultAttribute.value,
      operator: defaultOperators[0]?.value || '=',
      value: 0,
    };
    
    onChange({
      ...rule,
      conditions: [...rule.conditions, newCondition],
    });
  };

  const updateCondition = (index: number, condition: RuleConditionClause) => {
    const newConditions = [...rule.conditions];
    newConditions[index] = condition;
    onChange({
      ...rule,
      conditions: newConditions,
    });
  };

  const removeCondition = (index: number) => {
    onChange({
      ...rule,
      conditions: rule.conditions.filter((_, i) => i !== index),
    });
  };

  const updateRequirement = (requirement: EscortRequirement) => {
    onChange({
      ...rule,
      requirement,
    });
  };

  return (
    <div className="space-y-6">
      {/* IF Section - Conditions */}
      <Card className="p-4 border-blue-200 bg-blue-50/30">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
            IF
          </span>
          <span className="text-sm text-gray-500">
            All conditions must match
          </span>
        </div>

        <div className="space-y-2">
          {rule.conditions.length === 0 ? (
            <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm mb-2">No conditions defined</p>
              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Condition
              </Button>
            </div>
          ) : (
            <>
              {rule.conditions.map((condition, index) => (
                <ConditionRow
                  key={condition.id}
                  condition={condition}
                  onChange={(updated) => updateCondition(index, updated)}
                  onRemove={() => removeCondition(index)}
                  showAndLabel={index > 0}
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={addCondition}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Condition
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* THEN Section - Requirements */}
      <Card className="p-4 border-green-200 bg-green-50/30">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
            THEN
          </span>
          <span className="text-sm text-gray-500">
            Require the following
          </span>
        </div>

        <EscortRequirementEditor
          requirement={rule.requirement}
          onChange={updateRequirement}
        />
      </Card>
    </div>
  );
}

// Helper to create an empty IF/THEN rule
export function createEmptyIfThenRule(): IfThenRule {
  return {
    conditions: [],
    requirement: {
      front_escorts: 0,
      rear_escorts: 0,
    },
  };
}

// Helper to convert IF/THEN rule to the format stored in DB
export function ifThenRuleToConditions(rule: IfThenRule, notes?: string): any {
  return {
    ifThen: true,
    conditions: rule.conditions,
    requirement: {
      ...rule.requirement,
      notes: notes || rule.requirement.notes,
    },
    priority: rule.priority,
  };
}

// Helper to convert DB conditions back to IF/THEN rule
export function conditionsToIfThenRule(conditions: any): IfThenRule | null {
  if (!conditions?.ifThen) return null;
  return {
    conditions: conditions.conditions || [],
    requirement: conditions.requirement || { front_escorts: 0, rear_escorts: 0 },
    priority: conditions.priority,
  };
}
