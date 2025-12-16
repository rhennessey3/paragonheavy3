"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EscortRequirement } from "@/lib/compliance";
import { Car, Flag, GitBranch } from "lucide-react";

interface EscortRequirementEditorProps {
  requirement: EscortRequirement;
  onChange: (requirement: EscortRequirement) => void;
}

export function EscortRequirementEditor({ requirement, onChange }: EscortRequirementEditorProps) {
  const updateField = <K extends keyof EscortRequirement>(
    field: K, 
    value: EscortRequirement[K]
  ) => {
    onChange({ ...requirement, [field]: value });
  };

  const updatePlacementCondition = (
    condition: 'when_multilane' | 'when_single_lane' | 'when_police_escort',
    value: 'lead' | 'follow' | undefined
  ) => {
    onChange({
      ...requirement,
      placement_conditions: {
        ...requirement.placement_conditions,
        [condition]: value === '' ? undefined : value,
      },
    });
  };

  const hasFrontEscort = requirement.front_escorts > 0;
  const hasRearEscort = requirement.rear_escorts > 0;
  const hasConditionalPositioning = 
    requirement.placement_conditions?.when_multilane ||
    requirement.placement_conditions?.when_single_lane ||
    requirement.placement_conditions?.when_police_escort;

  return (
    <div className="space-y-4">
      {/* Front Escort Card */}
      <Card className={`p-4 transition-colors ${hasFrontEscort ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-900">Front Escort (Lead)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Required</span>
            <Switch
              checked={hasFrontEscort}
              onCheckedChange={(checked) => updateField('front_escorts', checked ? 1 : 0)}
            />
          </div>
        </div>
        
        {hasFrontEscort && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Number of escorts</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  className="mt-1 h-9"
                  value={requirement.front_escorts}
                  onChange={(e) => updateField('front_escorts', Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Checkbox
                  id="front_height_pole"
                  checked={requirement.front_has_height_pole || false}
                  onChange={(e) => updateField('front_has_height_pole', e.target.checked)}
                />
                <Label htmlFor="front_height_pole" className="text-sm text-gray-700 cursor-pointer flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  Height pole required
                </Label>
              </div>
            </div>
            
            {/* Leading Distance Range */}
            <div>
              <Label className="text-xs text-gray-500">Leading Distance</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="Min"
                  className="h-9 flex-1"
                  value={requirement.front_distance_min_ft || ''}
                  onChange={(e) => updateField('front_distance_min_ft', parseFloat(e.target.value) || undefined)}
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="h-9 flex-1"
                  value={requirement.front_distance_max_ft || ''}
                  onChange={(e) => updateField('front_distance_max_ft', parseFloat(e.target.value) || undefined)}
                />
                <span className="text-sm text-gray-500">ft</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Rear Escort Card */}
      <Card className={`p-4 transition-colors ${hasRearEscort ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-orange-600 rotate-180" />
            <span className="font-medium text-gray-900">Rear Escort (Follow)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Required</span>
            <Switch
              checked={hasRearEscort}
              onCheckedChange={(checked) => updateField('rear_escorts', checked ? 1 : 0)}
            />
          </div>
        </div>
        
        {hasRearEscort && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Number of escorts</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  className="mt-1 h-9"
                  value={requirement.rear_escorts}
                  onChange={(e) => updateField('rear_escorts', Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Checkbox
                  id="rear_height_pole"
                  checked={requirement.rear_has_height_pole || false}
                  onChange={(e) => updateField('rear_has_height_pole', e.target.checked)}
                />
                <Label htmlFor="rear_height_pole" className="text-sm text-gray-700 cursor-pointer flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  Height pole required
                </Label>
              </div>
            </div>
            
            {/* Following Distance Range */}
            <div>
              <Label className="text-xs text-gray-500">Following Distance</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="Min"
                  className="h-9 flex-1"
                  value={requirement.rear_distance_min_ft || ''}
                  onChange={(e) => updateField('rear_distance_min_ft', parseFloat(e.target.value) || undefined)}
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="h-9 flex-1"
                  value={requirement.rear_distance_max_ft || ''}
                  onChange={(e) => updateField('rear_distance_max_ft', parseFloat(e.target.value) || undefined)}
                />
                <span className="text-sm text-gray-500">ft</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Conditional Positioning - Pennsylvania-style rules */}
      {(hasFrontEscort || hasRearEscort) && (
        <Card className={`p-4 transition-colors ${hasConditionalPositioning ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-gray-900">If One Escort is Hired on Job</span>
          </div>
          
          <p className="text-xs text-gray-500 mb-4">
            Escort position changes based on lane conditions
          </p>

          <div className="space-y-3">
            {/* When 2+ lanes same direction */}
            {hasFrontEscort && (
              <div className="flex items-center gap-3">
                <Label className="text-sm text-gray-700 w-48 shrink-0">
                  When 2+ lanes (same direction):
                </Label>
                <Select
                  value={requirement.placement_conditions?.when_multilane ?? undefined}
                  onValueChange={(v) => updatePlacementCondition('when_multilane', v as 'lead' | 'follow' | undefined)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Not Set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Pilot Leads</SelectItem>
                    <SelectItem value="follow">Pilot Follows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* When 1 lane same direction */}
            {hasFrontEscort && (
              <div className="flex items-center gap-3">
                <Label className="text-sm text-gray-700 w-48 shrink-0">
                  When 1 lane (same direction):
                </Label>
                <Select
                  value={requirement.placement_conditions?.when_single_lane ?? undefined}
                  onValueChange={(v) => updatePlacementCondition('when_single_lane', v as 'lead' | 'follow' | undefined)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Not Set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Pilot Leads</SelectItem>
                    <SelectItem value="follow">Pilot Follows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* When police escort present */}
            {hasFrontEscort && (
              <div className="flex items-center gap-3">
                <Label className="text-sm text-gray-700 w-48 shrink-0">
                  When police escort present:
                </Label>
                <Select
                  value={requirement.placement_conditions?.when_police_escort ?? undefined}
                  onValueChange={(v) => updatePlacementCondition('when_police_escort', v as 'lead' | 'follow' | undefined)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Not Set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Pilot Leads</SelectItem>
                    <SelectItem value="follow">Pilot Follows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {hasConditionalPositioning && (
            <div className="mt-3 pt-3 border-t border-purple-100">
              <p className="text-xs text-purple-700 bg-purple-50 p-2 rounded">
                <strong>Note:</strong> Conditional positioning overrides default placement. 
                {requirement.placement_conditions?.when_multilane && ' Multi-lane: ' + (requirement.placement_conditions.when_multilane === 'lead' ? 'leads' : 'follows') + '.'}
                {requirement.placement_conditions?.when_single_lane && ' Single-lane: ' + (requirement.placement_conditions.when_single_lane === 'lead' ? 'leads' : 'follows') + '.'}
                {requirement.placement_conditions?.when_police_escort && ' With police: ' + (requirement.placement_conditions.when_police_escort === 'lead' ? 'leads' : 'follows') + '.'}
              </p>
            </div>
          )}
        </Card>
      )}

    </div>
  );
}
