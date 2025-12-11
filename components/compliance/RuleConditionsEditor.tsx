"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import type { RuleCondition } from "@/lib/compliance";

interface RuleConditionsEditorProps {
  conditions: RuleCondition;
  onChange: (conditions: RuleCondition) => void;
  category: string;
}

export function RuleConditionsEditor({ conditions, onChange, category }: RuleConditionsEditorProps) {
  const updateCondition = <K extends keyof RuleCondition>(
    key: K,
    value: RuleCondition[K]
  ) => {
    onChange({ ...conditions, [key]: value });
  };

  const updateEscort = (field: string, value: any) => {
    onChange({
      ...conditions,
      escortsRequired: {
        ...conditions.escortsRequired,
        [field]: value,
      },
    });
  };

  const updateTimeOfDay = (field: "allowed" | "forbidden", value: string) => {
    const values = value.split(",").map(v => v.trim()).filter(Boolean);
    onChange({
      ...conditions,
      timeOfDay: {
        ...conditions.timeOfDay,
        [field]: values.length > 0 ? values : undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Dimension Conditions */}
      {(category === "dimension_limit" || category === "escort_requirement" || category === "permit_requirement") && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Dimension Thresholds</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Min Width (ft)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 8.5"
                value={conditions.minWidthFt || ""}
                onChange={(e) => updateCondition("minWidthFt", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Max Width (ft)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 16"
                value={conditions.maxWidthFt || ""}
                onChange={(e) => updateCondition("maxWidthFt", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Min Height (ft)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 13.5"
                value={conditions.minHeightFt || ""}
                onChange={(e) => updateCondition("minHeightFt", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Max Height (ft)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 15"
                value={conditions.maxHeightFt || ""}
                onChange={(e) => updateCondition("maxHeightFt", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Min Length (ft)</Label>
              <Input
                type="number"
                step="1"
                placeholder="e.g., 75"
                value={conditions.minLengthFt || ""}
                onChange={(e) => updateCondition("minLengthFt", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Max Length (ft)</Label>
              <Input
                type="number"
                step="1"
                placeholder="e.g., 150"
                value={conditions.maxLengthFt || ""}
                onChange={(e) => updateCondition("maxLengthFt", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Weight Conditions */}
      {(category === "dimension_limit" || category === "permit_requirement") && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Weight Thresholds</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Max Gross Weight (lbs)</Label>
              <Input
                type="number"
                step="1000"
                placeholder="e.g., 80000"
                value={conditions.maxGrossWeightLbs || ""}
                onChange={(e) => updateCondition("maxGrossWeightLbs", e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Max Axle Weight (lbs)</Label>
              <Input
                type="number"
                step="1000"
                placeholder="e.g., 20000"
                value={conditions.maxAxleWeightLbs || ""}
                onChange={(e) => updateCondition("maxAxleWeightLbs", e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Escort Requirements */}
      {category === "escort_requirement" && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Escort Requirements</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Front Escort Required</Label>
              <Switch
                checked={conditions.escortsRequired?.front || false}
                onCheckedChange={(checked) => updateEscort("front", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Rear Escort Required</Label>
              <Switch
                checked={conditions.escortsRequired?.rear || false}
                onCheckedChange={(checked) => updateEscort("rear", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Height Pole Vehicle Required</Label>
              <Switch
                checked={conditions.escortsRequired?.heightPole || false}
                onCheckedChange={(checked) => updateEscort("heightPole", checked)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Number of Escorts</Label>
              <Input
                type="number"
                min="0"
                max="10"
                placeholder="e.g., 2"
                value={conditions.escortsRequired?.numberOfEscorts || ""}
                onChange={(e) => updateEscort("numberOfEscorts", e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Time Restrictions */}
      {category === "time_restriction" && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Time of Day Restrictions</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600">Allowed Times (comma-separated)</Label>
              <Input
                placeholder="e.g., sunrise_to_sunset, weekdays"
                value={conditions.timeOfDay?.allowed?.join(", ") || ""}
                onChange={(e) => updateTimeOfDay("allowed", e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Common values: sunrise_to_sunset, weekdays, weekends, overnight
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Forbidden Times (comma-separated)</Label>
              <Input
                placeholder="e.g., rush_hour, holidays"
                value={conditions.timeOfDay?.forbidden?.join(", ") || ""}
                onChange={(e) => updateTimeOfDay("forbidden", e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Common values: rush_hour, holidays, weekdays_6am_9am, weekdays_3pm_7pm
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Permit Type */}
      {category === "permit_requirement" && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Permit Type</h4>
          <Select
            value={conditions.permitType || ""}
            onValueChange={(value) => updateCondition("permitType", value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select permit type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single_trip">Single Trip</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="superload">Superload</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      )}

      {/* Notes */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Additional Notes</h4>
        <Textarea
          placeholder="Any additional conditions or notes..."
          value={conditions.notes || ""}
          onChange={(e) => updateCondition("notes", e.target.value || undefined)}
          rows={3}
        />
      </Card>
    </div>
  );
}
