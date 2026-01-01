"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Car,
  FileText,
  Gauge,
  Clock,
  MapPin,
  Zap,
  Ruler,
  Loader2,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { type PolicyType, POLICY_TYPES, DEFAULT_MERGE_POLICIES } from "@/lib/compliance";
import { toast } from "sonner";

interface PolicyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-selected jurisdiction (optional) */
  initialJurisdictionId?: string;
  /** Callback when policy is created successfully */
  onPolicyCreated?: (policyId: string) => void;
}

const policyIcons: Record<PolicyType, React.ReactNode> = {
  escort: <Car className="h-6 w-6" />,
  permit: <FileText className="h-6 w-6" />,
  speed: <Gauge className="h-6 w-6" />,
  hours: <Clock className="h-6 w-6" />,
  route: <MapPin className="h-6 w-6" />,
  utility: <Zap className="h-6 w-6" />,
  dimension: <Ruler className="h-6 w-6" />,
};

const policyColors: Record<PolicyType, string> = {
  escort: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
  permit: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300",
  speed: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300",
  hours: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300",
  route: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300",
  utility: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300",
  dimension: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300",
};

type Step = "jurisdiction" | "type" | "details";

export function PolicyCreationModal({
  isOpen,
  onClose,
  initialJurisdictionId,
  onPolicyCreated,
}: PolicyCreationModalProps) {
  const [step, setStep] = useState<Step>(initialJurisdictionId ? "type" : "jurisdiction");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>(initialJurisdictionId || "");
  const [selectedType, setSelectedType] = useState<PolicyType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch jurisdictions
  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });

  // Create policy mutation
  const createPolicy = useMutation(api.policies.createPolicy);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setStep(initialJurisdictionId ? "type" : "jurisdiction");
    setSelectedJurisdiction(initialJurisdictionId || "");
    setSelectedType(null);
    setName("");
    setDescription("");
    onClose();
  }, [initialJurisdictionId, onClose]);

  // Handle jurisdiction selection
  const handleJurisdictionSelect = (jurisdictionId: string) => {
    setSelectedJurisdiction(jurisdictionId);
    setStep("type");
  };

  // Handle type selection
  const handleTypeSelect = (type: PolicyType) => {
    setSelectedType(type);
    const typeInfo = POLICY_TYPES.find(t => t.key === type);
    const jurisdictionInfo = jurisdictions?.find(j => j._id === selectedJurisdiction);
    setName(`${jurisdictionInfo?.abbreviation || ""} ${typeInfo?.label || ""}`);
    setStep("details");
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === "details") {
      setStep("type");
      setSelectedType(null);
      setName("");
      setDescription("");
    } else if (step === "type" && !initialJurisdictionId) {
      setStep("jurisdiction");
      setSelectedJurisdiction("");
    }
  };

  // Handle create policy
  const handleCreate = async () => {
    if (!selectedJurisdiction || !selectedType || !name.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const policyId = await createPolicy({
        jurisdictionId: selectedJurisdiction as Id<"jurisdictions">,
        policyType: selectedType,
        name: name.trim(),
        description: description.trim() || undefined,
        conditions: [],
        baseOutput: {},
        mergeStrategies: DEFAULT_MERGE_POLICIES[selectedType],
      });

      toast.success("Policy created successfully!");
      onPolicyCreated?.(policyId);
      handleClose();
    } catch (error) {
      console.error("Failed to create policy:", error);
      toast.error("Failed to create policy");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedJurisdictionInfo = jurisdictions?.find(j => j._id === selectedJurisdiction);
  const selectedTypeInfo = POLICY_TYPES.find(t => t.key === selectedType);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(step === "type" || step === "details") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 mr-2"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {step === "jurisdiction" && "Create New Policy"}
            {step === "type" && `Select Policy Type`}
            {step === "details" && `New ${selectedTypeInfo?.label}`}
          </DialogTitle>
          {selectedJurisdictionInfo && step !== "jurisdiction" && (
            <p className="text-sm text-gray-500 ml-10">
              {selectedJurisdictionInfo.abbreviation} - {selectedJurisdictionInfo.name}
            </p>
          )}
        </DialogHeader>

        {/* Step 1: Select Jurisdiction */}
        {step === "jurisdiction" && (
          <div className="py-4">
            <Label className="text-sm font-medium mb-2 block">
              Select Jurisdiction
            </Label>
            <Select value={selectedJurisdiction} onValueChange={handleJurisdictionSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a jurisdiction..." />
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
        )}

        {/* Step 2: Select Policy Type */}
        {step === "type" && (
          <div className="py-4">
            <Label className="text-sm font-medium mb-3 block">
              Choose Policy Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {POLICY_TYPES.map((type) => (
                <Card
                  key={type.key}
                  className={`p-3 cursor-pointer transition-all border-2 ${policyColors[type.key]}`}
                  onClick={() => handleTypeSelect(type.key)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/50">
                      {policyIcons[type.key]}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{type.label}</h4>
                      <p className="text-xs opacity-75 line-clamp-1">{type.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Policy Details */}
        {step === "details" && (
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Policy Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter policy name..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter policy description (optional)..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        )}

        {step === "details" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Policy
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}


