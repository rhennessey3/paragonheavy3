"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Database, 
  ChevronDown, 
  ChevronRight,
  Edit2,
  Link2,
  Check,
  X
} from "lucide-react";
import { FIELD_CATEGORIES, getCategoryInfo, getDataTypeInfo, type FieldCategory } from "@/lib/systemFields";
import { Id } from "@/convex/_generated/dataModel";

export default function SystemFieldsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(FIELD_CATEGORIES.map(c => c.value))
  );
  const [editingField, setEditingField] = useState<Id<"systemFields"> | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const systemFields = useQuery(api.systemFields.getSystemFields, {});
  const seedFields = useMutation(api.systemFields.seedSystemFields);
  const updateField = useMutation(api.systemFields.updateSystemField);

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

  const handleSeedFields = async () => {
    try {
      const result = await seedFields({});
      alert(`Seeded ${result.created.length} fields. ${result.skipped.length} already existed.`);
    } catch (error) {
      console.error("Error seeding fields:", error);
      alert("Error seeding fields. Check console for details.");
    }
  };

  const startEditing = (field: any) => {
    setEditingField(field._id);
    setEditLabel(field.label);
    setEditDescription(field.description || "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditLabel("");
    setEditDescription("");
  };

  const saveEditing = async () => {
    if (!editingField) return;
    
    try {
      await updateField({
        fieldId: editingField,
        label: editLabel,
        description: editDescription || undefined,
      });
      cancelEditing();
    } catch (error) {
      console.error("Error updating field:", error);
      alert("Error updating field.");
    }
  };

  // Group fields by category
  const fieldsByCategory = new Map<string, typeof systemFields>();
  if (systemFields) {
    for (const field of systemFields) {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!field.label.toLowerCase().includes(query) && 
            !field.key.toLowerCase().includes(query) &&
            !(field.description?.toLowerCase().includes(query))) {
          continue;
        }
      }
      const existing = fieldsByCategory.get(field.category) || [];
      existing.push(field);
      fieldsByCategory.set(field.category, existing);
    }
  }

  const totalFields = systemFields?.length || 0;

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
                onClick={() => router.push("/dashboard/compliance")}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Fields</h1>
                <p className="text-gray-600 text-sm">
                  {totalFields} canonical fields in the data dictionary
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {totalFields === 0 && (
                <Button
                  variant="outline"
                  onClick={handleSeedFields}
                  className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Seed 29 Fields
                </Button>
              )}
              <Button
                onClick={() => router.push("/dashboard/compliance/fields/mapper")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Field Mapper
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Fields by Category */}
          {totalFields === 0 ? (
            <Card className="p-8 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No System Fields</h3>
              <p className="text-gray-600 mb-4">
                Click "Seed 29 Fields" to populate the canonical permit data dictionary.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {FIELD_CATEGORIES.map((category) => {
                const fields = fieldsByCategory.get(category.value) || [];
                const isExpanded = expandedCategories.has(category.value);
                
                if (searchQuery && fields.length === 0) return null;

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
                          {fields.length} {fields.length === 1 ? "field" : "fields"}
                        </span>
                      </div>
                    </button>

                    {isExpanded && fields.length > 0 && (
                      <div className="border-t border-gray-100">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field Key</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {fields.map((field) => (
                              <tr key={field._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                    {field.key}
                                  </code>
                                </td>
                                <td className="px-4 py-3">
                                  {editingField === field._id ? (
                                    <Input
                                      value={editLabel}
                                      onChange={(e) => setEditLabel(e.target.value)}
                                      className="h-8"
                                    />
                                  ) : (
                                    <span className="text-sm font-medium text-gray-900">
                                      {field.label}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className="text-xs">
                                    {getDataTypeInfo(field.dataType).label}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  {field.isRequired ? (
                                    <Badge className="bg-red-100 text-red-800 text-xs">Required</Badge>
                                  ) : (
                                    <span className="text-xs text-gray-400">Optional</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {editingField === field._id ? (
                                    <Input
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      className="h-8"
                                      placeholder="Description..."
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-600 line-clamp-1">
                                      {field.description || "-"}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {editingField === field._id ? (
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={saveEditing}
                                        className="h-8 w-8 p-0 text-green-600"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={cancelEditing}
                                        className="h-8 w-8 p-0 text-gray-400"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEditing(field)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
