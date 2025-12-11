"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Send, Trash2, Archive, Clock } from "lucide-react";
import { RuleConditionsEditor } from "@/components/compliance/RuleConditionsEditor";
import { RULE_CATEGORIES, RULE_STATUSES, getStatusInfo, type RuleCondition, type RuleCategory } from "@/lib/compliance";
import { Id } from "@/convex/_generated/dataModel";

export default function EditRulePage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params.ruleId as Id<"complianceRules">;

  const rule = useQuery(api.compliance.getRuleById, { ruleId });
  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });
  const updateRule = useMutation(api.compliance.updateRule);
  const updateRuleStatus = useMutation(api.compliance.updateRuleStatus);
  const deleteRule = useMutation(api.compliance.deleteRule);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "" as RuleCategory | "",
    title: "",
    summary: "",
    source: "",
    effectiveFrom: "",
    effectiveTo: "",
  });
  const [conditions, setConditions] = useState<RuleCondition>({});

  useEffect(() => {
    if (rule) {
      setFormData({
        category: rule.category,
        title: rule.title,
        summary: rule.summary,
        source: rule.source || "",
        effectiveFrom: rule.effectiveFrom ? new Date(rule.effectiveFrom).toISOString().split("T")[0] : "",
        effectiveTo: rule.effectiveTo ? new Date(rule.effectiveTo).toISOString().split("T")[0] : "",
      });
      setConditions(rule.conditions || {});
    }
  }, [rule]);

  if (!rule) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(rule.status);

  const handleSave = async () => {
    if (!formData.category || !formData.title || !formData.summary) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRule({
        ruleId,
        category: formData.category as any,
        title: formData.title,
        summary: formData.summary,
        source: formData.source || undefined,
        effectiveFrom: formData.effectiveFrom ? new Date(formData.effectiveFrom).getTime() : undefined,
        effectiveTo: formData.effectiveTo ? new Date(formData.effectiveTo).getTime() : undefined,
        conditions,
      });

      alert("Rule saved successfully");
    } catch (error) {
      console.error("Error updating rule:", error);
      alert("Error updating rule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsSubmitting(true);
    try {
      await updateRuleStatus({
        ruleId,
        status: newStatus as any,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this rule? This action cannot be undone.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteRule({ ruleId });
      router.push("/dashboard/compliance/rules");
    } catch (error: any) {
      console.error("Error deleting rule:", error);
      alert(error.message || "Error deleting rule. Please try again.");
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
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Edit Rule</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                <span className="text-sm text-gray-500">
                  {rule.jurisdiction?.name || "Unknown Jurisdiction"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {rule.status === "draft" && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            {rule.status === "published" && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("archived")}
                disabled={isSubmitting}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            )}
            {rule.status === "draft" && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("in_review")}
                disabled={isSubmitting}
              >
                <Clock className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            )}
            {(rule.status === "draft" || rule.status === "in_review") && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("published")}
                disabled={isSubmitting}
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
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
                  <Label className="text-sm font-medium">Jurisdiction</Label>
                  <Input
                    className="mt-1"
                    value={rule.jurisdiction?.name || "Unknown"}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Jurisdiction cannot be changed after creation
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => {
                      setFormData({ ...formData, category: v as RuleCategory });
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

          {/* Metadata */}
          <Card className="p-6 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>{" "}
                <span className="text-gray-900">
                  {new Date(rule.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>{" "}
                <span className="text-gray-900">
                  {new Date(rule.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
