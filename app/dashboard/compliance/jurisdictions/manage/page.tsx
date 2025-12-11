"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  TreeDeciduous,
  Map,
  Plus,
  Database,
  Layers,
} from "lucide-react";
import { JurisdictionTree } from "@/components/compliance/JurisdictionTree";
import { CountySelector } from "@/components/compliance/CountySelector";

export default function JurisdictionManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("hierarchy");
  const [selectedStateId, setSelectedStateId] = useState<Id<"jurisdictions"> | null>(null);
  const [isCreateDistrictOpen, setIsCreateDistrictOpen] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState("");
  const [newDistrictCode, setNewDistrictCode] = useState("");
  const [selectedCountyIds, setSelectedCountyIds] = useState<Id<"jurisdictions">[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const states = useQuery(api.compliance.getJurisdictions, { type: "state" });
  const seedStates = useMutation(api.compliance.seedUSStates);
  const seedPADistricts = useMutation(api.compliance.seedPennsylvaniaDistricts);
  const createDistrict = useMutation(api.compliance.createDistrict);

  const handleSeedStates = async () => {
    try {
      const result = await seedStates({});
      alert(`Created ${result.created.length} states. ${result.skipped.length} already existed.`);
    } catch (error) {
      console.error("Error seeding states:", error);
      alert("Error seeding states.");
    }
  };

  const handleSeedPAData = async () => {
    try {
      // This will seed both counties (if needed) and districts
      const result = await seedPADistricts({});
      alert(
        `Created ${result.createdDistricts.length} districts. ${result.skippedDistricts.length} already existed. Counties were also seeded if needed.`
      );
    } catch (error: any) {
      console.error("Error seeding PA data:", error);
      alert(error.message || "Error seeding PA data.");
    }
  };

  const handleCreateDistrict = async () => {
    if (!selectedStateId || !newDistrictName || !newDistrictCode || selectedCountyIds.length === 0) {
      alert("Please fill in all fields and select at least one county.");
      return;
    }

    setIsCreating(true);
    try {
      await createDistrict({
        name: newDistrictName,
        code: newDistrictCode,
        parentId: selectedStateId,
        countyIds: selectedCountyIds,
      });
      setIsCreateDistrictOpen(false);
      setNewDistrictName("");
      setNewDistrictCode("");
      setSelectedCountyIds([]);
      alert("District created successfully!");
    } catch (error: any) {
      console.error("Error creating district:", error);
      alert(error.message || "Error creating district.");
    } finally {
      setIsCreating(false);
    }
  };

  const openCreateDistrictDialog = (stateId: Id<"jurisdictions">) => {
    setSelectedStateId(stateId);
    setIsCreateDistrictOpen(true);
  };

  const selectedState = states?.find((s) => s._id === selectedStateId);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/compliance/jurisdictions")}
              className="text-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Jurisdiction Management
              </h1>
              <p className="text-gray-600 text-sm">
                Define states, counties, and permit districts
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {(!states || states.length === 0) && (
              <Button
                variant="outline"
                onClick={handleSeedStates}
                className="border-blue-200 bg-blue-50 text-blue-700"
              >
                <Database className="h-4 w-4 mr-2" />
                Seed US States
              </Button>
            )}
            {states && states.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSeedPAData}
                  className="border-purple-200 bg-purple-50 text-purple-700"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Seed PA Counties & Districts
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <TreeDeciduous className="h-4 w-4" />
              Hierarchy View
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create District
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy" className="flex-1">
            <Card className="h-full overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-medium text-gray-900">State & District Hierarchy</h3>
                <p className="text-sm text-gray-600">
                  Click on a state to expand and view its districts and counties
                </p>
              </div>
              <div className="p-4 overflow-y-auto max-h-[600px]">
                <JurisdictionTree
                  onSelectState={(stateId) => setSelectedStateId(stateId)}
                  onCreateDistrict={openCreateDistrictDialog}
                  selectedId={selectedStateId || undefined}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="flex-1">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Left: State & District Info */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-medium text-gray-900">Create New District</h3>
                  <p className="text-sm text-gray-600">
                    Select a state and define a new permit district
                  </p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      State
                    </label>
                    <Select
                      value={selectedStateId || ""}
                      onValueChange={(v) => {
                        setSelectedStateId(v as Id<"jurisdictions">);
                        setSelectedCountyIds([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state..." />
                      </SelectTrigger>
                      <SelectContent>
                        {states?.map((state) => (
                          <SelectItem key={state._id} value={state._id}>
                            {state.name} ({state.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      District Name
                    </label>
                    <Input
                      placeholder="e.g., District 10-0"
                      value={newDistrictName}
                      onChange={(e) => setNewDistrictName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      District Code
                    </label>
                    <Input
                      placeholder="e.g., 10"
                      value={newDistrictCode}
                      onChange={(e) => setNewDistrictCode(e.target.value)}
                    />
                  </div>

                  {selectedCountyIds.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-800 mb-1">
                        Selected Counties: {selectedCountyIds.length}
                      </div>
                      <p className="text-xs text-blue-600">
                        Use the panel on the right to select counties for this district
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleCreateDistrict}
                    disabled={
                      !selectedStateId ||
                      !newDistrictName ||
                      !newDistrictCode ||
                      selectedCountyIds.length === 0 ||
                      isCreating
                    }
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create District
                  </Button>
                </div>
              </Card>

              {/* Right: County Selector */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-medium text-gray-900">Select Counties</h3>
                  <p className="text-sm text-gray-600">
                    {selectedStateId
                      ? "Select the counties that make up this district"
                      : "Select a state first"}
                  </p>
                </div>
                {selectedStateId ? (
                  <CountySelector
                    stateId={selectedStateId}
                    selectedCountyIds={selectedCountyIds}
                    onSelectionChange={setSelectedCountyIds}
                  />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Map className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Select a state to view its counties</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create District Dialog (alternative quick create) */}
      <Dialog open={isCreateDistrictOpen} onOpenChange={setIsCreateDistrictOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Create District in {selectedState?.name || "..."}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  District Name
                </label>
                <Input
                  placeholder="e.g., District 10-0"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  District Code
                </label>
                <Input
                  placeholder="e.g., 10"
                  value={newDistrictCode}
                  onChange={(e) => setNewDistrictCode(e.target.value)}
                />
              </div>
              {selectedCountyIds.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">
                    {selectedCountyIds.length} counties selected
                  </div>
                </div>
              )}
            </div>
            <div className="border rounded-lg overflow-hidden">
              {selectedStateId && (
                <CountySelector
                  stateId={selectedStateId}
                  selectedCountyIds={selectedCountyIds}
                  onSelectionChange={setSelectedCountyIds}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDistrictOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDistrict}
              disabled={
                !newDistrictName ||
                !newDistrictCode ||
                selectedCountyIds.length === 0 ||
                isCreating
              }
            >
              Create District
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
