"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UtilityNoticeRequirement, UTILITY_TYPES, COMMON_NOTICE_PERIODS } from "@/lib/compliance";
import { Clock, Phone, Mail, Globe, DollarSign, Zap } from "lucide-react";

interface UtilityNoticeRequirementEditorProps {
  requirement: UtilityNoticeRequirement;
  onChange: (requirement: UtilityNoticeRequirement) => void;
}

export function UtilityNoticeRequirementEditor({ requirement, onChange }: UtilityNoticeRequirementEditorProps) {
  const updateField = <K extends keyof UtilityNoticeRequirement>(
    field: K, 
    value: UtilityNoticeRequirement[K]
  ) => {
    onChange({ ...requirement, [field]: value });
  };

  const toggleUtilityType = (type: string) => {
    const current = requirement.utility_types || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateField('utility_types', updated);
  };

  const isCustomNoticePeriod = !COMMON_NOTICE_PERIODS.some(p => p.value === requirement.notice_hours);

  return (
    <div className="space-y-4">
      {/* Notice Period Card */}
      <Card className="p-4 border-blue-200 bg-blue-50/30">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900">Notice Period</span>
        </div>
        
        <div className="space-y-3 pt-2 border-t border-blue-100">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Select common period or enter custom hours</Label>
            <Select
              value={isCustomNoticePeriod ? "custom" : requirement.notice_hours.toString()}
              onValueChange={(value) => {
                if (value !== "custom") {
                  updateField('notice_hours', parseInt(value));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_NOTICE_PERIODS.map(period => (
                  <SelectItem key={period.value} value={period.value.toString()}>
                    {period.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              placeholder="Hours"
              className="flex-1"
              value={requirement.notice_hours || ''}
              onChange={(e) => updateField('notice_hours', parseInt(e.target.value) || 24)}
            />
            <span className="text-sm text-gray-500">hours prior notice</span>
          </div>

          <div className="text-xs text-blue-700 bg-blue-100/50 p-2 rounded">
            <strong>Requirement:</strong> Notify utility companies {requirement.notice_hours || 0} hours before work begins
          </div>
        </div>
      </Card>

      {/* Utility Types Card */}
      <Card className="p-4 border-amber-200 bg-amber-50/30">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-gray-900">Utility Types</span>
        </div>
        
        <div className="pt-2 border-t border-amber-100">
          <Label className="text-xs text-gray-500 mb-2 block">
            Select which utilities require notification:
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {UTILITY_TYPES.map(utilityType => (
              <div key={utilityType.value} className="flex items-center gap-2">
                <Checkbox
                  id={`utility_${utilityType.value}`}
                  checked={requirement.utility_types?.includes(utilityType.value) || false}
                  onCheckedChange={() => toggleUtilityType(utilityType.value)}
                />
                <Label 
                  htmlFor={`utility_${utilityType.value}`} 
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  {utilityType.label}
                </Label>
              </div>
            ))}
          </div>
          
          {requirement.utility_types && requirement.utility_types.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ No utility types selected - rule will apply to all utilities
            </p>
          )}
        </div>
      </Card>

      {/* Contact Information Card */}
      <Card className="p-4 border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900">Contact Information</span>
          <span className="text-xs text-gray-400 ml-auto">(Optional)</span>
        </div>
        
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div>
            <Label className="text-xs text-gray-500">Contact Name / Department</Label>
            <Input
              placeholder="e.g., DOT Utility Coordination Office"
              className="mt-1"
              value={requirement.contact_name || ''}
              onChange={(e) => updateField('contact_name', e.target.value || undefined)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone
              </Label>
              <Input
                placeholder="(555) 123-4567"
                className="mt-1"
                value={requirement.contact_phone || ''}
                onChange={(e) => updateField('contact_phone', e.target.value || undefined)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </Label>
              <Input
                placeholder="utility@example.com"
                type="email"
                className="mt-1"
                value={requirement.contact_email || ''}
                onChange={(e) => updateField('contact_email', e.target.value || undefined)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <Globe className="h-3 w-3" /> Website / Portal
            </Label>
            <Input
              placeholder="https://utility.example.com/coordination"
              type="url"
              className="mt-1"
              value={requirement.contact_website || ''}
              onChange={(e) => updateField('contact_website', e.target.value || undefined)}
            />
          </div>
        </div>
      </Card>

      {/* Cost Estimate Card */}
      <Card className="p-4 border-green-200 bg-green-50/30">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium text-gray-900">Estimated Cost Range</span>
          <span className="text-xs text-gray-400 ml-auto">(Optional)</span>
        </div>
        
        <div className="pt-2 border-t border-green-100">
          <Label className="text-xs text-gray-500">Cost estimate for coordination/relocation</Label>
          <Input
            placeholder="e.g., $500-$2,000 or Contact for quote"
            className="mt-1"
            value={requirement.estimated_cost_range || ''}
            onChange={(e) => updateField('estimated_cost_range', e.target.value || undefined)}
          />
          <p className="text-xs text-gray-500 mt-1">
            This helps carriers estimate total trip costs
          </p>
        </div>
      </Card>

      {/* Notes Card */}
      <Card className="p-4 border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-medium text-gray-900">Additional Notes</span>
          <span className="text-xs text-gray-400 ml-auto">(Optional)</span>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <Textarea
            placeholder="e.g., Contact during business hours only (M-F 8am-5pm), Submit form XYZ-123, etc."
            rows={3}
            value={requirement.notes || ''}
            onChange={(e) => updateField('notes', e.target.value || undefined)}
          />
        </div>
      </Card>
    </div>
  );
}
