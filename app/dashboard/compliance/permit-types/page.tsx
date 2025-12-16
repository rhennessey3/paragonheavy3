"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Plus, 
  FileText,
  Settings,
  Check,
  X,
  Edit2,
  Trash2,
  Database,
  MapPin,
  Globe,
  Copy
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";

export default function PermitTypesPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newJurisdictionId, setNewJurisdictionId] = useState<string>("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [copyFromPermitTypeId, setCopyFromPermitTypeId] = useState<string>("");

  const permitTypeStats = useQuery(api.permitTypes.getPermitTypeStats, {});
  const allPermitTypes = useQuery(api.permitTypes.getAllPermitTypes, {});
  const systemFields = useQuery(api.systemFields.getSystemFields, {});
  const states = useQuery(api.compliance.getJurisdictions, { type: "state" });
  const seedPermitTypes = useMutation(api.permitTypes.seedPermitTypes);
  const seedPermitTypeFields = useMutation(api.permitTypes.seedPermitTypeFields);
  const createPermitType = useMutation(api.permitTypes.createPermitType);
  const deletePermitType = useMutation(api.permitTypes.deletePermitType);
  const copyPermitTypeFields = useMutation(api.permitTypes.copyPermitTypeFields);

  const handleSeedTypes = async () => {
    try {
      const result = await seedPermitTypes({});
      
      // Seed field configurations for each created type
      for (const key of result.created) {
        try {
          await seedPermitTypeFields({ permitTypeKey: key });
        } catch (e) {
          console.warn(`Could not seed fields for ${key}:`, e);
        }
      }
      
      alert(`Created ${result.created.length} permit types. ${result.skipped.length} already existed.`);
    } catch (error) {
      console.error("Error seeding permit types:", error);
      alert("Error seeding permit types. Check console for details.");
    }
  };

  const handleCreate = async () => {
    if (!newKey.trim() || !newLabel.trim()) {
      alert("Key and Label are required");
      return;
    }

    try {
      const newPermitTypeId = await createPermitType({
        key: newKey.trim().toLowerCase().replace(/\s+/g, "_"),
        label: newLabel.trim(),
        description: newDescription.trim() || undefined,
        jurisdictionId: newJurisdictionId ? (newJurisdictionId as Id<"jurisdictions">) : undefined,
      });

      // If copying from another permit type, copy the field configurations
      if (copyFromPermitTypeId) {
        await copyPermitTypeFields({
          sourcePermitTypeId: copyFromPermitTypeId as Id<"permitTypes">,
          targetPermitTypeId: newPermitTypeId,
        });
      }

      setIsCreating(false);
      setNewKey("");
      setNewLabel("");
      setNewDescription("");
      setNewJurisdictionId("");
      setCopyFromPermitTypeId("");
    } catch (error: any) {
      alert(error.message || "Error creating permit type");
    }
  };

  // Filter permit types by jurisdiction
  const filteredPermitTypes = useMemo(() => {
    if (!permitTypeStats) return [];
    
    if (jurisdictionFilter === "all") {
      return permitTypeStats;
    } else if (jurisdictionFilter === "global") {
      return permitTypeStats.filter(pt => !pt.jurisdictionId);
    } else {
      return permitTypeStats.filter(pt => pt.jurisdictionId === jurisdictionFilter);
    }
  }, [permitTypeStats, jurisdictionFilter]);

  const handleDelete = async (id: Id<"permitTypes">, label: string) => {
    if (!confirm(`Delete "${label}"? This will also remove all field configurations.`)) {
      return;
    }

    try {
      await deletePermitType({ permitTypeId: id });
    } catch (error) {
      console.error("Error deleting permit type:", error);
      alert("Error deleting permit type");
    }
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Permit Types</h1>
                <p className="text-gray-600 text-sm">
                  Configure which fields appear on each permit form by state/county
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {(!permitTypeStats || permitTypeStats.length === 0) && (
                <Button
                  variant="outline"
                  onClick={handleSeedTypes}
                  className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Seed 5 Types
                </Button>
              )}
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Permit Type
              </Button>
            </div>
          </div>

          {/* Jurisdiction Filter */}
          {permitTypeStats && permitTypeStats.length > 0 && (
            <div className="mb-6 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by:</label>
              <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      All Jurisdictions
                    </div>
                  </SelectItem>
                  <SelectItem value="global">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Global (No specific jurisdiction)
                    </div>
                  </SelectItem>
                  {states && states.map((state) => (
                    <SelectItem key={state._id} value={state._id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {state.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">
                Showing {filteredPermitTypes.length} permit type{filteredPermitTypes.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Create Form */}
          {isCreating && (
            <Card className="p-4 mb-6 border-blue-200 bg-blue-50">
              <h3 className="font-semibold text-gray-900 mb-4">New Permit Type</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Key *</label>
                  <Input
                    placeholder="e.g., multi_trip"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique identifier (lowercase)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Label *</label>
                  <Input
                    placeholder="e.g., Multi-Trip Permit"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                  <Input
                    placeholder="Brief description..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Jurisdiction</label>
                  <SearchableSelect
                    value={newJurisdictionId || "none"}
                    onValueChange={(val) => setNewJurisdictionId(val === "none" ? "" : val)}
                    placeholder="Global (all states)"
                    searchPlaceholder="Search states..."
                    emptyMessage="No states found"
                    options={[
                      {
                        value: "none",
                        label: "Global (all states)",
                        icon: <Globe className="h-4 w-4" />,
                      },
                      ...(states?.map((state) => ({
                        value: state._id,
                        label: `${state.name} (${state.abbreviation})`,
                        icon: <MapPin className="h-4 w-4" />,
                      })) || []),
                    ]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select a specific state or leave as global
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Copy Field Configuration From (Optional)
                  </label>
                  <Select value={copyFromPermitTypeId || "none"} onValueChange={(val) => setCopyFromPermitTypeId(val === "none" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Start with blank configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Start with blank configuration
                        </div>
                      </SelectItem>
                      {allPermitTypes && allPermitTypes.map((pt) => (
                        <SelectItem key={pt._id} value={pt._id}>
                          <div className="flex items-center gap-2">
                            <Copy className="h-4 w-4" />
                            {pt.label}
                            {pt.jurisdiction && (
                              <span className="text-xs text-gray-500">
                                ({pt.jurisdiction.name})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Copy required/optional/hidden settings from an existing permit type
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create
                </Button>
              </div>
            </Card>
          )}

          {/* Permit Types List */}
          {!permitTypeStats || permitTypeStats.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Permit Types</h3>
              <p className="text-gray-600 mb-4">
                Click "Seed 5 Types" to create common permit types with default field configurations,
                or add a custom permit type.
              </p>
            </Card>
          ) : filteredPermitTypes.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matching Permit Types</h3>
              <p className="text-gray-600 mb-4">
                No permit types found for the selected jurisdiction.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPermitTypes.map((pt) => (
                <Card 
                  key={pt._id} 
                  className={`p-5 hover:shadow-md transition-shadow ${!pt.isActive ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{pt.label}</h3>
                        {pt.jurisdiction ? (
                          <Badge className="bg-purple-100 text-purple-800 text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {pt.jurisdiction.abbreviation || pt.jurisdiction.name}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 text-xs flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Global
                          </Badge>
                        )}
                      </div>
                      <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {pt.key}
                      </code>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(pt._id, pt.label)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {pt.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pt.description}</p>
                  )}

                  {/* Field Stats */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Fields configured</span>
                      <span className="font-medium">
                        {pt.fieldStats.total} / {totalFields}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        {pt.fieldStats.required} required
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {pt.fieldStats.optional} optional
                      </Badge>
                      {pt.fieldStats.hidden > 0 && (
                        <Badge className="bg-gray-100 text-gray-600 text-xs">
                          {pt.fieldStats.hidden} hidden
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/compliance/permit-types/${pt._id}/fields`)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Fields
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
