"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CanvasBuilder } from "@/components/compliance/canvas";
import { 
  type CompliancePolicy, 
  type PolicyType,
  POLICY_TYPES,
} from "@/lib/compliance";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Palette, Shield } from "lucide-react";

export default function CanvasBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial params from URL
  const policyIdParam = searchParams.get("policyId");
  const policyTypeParam = searchParams.get("type") as PolicyType | null;
  const jurisdictionParam = searchParams.get("jurisdiction");

  // State
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>(jurisdictionParam || "");
  const [selectedPolicyType, setSelectedPolicyType] = useState<PolicyType>(policyTypeParam || "escort");
  const [isReady, setIsReady] = useState<boolean>(
    !!(policyIdParam || (jurisdictionParam && policyTypeParam))
  );

  // Fetch jurisdictions
  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });
  
  // Fetch existing policy if editing
  const existingPolicy = useQuery(
    api.policies.getPolicy,
    policyIdParam ? { policyId: policyIdParam as Id<"compliancePolicies"> } : "skip"
  );

  // Mutations
  const createPolicy = useMutation(api.policies.createPolicy);
  const updatePolicy = useMutation(api.policies.updatePolicy);

  // Get jurisdiction info
  const selectedJurisdictionInfo = useMemo(() => {
    if (!selectedJurisdiction || !jurisdictions) return null;
    return jurisdictions.find(j => j._id === selectedJurisdiction);
  }, [jurisdictions, selectedJurisdiction]);

  // Transform existing policy to the expected format
  const transformedPolicy = useMemo<CompliancePolicy | undefined>(() => {
    if (!existingPolicy) return undefined;
    return {
      _id: existingPolicy._id,
      jurisdictionId: existingPolicy.jurisdictionId,
      policyType: existingPolicy.policyType as PolicyType,
      name: existingPolicy.name,
      description: existingPolicy.description,
      status: existingPolicy.status as "draft" | "published" | "archived",
      conditions: existingPolicy.conditions || [],
      baseOutput: existingPolicy.baseOutput,
      mergeStrategies: existingPolicy.mergeStrategies,
      effectiveFrom: existingPolicy.effectiveFrom,
      effectiveTo: existingPolicy.effectiveTo,
      createdBy: existingPolicy.createdBy,
      updatedBy: existingPolicy.updatedBy,
      createdAt: existingPolicy.createdAt,
      updatedAt: existingPolicy.updatedAt,
    };
  }, [existingPolicy]);

  // Determine if we can show the canvas
  const canShowCanvas = isReady && (
    (policyIdParam && transformedPolicy) || 
    (selectedJurisdiction && selectedPolicyType)
  );

  // Get the actual jurisdiction to use
  const jurisdictionId = transformedPolicy?.jurisdictionId || selectedJurisdiction;
  const policyType = transformedPolicy?.policyType || selectedPolicyType;

  // Handle save
  const handleSave = useCallback(async (policyData: Partial<CompliancePolicy>) => {
    if (!jurisdictionId) {
      toast.error("Please select a jurisdiction");
      return;
    }

    try {
      if (policyData._id) {
        // Update existing
        await updatePolicy({
          policyId: policyData._id as Id<"compliancePolicies">,
          name: policyData.name,
          description: policyData.description,
          conditions: policyData.conditions,
          baseOutput: policyData.baseOutput,
          mergeStrategies: policyData.mergeStrategies,
        });
        toast.success("Policy saved successfully");
      } else {
        // Create new
        await createPolicy({
          jurisdictionId: jurisdictionId as Id<"jurisdictions">,
          policyType: policyType,
          name: policyData.name!,
          description: policyData.description,
          conditions: policyData.conditions,
          baseOutput: policyData.baseOutput,
          mergeStrategies: policyData.mergeStrategies,
        });
        toast.success("Policy created successfully");
      }
      
      // Navigate back to graph
      router.push(`/dashboard/compliance/graph?jurisdiction=${jurisdictionId}`);
    } catch (error) {
      console.error("Failed to save policy:", error);
      toast.error("Failed to save policy");
    }
  }, [jurisdictionId, policyType, createPolicy, updatePolicy, router]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Handle start building
  const handleStartBuilding = useCallback(() => {
    if (!selectedJurisdiction || !selectedPolicyType) {
      toast.error("Please select both a jurisdiction and policy type");
      return;
    }
    setIsReady(true);
  }, [selectedJurisdiction, selectedPolicyType]);

  // Show loading state while fetching existing policy
  if (policyIdParam && !existingPolicy) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-600">Loading policy...</p>
        </div>
      </div>
    );
  }

  // Show setup screen if not ready
  if (!canShowCanvas) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="h-6 w-px bg-gray-200" />
            
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              <h1 className="text-xl font-semibold">Canvas Policy Builder</h1>
            </div>
          </div>
        </div>

        {/* Setup Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-xl shadow-sm border p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Policy</h2>
                <p className="text-gray-600">
                  Build compliance policies visually by dragging and connecting nodes on the canvas.
                </p>
              </div>

              <div className="space-y-4">
                {/* Jurisdiction Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Jurisdiction
                  </label>
                  <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a jurisdiction..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions?.map((j) => (
                        <SelectItem key={j._id} value={j._id}>
                          {j.abbreviation ? `${j.abbreviation} - ` : ""}{j.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Policy Type Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Policy Type
                  </label>
                  <Select value={selectedPolicyType} onValueChange={(v) => setSelectedPolicyType(v as PolicyType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POLICY_TYPES.map((pt) => (
                        <SelectItem key={pt.key} value={pt.key}>
                          <div className="flex flex-col">
                            <span>{pt.label}</span>
                            <span className="text-xs text-gray-500">{pt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Info */}
                {selectedJurisdiction && selectedPolicyType && (
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-indigo-700">
                      You will create a <strong>{POLICY_TYPES.find(p => p.key === selectedPolicyType)?.label}</strong> for{" "}
                      <strong>{selectedJurisdictionInfo?.name || "the selected jurisdiction"}</strong>.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStartBuilding}
                  disabled={!selectedJurisdiction || !selectedPolicyType}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Start Building
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the canvas builder
  return (
    <div className="h-screen">
      <CanvasBuilder
        initialPolicy={transformedPolicy}
        policyType={policyType}
        jurisdictionId={jurisdictionId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}


