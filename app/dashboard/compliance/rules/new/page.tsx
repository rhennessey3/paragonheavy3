"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Send } from "lucide-react";
import { RuleConditionsEditor } from "@/components/compliance/RuleConditionsEditor";
import { RULE_CATEGORIES, type RuleCondition, type RuleCategory } from "@/lib/compliance";
import { Id } from "@/convex/_generated/dataModel";

export default function CreateRulePage() {
  const router = useRouter();
  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });
  const createRule = useMutation(api.compliance.createRule);
  const updateRuleStatus = useMutation(api.compliance.updateRuleStatus);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    jurisdictionId: "" as string,
    category: "" as RuleCategory | "",
    title: "",
    summary: "",
    source: "",
    effectiveFrom: "",
    effectiveTo: "",
  });
  const [conditions, setConditions] = useState<RuleCondition>({});

  const handleSubmit = async (publish: boolean = false) => {
    if (!formData.jurisdictionId || !formData.category || !formData.title || !formData.summary) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const ruleId = await createRule({
        jurisdictionId: formData.jurisdictionId as Id<"jurisdictions">,
        category: formData.category as any,
        title: formData.title,
        summary: formData.summary,
        source: formData.source || undefined,
        effectiveFrom: formData.effectiveFrom ? new Date(formData.effectiveFrom).getTime() : undefined,
        effectiveTo: formData.effectiveTo ? new Date(formData.effectiveTo).getTime() : undefined,
        conditions,
      });

      if (publish) {
        await updateRuleStatus({ ruleId, status: "published" });
      }

      router.push("/dashboard/compliance/rules");
    } catch (error) {
      console.error("Error creating rule:", error);
      alert("Error creating rule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Create New Rule</h1>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Save & Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Jurisdiction <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.jurisdictionId}
                    onValueChange={(v) => setFormData({ ...formData, jurisdictionId: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions?.map((j) => (
                        <SelectItem key={j._id} value={j._id}>
                          {j.name} {j.abbreviation ? `(${j.abbreviation})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => {
                      setFormData({ ...formData, category: v as RuleCategory });
                      setConditions({});
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
                  rows={4}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Source Reference</Label>
                <Input
                  className="mt-1"
                  placeholder="URL or statute number (e.g., 625 ILCS 5/15-301)"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
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
            </div>
          </Card>

          {/* Conditions */}
          {formData.category && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rule Conditions</h3>
              <p className="text-sm text-gray-600 mb-4">
                Define the conditions that trigger this rule. These are used to automatically 
                check routes against compliance requirements.
              </p>
              <RuleConditionsEditor
                conditions={conditions}
                onChange={setConditions}
                category={formData.category}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
