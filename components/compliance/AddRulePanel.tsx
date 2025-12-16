"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Send } from "lucide-react";
import { RuleConditionsEditor } from "@/components/compliance/RuleConditionsEditor";
import { IfThenRuleBuilder, createEmptyIfThenRule, ifThenRuleToConditions } from "@/components/compliance/IfThenRuleBuilder";
import { RULE_CATEGORIES, type RuleCondition, type RuleCategory, type IfThenRule } from "@/lib/compliance";
import { Id } from "@/convex/_generated/dataModel";
import { JurisdictionData } from "./JurisdictionMap";

interface AddRulePanelProps {
  jurisdiction: JurisdictionData;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddRulePanel({ jurisdiction, onClose, onSuccess }: AddRulePanelProps) {
  const createRule = useMutation(api.compliance.createRule);
  const updateRuleStatus = useMutation(api.compliance.updateRuleStatus);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "" as RuleCategory | "",
    title: "",
    summary: "",
    source: "",
    notes: "",
    effectiveFrom: "",
    effectiveTo: "",
  });
  const [conditions, setConditions] = useState<RuleCondition>({});
  const [ifThenRule, setIfThenRule] = useState<IfThenRule>(createEmptyIfThenRule());

  // Use IF/THEN builder for escort requirements, utility notices, and permit requirements
  const useIfThenBuilder = formData.category === "escort_requirement" || formData.category === "utility_notice" || formData.category === "permit_requirement";

  const handleSubmit = async (publish: boolean = false) => {
    if (!formData.category || !formData.title || !formData.summary) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use IF/THEN conditions for escort rules, legacy conditions for others
      const finalConditions = useIfThenBuilder 
        ? ifThenRuleToConditions(ifThenRule, formData.notes)
        : conditions;

      const ruleId = await createRule({
        jurisdictionId: jurisdiction._id,
        category: formData.category as any,
        title: formData.title,
        summary: formData.summary,
        source: formData.source || undefined,
        effectiveFrom: formData.effectiveFrom ? new Date(formData.effectiveFrom).getTime() : undefined,
        effectiveTo: formData.effectiveTo ? new Date(formData.effectiveTo).getTime() : undefined,
        conditions: finalConditions,
      });

      if (publish) {
        await updateRuleStatus({ ruleId, status: "published" });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating rule:", error);
      alert("Error creating rule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Rule</h2>
            <p className="text-sm text-gray-500">{jurisdiction.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(v) => {
                const category = v as RuleCategory;
                setFormData({ ...formData, category });
                setConditions({});
                // Initialize IF/THEN rule with appropriate type
                const ruleType = category === "utility_notice" ? "utility_notice" : "escort";
                setIfThenRule(createEmptyIfThenRule(ruleType));
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {RULE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              className="mt-1"
              placeholder="e.g., Standard Overwidth Permit Required"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">
              Summary <span className="text-red-500">*</span>
            </Label>
            <Textarea
              className="mt-1"
              placeholder="Describe the rule in detail..."
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Effective From</Label>
              <Input
                type="date"
                className="mt-1"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Effective Until</Label>
              <Input
                type="date"
                className="mt-1"
                value={formData.effectiveTo}
                onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
              />
            </div>
          </div>

          {formData.category && (
            <div className="pt-4 border-t border-gray-200">
              {useIfThenBuilder ? (
                <>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Rule Builder</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Define IF conditions and THEN requirements for this {formData.category === "utility_notice" ? "utility notice" : "escort"} rule.
                  </p>
                  <IfThenRuleBuilder
                    rule={ifThenRule}
                    onChange={setIfThenRule}
                  />
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Rule Conditions</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Define the conditions that trigger this rule.
                  </p>
                  <RuleConditionsEditor
                    conditions={conditions}
                    onChange={setConditions}
                    category={formData.category}
                  />
                </>
              )}
            </div>
          )}

          {/* Notes - separate from THEN block */}
          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              className="mt-1"
              placeholder="Additional notes about this rule..."
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Source Reference - at the bottom */}
          <div>
            <Label className="text-sm font-medium">Source Reference</Label>
            <Input
              className="mt-1"
              placeholder="URL or statute number (e.g., PA Code 179.10)"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            Save & Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
