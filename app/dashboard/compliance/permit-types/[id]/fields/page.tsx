"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Save,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  MapPin,
  Globe
} from "lucide-react";
import { FIELD_CATEGORIES, getCategoryInfo } from "@/lib/systemFields";
import { FIELD_REQUIREMENTS, getRequirementInfo, type FieldRequirement } from "@/lib/permitTypes";
import { Id } from "@/convex/_generated/dataModel";

export default function PermitTypeFieldsPage() {
  const router = useRouter();
  const params = useParams();
  const permitTypeId = params.id as Id<"permitTypes">;

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(FIELD_CATEGORIES.map(c => c.value))
  );
  const [pendingChanges, setPendingChanges] = useState<Map<string, FieldRequirement>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const permitType = useQuery(api.permitTypes.getPermitTypeById, { permitTypeId });
  const systemFields = useQuery(api.systemFields.getSystemFields, {});
  const currentConfig = useQuery(api.permitTypes.getPermitTypeFields, { permitTypeId });
  const bulkSetRequirements = useMutation(api.permitTypes.bulkSetFieldRequirements);

  // Build a map of current configurations
  const configMap = useMemo(() => {
    const map = new Map<string, { requirement: FieldRequirement; sortOrder: number }>();
    if (currentConfig) {
      for (const config of currentConfig) {
        map.set(config.systemFieldId, {
          requirement: config.requirement,
          sortOrder: config.sortOrder,
        });
      }
    }
    return map;
  }, [currentConfig]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleRequirementChange = (fieldId: string, requirement: FieldRequirement) => {
    setPendingChanges(prev => {
      const next = new Map(prev);
      const current = configMap.get(fieldId);
      
      // If setting back to original value, remove from pending
      if (current && current.requirement === requirement) {
        next.delete(fieldId);
      } else {
        next.set(fieldId, requirement);
      }
      
      return next;
    });
  };

  const getEffectiveRequirement = (fieldId: string): FieldRequirement => {
    if (pendingChanges.has(fieldId)) {
      return pendingChanges.get(fieldId)!;
    }
    const config = configMap.get(fieldId);
    return config?.requirement || "hidden";
  };

  const handleSave = async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    try {
      const fields = Array.from(pendingChanges.entries()).map(([fieldId, requirement], index) => {
        const existingConfig = configMap.get(fieldId);
        return {
          systemFieldId: fieldId as Id<"systemFields">,
          requirement,
          sortOrder: existingConfig?.sortOrder || (systemFields?.findIndex(f => f._id === fieldId) || 0) + 1,
        };
      });

      await bulkSetRequirements({
        permitTypeId,
        fields,
      });

      setPendingChanges(new Map());
      alert("Field configurations saved successfully!");
    } catch (error) {
      console.error("Error saving configurations:", error);
      alert("Error saving configurations");
    } finally {
      setIsSaving(false);
    }
  };

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped = new Map<string, typeof systemFields>();
    if (systemFields) {
      for (const field of systemFields) {
        const existing = grouped.get(field.category) || [];
        existing.push(field);
        grouped.set(field.category, existing);
      }
    }
    return grouped;
  }, [systemFields]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!systemFields) return { required: 0, optional: 0, hidden: 0, configured: 0 };
    
    let required = 0;
    let optional = 0;
    let hidden = 0;

    for (const field of systemFields) {
      const req = getEffectiveRequirement(field._id);
      if (req === "required") required++;
      else if (req === "optional") optional++;
      else hidden++;
    }

    return { required, optional, hidden, configured: required + optional };
  }, [systemFields, configMap, pendingChanges]);

  if (!permitType) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-white">
        <div className="px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/compliance/permit-types")}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{permitType.label}</h1>
                  {permitType.jurisdiction ? (
                    <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {permitType.jurisdiction.name}
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Global
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 text-sm">
                  Configure which fields appear on this permit form
                </p>
              </div>
            </div>
            {pendingChanges.size > 0 && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save {pendingChanges.size} Changes
              </Button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">{stats.required}</Badge>
                  <span className="text-sm text-gray-600">Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">{stats.optional}</Badge>
                  <span className="text-sm text-gray-600">Optional</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-100 text-gray-600">{stats.hidden}</Badge>
                  <span className="text-sm text-gray-600">Hidden</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {stats.configured} of {systemFields?.length || 0} fields visible on form
              </div>
            </div>
          </div>

          {/* Field Configuration */}
          <div className="space-y-4">
            {FIELD_CATEGORIES.map((category) => {
              const fields = fieldsByCategory.get(category.value) || [];
              const isExpanded = expandedCategories.has(category.value);

              if (fields.length === 0) return null;

              // Category stats
              const categoryStats = {
                required: fields.filter(f => getEffectiveRequirement(f._id) === "required").length,
                optional: fields.filter(f => getEffectiveRequirement(f._id) === "optional").length,
                hidden: fields.filter(f => getEffectiveRequirement(f._id) === "hidden").length,
              };

              return (
                <Card key={category.value} className="overflow-hidden">
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left"
                    onClick={() => toggleCategory(category.value)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      <Badge className={category.color}>{category.label}</Badge>
                      <span className="text-sm text-gray-500">
                        {categoryStats.required + categoryStats.optional} / {fields.length} visible
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {categoryStats.required > 0 && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          {categoryStats.required} req
                        </Badge>
                      )}
                      {categoryStats.optional > 0 && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {categoryStats.optional} opt
                        </Badge>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-32">Required</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-32">Optional</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-32">Hidden</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {fields.map((field) => {
                            const currentReq = getEffectiveRequirement(field._id);
                            const hasChange = pendingChanges.has(field._id);

                            return (
                              <tr key={field._id} className={`hover:bg-gray-50 ${hasChange ? "bg-yellow-50" : ""}`}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {hasChange && (
                                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    )}
                                    <div>
                                      <span className="text-sm font-medium text-gray-900">
                                        {field.label}
                                      </span>
                                      <div className="text-xs text-gray-500">{field.description}</div>
                                    </div>
                                  </div>
                                </td>
                                {(["required", "optional", "hidden"] as FieldRequirement[]).map((req) => (
                                  <td key={req} className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handleRequirementChange(field._id, req)}
                                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        currentReq === req
                                          ? req === "required"
                                            ? "bg-red-500 border-red-500 text-white"
                                            : req === "optional"
                                              ? "bg-blue-500 border-blue-500 text-white"
                                              : "bg-gray-400 border-gray-400 text-white"
                                          : "border-gray-300 hover:border-gray-400"
                                      }`}
                                    >
                                      {currentReq === req && <Check className="h-4 w-4" />}
                                    </button>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
