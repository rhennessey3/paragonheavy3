"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PermitRequirement, APPLICATION_METHODS, COMMON_PERMIT_DOCUMENTS } from "@/lib/compliance";
import { FileText, DollarSign, Clock, Link as LinkIcon, Phone } from "lucide-react";
import { useState } from "react";

interface PermitRequirementEditorProps {
  requirement: PermitRequirement;
  onChange: (requirement: PermitRequirement) => void;
  jurisdictionId?: string; // For future: fetch state-specific permit types
}

export function PermitRequirementEditor({ requirement, onChange }: PermitRequirementEditorProps) {
  const [customPermitType, setCustomPermitType] = useState(false);

  const updateField = <K extends keyof PermitRequirement>(
    field: K, 
    value: PermitRequirement[K]
  ) => {
    onChange({ ...requirement, [field]: value });
  };

  const toggleDocument = (docValue: string) => {
    const current = requirement.required_documents || [];
    const updated = current.includes(docValue)
      ? current.filter(d => d !== docValue)
      : [...current, docValue];
    updateField('required_documents', updated);
  };

  // Common permit types (can be extended with state-specific ones from DB)
  const COMMON_PERMIT_TYPES = [
    { value: 'single_trip_oversize', label: 'Single Trip - Oversize' },
    { value: 'single_trip_overweight', label: 'Single Trip - Overweight' },
    { value: 'single_trip_combined', label: 'Single Trip - Oversize/Overweight' },
    { value: 'annual_oversize', label: 'Annual - Oversize' },
    { value: 'annual_overweight', label: 'Annual - Overweight' },
    { value: 'mobile_home', label: 'Mobile Home Transport' },
    { value: 'superload', label: 'Superload' },
    { value: 'emergency', label: 'Emergency Permit' },
    { value: 'temporary', label: 'Temporary Permit' },
    { value: 'custom', label: 'Custom / Other' },
  ];

  return (
    <div className="space-y-4">
      {/* Permit Type Selection */}
      <Card className="p-4 border-purple-200 bg-purple-50/30">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-gray-900">Permit Type</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Select Permit Type</Label>
            <Select
              value={customPermitType ? 'custom' : requirement.permit_type_key}
              onValueChange={(v) => {
                if (v === 'custom') {
                  setCustomPermitType(true);
                  updateField('permit_type_key', '');
                } else {
                  setCustomPermitType(false);
                  updateField('permit_type_key', v);
                  const selected = COMMON_PERMIT_TYPES.find(pt => pt.value === v);
                  updateField('permit_type_label', selected?.label);
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select permit type" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_PERMIT_TYPES.map(pt => (
                  <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {customPermitType && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-gray-500">Custom Permit Key</Label>
                <Input
                  placeholder="e.g., pa_district_permit"
                  className="mt-1"
                  value={requirement.permit_type_key}
                  onChange={(e) => updateField('permit_type_key', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Display Name</Label>
                <Input
                  placeholder="e.g., Pennsylvania District Permit"
                  className="mt-1"
                  value={requirement.permit_type_label || ''}
                  onChange={(e) => updateField('permit_type_label', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Cost Information */}
      <Card className="p-4 border-green-200 bg-green-50/30">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium text-gray-900">Cost Information</span>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">Minimum Cost ($)</Label>
              <Input
                type="number"
                min={0}
                step={10}
                placeholder="50"
                className="mt-1"
                value={requirement.estimated_cost_min || ''}
                onChange={(e) => updateField('estimated_cost_min', parseFloat(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Maximum Cost ($)</Label>
              <Input
                type="number"
                min={0}
                step={10}
                placeholder="150"
                className="mt-1"
                value={requirement.estimated_cost_max || ''}
                onChange={(e) => updateField('estimated_cost_max', parseFloat(e.target.value) || undefined)}
              />
            </div>
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Cost Notes</Label>
            <Textarea
              placeholder="e.g., Cost varies by distance, additional fees may apply for rush processing"
              className="mt-1 min-h-[60px]"
              value={requirement.cost_notes || ''}
              onChange={(e) => updateField('cost_notes', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Processing Information */}
      <Card className="p-4 border-blue-200 bg-blue-50/30">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900">Processing Information</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Processing Time (Days)</Label>
            <Input
              type="number"
              min={1}
              max={365}
              placeholder="3"
              className="mt-1"
              value={requirement.processing_time_days || ''}
              onChange={(e) => updateField('processing_time_days', parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Validity Period (Days)</Label>
            <Input
              type="number"
              min={1}
              max={365}
              placeholder="30"
              className="mt-1"
              value={requirement.validity_period_days || ''}
              onChange={(e) => updateField('validity_period_days', parseInt(e.target.value) || undefined)}
            />
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Processing Notes</Label>
            <Textarea
              placeholder="e.g., Rush processing available for additional fee, processing may be delayed during holiday season"
              className="mt-1 min-h-[60px]"
              value={requirement.processing_notes || ''}
              onChange={(e) => updateField('processing_notes', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Application Method & Contact */}
      <Card className="p-4 border-orange-200 bg-orange-50/30">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-gray-900">Application & Contact</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Application Method</Label>
            <Select
              value={requirement.application_method || undefined}
              onValueChange={(v) => updateField('application_method', v as PermitRequirement['application_method'])}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_METHODS.map(method => (
                  <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Application URL</Label>
            <Input
              type="url"
              placeholder="https://permits.state.gov/apply"
              className="mt-1"
              value={requirement.application_url || ''}
              onChange={(e) => updateField('application_url', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">Contact Name</Label>
              <Input
                placeholder="Permit Office"
                className="mt-1"
                value={requirement.contact_name || ''}
                onChange={(e) => updateField('contact_name', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Contact Phone</Label>
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                className="mt-1"
                value={requirement.contact_phone || ''}
                onChange={(e) => updateField('contact_phone', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Contact Email</Label>
            <Input
              type="email"
              placeholder="permits@state.gov"
              className="mt-1"
              value={requirement.contact_email || ''}
              onChange={(e) => updateField('contact_email', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Required Documents */}
      <Card className="p-4 border-indigo-200 bg-indigo-50/30">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-indigo-600" />
          <span className="font-medium text-gray-900">Required Documents</span>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-gray-500 mb-2">Select all documents required for this permit:</p>
          
          <div className="grid grid-cols-2 gap-2">
            {COMMON_PERMIT_DOCUMENTS.map(doc => (
              <div key={doc.value} className="flex items-center gap-2">
                <Checkbox
                  id={`doc_${doc.value}`}
                  checked={(requirement.required_documents || []).includes(doc.value)}
                  onCheckedChange={() => toggleDocument(doc.value)}
                />
                <Label 
                  htmlFor={`doc_${doc.value}`} 
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  {doc.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Restrictions & Notes */}
      <Card className="p-4 border-red-200 bg-red-50/30">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="h-4 w-4 text-red-600" />
          <span className="font-medium text-gray-900">Restrictions & Additional Notes</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Restrictions</Label>
            <Textarea
              placeholder="e.g., Travel restricted to daylight hours only, no weekend travel, must avoid school zones during school hours"
              className="mt-1 min-h-[60px]"
              value={requirement.restrictions || ''}
              onChange={(e) => updateField('restrictions', e.target.value)}
            />
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Additional Notes</Label>
            <Textarea
              placeholder="Any other important information about this permit requirement"
              className="mt-1 min-h-[60px]"
              value={requirement.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}






