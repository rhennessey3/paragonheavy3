"use client";

import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import { SystemFieldCard } from "./SystemFieldCard";
import { StateFieldItem } from "./StateFieldItem";
import { FIELD_CATEGORIES, getCategoryInfo } from "@/lib/systemFields";

interface FieldMapperProps {
  jurisdictionId: Id<"jurisdictions">;
  jurisdictionName: string;
  jurisdictionAbbreviation: string;
}

export function FieldMapper({
  jurisdictionId,
  jurisdictionName,
  jurisdictionAbbreviation,
}: FieldMapperProps) {
  const [systemFieldSearch, setSystemFieldSearch] = useState("");
  const [stateFieldSearch, setStateFieldSearch] = useState("");
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldType, setNewFieldType] = useState("string");
  const [activeId, setActiveId] = useState<Id<"stateFields"> | null>(null);

  const systemFields = useQuery(api.systemFields.getSystemFields, {});
  const stateFieldsWithStatus = useQuery(api.stateFields.getStateFieldsWithMappingStatus, {
    jurisdictionId,
  });
  const mappingsWithDetails = useQuery(api.stateFields.getMappingsWithStateFields, {
    jurisdictionId,
  });

  const createStateField = useMutation(api.stateFields.createStateField);
  const createMapping = useMutation(api.stateFields.createMappingWithStateField);
  const removeMapping = useMutation(api.stateFields.removeMappingBySystemField);

  // Filter system fields by search
  const filteredSystemFields = useMemo(() => {
    if (!systemFields) return [];
    if (!systemFieldSearch) return systemFields;
    const query = systemFieldSearch.toLowerCase();
    return systemFields.filter(
      (f) =>
        f.label.toLowerCase().includes(query) ||
        f.key.toLowerCase().includes(query)
    );
  }, [systemFields, systemFieldSearch]);

  // Group system fields by category
  const systemFieldsByCategory = useMemo(() => {
    const grouped = new Map<string, typeof filteredSystemFields>();
    for (const field of filteredSystemFields) {
      const existing = grouped.get(field.category) || [];
      existing.push(field);
      grouped.set(field.category, existing);
    }
    return grouped;
  }, [filteredSystemFields]);

  // Filter state fields by search
  const filteredStateFields = useMemo(() => {
    if (!stateFieldsWithStatus) return [];
    if (!stateFieldSearch) return stateFieldsWithStatus;
    const query = stateFieldSearch.toLowerCase();
    return stateFieldsWithStatus.filter(
      (f) =>
        f.key.toLowerCase().includes(query) ||
        (f.label && f.label.toLowerCase().includes(query))
    );
  }, [stateFieldsWithStatus, stateFieldSearch]);

  // Create a map of systemFieldId -> mapped state field
  const mappingsBySystemField = useMemo(() => {
    const map = new Map<string, NonNullable<typeof mappingsWithDetails>[number]>();
    if (mappingsWithDetails) {
      for (const mapping of mappingsWithDetails) {
        if (mapping.stateField) {
          map.set(mapping.systemFieldId, mapping);
        }
      }
    }
    return map;
  }, [mappingsWithDetails]);

  // Get active dragged item
  const activeStateField = useMemo(() => {
    if (!activeId || !stateFieldsWithStatus) return null;
    return stateFieldsWithStatus.find((f) => f._id === activeId);
  }, [activeId, stateFieldsWithStatus]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as Id<"stateFields">);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const stateFieldId = active.id as Id<"stateFields">;
    const systemFieldId = over.id as Id<"systemFields">;

    try {
      await createMapping({
        jurisdictionId,
        systemFieldId,
        stateFieldId,
      });
    } catch (error) {
      console.error("Error creating mapping:", error);
    }
  };

  const handleUnlink = async (systemFieldId: Id<"systemFields">) => {
    try {
      await removeMapping({
        jurisdictionId,
        systemFieldId,
      });
    } catch (error) {
      console.error("Error removing mapping:", error);
    }
  };

  const handleAddField = async () => {
    if (!newFieldKey.trim()) return;

    try {
      await createStateField({
        jurisdictionId,
        key: newFieldKey.trim(),
        dataType: newFieldType,
      });
      setNewFieldKey("");
    } catch (error) {
      console.error("Error creating state field:", error);
    }
  };

  // Calculate stats
  const totalSystemFields = systemFields?.length || 0;
  const mappedCount = mappingsBySystemField.size;
  const coveragePercent = totalSystemFields > 0 ? Math.round((mappedCount / totalSystemFields) * 100) : 0;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 h-full">
        {/* Left Panel - System Fields */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Fields</h2>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {mappedCount}/{totalSystemFields}
              </span>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search system fields..."
              value={systemFieldSearch}
              onChange={(e) => setSystemFieldSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {FIELD_CATEGORIES.map((category) => {
              const fields = systemFieldsByCategory.get(category.value) || [];
              if (fields.length === 0) return null;

              return (
                <div key={category.value}>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {category.label}
                  </h3>
                  <div className="space-y-3">
                    {fields.map((field) => {
                      const mapping = mappingsBySystemField.get(field._id);
                      return (
                        <SystemFieldCard
                          key={field._id}
                          id={field._id}
                          fieldKey={field.key}
                          label={field.label}
                          dataType={field.dataType}
                          description={field.description}
                          isRequired={field.isRequired}
                          category={category.label}
                          categoryColor={category.color}
                          mappedStateField={mapping?.stateField || null}
                          onUnlink={() => handleUnlink(field._id)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-200" />

        {/* Right Panel - State Fields */}
        <div className="w-80 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {jurisdictionAbbreviation} Fields
          </h2>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${jurisdictionAbbreviation} fields...`}
              value={stateFieldSearch}
              onChange={(e) => setStateFieldSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Add new field */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="New field key..."
              value={newFieldKey}
              onChange={(e) => setNewFieldKey(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddField();
              }}
            />
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value)}
              className="border rounded-md px-2 text-sm bg-white"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="date">Date</option>
            </select>
            <Button onClick={handleAddField} size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredStateFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No fields defined yet.</p>
                <p className="text-xs mt-1">Add fields above to start mapping.</p>
              </div>
            ) : (
              filteredStateFields.map((field) => (
                <StateFieldItem
                  key={field._id}
                  id={field._id}
                  fieldKey={field.key}
                  label={field.label}
                  dataType={field.dataType}
                  isMapped={field.isMapped}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeStateField && (
          <div className="flex items-center gap-3 p-3 bg-white border rounded-md shadow-xl ring-2 ring-blue-500">
            <div className="flex-1 min-w-0">
              <span className="font-mono text-sm text-gray-900">
                {activeStateField.key}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {activeStateField.dataType}
            </Badge>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
