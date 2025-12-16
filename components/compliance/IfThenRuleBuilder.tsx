"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ConditionRow } from "./ConditionRow";
import { EscortRequirementEditor } from "./EscortRequirementEditor";
import { UtilityNoticeRequirementEditor } from "./UtilityNoticeRequirementEditor";
import { PermitRequirementEditor } from "./PermitRequirementEditor";
import { 
  RuleConditionClause, 
  EscortRequirement,
  UtilityNoticeRequirement,
  PermitRequirement, 
  IfThenRule,
  RULE_ATTRIBUTES,
  getOperatorsForAttribute,
  isEscortRequirement,
} from "@/lib/compliance";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const updateRequirement = (requirement: EscortRequirement | UtilityNoticeRequirement | PermitRequirement) => {
    onChange({
      ...rule,
      requirement,
    });
  };

  const switchRequirementType = (type: 'escort' | 'utility_notice' | 'permit_requirement') => {
    // Create default requirement for the new type
    let newRequirement: EscortRequirement | UtilityNoticeRequirement | PermitRequirement;
    
    if (type === 'escort') {
      newRequirement = { front_escorts: 0, rear_escorts: 0 };
    } else if (type === 'utility_notice') {
      newRequirement = { notice_hours: 24, utility_types: [] };
    } else {
      newRequirement = { permit_type_key: '', permit_type_label: '' };
    }
    
    onChange({
      ...rule,
      requirementType: type,
      requirement: newRequirement,
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              THEN
            </span>
            <span className="text-sm text-gray-500">
              Require the following
            </span>
          </div>
          
          {/* Requirement Type Selector */}
          <Tabs value={rule.requirementType} onValueChange={(v) => switchRequirementType(v as 'escort' | 'utility_notice' | 'permit_requirement')}>
            <TabsList className="h-8">
              <TabsTrigger value="escort" className="text-xs">Escort</TabsTrigger>
              <TabsTrigger value="utility_notice" className="text-xs">Utility Notice</TabsTrigger>
              <TabsTrigger value="permit_requirement" className="text-xs">Permit</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {rule.requirementType === 'escort' ? (
          <EscortRequirementEditor
            requirement={rule.requirement as EscortRequirement}
            onChange={updateRequirement}
          />
        ) : rule.requirementType === 'utility_notice' ? (
          <UtilityNoticeRequirementEditor
            requirement={rule.requirement as UtilityNoticeRequirement}
            onChange={updateRequirement}
          />
        ) : (
          <PermitRequirementEditor
            requirement={rule.requirement as PermitRequirement}
            onChange={updateRequirement}
          />
        )}
      </Card>
    </div>
  );
}

// Helper to create an empty IF/THEN rule
export function createEmptyIfThenRule(type: 'escort' | 'utility_notice' | 'permit_requirement' = 'escort'): IfThenRule {
  let requirement: EscortRequirement | UtilityNoticeRequirement | PermitRequirement;
  
  if (type === 'escort') {
    requirement = { front_escorts: 0, rear_escorts: 0 };
  } else if (type === 'utility_notice') {
    requirement = { notice_hours: 24, utility_types: [] };
  } else {
    requirement = { permit_type_key: '', permit_type_label: '' };
  }
  
  return {
    conditions: [],
    requirement,
    requirementType: type,
  };
}

// Helper to convert IF/THEN rule to the format stored in DB
export function ifThenRuleToConditions(rule: IfThenRule, notes?: string): any {
  return {
    ifThen: true,
    requirementType: rule.requirementType,
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
  
  // Determine requirement type from the stored data
  let requirementType: 'escort' | 'utility_notice' | 'permit_requirement';
  
  if (conditions.requirementType) {
    requirementType = conditions.requirementType;
  } else if (conditions.requirement?.notice_hours !== undefined) {
    requirementType = 'utility_notice';
  } else if (conditions.requirement?.permit_type_key !== undefined) {
    requirementType = 'permit_requirement';
  } else {
    requirementType = 'escort';
  }
  
  // Provide default requirement based on type
  let defaultRequirement: EscortRequirement | UtilityNoticeRequirement | PermitRequirement;
  
  if (requirementType === 'escort') {
    defaultRequirement = { front_escorts: 0, rear_escorts: 0 };
  } else if (requirementType === 'utility_notice') {
    defaultRequirement = { notice_hours: 24, utility_types: [] };
  } else {
    defaultRequirement = { permit_type_key: '', permit_type_label: '' };
  }
  
  return {
    conditions: conditions.conditions || [],
    requirement: conditions.requirement || defaultRequirement,
    requirementType,
    priority: conditions.priority,
  };
}
