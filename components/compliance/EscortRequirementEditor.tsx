"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { EscortRequirement } from "@/lib/compliance";
import { Car, Flag } from "lucide-react";

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

  const hasFrontEscort = requirement.front_escorts > 0;
  const hasRearEscort = requirement.rear_escorts > 0;

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
          </div>
        )}
      </Card>

    </div>
  );
}
