"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Search, 
  Check, 
  X,
  Link2,
  Link2Off,
  Save,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { FIELD_CATEGORIES, getCategoryInfo } from "@/lib/systemFields";
import { Id } from "@/convex/_generated/dataModel";

interface MappingEdit {
  systemFieldId: Id<"systemFields">;
  stateLabel: string;
  notes: string;
}

export default function StateMappingsPage() {
  const router = useRouter();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(FIELD_CATEGORIES.map(c => c.value))
  );
  const [pendingEdits, setPendingEdits] = useState<Map<string, MappingEdit>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });
  const systemFields = useQuery(api.systemFields.getSystemFields, {});
  const mappingCounts = useQuery(api.systemFields.getMappingCounts, {});
  
  const currentMappings = useQuery(
    api.systemFields.getStateMappings,
    selectedJurisdiction ? { jurisdictionId: selectedJurisdiction as Id<"jurisdictions"> } : "skip"
  );

  const createOrUpdateMapping = useMutation(api.systemFields.createOrUpdateMapping);

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

  // Create a map of systemFieldId -> mapping for quick lookup
  const mappingsMap = useMemo(() => {
    const map = new Map<string, any>();
    if (currentMappings) {
      for (const mapping of currentMappings) {
        map.set(mapping.systemFieldId, mapping);
      }
    }
    return map;
  }, [currentMappings]);

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped = new Map<string, any[]>();
    if (systemFields) {
      for (const field of systemFields) {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!field.label.toLowerCase().includes(query) && 
              !field.key.toLowerCase().includes(query)) {
            continue;
          }
        }
        const existing = grouped.get(field.category) || [];
        existing.push(field);
        grouped.set(field.category, existing);
      }
    }
    return grouped;
  }, [systemFields, searchQuery]);

  const handleLabelChange = (systemFieldId: Id<"systemFields">, stateLabel: string) => {
    setPendingEdits(prev => {
      const next = new Map(prev);
      const existing = next.get(systemFieldId) || { systemFieldId, stateLabel: "", notes: "" };
      next.set(systemFieldId, { ...existing, systemFieldId, stateLabel });
      return next;
    });
  };

  const handleNotesChange = (systemFieldId: Id<"systemFields">, notes: string) => {
    setPendingEdits(prev => {
      const next = new Map(prev);
      const existing = next.get(systemFieldId) || { systemFieldId, stateLabel: "", notes: "" };
      next.set(systemFieldId, { ...existing, systemFieldId, notes });
      return next;
    });
  };

  const saveAllMappings = async () => {
    if (!selectedJurisdiction || pendingEdits.size === 0) return;

    setIsSaving(true);
    try {
      const editsArray = Array.from(pendingEdits.entries());
      for (const [fieldId, edit] of editsArray) {
        if (edit.stateLabel.trim()) {
          await createOrUpdateMapping({
            jurisdictionId: selectedJurisdiction as Id<"jurisdictions">,
            systemFieldId: edit.systemFieldId,
            stateLabel: edit.stateLabel.trim(),
            notes: edit.notes.trim() || undefined,
          });
        }
      }
      setPendingEdits(new Map());
      alert("Mappings saved successfully!");
    } catch (error) {
      console.error("Error saving mappings:", error);
      alert("Error saving mappings.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedJurisdictionData = jurisdictions?.find(j => j._id === selectedJurisdiction);
  const totalFields = systemFields?.length || 0;
  const mappedCount = currentMappings?.filter(m => m.isActive).length || 0;
  const coveragePercent = totalFields > 0 ? Math.round((mappedCount / totalFields) * 100) : 0;

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
                onClick={() => router.push("/dashboard/compliance/fields")}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">State Field Mappings</h1>
                <p className="text-gray-600 text-sm">
                  Map state-specific field labels to canonical system fields
                </p>
              </div>
            </div>
            {pendingEdits.size > 0 && (
              <Button
                onClick={saveAllMappings}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save {pendingEdits.size} Changes
              </Button>
            )}
          </div>

          {/* State Selector */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-64">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Select State
                </label>
                <Select
                  value={selectedJurisdiction}
                  onValueChange={(v) => {
                    setSelectedJurisdiction(v);
                    setPendingEdits(new Map());
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions?.map((j) => {
                      const stats = mappingCounts?.jurisdictionStats.find(s => s.jurisdictionId === j._id);
                      return (
                        <SelectItem key={j._id} value={j._id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{j.name} ({j.abbreviation})</span>
                            {stats && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {stats.coverage}%
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedJurisdiction && (
                <>
                  <div className="relative flex-1 max-w-md">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Search Fields
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="ml-auto">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Coverage
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${coveragePercent}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {mappedCount}/{totalFields} ({coveragePercent}%)
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mapping Editor */}
          {!selectedJurisdiction ? (
            <Card className="p-8 text-center">
              <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a State</h3>
              <p className="text-gray-600">
                Choose a state from the dropdown above to view and edit its field mappings.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {FIELD_CATEGORIES.map((category) => {
                const fields = fieldsByCategory.get(category.value) || [];
                const isExpanded = expandedCategories.has(category.value);
                
                if (searchQuery && fields.length === 0) return null;

                const categoryMappedCount = fields.filter(f => mappingsMap.has(f._id)).length;

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
                          {categoryMappedCount}/{fields.length} mapped
                        </span>
                      </div>
                    </button>

                    {isExpanded && fields.length > 0 && (
                      <div className="border-t border-gray-100">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">System Field</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                {selectedJurisdictionData?.abbreviation || "State"} Label
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {fields.map((field) => {
                              const mapping = mappingsMap.get(field._id);
                              const pendingEdit = pendingEdits.get(field._id);
                              const isMapped = !!mapping;

                              return (
                                <tr key={field._id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-center">
                                    {isMapped ? (
                                      <Link2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Link2Off className="h-4 w-4 text-gray-300" />
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div>
                                      <span className="text-sm font-medium text-gray-900">
                                        {field.label}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        <code>{field.key}</code>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input
                                      placeholder={`What does ${selectedJurisdictionData?.abbreviation || "state"} call this?`}
                                      value={
                                        pendingEdit?.stateLabel ?? 
                                        mapping?.stateLabel ?? 
                                        ""
                                      }
                                      onChange={(e) => handleLabelChange(field._id, e.target.value)}
                                      className="h-9"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input
                                      placeholder="Optional notes..."
                                      value={
                                        pendingEdit?.notes ?? 
                                        mapping?.notes ?? 
                                        ""
                                      }
                                      onChange={(e) => handleNotesChange(field._id, e.target.value)}
                                      className="h-9"
                                    />
                                  </td>
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
          )}

          {/* Coverage Summary for All States */}
          {!selectedJurisdiction && mappingCounts && mappingCounts.jurisdictionStats.length > 0 && (
            <Card className="mt-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapping Coverage by State</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {mappingCounts.jurisdictionStats.slice(0, 12).map((stat) => (
                  <button
                    key={stat.jurisdictionId}
                    onClick={() => setSelectedJurisdiction(stat.jurisdictionId)}
                    className="p-3 border rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{stat.abbreviation}</span>
                      <Badge 
                        variant="outline" 
                        className={
                          stat.coverage === 100 
                            ? "bg-green-50 text-green-700" 
                            : stat.coverage > 0 
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-50 text-gray-500"
                        }
                      >
                        {stat.coverage}%
                      </Badge>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          stat.coverage === 100 
                            ? "bg-green-500" 
                            : stat.coverage > 0 
                              ? "bg-yellow-500"
                              : "bg-gray-300"
                        }`}
                        style={{ width: `${stat.coverage}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
              {mappingCounts.jurisdictionStats.length > 12 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Showing top 12 states by coverage. Select a state from dropdown to view all.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
