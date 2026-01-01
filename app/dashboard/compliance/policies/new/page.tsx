"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Car,
  FileText,
  Gauge,
  Clock,
  MapPin,
  Zap,
  Ruler,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { PolicyEditor } from "@/components/compliance/PolicyEditor";
import { 
  type PolicyType, 
  type CompliancePolicy,
  POLICY_TYPES,
} from "@/lib/compliance";
import { toast } from "sonner";

const policyIcons: Record<PolicyType, React.ReactNode> = {
  escort: <Car className="h-8 w-8" />,
  permit: <FileText className="h-8 w-8" />,
  speed: <Gauge className="h-8 w-8" />,
  hours: <Clock className="h-8 w-8" />,
  route: <MapPin className="h-8 w-8" />,
  utility: <Zap className="h-8 w-8" />,
  dimension: <Ruler className="h-8 w-8" />,
};

const policyColors: Record<PolicyType, string> = {
  escort: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200",
  permit: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200",
  speed: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200",
  hours: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200",
  route: "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200",
  utility: "bg-cyan-100 text-cyan-700 border-cyan-300 hover:bg-cyan-200",
  dimension: "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200",
};

export default function NewPolicyPage() {
  const router = useRouter();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("");
  const [selectedType, setSelectedType] = useState<PolicyType | null>(null);

  // Fetch jurisdictions
  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });

  // Mutations
  const createPolicy = useMutation(api.policies.createPolicy);

  // Handle save
  const handleSave = useCallback(async (policyData: Partial<CompliancePolicy>) => {
    if (!selectedJurisdiction) {
      toast.error("Please select a jurisdiction");
      return;
    }

    try {
      const policyId = await createPolicy({
        jurisdictionId: selectedJurisdiction as Id<"jurisdictions">,
        policyType: policyData.policyType!,
        name: policyData.name!,
        description: policyData.description,
        conditions: policyData.conditions,
        baseOutput: policyData.baseOutput,
        mergeStrategies: policyData.mergeStrategies,
      });
      toast.success("Policy created");
      router.push(`/dashboard/compliance/policies/${policyId}`);
    } catch (error) {
      toast.error("Failed to create policy");
      console.error(error);
    }
  }, [selectedJurisdiction, createPolicy, router]);

  // Step 1: Select jurisdiction
  if (!selectedJurisdiction) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/compliance/policies")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Policy</h1>
            <p className="text-gray-500 text-sm">Step 1: Select Jurisdiction</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Jurisdiction</CardTitle>
            <CardDescription>
              Choose the jurisdiction this policy will apply to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
              <SelectTrigger className="w-full">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Select policy type
  if (!selectedType) {
    const jurisdictionInfo = jurisdictions?.find(j => j._id === selectedJurisdiction);

    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedJurisdiction("")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Policy</h1>
            <p className="text-gray-500 text-sm">
              Step 2: Select Policy Type for {jurisdictionInfo?.name}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {POLICY_TYPES.map((type) => (
            <Card
              key={type.key}
              className={`cursor-pointer transition-all border-2 ${policyColors[type.key]}`}
              onClick={() => setSelectedType(type.key)}
            >
              <CardContent className="py-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/50">
                  {policyIcons[type.key]}
                </div>
                <h3 className="font-semibold mb-1">{type.label}</h3>
                <p className="text-sm opacity-80">{type.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Step 3: Edit policy details
  const jurisdictionInfo = jurisdictions?.find(j => j._id === selectedJurisdiction);
  const typeInfo = POLICY_TYPES.find(t => t.key === selectedType);

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedType(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            New {typeInfo?.label}
          </h1>
          <p className="text-gray-500 text-sm">
            {jurisdictionInfo?.name}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <PolicyEditor
            policyType={selectedType}
            onSave={handleSave}
            onCancel={() => router.push("/dashboard/compliance/policies")}
          />
        </CardContent>
      </Card>
    </div>
  );
}


