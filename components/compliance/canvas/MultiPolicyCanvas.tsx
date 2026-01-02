"use client";

import { useCallback, useRef, useState, useMemo, useEffect, type MutableRefObject } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
  type Viewport,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Trash2, Undo, Info, AlertCircle, RotateCcw, FileText, Check } from "lucide-react";
import { toast } from "sonner";

import { NodePalette } from "./NodePalette";
import { AttributeNode } from "./nodes/AttributeNode";
import { OperatorNode } from "./nodes/OperatorNode";
import { ValueNode } from "./nodes/ValueNode";
import { OutputNode } from "./nodes/OutputNode";
import { PolicyCenterNode, type PolicyCenterNodeData } from "./nodes/PolicyCenterNode";
import { 
  type CompliancePolicy, 
  type PolicyType,
  type PolicyCondition,
} from "@/lib/compliance";

// Register custom node types
const nodeTypes = {
  attribute: AttributeNode,
  operator: OperatorNode,
  value: ValueNode,
  output: OutputNode,
  policyCenter: PolicyCenterNode,
};

// Port type compatibility rules
const PORT_COMPATIBILITY: Record<string, string[]> = {
  attribute: ["operator"],
  operator: ["value"],
  value: ["output"],
  output: ["policyCenter"],
};

// Edge styles
const defaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
  style: { stroke: "#6366f1", strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#6366f1",
  },
};

// Type for saved node positions
export interface SavedNodePositions {
  [nodeId: string]: { x: number; y: number };
}

// Type for saved viewport
export interface SavedViewport {
  x: number;
  y: number;
  zoom: number;
}

// Draft data structure for saving/loading canvas state
export interface CanvasDraftData {
  draftId?: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  viewport?: SavedViewport;
}

interface MultiPolicyCanvasProps {
  /** Existing policies to display */
  policies: CompliancePolicy[];
  /** Current jurisdiction ID */
  jurisdictionId?: string;
  /** Saved node positions from database */
  savedPositions?: SavedNodePositions;
  /** Saved viewport from database */
  savedViewport?: SavedViewport;
  /** Currently loaded draft (if any) */
  currentDraft?: CanvasDraftData | null;
  /** Callback when a policy needs to be created */
  onCreatePolicy: (policy: Partial<CompliancePolicy>) => Promise<string>;
  /** Callback when a policy needs to be updated */
  onUpdatePolicy: (policyId: string, updates: Partial<CompliancePolicy>) => Promise<void>;
  /** Callback when a policy is deleted */
  onDeletePolicy?: (policyId: string) => Promise<void>;
  /** Callback when a policy is clicked (for navigation) */
  onPolicyClick?: (policyId: string) => void;
  /** Callback when node positions change (for persistence) */
  onPositionsChange?: (positions: SavedNodePositions, viewport: SavedViewport) => void;
  /** Callback to reset layout to default */
  onResetLayout?: () => void;
  /** Callback to save canvas as draft */
  onSaveDraft?: (draft: CanvasDraftData) => Promise<string>;
  /** Whether draft is currently saving */
  isSavingDraft?: boolean;
  /** Last saved timestamp for draft indicator */
  lastDraftSaved?: number;
}

// Generate unique ID
function generateId() {
  return `node_${Math.random().toString(36).substring(2, 9)}`;
}

// Layout constants
const POLICY_SPACING_X = 500;
const POLICY_SPACING_Y = 400;
const POLICIES_PER_ROW = 3;
const CONDITION_OFFSET_Y = -200;

// Debounce delay for saving positions (in ms)
const POSITION_SAVE_DEBOUNCE_MS = 800;

