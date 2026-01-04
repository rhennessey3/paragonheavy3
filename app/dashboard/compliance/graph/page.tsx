"use client";

import { useState, useCallback, useMemo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Layers, AlertTriangle, FileText, Plus, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { 
  MultiPolicyCanvas, 
  type SavedNodePositions, 
  type SavedViewport,
  type CanvasDraftData,
} from "@/components/compliance/canvas";
import { 
  type PolicyType, 
  type CompliancePolicy,
} from "@/lib/compliance";
import { toast } from "sonner";

export default function PolicyGraphPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJurisdiction = searchParams.get("jurisdiction") || "all";
  const initialDraftId = searchParams.get("draft");
  
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>(initialJurisdiction);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(initialDraftId);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState<number | undefined>();

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
  const updatePolicyStatus = useMutation(api.policies.updatePolicyStatus);
  const createDraftFromPublished = useMutation(api.policies.createDraftFromPublished);
  
  // Canvas layout persistence
  const canvasLayout = useQuery(api.canvasLayouts.getCanvasLayout, {
    jurisdictionId: selectedJurisdiction,
  });
  const saveCanvasLayout = useMutation(api.canvasLayouts.saveCanvasLayout);
  const deleteCanvasLayout = useMutation(api.canvasLayouts.deleteCanvasLayout);

  // Canvas drafts
  const canvasDrafts = useQuery(api.canvasDrafts.listCanvasDrafts, {
    jurisdictionId: selectedJurisdiction !== "all" 
      ? selectedJurisdiction as Id<"jurisdictions"> 
      : undefined,
  });
  const currentDraft = useQuery(
    api.canvasDrafts.getCanvasDraft,
    currentDraftId ? { draftId: currentDraftId as Id<"canvasDrafts"> } : "skip"
  );
  const saveCanvasDraftMutation = useMutation(api.canvasDrafts.saveCanvasDraft);
  const deleteCanvasDraftMutation = useMutation(api.canvasDrafts.deleteCanvasDraft);

  // Get selected jurisdiction info for display
  const selectedJurisdictionInfo = jurisdictions?.find(
    j => j._id === selectedJurisdiction
  );

  // Handle creating a new policy
  const handleCreatePolicy = useCallback(async (policyData: Partial<CompliancePolicy> & { status?: "draft" | "published" }): Promise<string> => {
    if (!policyData.jurisdictionId) {
      throw new Error("Jurisdiction is required");
    }

    const policyId = await createPolicy({
      jurisdictionId: policyData.jurisdictionId as Id<"jurisdictions">,
      policyType: policyData.policyType!,
      name: policyData.name!,
      description: policyData.description,
      conditions: policyData.conditions,
      conditionLogic: policyData.conditionLogic,
      baseOutput: policyData.baseOutput,
      mergeStrategies: policyData.mergeStrategies,
      status: policyData.status,
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
      conditionLogic: updates.conditionLogic,
      baseOutput: updates.baseOutput,
      mergeStrategies: updates.mergeStrategies,
    });
  }, [updatePolicy]);

  // Handle deleting a policy
  const handleDeletePolicy = useCallback(async (policyId: string): Promise<void> => {
    // Check if this is a published policy - if so, use force deletion
    const policy = policies?.find(p => p._id === policyId);
    const isPublished = policy?.status === "published";

    await deletePolicy({
      policyId: policyId as Id<"compliancePolicies">,
      force: isPublished ? true : undefined,
    });
    toast.success("Policy deleted");
  }, [deletePolicy, policies]);

  // Handle publishing a draft policy
  const handlePublishPolicy = useCallback(async (policyId: string): Promise<void> => {
    await updatePolicyStatus({
      policyId: policyId as Id<"compliancePolicies">,
      status: "published",
    });
  }, [updatePolicyStatus]);

  // Handle creating a draft from a published policy
  const handleCreateDraftFromPublished = useCallback(async (
    sourcePolicyId: string,
    conditions: CompliancePolicy["conditions"],
    conditionLogic?: "AND" | "OR"
  ): Promise<string> => {
    const draftId = await createDraftFromPublished({
      sourcePolicyId: sourcePolicyId as Id<"compliancePolicies">,
      conditions,
      conditionLogic,
    });
    return draftId;
  }, [createDraftFromPublished]);

  // Handle policy click - policy is already visible on canvas, no navigation needed
  const handlePolicyClick = useCallback((policyId: string) => {
    // Policy nodes are clickable on the canvas itself
    // This callback can be used to highlight/select the policy if needed
    console.log("Policy selected:", policyId);
  }, []);
  
  // Handle position changes - save to database
  const handlePositionsChange = useCallback(
    async (positions: SavedNodePositions, viewport: SavedViewport) => {
      try {
        await saveCanvasLayout({
          jurisdictionId: selectedJurisdiction,
          nodePositions: positions,
          viewport,
        });
      } catch (error) {
        console.error("Failed to save canvas layout:", error);
        // Silent fail - don't interrupt user workflow
      }
    },
    [saveCanvasLayout, selectedJurisdiction]
  );
  
  // Handle reset layout - delete saved layout
  const handleResetLayout = useCallback(async () => {
    try {
      await deleteCanvasLayout({
        jurisdictionId: selectedJurisdiction,
      });
      toast.success("Layout reset to default");
      // Force a re-render by reloading
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset layout:", error);
      toast.error("Failed to reset layout");
    }
  }, [deleteCanvasLayout, selectedJurisdiction]);

  // Handle saving canvas draft
  const handleSaveDraft = useCallback(async (draft: CanvasDraftData): Promise<string> => {
    setIsSavingDraft(true);
    try {
      const draftId = await saveCanvasDraftMutation({
        draftId: draft.draftId ? draft.draftId as Id<"canvasDrafts"> : undefined,
        name: draft.name,
        jurisdictionId: selectedJurisdiction !== "all" 
          ? selectedJurisdiction as Id<"jurisdictions"> 
          : undefined,
        nodes: draft.nodes,
        edges: draft.edges,
        viewport: draft.viewport,
      });
      setCurrentDraftId(draftId);
      setLastDraftSaved(Date.now());
      return draftId;
    } finally {
      setIsSavingDraft(false);
    }
  }, [saveCanvasDraftMutation, selectedJurisdiction]);

  // Handle loading a draft
  const handleLoadDraft = useCallback((draftId: string) => {
    setCurrentDraftId(draftId);
    // Update URL to include draft ID
    const url = new URL(window.location.href);
    url.searchParams.set("draft", draftId);
    router.replace(url.pathname + url.search);
  }, [router]);

  // Handle creating a new canvas (clear draft)
  const handleNewCanvas = useCallback(() => {
    setCurrentDraftId(null);
    setLastDraftSaved(undefined);
    // Remove draft from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("draft");
    router.replace(url.pathname + url.search);
  }, [router]);

  // Handle deleting a draft
  const handleDeleteDraft = useCallback(async (draftId: string) => {
    try {
      await deleteCanvasDraftMutation({
        draftId: draftId as Id<"canvasDrafts">,
      });
      if (currentDraftId === draftId) {
        handleNewCanvas();
      }
      toast.success("Draft deleted");
    } catch (error) {
      console.error("Failed to delete draft:", error);
      toast.error("Failed to delete draft");
    }
  }, [deleteCanvasDraftMutation, currentDraftId, handleNewCanvas]);

  // Format current draft data for canvas
  const currentDraftData = useMemo((): CanvasDraftData | null => {
    if (!currentDraft) return null;
    return {
      draftId: currentDraft._id,
      name: currentDraft.name,
      nodes: currentDraft.nodes || [],
      edges: currentDraft.edges || [],
      viewport: currentDraft.viewport,
    };
  }, [currentDraft]);
  
  // Extract saved positions and viewport from the canvas layout
  const savedPositions = useMemo(() => {
    if (canvasLayout?.nodePositions) {
      return canvasLayout.nodePositions as SavedNodePositions;
    }
    return undefined;
  }, [canvasLayout?.nodePositions]);
  
  const savedViewport = useMemo(() => {
    if (canvasLayout?.viewport) {
      return canvasLayout.viewport as SavedViewport;
    }
    return undefined;
  }, [canvasLayout?.viewport]);

  // Transform policies to match the expected format
  const formattedPolicies: CompliancePolicy[] = (policies || []).map(policy => ({
    _id: policy._id,
    jurisdictionId: policy.jurisdictionId,
    policyType: policy.policyType as PolicyType,
    name: policy.name,
    description: policy.description,
    status: policy.status as "draft" | "published" | "archived",
    conditions: policy.conditions || [],
    conditionLogic: policy.conditionLogic as "AND" | "OR" | undefined,
    baseOutput: policy.baseOutput,
    mergeStrategies: policy.mergeStrategies,
    createdBy: policy.createdBy,
    updatedBy: policy.updatedBy,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  }));

  // Loading state includes canvas layout check (undefined means still loading, null means no saved layout)
  const isLoading = !policies || !jurisdictions || canvasLayout === undefined;

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

          {/* Drafts Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Drafts
                {canvasDrafts && canvasDrafts.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {canvasDrafts.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Saved Drafts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNewCanvas}>
                <Plus className="h-4 w-4 mr-2" />
                New Canvas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canvasDrafts && canvasDrafts.length > 0 ? (
                canvasDrafts.map((draft) => (
                  <DropdownMenuItem
                    key={draft._id}
                    className="flex items-center justify-between group"
                    onClick={() => handleLoadDraft(draft._id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{draft.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(draft.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDraft(draft._id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-gray-500">
                  No saved drafts yet
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
            savedPositions={savedPositions}
            savedViewport={savedViewport}
            currentDraft={currentDraftData}
            onCreatePolicy={handleCreatePolicy}
            onUpdatePolicy={handleUpdatePolicy}
            onDeletePolicy={handleDeletePolicy}
            onPublishPolicy={handlePublishPolicy}
            onPolicyClick={handlePolicyClick}
            onPositionsChange={handlePositionsChange}
            onResetLayout={handleResetLayout}
            onSaveDraft={handleSaveDraft}
            isSavingDraft={isSavingDraft}
            lastDraftSaved={lastDraftSaved}
            onCreateDraftFromPublished={handleCreateDraftFromPublished}
          />
        )}
      </div>
    </div>
  );
}
