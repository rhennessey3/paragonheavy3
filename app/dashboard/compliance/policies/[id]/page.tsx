"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  GitBranch,
  CheckCircle,
  Archive,
  Trash2,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { PolicyEditor } from "@/components/compliance/PolicyEditor";
import { 
  type PolicyType, 
  type CompliancePolicy,
  POLICY_TYPES,
} from "@/lib/compliance";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-600",
};

export default function PolicyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const policyId = params.id as string;

  // Fetch policy
  const policy = useQuery(api.policies.getPolicyById, {
    policyId: policyId as Id<"compliancePolicies">,
  });

  // Mutations
  const updatePolicy = useMutation(api.policies.updatePolicy);
  const updatePolicyStatus = useMutation(api.policies.updatePolicyStatus);
  const deletePolicy = useMutation(api.policies.deletePolicy);

  // Handle save
  const handleSave = useCallback(async (policyData: Partial<CompliancePolicy>) => {
    try {
      await updatePolicy({
        policyId: policyId as Id<"compliancePolicies">,
        name: policyData.name,
        description: policyData.description,
        conditions: policyData.conditions,
        baseOutput: policyData.baseOutput,
        mergeStrategies: policyData.mergeStrategies,
      });
      toast.success("Policy updated");
    } catch (error) {
      toast.error("Failed to update policy");
      console.error(error);
    }
  }, [policyId, updatePolicy]);

  // Handle status change
  const handleStatusChange = async (newStatus: "draft" | "published" | "archived") => {
    try {
      await updatePolicyStatus({
        policyId: policyId as Id<"compliancePolicies">,
        status: newStatus,
      });
      toast.success(`Policy ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this policy?")) return;

    try {
      await deletePolicy({
        policyId: policyId as Id<"compliancePolicies">,
      });
      toast.success("Policy deleted");
      router.push("/dashboard/compliance/policies");
    } catch (error) {
      toast.error("Failed to delete policy");
    }
  };

  if (!policy) {
    return (
      <div className="container mx-auto py-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-500 mt-4">Loading policy...</p>
      </div>
    );
  }

  const typeInfo = POLICY_TYPES.find(t => t.key === policy.policyType);

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/compliance/policies")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{policy.name}</h1>
              <Badge className={statusColors[policy.status]}>
                {policy.status}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm">
              {typeInfo?.label} • {policy.jurisdiction?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/compliance/graph")}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            View in Graph
          </Button>
          
          {policy.status === "draft" && (
            <>
              <Button
                variant="outline"
                onClick={() => handleStatusChange("published")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          
          {policy.status === "published" && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("archived")}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <Card>
        <CardContent className="p-0">
          <PolicyEditor
            policy={{
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
            }}
            policyType={policy.policyType as PolicyType}
            onSave={handleSave}
            onCancel={() => router.push("/dashboard/compliance/policies")}
            onDelete={policy.status === "draft" ? handleDelete : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}