export function MultiPolicyCanvas({
  policies,
  jurisdictionId,
  savedPositions,
  savedViewport,
  currentDraft,
  onCreatePolicy,
  onUpdatePolicy,
  onDeletePolicy,
  onPolicyClick,
  onPositionsChange,
  onResetLayout,
  onSaveDraft,
  isSavingDraft,
  lastDraftSaved,
}: MultiPolicyCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [savingPolicies, setSavingPolicies] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Draft saving state
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [draftName, setDraftName] = useState(currentDraft?.name || "");
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(currentDraft?.draftId);
  
  // Ref to track debounced save timer
  const positionSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if we've applied saved positions (to avoid re-applying on every render)
  const hasAppliedSavedPositions = useRef(false);

  // Helper to get position - uses saved position if available, otherwise calculates default
  const getNodePosition = useCallback((nodeId: string, defaultPosition: { x: number; y: number }) => {
    if (savedPositions && savedPositions[nodeId]) {
      return savedPositions[nodeId];
    }
    return defaultPosition;
  }, [savedPositions]);

  // Convert existing policies to nodes
  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    policies.forEach((policy, index) => {
      const row = Math.floor(index / POLICIES_PER_ROW);
      const col = index % POLICIES_PER_ROW;
      const policyNodeId = `policy_${policy._id}`;

      // Calculate default position
      const defaultPolicyPosition = { 
        x: 100 + col * POLICY_SPACING_X, 
        y: 200 + row * POLICY_SPACING_Y 
      };

      // Create policy center node with saved or default position
      nodes.push({
        id: policyNodeId,
        type: "policyCenter",
        position: getNodePosition(policyNodeId, defaultPolicyPosition),
        data: {
          _id: policy._id,
          policyType: policy.policyType,
          name: policy.name,
          description: policy.description,
          status: policy.status,
          baseOutput: policy.baseOutput,
          mergeStrategies: policy.mergeStrategies,
          isNew: false,
          conditionCount: policy.conditions?.length || 0,
        } as PolicyCenterNodeData,
      });

      // Create condition chain nodes for each existing condition
      if (policy.conditions && policy.conditions.length > 0) {
        policy.conditions.forEach((condition, condIndex) => {
          const baseX = 100 + col * POLICY_SPACING_X - 400;
          const baseY = 200 + row * POLICY_SPACING_Y + CONDITION_OFFSET_Y + condIndex * 80;
          const spacing = 120;

          // Attribute node
          const attrId = `attr_${policy._id}_${condition.id}`;
          const defaultAttrPosition = { x: baseX, y: baseY };
          nodes.push({
            id: attrId,
            type: "attribute",
            position: getNodePosition(attrId, defaultAttrPosition),
            data: {
              id: condition.id,
              attribute: condition.attribute,
              label: condition.attribute.replace(/_/g, " "),
              sourceRegulation: condition.sourceRegulation,
            },
          });

          // Operator node
          const opId = `op_${policy._id}_${condition.id}`;
          const defaultOpPosition = { x: baseX + spacing, y: baseY };
          nodes.push({
            id: opId,
            type: "operator",
            position: getNodePosition(opId, defaultOpPosition),
            data: {
              id: `op_${condition.id}`,
              operator: condition.operator,
              label: condition.operator,
              symbol: getOperatorSymbol(condition.operator),
            },
          });

          // Value node
          const valId = `val_${policy._id}_${condition.id}`;
          const defaultValPosition = { x: baseX + spacing * 2, y: baseY };
          nodes.push({
            id: valId,
            type: "value",
            position: getNodePosition(valId, defaultValPosition),
            data: {
              id: `val_${condition.id}`,
              valueType: getValueType(condition.value),
              value: condition.value,
            },
          });

          // Output node
          const outId = `out_${policy._id}_${condition.id}`;
          const defaultOutPosition = { x: baseX + spacing * 3, y: baseY };
          nodes.push({
            id: outId,
            type: "output",
            position: getNodePosition(outId, defaultOutPosition),
            data: {
              id: `out_${condition.id}`,
              outputType: policy.policyType,
              label: `${policy.policyType} Output`,
              output: condition.output || {},
            },
          });

          // Create edges for the condition chain
          edges.push(
            { id: `e_${attrId}_${opId}`, source: attrId, target: opId, ...defaultEdgeOptions },
            { id: `e_${opId}_${valId}`, source: opId, target: valId, ...defaultEdgeOptions },
            { id: `e_${valId}_${outId}`, source: valId, target: outId, ...defaultEdgeOptions },
            { id: `e_${outId}_${policyNodeId}`, source: outId, target: policyNodeId, ...defaultEdgeOptions }
          );
        });
      }
    });

    return { nodes, edges };
  }, [policies, getNodePosition]);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialNodes.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialNodes.edges);

  // Re-initialize when policies change
  useEffect(() => {
    setNodes(initialNodes.nodes);
    setEdges(initialNodes.edges);
  }, [initialNodes, setNodes, setEdges]);
  
  // Debounced position save handler
  const schedulePositionSave = useCallback(() => {
    if (!onPositionsChange) return;
    
    // Clear existing timer
    if (positionSaveTimerRef.current) {
      clearTimeout(positionSaveTimerRef.current);
    }
    
    // Schedule new save
    positionSaveTimerRef.current = setTimeout(() => {
      // Get current positions from nodes
      setNodes((currentNodes) => {
        const positions: SavedNodePositions = {};
        currentNodes.forEach((node) => {
          positions[node.id] = { x: node.position.x, y: node.position.y };
        });
        
        // Get current viewport
        const viewport = reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 };
        
        // Call the save handler
        onPositionsChange(positions, viewport);
        
        return currentNodes; // Don't modify nodes
      });
    }, POSITION_SAVE_DEBOUNCE_MS);
  }, [onPositionsChange, setNodes, reactFlowInstance]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (positionSaveTimerRef.current) {
        clearTimeout(positionSaveTimerRef.current);
      }
    };
  }, []);
  
  // Wrapped onNodesChange to track position changes
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply the changes
      onNodesChangeBase(changes);
      
      // Check if any change is a position change
      const hasPositionChange = changes.some(
        (change) => change.type === "position" && change.dragging === false
      );
      
      if (hasPositionChange) {
        schedulePositionSave();
      }
    },
    [onNodesChangeBase, schedulePositionSave]
  );
  
  // Handle viewport changes (pan/zoom)
  const onMoveEnd = useCallback(
    (_event: any, viewport: Viewport) => {
      if (onPositionsChange) {
        // Get current positions
        const positions: SavedNodePositions = {};
        nodes.forEach((node) => {
          positions[node.id] = { x: node.position.x, y: node.position.y };
        });
        
        // Debounce the save
        if (positionSaveTimerRef.current) {
          clearTimeout(positionSaveTimerRef.current);
        }
        
        positionSaveTimerRef.current = setTimeout(() => {
          onPositionsChange(positions, viewport);
        }, POSITION_SAVE_DEBOUNCE_MS);
      }
    },
    [nodes, onPositionsChange]
  );

  // Save a new policy - defined early so it can be used in useEffects
  const handleSaveNewPolicy = useCallback(async (nodeId: string) => {
    // Use functional state updates to get the latest nodes/edges
    let policyNode: Node | undefined;
    let currentNodes: Node[] = [];
    let currentEdges: Edge[] = [];
    
    // Get current state synchronously using functional updates
    setNodes((nds) => {
      currentNodes = nds;
      policyNode = nds.find(n => n.id === nodeId && n.type === "policyCenter");
      return nds; // Don't change anything
    });
    
    setEdges((eds) => {
      currentEdges = eds;
      return eds; // Don't change anything
    });

    if (!policyNode) {
      toast.error("Policy node not found");
      return;
    }

    const policyData = policyNode.data as PolicyCenterNodeData;
    
    if (!jurisdictionId) {
      toast.error("Please select a jurisdiction first");
      return;
    }

    if (!policyData.name || policyData.name.trim() === "") {
      toast.error("Please enter a policy name");
      return;
    }

    // Find conditions connected to this policy using current state
    const conditions: PolicyCondition[] = [];
    const outputEdges = currentEdges.filter(e => e.target === nodeId);
    
    for (const outputEdge of outputEdges) {
      const outputNode = currentNodes.find(n => n.id === outputEdge.source && n.type === "output");
      if (!outputNode) continue;

      const valueEdge = currentEdges.find(e => e.target === outputNode.id);
      if (!valueEdge) continue;
      const valueNode = currentNodes.find(n => n.id === valueEdge.source && n.type === "value");
      if (!valueNode) continue;

      const operatorEdge = currentEdges.find(e => e.target === valueNode.id);
      if (!operatorEdge) continue;
      const operatorNode = currentNodes.find(n => n.id === operatorEdge.source && n.type === "operator");
      if (!operatorNode) continue;

      const attributeEdge = currentEdges.find(e => e.target === operatorNode.id);
      if (!attributeEdge) continue;
      const attributeNode = currentNodes.find(n => n.id === attributeEdge.source && n.type === "attribute");
      if (!attributeNode) continue;

      conditions.push({
        id: attributeNode.data.id || generateId(),
        attribute: attributeNode.data.attribute,
        operator: operatorNode.data.operator,
        value: valueNode.data.value,
        sourceRegulation: attributeNode.data.sourceRegulation,
        notes: attributeNode.data.notes,
        output: outputNode.data.output,
      });
    }

    setSavingPolicies(prev => new Set(prev).add(nodeId));

    try {
      const newPolicyId = await onCreatePolicy({
        jurisdictionId,
        policyType: policyData.policyType,
        name: policyData.name,
        description: policyData.description,
        conditions,
        baseOutput: policyData.baseOutput,
        mergeStrategies: policyData.mergeStrategies,
      });

      // Update the node to mark it as saved
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                id: `policy_${newPolicyId}`,
                data: {
                  ...node.data,
                  _id: newPolicyId,
                  isNew: false,
                  onSave: undefined,
                },
              }
            : node
        )
      );

      // Update edges that reference this node
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          source: edge.source === nodeId ? `policy_${newPolicyId}` : edge.source,
          target: edge.target === nodeId ? `policy_${newPolicyId}` : edge.target,
        }))
      );

      toast.success("Policy created successfully!");
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save policy:", error);
      toast.error("Failed to create policy");
    } finally {
      setSavingPolicies(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  }, [jurisdictionId, onCreatePolicy, setNodes, setEdges]);

  // Store a ref to the save handler so nodes can access it
  const saveHandlerRef = useRef<(nodeId: string) => void>(() => {});
  
  // Update the ref whenever handleSaveNewPolicy changes
  useEffect(() => {
    saveHandlerRef.current = handleSaveNewPolicy;
  }, [handleSaveNewPolicy]);
  
  // Inject onSave callback into new policy nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "policyCenter" && (node.data as PolicyCenterNodeData).isNew) {
          const data = node.data as PolicyCenterNodeData;
          // Update isSaving state and inject save handler
          return {
            ...node,
            data: {
              ...data,
              isSaving: savingPolicies.has(node.id),
              onSave: () => saveHandlerRef.current(node.id),
            },
          };
        }
        return node;
      })
    );
  }, [savingPolicies, setNodes]);

  // Validate connection based on port types
  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return false;
    
    const sourceType = sourceNode.type || "";
    const targetType = targetNode.type || "";
    
    const allowedTargets = PORT_COMPATIBILITY[sourceType] || [];
    return allowedTargets.includes(targetType);
  }, [nodes]);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (isValidConnection(params)) {
        setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
        setHasUnsavedChanges(true);
      }
    },
    [setEdges, isValidConnection]
  );

  // Handle dropping new nodes from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const nodeData = event.dataTransfer.getData("application/reactflow");
      if (!nodeData) return;

      const { type, data } = JSON.parse(nodeData);

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = generateId();

      // Special handling for policy center nodes
      if (type === "policyCenter") {
        if (!jurisdictionId) {
          toast.error("Please select a jurisdiction before creating a policy");
          return;
        }
        
        const newNode: Node = {
          id: nodeId,
          type,
          position,
          data: {
            ...data,
            id: nodeId,
            jurisdictionId,
            isNew: true,
            isSaving: false,
          } as PolicyCenterNodeData,
        };
        setNodes((nds) => [...nds, newNode]);
      } else {
        const newNode: Node = {
          id: nodeId,
          type,
          position,
          data: {
            ...data,
            id: nodeId,
          },
        };
        setNodes((nds) => [...nds, newNode]);
      }
      
      setHasUnsavedChanges(true);
    },
    [reactFlowInstance, setNodes, jurisdictionId]
  );

  // Serialize conditions for a specific policy node
  const serializeConditionsForPolicy = useCallback((policyNodeId: string): PolicyCondition[] => {
    const conditions: PolicyCondition[] = [];
    
    // Find all output nodes connected to this policy
    const outputEdges = edges.filter(e => e.target === policyNodeId);
    
    for (const outputEdge of outputEdges) {
      const outputNode = nodes.find(n => n.id === outputEdge.source && n.type === "output");
      if (!outputNode) continue;

      // Trace back through the chain
      const valueEdge = edges.find(e => e.target === outputNode.id);
      if (!valueEdge) continue;
      const valueNode = nodes.find(n => n.id === valueEdge.source && n.type === "value");
      if (!valueNode) continue;

      const operatorEdge = edges.find(e => e.target === valueNode.id);
      if (!operatorEdge) continue;
      const operatorNode = nodes.find(n => n.id === operatorEdge.source && n.type === "operator");
      if (!operatorNode) continue;

      const attributeEdge = edges.find(e => e.target === operatorNode.id);
      if (!attributeEdge) continue;
      const attributeNode = nodes.find(n => n.id === attributeEdge.source && n.type === "attribute");
      if (!attributeNode) continue;

      const condition: PolicyCondition = {
        id: attributeNode.data.id || generateId(),
        attribute: attributeNode.data.attribute,
        operator: operatorNode.data.operator,
        value: valueNode.data.value,
        sourceRegulation: attributeNode.data.sourceRegulation,
        notes: attributeNode.data.notes,
        output: outputNode.data.output,
      };

      conditions.push(condition);
    }

    return conditions;
  }, [nodes, edges]);

  // Delete selected nodes
  const onDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    const policyNodes = selectedNodes.filter(n => n.type === "policyCenter");
    
    // Don't allow deleting existing policies from canvas (only new ones)
    const canDelete = policyNodes.every(n => (n.data as PolicyCenterNodeData).isNew);
    
    if (!canDelete) {
      toast.error("Cannot delete saved policies from canvas. Use the policy editor instead.");
      return;
    }

    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => {
      const deletedIds = new Set(selectedNodes.map(n => n.id));
      return eds.filter((edge) => !deletedIds.has(edge.source) && !deletedIds.has(edge.target));
    });
    setHasUnsavedChanges(true);
  }, [nodes, setNodes, setEdges]);

  // Count new (unsaved) policies
  const newPolicyCount = useMemo(() => {
    return nodes.filter(n => n.type === "policyCenter" && (n.data as PolicyCenterNodeData).isNew).length;
  }, [nodes]);

  // Count total conditions on canvas
  const totalConditions = useMemo(() => {
    return nodes.filter(n => n.type === "output").length;
  }, [nodes]);

  // Handle saving draft
  const handleSaveDraft = useCallback(async () => {
    if (!onSaveDraft) return;
    
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      toast.error("Please enter a draft name");
      return;
    }

    const viewport = reactFlowInstance?.getViewport();
    
    try {
      const savedDraftId = await onSaveDraft({
        draftId: currentDraftId,
        name: trimmedName,
        nodes,
        edges,
        viewport: viewport ? { x: viewport.x, y: viewport.y, zoom: viewport.zoom } : undefined,
      });
      
      setCurrentDraftId(savedDraftId);
      setShowSaveDraftDialog(false);
      setHasUnsavedChanges(false);
      toast.success(currentDraftId ? "Draft updated" : "Draft saved");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
    }
  }, [onSaveDraft, draftName, currentDraftId, nodes, edges, reactFlowInstance]);

  // Quick save (update existing draft without dialog)
  const handleQuickSaveDraft = useCallback(async () => {
    if (!onSaveDraft || !currentDraftId || !draftName) {
      setShowSaveDraftDialog(true);
      return;
    }

    const viewport = reactFlowInstance?.getViewport();
    
    try {
      await onSaveDraft({
        draftId: currentDraftId,
        name: draftName,
        nodes,
        edges,
        viewport: viewport ? { x: viewport.x, y: viewport.y, zoom: viewport.zoom } : undefined,
      });
      
      setHasUnsavedChanges(false);
      toast.success("Draft saved");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
    }
  }, [onSaveDraft, currentDraftId, draftName, nodes, edges, reactFlowInstance]);

  // Update draft info when currentDraft prop changes
  useEffect(() => {
    if (currentDraft) {
      setDraftName(currentDraft.name);
      setCurrentDraftId(currentDraft.draftId);
    }
  }, [currentDraft]);

  // Format last saved time
  const lastSavedText = useMemo(() => {
    if (!lastDraftSaved) return null;
    const diff = Date.now() - lastDraftSaved;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(lastDraftSaved).toLocaleTimeString();
  }, [lastDraftSaved]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar - Node Palette */}
      <NodePalette policyType="escort" />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="h-14 border-b bg-white px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {policies.length} saved policies
              </Badge>
              {newPolicyCount > 0 && (
                <Badge className="text-xs bg-amber-500">
                  {newPolicyCount} unsaved
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {totalConditions} conditions
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Draft indicator */}
            {currentDraftId && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                <FileText className="h-3 w-3" />
                <span className="font-medium truncate max-w-[120px]">{draftName}</span>
                {lastSavedText && (
                  <span className="text-gray-400">({lastSavedText})</span>
                )}
              </div>
            )}
            
            {/* Save Draft Button */}
            {onSaveDraft && (
              <Button
                variant={hasUnsavedChanges ? "default" : "outline"}
                size="sm"
                onClick={handleQuickSaveDraft}
                disabled={isSavingDraft}
                title={currentDraftId ? "Save draft (Ctrl+S)" : "Save as draft"}
              >
                {isSavingDraft ? (
                  <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {currentDraftId ? "Save" : "Save Draft"}
              </Button>
            )}
            
            <div className="h-6 w-px bg-gray-200" />
            
            {onResetLayout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetLayout}
                title="Reset layout to default"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteSelected}
              title="Delete selected"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {hasUnsavedChanges && !currentDraftId && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 min-h-0" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onMoveEnd={onMoveEnd}
            nodeTypes={nodeTypes}
            isValidConnection={isValidConnection}
            fitView={!savedViewport}
            fitViewOptions={{ padding: 0.2 }}
            defaultViewport={savedViewport}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={defaultEdgeOptions}
            deleteKeyCode={["Backspace", "Delete"]}
            multiSelectionKeyCode={["Shift"]}
            snapToGrid
            snapGrid={[15, 15]}
            onNodeClick={(_, node) => {
              // Navigate to policy detail when clicking on saved policy
              if (node.type === "policyCenter") {
                const data = node.data as PolicyCenterNodeData;
                if (!data.isNew && data._id && onPolicyClick) {
                  onPolicyClick(data._id);
                }
              }
            }}
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1} 
              color="#e5e7eb" 
            />
            <Controls className="bg-white shadow-md rounded-lg" />
            <MiniMap
              className="bg-white rounded-lg shadow-md"
              nodeColor={(node) => {
                if (node.type === "policyCenter") {
                  const data = node.data as PolicyCenterNodeData;
                  return data.isNew ? "#fef3c7" : "#c7d2fe";
                }
                switch (node.type) {
                  case "attribute": return "#dbeafe";
                  case "operator": return "#e9d5ff";
                  case "value": return "#d1fae5";
                  case "output": return "#fed7aa";
                  default: return "#f3f4f6";
                }
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />

            {/* Help Panel */}
            <Panel position="bottom-right" className="m-4">
              <div className="bg-white rounded-lg p-3 shadow-sm text-xs max-w-[220px]">
                <div className="flex items-center gap-2 font-medium text-gray-700 mb-2">
                  <Info className="h-4 w-4" />
                  How to Build
                </div>
                <ol className="space-y-1 text-gray-500 list-decimal list-inside">
                  <li>Drag a <strong>Policy</strong> node onto canvas</li>
                  <li>Drag <strong>Attribute → Operator → Value → Output</strong></li>
                  <li>Connect Output to Policy</li>
                  <li>Click <strong>Save</strong> on the policy node</li>
                </ol>
              </div>
            </Panel>

            {/* Empty State Panel */}
            {policies.length === 0 && nodes.length === 0 && (
              <Panel position="top-center" className="m-8">
                <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Policies Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Drag a policy type from the left palette to create your first compliance policy.
                  </p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>

      {/* Save Draft Dialog */}
      <Dialog open={showSaveDraftDialog} onOpenChange={setShowSaveDraftDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Save Draft</DialogTitle>
            <DialogDescription>
              Save your current canvas state to continue working on it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="draft-name" className="text-sm font-medium">
              Draft Name
            </Label>
            <Input
              id="draft-name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g., PA Escort Policy WIP"
              className="mt-1.5"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveDraft();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDraftDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDraft} disabled={isSavingDraft || !draftName.trim()}>
              {isSavingDraft ? (
                <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper functions
function getOperatorSymbol(operator: string): string {
  const symbols: Record<string, string> = {
    ">": ">",
    ">=": "≥",
    "<": "<",
    "<=": "≤",
    "=": "=",
    "!=": "≠",
    between: "↔",
    in: "∈",
  };
  return symbols[operator] || operator;
}

function getValueType(value: any): "number" | "range" | "enum" | "boolean" {
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "range";
  if (typeof value === "number") return "number";
  return "enum";
}

