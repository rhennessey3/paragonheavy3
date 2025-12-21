"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Layers, AlertTriangle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { MultiPolicyCanvas } from "@/components/compliance/canvas";
import { 
  type PolicyType, 
  type CompliancePolicy,
} from "@/lib/compliance";
import { toast } from "sonner";

export default function PolicyGraphPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJurisdiction = searchParams.get("jurisdiction") || "all";
  
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>(initialJurisdiction);

  // Fetch jurisdictions for the filter dropdown
  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });

  // Fetch policies based on selected jurisdiction
  const policies = useQuery(api.policies.searchPolicies, {
    jurisdictionId: selectedJurisdiction !== "all" 
      ? selectedJurisdiction as Id<"jurisdictions"> 
      : undefined,
  });

  // Mutations
  const createPolicy = useMutation(api.policies.createPolicy);
  const updatePolicy = useMutation(api.policies.updatePolicy);
  const deletePolicy = useMutation(api.policies.deletePolicy);

  // Get selected jurisdiction info for display
  const selectedJurisdictionInfo = jurisdictions?.find(
    j => j._id === selectedJurisdiction
  );

  // Handle creating a new policy
  const handleCreatePolicy = useCallback(async (policyData: Partial<CompliancePolicy>): Promise<string> => {
    if (!policyData.jurisdictionId) {
      throw new Error("Jurisdiction is required");
    }

    const policyId = await createPolicy({
      jurisdictionId: policyData.jurisdictionId as Id<"jurisdictions">,
      policyType: policyData.policyType!,
      name: policyData.name!,
      description: policyData.description,
      conditions: policyData.conditions,
      baseOutput: policyData.baseOutput,
      mergeStrategies: policyData.mergeStrategies,
    });

    return policyId;
  }, [createPolicy]);

  // Handle updating an existing policy
  const handleUpdatePolicy = useCallback(async (policyId: string, updates: Partial<CompliancePolicy>): Promise<void> => {
    await updatePolicy({
      policyId: policyId as Id<"compliancePolicies">,
      name: updates.name,
      description: updates.description,
      conditions: updates.conditions,
      baseOutput: updates.baseOutput,
      mergeStrategies: updates.mergeStrategies,
    });
  }, [updatePolicy]);

  // Handle deleting a policy
  const handleDeletePolicy = useCallback(async (policyId: string): Promise<void> => {
    await deletePolicy({
      policyId: policyId as Id<"compliancePolicies">,
    });
    toast.success("Policy deleted");
  }, [deletePolicy]);

  // Handle policy click - navigate to policy detail
  const handlePolicyClick = useCallback((policyId: string) => {
    router.push(`/dashboard/compliance/policies/${policyId}`);
  }, [router]);

  // Transform policies to match the expected format
  const formattedPolicies: CompliancePolicy[] = (policies || []).map(policy => ({
    _id: policy._id,
    jurisdictionId: policy.jurisdictionId,
    policyType: policy.policyType as PolicyType,
    name: policy.name,
    description: policy.description,
    status: policy.status as "draft" | "published" | "archived",
    conditions: policy.conditions || [],
    baseOutput: policy.baseOutput,
    mergeStrategies: policy.mergeStrategies,
    createdBy: policy.createdBy,
    updatedBy: policy.updatedBy,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  }));

  const isLoading = !policies || !jurisdictions;

  // Show warning if no jurisdiction selected
  const showJurisdictionWarning = selectedJurisdiction === "all";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/compliance/policies")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h1 className="text-lg font-bold">Policy Canvas</h1>
            <p className="text-gray-500 text-xs">
              Drag and drop to build compliance policies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Layers className="h-4 w-4" />
            <span>{formattedPolicies.length} policies</span>
          </div>

          {/* Jurisdiction Filter */}
          <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select Jurisdiction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jurisdictions</SelectItem>
              {jurisdictions?.map((j) => (
                <SelectItem key={j._id} value={j._id}>
                  {j.abbreviation ? `${j.abbreviation} - ` : ""}{j.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Jurisdiction Warning */}
      {showJurisdictionWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Select a specific jurisdiction to create new policies. Viewing all jurisdictions is read-only.
            </span>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-500 mt-4">Loading policies...</p>
            </div>
          </div>
        ) : (
          <MultiPolicyCanvas
            policies={formattedPolicies}
            jurisdictionId={selectedJurisdiction !== "all" ? selectedJurisdiction : undefined}
            onCreatePolicy={handleCreatePolicy}
            onUpdatePolicy={handleUpdatePolicy}
            onDeletePolicy={handleDeletePolicy}
            onPolicyClick={handlePolicyClick}
          />
        )}
      </div>
    </div>
  );
}
