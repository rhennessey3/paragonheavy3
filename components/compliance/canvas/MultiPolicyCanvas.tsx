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
  reconnectEdge,
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { Save, Trash2, Undo, Redo, Info, AlertCircle, LayoutGrid, FileText, Check, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";

import { NodePalette } from "./NodePalette";
import { AttributeNode } from "./nodes/AttributeNode";
import { OperatorNode } from "./nodes/OperatorNode";
import { ValueNode } from "./nodes/ValueNode";
import { OutputNode } from "./nodes/OutputNode";
import { PolicyCenterNode, type PolicyCenterNodeData } from "./nodes/PolicyCenterNode";
import { ConditionLogicNode, type ConditionLogicNodeData } from "./nodes/ConditionLogicNode";
import { MergeStrategyNode, type MergeStrategyNodeData } from "./nodes/MergeStrategyNode";
import { SaveOptionsDialog } from "./SaveOptionsDialog";
import {
  type CompliancePolicy,
  type PolicyType,
  type PolicyCondition,
} from "@/lib/compliance";
import {
  type ConditionData,
  generateConditionStatement,
  generateConditionItems,
  generateOutputStatement,
} from "@/lib/condition-statement";

// Register custom node types
const nodeTypes = {
  attribute: AttributeNode,
  operator: OperatorNode,
  value: ValueNode,
  conditionLogic: ConditionLogicNode,
  output: OutputNode,
  mergeStrategy: MergeStrategyNode,
  policyCenter: PolicyCenterNode,
};

// Port type compatibility rules
const PORT_COMPATIBILITY: Record<string, string[]> = {
  attribute: ["operator"],
  operator: ["value"],
  value: ["output", "conditionLogic"],
  conditionLogic: ["output"],
  output: ["policyCenter", "mergeStrategy"],
  mergeStrategy: ["policyCenter"],
};

// Edge styles
const defaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
  reconnectable: true,
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
  onCreatePolicy: (policy: Partial<CompliancePolicy> & { status?: "draft" | "published" }) => Promise<string>;
  /** Callback when a policy needs to be updated */
  onUpdatePolicy: (policyId: string, updates: Partial<CompliancePolicy>) => Promise<void>;
  /** Callback when a policy is deleted */
  onDeletePolicy?: (policyId: string) => Promise<void>;
  /** Callback when a policy status is updated (for publishing) */
  onPublishPolicy?: (policyId: string) => Promise<void>;
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
  /** Callback when creating a draft from a published policy */
  onCreateDraftFromPublished?: (
    sourcePolicyId: string,
    conditions: PolicyCondition[],
    conditionLogic?: "AND" | "OR"
  ) => Promise<string>;
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
  onPublishPolicy,
  onPolicyClick,
  onPositionsChange,
  onResetLayout,
  onSaveDraft,
  isSavingDraft,
  lastDraftSaved,
  onCreateDraftFromPublished,
}: MultiPolicyCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [savingPolicies, setSavingPolicies] = useState<Set<string>>(new Set());
  const [publishingPolicies, setPublishingPolicies] = useState<Set<string>>(new Set());
  const [deletingPolicies, setDeletingPolicies] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Delete confirmation dialog state
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null);
  const [pendingDeletePolicyId, setPendingDeletePolicyId] = useState<string | null>(null);

  // Track original edges for each published policy to detect changes
  // Key: policyNodeId, Value: stringified edge data (source + sourceHandle + target + targetHandle)
  const [originalPolicyEdges, setOriginalPolicyEdges] = useState<Map<string, Set<string>>>(new Map());

  // Helper to collect all edges in a policy's subgraph (not just direct connections)
  // This includes edges to output nodes and condition logic nodes connected to the policy
  const collectPolicySubgraphEdges = useCallback((
    policyNodeId: string,
    allNodes: Node[],
    allEdges: Edge[]
  ): Set<string> => {
    const edgeKeys = new Set<string>();
    const visitedNodes = new Set<string>();
    const nodesToVisit: string[] = [policyNodeId];

    // BFS to collect all nodes in the policy's subgraph (traversing edges backwards)
    while (nodesToVisit.length > 0) {
      const currentNodeId = nodesToVisit.shift()!;
      if (visitedNodes.has(currentNodeId)) continue;
      visitedNodes.add(currentNodeId);

      // Find all edges that target this node
      allEdges.forEach((edge) => {
        if (edge.target === currentNodeId) {
          // Add the edge to our tracking set
          edgeKeys.add(`${edge.source}|${edge.sourceHandle || ''}|${edge.target}|${edge.targetHandle || ''}`);

          // Get the source node to decide if we should traverse further
          const sourceNode = allNodes.find(n => n.id === edge.source);
          if (sourceNode) {
            // Only traverse further for output and conditionLogic nodes (part of policy subgraph)
            // Stop at value, operator, and attribute nodes (they're leaf nodes of the subgraph)
            if (sourceNode.type === "output" || sourceNode.type === "conditionLogic") {
              nodesToVisit.push(sourceNode.id);
            }
          }
        }
      });
    }

    return edgeKeys;
  }, []);

  // Helper to collect all node IDs in a policy's subgraph (for deletion)
  // This traverses backward from the policy node to find all connected nodes
  const collectPolicySubgraphNodes = useCallback((
    policyNodeId: string,
    allNodes: Node[],
    allEdges: Edge[]
  ): string[] => {
    const nodeIds: string[] = [policyNodeId];
    const visitedNodes = new Set<string>([policyNodeId]);
    const nodesToVisit: string[] = [policyNodeId];

    // BFS traversal backward through edges
    while (nodesToVisit.length > 0) {
      const currentNodeId = nodesToVisit.shift()!;

      // Find all edges that target this node (backward traversal)
      allEdges.forEach((edge) => {
        if (edge.target === currentNodeId) {
          const sourceNode = allNodes.find(n => n.id === edge.source);
          if (sourceNode && !visitedNodes.has(sourceNode.id)) {
            visitedNodes.add(sourceNode.id);
            nodeIds.push(sourceNode.id);
            nodesToVisit.push(sourceNode.id);
          }
        }
      });
    }

    return nodeIds;
  }, []);

  // Draft saving state
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [draftName, setDraftName] = useState(currentDraft?.name || "");
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(currentDraft?.draftId);

  // Save options dialog state (for choosing draft vs publish)
  const [showSaveOptionsDialog, setShowSaveOptionsDialog] = useState(false);
  const [pendingSaveNodeId, setPendingSaveNodeId] = useState<string | null>(null);

  // Help panel state
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  
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
          conditionLogic: policy.conditionLogic,
          isNew: false,
          conditionCount: policy.conditions?.length || 0,
        } as PolicyCenterNodeData,
      });

      // Create condition chain nodes for each existing condition
      if (policy.conditions && policy.conditions.length > 0) {
        const hasConditionLogic = policy.conditionLogic && policy.conditions.length > 1;
        const spacing = 120;
        const baseX = 100 + col * POLICY_SPACING_X - 400;

        // If using conditionLogic (AND/OR), create a logic node and single output
        let conditionLogicNodeId: string | null = null;
        let sharedOutputId: string | null = null;

        if (hasConditionLogic) {
          // Create conditionLogic node
          conditionLogicNodeId = `logic_${policy._id}`;
          const logicBaseY = 200 + row * POLICY_SPACING_Y + CONDITION_OFFSET_Y + (policy.conditions.length - 1) * 40;
          const defaultLogicPosition = { x: baseX + spacing * 3, y: logicBaseY };
          nodes.push({
            id: conditionLogicNodeId,
            type: "conditionLogic",
            position: getNodePosition(conditionLogicNodeId, defaultLogicPosition),
            data: {
              id: conditionLogicNodeId,
              conditionLogic: policy.conditionLogic,
              label: policy.conditionLogic === "AND" ? "All Match (AND)" : "Any Match (OR)",
            } as ConditionLogicNodeData,
          });

          // Create shared output node
          sharedOutputId = `out_${policy._id}_shared`;
          const defaultOutputPosition = { x: baseX + spacing * 4, y: logicBaseY };
          // Use the first condition's output as the shared output
          const firstConditionOutput = policy.conditions[0]?.output || {};
          nodes.push({
            id: sharedOutputId,
            type: "output",
            position: getNodePosition(sharedOutputId, defaultOutputPosition),
            data: {
              id: `out_${policy._id}`,
              outputType: policy.policyType,
              label: `${policy.policyType} Output`,
              output: firstConditionOutput,
            },
          });

          // Connect logic node to output, output to policy
          edges.push(
            { id: `e_${conditionLogicNodeId}_${sharedOutputId}`, source: conditionLogicNodeId, target: sharedOutputId, ...defaultEdgeOptions },
            { id: `e_${sharedOutputId}_${policyNodeId}`, source: sharedOutputId, target: policyNodeId, ...defaultEdgeOptions }
          );
        }

        policy.conditions.forEach((condition, condIndex) => {
          const baseY = 200 + row * POLICY_SPACING_Y + CONDITION_OFFSET_Y + condIndex * 80;

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
          const valueType = getValueType(condition.value);

          // For number values, enable feet/inches mode and calculate from decimal
          let valueData: any = {
            id: `val_${condition.id}`,
            valueType,
            value: condition.value,
          };

          if (valueType === "number" && typeof condition.value === "number") {
            const totalFeet = condition.value;
            const feet = Math.floor(totalFeet);
            const inches = Math.round((totalFeet - feet) * 12);
            valueData = {
              ...valueData,
              useFeetInches: true,
              feet,
              inches,
            };
          }

          nodes.push({
            id: valId,
            type: "value",
            position: getNodePosition(valId, defaultValPosition),
            data: valueData,
          });

          // Create edges for the condition chain
          edges.push(
            { id: `e_${attrId}_${opId}`, source: attrId, target: opId, ...defaultEdgeOptions },
            { id: `e_${opId}_${valId}`, source: opId, target: valId, ...defaultEdgeOptions }
          );

          if (hasConditionLogic && conditionLogicNodeId) {
            // Connect value to conditionLogic node
            edges.push({
              id: `e_${valId}_${conditionLogicNodeId}`,
              source: valId,
              target: conditionLogicNodeId,
              ...defaultEdgeOptions,
            });
          } else {
            // No conditionLogic - create individual output node and connect directly
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

            edges.push(
              { id: `e_${valId}_${outId}`, source: valId, target: outId, ...defaultEdgeOptions },
              { id: `e_${outId}_${policyNodeId}`, source: outId, target: policyNodeId, ...defaultEdgeOptions }
            );
          }
        });
      }
    });

    return { nodes, edges };
  }, [policies, getNodePosition]);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialNodes.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialNodes.edges);

  // Refs to track current nodes/edges for use in callbacks without stale closure issues
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  // Keep refs in sync with state
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // Memoized fingerprint of condition and output node data to trigger statement regeneration
  // when values change (not just when edges change)
  const conditionDataFingerprint = useMemo(() => {
    const fingerprints: string[] = [];
    nodes.forEach(node => {
      if (node.type === "attribute" || node.type === "operator" || node.type === "value") {
        // Include relevant data fields that affect the condition statement
        const relevantData = {
          attribute: node.data.attribute,
          operator: node.data.operator,
          value: node.data.value,
        };
        fingerprints.push(`${node.id}:${JSON.stringify(relevantData)}`);
      }
      // Also track output node changes for output statement regeneration
      if (node.type === "output") {
        const relevantData = {
          outputType: node.data.outputType,
          output: node.data.output,
        };
        fingerprints.push(`${node.id}:${JSON.stringify(relevantData)}`);
      }
    });
    return fingerprints.sort().join("|");
  }, [nodes]);

  // History state for undo/redo
  const historyRef = useRef<{
    past: Array<{ nodes: Node[]; edges: Edge[] }>;
    future: Array<{ nodes: Node[]; edges: Edge[] }>;
  }>({ past: [], future: [] });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isUndoRedoAction = useRef(false);
  const MAX_HISTORY_SIZE = 50;

  // Record current state to history
  const recordHistory = useCallback(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    historyRef.current.past.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });

    // Limit history size
    if (historyRef.current.past.length > MAX_HISTORY_SIZE) {
      historyRef.current.past.shift();
    }

    // Clear future on new action
    historyRef.current.future = [];

    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(false);
  }, [nodes, edges]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyRef.current.past.length === 0) return;

    const previous = historyRef.current.past.pop()!;

    // Save current state to future
    historyRef.current.future.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });

    isUndoRedoAction.current = true;
    setNodes(previous.nodes);
    setEdges(previous.edges);

    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(true);
  }, [nodes, edges, setNodes, setEdges]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyRef.current.future.length === 0) return;

    const next = historyRef.current.future.pop()!;

    // Save current state to past
    historyRef.current.past.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });

    isUndoRedoAction.current = true;
    setNodes(next.nodes);
    setEdges(next.edges);

    setCanUndo(true);
    setCanRedo(historyRef.current.future.length > 0);
  }, [nodes, edges, setNodes, setEdges]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
      // Also support Ctrl+Y for redo on Windows
      if ((e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Track which policies we've initialized to avoid resetting user's work
  const initializedPoliciesRef = useRef<string>("");

  // Track recently saved policies to prevent race condition with Convex query subscription
  const recentlySavedPoliciesRef = useRef<Set<string>>(new Set());

  // Only re-initialize when the actual policy list changes (add/remove), not position updates
  const policyIds = useMemo(() => policies.map(p => p._id).sort().join(','), [policies]);

  useEffect(() => {
    // Only reset if the policy list actually changed
    if (initializedPoliciesRef.current !== policyIds) {
      // Check if this change is due to a policy we just saved locally
      // If so, skip reinitialization to prevent race condition with local state
      const newPolicyIds = policies.map(p => p._id);
      const hasRecentlySaved = newPolicyIds.some(id =>
        recentlySavedPoliciesRef.current.has(id)
      );

      if (hasRecentlySaved) {
        // Don't reset nodes - just update the ref to prevent future unnecessary resets
        initializedPoliciesRef.current = policyIds;
        return;
      }

      setNodes(initialNodes.nodes);
      setEdges(initialNodes.edges);
      initializedPoliciesRef.current = policyIds;

      // Initialize original edges for published policies (including full subgraph)
      const originalEdgesMap = new Map<string, Set<string>>();
      initialNodes.nodes.forEach((node) => {
        if (node.type === "policyCenter") {
          const data = node.data as PolicyCenterNodeData;
          if (data.status === "published" && data._id) {
            // Get all edges in the policy's subgraph (includes output and conditionLogic nodes)
            const policyEdges = collectPolicySubgraphEdges(node.id, initialNodes.nodes, initialNodes.edges);
            originalEdgesMap.set(node.id, policyEdges);
          }
        }
      });
      setOriginalPolicyEdges(originalEdgesMap);
    }
  }, [policyIds, initialNodes, setNodes, setEdges, collectPolicySubgraphEdges, policies]);

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

  // Count conditions connected to a policy node (for validation)
  const countConnectedConditions = useCallback((nodeId: string): number => {
    const currentEdges = edgesRef.current;
    const currentNodes = nodesRef.current;

    // Helper to check if a value node has a complete condition chain (attr -> op -> val)
    const isCompleteConditionChain = (valueNodeId: string): boolean => {
      const valueNode = currentNodes.find(n => n.id === valueNodeId && n.type === "value");
      if (!valueNode) return false;
      const operatorEdge = currentEdges.find(e => e.target === valueNode.id);
      if (!operatorEdge) return false;
      const operatorNode = currentNodes.find(n => n.id === operatorEdge.source && n.type === "operator");
      if (!operatorNode) return false;
      const attributeEdge = currentEdges.find(e => e.target === operatorNode.id);
      if (!attributeEdge) return false;
      const attributeNode = currentNodes.find(n => n.id === attributeEdge.source && n.type === "attribute");
      return !!attributeNode;
    };

    let count = 0;
    const outputEdges = currentEdges.filter(e => e.target === nodeId);

    for (const outputEdge of outputEdges) {
      const outputNode = currentNodes.find(n => n.id === outputEdge.source && n.type === "output");
      if (!outputNode) continue;

      const toOutputEdge = currentEdges.find(e => e.target === outputNode.id);
      if (!toOutputEdge) continue;

      const sourceNode = currentNodes.find(n => n.id === toOutputEdge.source);
      if (!sourceNode) continue;

      // Handle conditionLogic node (AND/OR)
      if (sourceNode.type === "conditionLogic") {
        const valueEdges = currentEdges.filter(e => e.target === sourceNode.id);
        for (const valueEdge of valueEdges) {
          if (isCompleteConditionChain(valueEdge.source)) {
            count++;
          }
        }
      } else if (sourceNode.type === "value") {
        // Direct value → output connection
        if (isCompleteConditionChain(sourceNode.id)) {
          count++;
        }
      }
    }

    return count;
  }, []);

  // Helper to trace a condition chain and extract data for statement generation
  const traceConditionForStatement = useCallback((valueNodeId: string): ConditionData | null => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    const valueNode = currentNodes.find(n => n.id === valueNodeId && n.type === "value");
    if (!valueNode) return null;

    const operatorEdge = currentEdges.find(e => e.target === valueNode.id);
    if (!operatorEdge) return null;

    const operatorNode = currentNodes.find(n => n.id === operatorEdge.source && n.type === "operator");
    if (!operatorNode) return null;

    const attributeEdge = currentEdges.find(e => e.target === operatorNode.id);
    if (!attributeEdge) return null;

    const attributeNode = currentNodes.find(n => n.id === attributeEdge.source && n.type === "attribute");
    if (!attributeNode) return null;

    return {
      attribute: attributeNode.data.attribute,
      operator: operatorNode.data.operator,
      value: valueNode.data.value,
      sourceRegulation: attributeNode.data.sourceRegulation,
      expiryDate: attributeNode.data.expiryDate,
    };
  }, []);

  // Extracts all connected conditions for a given policy node
  const getConnectedConditionsData = useCallback((policyNodeId: string): {
    conditions: ConditionData[];
    conditionLogic: "AND" | "OR";
  } => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    const conditions: ConditionData[] = [];
    let detectedConditionLogic: "AND" | "OR" = "AND";

    // Find all output nodes connected to this policy
    const outputEdges = currentEdges.filter(e => e.target === policyNodeId);

    for (const outputEdge of outputEdges) {
      const outputNode = currentNodes.find(n => n.id === outputEdge.source && n.type === "output");
      if (!outputNode) continue;

      const toOutputEdge = currentEdges.find(e => e.target === outputNode.id);
      if (!toOutputEdge) continue;

      const sourceNode = currentNodes.find(n => n.id === toOutputEdge.source);
      if (!sourceNode) continue;

      // Handle conditionLogic node (AND/OR)
      if (sourceNode.type === "conditionLogic") {
        const logicData = sourceNode.data as ConditionLogicNodeData;
        detectedConditionLogic = logicData.conditionLogic || "AND";

        const valueEdges = currentEdges.filter(e => e.target === sourceNode.id);
        for (const valueEdge of valueEdges) {
          const condition = traceConditionForStatement(valueEdge.source);
          if (condition) {
            conditions.push(condition);
          }
        }
      } else if (sourceNode.type === "value") {
        const condition = traceConditionForStatement(sourceNode.id);
        if (condition) {
          conditions.push(condition);
        }
      }
    }

    return { conditions, conditionLogic: detectedConditionLogic };
  }, [traceConditionForStatement]);

  // Get connected output data for a policy node
  const getConnectedOutputData = useCallback((policyNodeId: string): {
    outputType: string;
    output: Record<string, any>;
  } | null => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    // Find output nodes connected to this policy (directly or via merge strategy)
    const directEdges = currentEdges.filter(e => e.target === policyNodeId);

    for (const edge of directEdges) {
      const sourceNode = currentNodes.find(n => n.id === edge.source);
      if (!sourceNode) continue;

      // Direct output node connection
      if (sourceNode.type === "output") {
        return {
          outputType: sourceNode.data.outputType,
          output: sourceNode.data.output || {},
        };
      }

      // Merge strategy node - trace back to find output node
      if (sourceNode.type === "mergeStrategy") {
        const toMergeEdges = currentEdges.filter(e => e.target === sourceNode.id);
        for (const toMergeEdge of toMergeEdges) {
          const outputNode = currentNodes.find(n => n.id === toMergeEdge.source && n.type === "output");
          if (outputNode) {
            return {
              outputType: outputNode.data.outputType,
              output: outputNode.data.output || {},
            };
          }
        }
      }
    }

    return null;
  }, []);

  // Save a new policy - defined early so it can be used in useEffects
  const handleSaveNewPolicy = useCallback(async (nodeId: string, status: "draft" | "published" = "draft") => {
    // Use refs to get current nodes/edges (refs are always up-to-date)
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const policyNode = currentNodes.find(n => n.id === nodeId && n.type === "policyCenter");

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

    // Helper to trace from value node back to attribute
    const traceConditionChainLocal = (valueNodeId: string, outputData?: any): PolicyCondition | null => {
      const valueNode = currentNodes.find(n => n.id === valueNodeId && n.type === "value");
      if (!valueNode) return null;

      const operatorEdge = currentEdges.find(e => e.target === valueNode.id);
      if (!operatorEdge) return null;
      const operatorNode = currentNodes.find(n => n.id === operatorEdge.source && n.type === "operator");
      if (!operatorNode) return null;

      const attributeEdge = currentEdges.find(e => e.target === operatorNode.id);
      if (!attributeEdge) return null;
      const attributeNode = currentNodes.find(n => n.id === attributeEdge.source && n.type === "attribute");
      if (!attributeNode) return null;

      return {
        id: attributeNode.data.id || generateId(),
        attribute: attributeNode.data.attribute,
        operator: operatorNode.data.operator,
        value: valueNode.data.value,
        sourceRegulation: attributeNode.data.sourceRegulation,
        notes: attributeNode.data.notes,
        output: outputData,
      };
    };

    // Find conditions connected to this policy using current state
    const conditions: PolicyCondition[] = [];
    const outputEdges = currentEdges.filter(e => e.target === nodeId);

    // Detect conditionLogic from graph structure
    let detectedConditionLogic: "AND" | "OR" | undefined = policyData.conditionLogic;

    for (const outputEdge of outputEdges) {
      const outputNode = currentNodes.find(n => n.id === outputEdge.source && n.type === "output");
      if (!outputNode) continue;

      // Check what's connected to the output node
      const toOutputEdge = currentEdges.find(e => e.target === outputNode.id);
      if (!toOutputEdge) continue;

      const sourceNode = currentNodes.find(n => n.id === toOutputEdge.source);
      if (!sourceNode) continue;

      // Handle conditionLogic node (AND/OR)
      if (sourceNode.type === "conditionLogic") {
        const logicNode = sourceNode;
        const logicData = logicNode.data as ConditionLogicNodeData;

        // Detect conditionLogic from the node in the graph
        if (logicData.conditionLogic) {
          detectedConditionLogic = logicData.conditionLogic;
        }

        // Find all value nodes connected to this logic node
        const valueEdges = currentEdges.filter(e => e.target === logicNode.id);

        for (const valueEdge of valueEdges) {
          const condition = traceConditionChainLocal(valueEdge.source, outputNode.data.output);
          if (condition) {
            conditions.push(condition);
          }
        }
      } else if (sourceNode.type === "value") {
        // Direct value → output connection (existing behavior)
        const condition = traceConditionChainLocal(sourceNode.id, outputNode.data.output);
        if (condition) {
          conditions.push(condition);
        }
      }
    }

    // Validate conditions for publish
    if (status === "published" && conditions.length === 0) {
      toast.error("Cannot publish a policy with no conditions. Add at least one condition or save as draft.");
      return;
    }

    // Warn on draft with no conditions (non-blocking)
    if (status === "draft" && conditions.length === 0) {
      toast.warning("Saving draft with no conditions. This policy won't be functional until conditions are added.");
    }

    setSavingPolicies(prev => new Set(prev).add(nodeId));

    try {
      const newPolicyId = await onCreatePolicy({
        jurisdictionId,
        policyType: policyData.policyType,
        name: policyData.name,
        description: policyData.description,
        conditions,
        conditionLogic: detectedConditionLogic,
        baseOutput: policyData.baseOutput,
        mergeStrategies: policyData.mergeStrategies,
        status,
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
                  status,
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

      // Track this policy ID to prevent race condition with Convex query subscription
      recentlySavedPoliciesRef.current.add(newPolicyId);
      // Clear after delay to allow the effect to skip reinitialization
      setTimeout(() => {
        recentlySavedPoliciesRef.current.delete(newPolicyId);
      }, 2000);

      toast.success(status === "published" ? "Policy published!" : "Policy saved as draft!");
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
  const saveHandlerRef = useRef<(nodeId: string, status: "draft" | "published") => void>(() => {});

  // Update the ref whenever handleSaveNewPolicy changes
  useEffect(() => {
    saveHandlerRef.current = handleSaveNewPolicy;
  }, [handleSaveNewPolicy]);

  // Handler to show the save options dialog
  const handleShowSaveOptionsDialog = useCallback((nodeId: string) => {
    setPendingSaveNodeId(nodeId);
    setShowSaveOptionsDialog(true);
  }, []);

  // Handler for when user selects an option in the save dialog
  const handleSaveFromDialog = useCallback(async (status: "draft" | "published") => {
    if (!pendingSaveNodeId) return;

    setShowSaveOptionsDialog(false);
    await saveHandlerRef.current(pendingSaveNodeId, status);
    setPendingSaveNodeId(null);
  }, [pendingSaveNodeId]);

  // Handler for publishing a draft policy
  const handlePublishPolicy = useCallback(async (nodeId: string, policyId: string) => {
    if (!onPublishPolicy) return;

    // Count connected conditions before publishing
    const conditionCount = countConnectedConditions(nodeId);
    if (conditionCount === 0) {
      toast.error("Cannot publish a policy with no conditions. Connect at least one condition first.");
      return;
    }

    setPublishingPolicies(prev => new Set(prev).add(nodeId));

    try {
      await onPublishPolicy(policyId);

      // Update the node's status to published
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  status: "published",
                },
              }
            : node
        )
      );

      toast.success("Policy published!");
    } catch (error) {
      console.error("Failed to publish policy:", error);
      toast.error("Failed to publish policy");
    } finally {
      setPublishingPolicies(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  }, [onPublishPolicy, setNodes]);

  // Handler for saving published policy changes as a new draft
  const handleSavePublishedAsDraft = useCallback(async (nodeId: string, policyId: string) => {
    if (!onCreateDraftFromPublished) return;

    // Use refs to get current nodes/edges
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    // Helper to trace from value node back to attribute
    const traceConditionChainLocal = (valueNodeId: string, outputData?: any): PolicyCondition | null => {
      const valueNode = currentNodes.find(n => n.id === valueNodeId && n.type === "value");
      if (!valueNode) return null;

      const operatorEdge = currentEdges.find(e => e.target === valueNode.id);
      if (!operatorEdge) return null;
      const operatorNode = currentNodes.find(n => n.id === operatorEdge.source && n.type === "operator");
      if (!operatorNode) return null;

      const attributeEdge = currentEdges.find(e => e.target === operatorNode.id);
      if (!attributeEdge) return null;
      const attributeNode = currentNodes.find(n => n.id === attributeEdge.source && n.type === "attribute");
      if (!attributeNode) return null;

      return {
        id: attributeNode.data.id || generateId(),
        attribute: attributeNode.data.attribute,
        operator: operatorNode.data.operator,
        value: valueNode.data.value,
        sourceRegulation: attributeNode.data.sourceRegulation,
        notes: attributeNode.data.notes,
        output: outputData,
      };
    };

    // Find conditions connected to this policy (same logic as handleSaveNewPolicy)
    const conditions: PolicyCondition[] = [];
    const outputEdges = currentEdges.filter(e => e.target === nodeId);

    // Detect conditionLogic from graph structure
    let detectedConditionLogic: "AND" | "OR" | undefined;

    for (const outputEdge of outputEdges) {
      const outputNode = currentNodes.find(n => n.id === outputEdge.source && n.type === "output");
      if (!outputNode) continue;

      // Check what's connected to the output node
      const toOutputEdge = currentEdges.find(e => e.target === outputNode.id);
      if (!toOutputEdge) continue;

      const sourceNode = currentNodes.find(n => n.id === toOutputEdge.source);
      if (!sourceNode) continue;

      // Handle conditionLogic node (AND/OR)
      if (sourceNode.type === "conditionLogic") {
        const logicNode = sourceNode;
        const logicData = logicNode.data as ConditionLogicNodeData;

        // Detect conditionLogic from the node in the graph
        if (logicData.conditionLogic) {
          detectedConditionLogic = logicData.conditionLogic;
        }

        // Find all value nodes connected to this logic node
        const valueEdges = currentEdges.filter(e => e.target === logicNode.id);

        for (const valueEdge of valueEdges) {
          const condition = traceConditionChainLocal(valueEdge.source, outputNode.data.output);
          if (condition) {
            conditions.push(condition);
          }
        }
      } else if (sourceNode.type === "value") {
        // Direct value → output connection (existing behavior)
        const condition = traceConditionChainLocal(sourceNode.id, outputNode.data.output);
        if (condition) {
          conditions.push(condition);
        }
      }
    }

    // Get condition logic from the policy node (fallback) or detected from graph
    const policyNode = currentNodes.find(n => n.id === nodeId);
    const conditionLogic = detectedConditionLogic || (policyNode?.data as PolicyCenterNodeData)?.conditionLogic;

    setSavingPolicies(prev => new Set(prev).add(nodeId));

    try {
      await onCreateDraftFromPublished(policyId, conditions, conditionLogic);

      // Update original edge state for this policy (reset pending changes)
      // Use full subgraph edges for consistency with initialization
      const currentEdgeIds = collectPolicySubgraphEdges(nodeId, currentNodes, currentEdges);
      setOriginalPolicyEdges(prev => {
        const next = new Map(prev);
        next.set(nodeId, currentEdgeIds);
        return next;
      });

      toast.success("Draft version created! The published policy remains active.");
    } catch (error) {
      console.error("Failed to create draft from published:", error);
      toast.error("Failed to save as draft");
    } finally {
      setSavingPolicies(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  }, [onCreateDraftFromPublished, collectPolicySubgraphEdges]);

  // Handler for showing delete confirmation dialog
  const handleShowDeleteConfirmDialog = useCallback((nodeId: string, policyId: string) => {
    setPendingDeleteNodeId(nodeId);
    setPendingDeletePolicyId(policyId);
    setShowDeleteConfirmDialog(true);
  }, []);

  // Handler for confirming policy deletion
  const handleConfirmDeletePolicy = useCallback(async () => {
    if (!pendingDeleteNodeId || !pendingDeletePolicyId || !onDeletePolicy) return;

    const nodeId = pendingDeleteNodeId;
    const policyId = pendingDeletePolicyId;

    setShowDeleteConfirmDialog(false);
    setDeletingPolicies(prev => new Set(prev).add(nodeId));

    try {
      // Get current state for subgraph collection BEFORE deletion
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      // Collect all nodes in the policy's subgraph (policy + output + logic + value + operator + attribute)
      const subgraphNodeIds = collectPolicySubgraphNodes(nodeId, currentNodes, currentEdges);
      const subgraphNodeIdSet = new Set(subgraphNodeIds);

      // Delete from database
      await onDeletePolicy(policyId);

      // Record history before removing nodes
      recordHistory();

      // Remove all subgraph nodes from canvas
      setNodes((nds) => nds.filter((node) => !subgraphNodeIdSet.has(node.id)));

      // Remove all edges that involve any subgraph node
      setEdges((eds) => eds.filter((edge) =>
        !subgraphNodeIdSet.has(edge.source) && !subgraphNodeIdSet.has(edge.target)
      ));
    } catch (error) {
      console.error("Failed to delete policy:", error);
      toast.error("Failed to delete policy");
    } finally {
      setDeletingPolicies(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
      setPendingDeleteNodeId(null);
      setPendingDeletePolicyId(null);
    }
  }, [pendingDeleteNodeId, pendingDeletePolicyId, onDeletePolicy, setNodes, setEdges, recordHistory, collectPolicySubgraphNodes]);

  // Inject callbacks into policy nodes
  useEffect(() => {
    // Compute pending changes inside the effect to avoid circular dependency
    // Takes currentNodes to traverse the policy's full subgraph
    const computePendingChanges = (nodeId: string, currentNodes: Node[]): boolean => {
      const originalEdgeSet = originalPolicyEdges.get(nodeId);
      if (!originalEdgeSet) return false;

      // Get all edges in the policy's subgraph (not just direct connections)
      // This includes edges to output nodes and conditionLogic nodes
      const visitedNodes = new Set<string>();
      const nodesToVisit: string[] = [nodeId];
      const currentEdgeSet = new Set<string>();

      while (nodesToVisit.length > 0) {
        const currentNodeId = nodesToVisit.shift()!;
        if (visitedNodes.has(currentNodeId)) continue;
        visitedNodes.add(currentNodeId);

        edges.forEach((edge) => {
          if (edge.target === currentNodeId) {
            currentEdgeSet.add(`${edge.source}|${edge.sourceHandle || ''}|${edge.target}|${edge.targetHandle || ''}`);

            const sourceNode = currentNodes.find(n => n.id === edge.source);
            if (sourceNode && (sourceNode.type === "output" || sourceNode.type === "conditionLogic")) {
              nodesToVisit.push(sourceNode.id);
            }
          }
        });
      }

      // Compare: check if edges were added or removed
      if (currentEdgeSet.size !== originalEdgeSet.size) return true;
      for (const id of currentEdgeSet) {
        if (!originalEdgeSet.has(id)) return true;
      }
      for (const id of originalEdgeSet) {
        if (!currentEdgeSet.has(id)) return true;
      }
      return false;
    };

    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "policyCenter") {
          const data = node.data as PolicyCenterNodeData;

          // Generate condition statement for this policy node
          const { conditions, conditionLogic } = getConnectedConditionsData(node.id);
          const conditionStatement = generateConditionStatement(conditions, conditionLogic);

          // Generate structured condition items for rendering with citations
          const { items: conditionItems, connector: conditionConnector } = generateConditionItems(conditions, conditionLogic);

          // Generate output statement for this policy node
          const outputData = getConnectedOutputData(node.id);
          const outputStatement = outputData
            ? generateOutputStatement(outputData.outputType, outputData.output)
            : '';

          if (data.isNew) {
            // New unsaved policy - inject save handler
            return {
              ...node,
              data: {
                ...data,
                conditionStatement,
                conditionItems,
                conditionConnector,
                outputStatement,
                isSaving: savingPolicies.has(node.id),
                onSave: () => handleShowSaveOptionsDialog(node.id),
              },
            };
          } else if (data.status === "draft" && data._id) {
            // Existing draft policy - inject publish and delete handlers
            return {
              ...node,
              data: {
                ...data,
                conditionStatement,
                conditionItems,
                conditionConnector,
                outputStatement,
                isPublishing: publishingPolicies.has(node.id),
                onPublish: () => handlePublishPolicy(node.id, data._id!),
                isDeleting: deletingPolicies.has(node.id),
                onDelete: onDeletePolicy ? () => handleShowDeleteConfirmDialog(node.id, data._id!) : undefined,
              },
            };
          } else if (data.status === "published" && data._id) {
            // Published policy - inject pending changes state, save as draft handler, AND delete handler
            const hasPendingChanges = computePendingChanges(node.id, nds);
            return {
              ...node,
              data: {
                ...data,
                conditionStatement,
                conditionItems,
                conditionConnector,
                outputStatement,
                hasPendingChanges,
                isSavingAsDraft: savingPolicies.has(node.id),
                onSaveAsDraft: hasPendingChanges
                  ? () => handleSavePublishedAsDraft(node.id, data._id!)
                  : undefined,
                // Enable deletion for published policies
                isDeleting: deletingPolicies.has(node.id),
                onDelete: onDeletePolicy
                  ? () => handleShowDeleteConfirmDialog(node.id, data._id!)
                  : undefined,
              },
            };
          }
        }
        return node;
      })
    );
  }, [savingPolicies, publishingPolicies, deletingPolicies, originalPolicyEdges, edges, setNodes, handleShowSaveOptionsDialog, handlePublishPolicy, handleSavePublishedAsDraft, handleShowDeleteConfirmDialog, onDeletePolicy, getConnectedConditionsData, getConnectedOutputData, conditionDataFingerprint]);

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
        // Record history before adding edge
        recordHistory();
        setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
        setHasUnsavedChanges(true);
      }
    },
    [setEdges, isValidConnection, recordHistory]
  );

  // Handle edge reconnection (dragging endpoint to a new node)
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (isValidConnection(newConnection)) {
        recordHistory();
        setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
        setHasUnsavedChanges(true);
      }
    },
    [setEdges, isValidConnection, recordHistory]
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

      // Record history before adding node
      recordHistory();

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
    [reactFlowInstance, setNodes, jurisdictionId, recordHistory]
  );

  // Helper to trace from value node back to attribute
  const traceConditionChain = useCallback((valueNodeId: string, outputData?: any): PolicyCondition | null => {
    const valueNode = nodes.find(n => n.id === valueNodeId && n.type === "value");
    if (!valueNode) return null;

    const operatorEdge = edges.find(e => e.target === valueNode.id);
    if (!operatorEdge) return null;
    const operatorNode = nodes.find(n => n.id === operatorEdge.source && n.type === "operator");
    if (!operatorNode) return null;

    const attributeEdge = edges.find(e => e.target === operatorNode.id);
    if (!attributeEdge) return null;
    const attributeNode = nodes.find(n => n.id === attributeEdge.source && n.type === "attribute");
    if (!attributeNode) return null;

    return {
      id: attributeNode.data.id || generateId(),
      attribute: attributeNode.data.attribute,
      operator: operatorNode.data.operator,
      value: valueNode.data.value,
      sourceRegulation: attributeNode.data.sourceRegulation,
      notes: attributeNode.data.notes,
      output: outputData,
    };
  }, [nodes, edges]);

  // Serialize conditions for a specific policy node
  const serializeConditionsForPolicy = useCallback((policyNodeId: string): PolicyCondition[] => {
    const conditions: PolicyCondition[] = [];

    // Find all output nodes connected to this policy
    const outputEdges = edges.filter(e => e.target === policyNodeId);

    for (const outputEdge of outputEdges) {
      const outputNode = nodes.find(n => n.id === outputEdge.source && n.type === "output");
      if (!outputNode) continue;

      // Check what's connected to the output node
      const toOutputEdge = edges.find(e => e.target === outputNode.id);
      if (!toOutputEdge) continue;

      const sourceNode = nodes.find(n => n.id === toOutputEdge.source);
      if (!sourceNode) continue;

      // Handle conditionLogic node
      if (sourceNode.type === "conditionLogic") {
        const logicNode = sourceNode;

        // Find all value nodes connected to this logic node
        const valueEdges = edges.filter(e => e.target === logicNode.id);

        for (const valueEdge of valueEdges) {
          const condition = traceConditionChain(valueEdge.source, outputNode.data.output);
          if (condition) {
            conditions.push(condition);
          }
        }
      } else if (sourceNode.type === "value") {
        // Direct value → output connection (existing behavior)
        const condition = traceConditionChain(sourceNode.id, outputNode.data.output);
        if (condition) {
          conditions.push(condition);
        }
      }
    }

    return conditions;
  }, [nodes, edges, traceConditionChain]);

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

    // Record history before deleting
    recordHistory();

    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => {
      const deletedIds = new Set(selectedNodes.map(n => n.id));
      return eds.filter((edge) => !deletedIds.has(edge.source) && !deletedIds.has(edge.target));
    });
    setHasUnsavedChanges(true);
  }, [nodes, setNodes, setEdges, recordHistory]);

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

            {/* Undo/Redo buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-gray-200" />

            {onResetLayout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetLayout}
                title="Reset layout to default"
              >
                <LayoutGrid className="h-4 w-4" />
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
          <TooltipProvider delayDuration={300}>
            <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
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
              {showHelpPanel ? (
                <div className="bg-white rounded-lg p-3 shadow-sm text-xs max-w-[220px]">
                  <div className="flex items-center justify-between font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      How to Build
                    </div>
                    <button
                      onClick={() => setShowHelpPanel(false)}
                      className="p-0.5 hover:bg-gray-100 rounded"
                    >
                      <X className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  </div>
                  <ol className="space-y-1 text-gray-500 list-decimal list-inside">
                    <li>Drag a <strong>Policy</strong> node onto canvas</li>
                    <li>Drag <strong>Attribute → Operator → Value → Output</strong></li>
                    <li>Connect Output to Policy</li>
                    <li>Click <strong>Save</strong> on the policy node</li>
                  </ol>
                </div>
              ) : (
                <button
                  onClick={() => setShowHelpPanel(true)}
                  className="w-9 h-9 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                  title="How to Build"
                >
                  <HelpCircle className="h-5 w-5 text-gray-500" />
                </button>
              )}
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
          </TooltipProvider>
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

      {/* Save Options Dialog (draft vs publish) */}
      <SaveOptionsDialog
        open={showSaveOptionsDialog}
        onOpenChange={(open) => {
          setShowSaveOptionsDialog(open);
          // Don't clear pendingSaveNodeId here - handleSaveFromDialog clears it after save completes
          // This prevents race condition where pendingSaveNodeId is cleared before async save finishes
        }}
        onSave={handleSaveFromDialog}
        isSaving={pendingSaveNodeId ? savingPolicies.has(pendingSaveNodeId) : false}
        policyName={
          pendingSaveNodeId
            ? (nodes.find(n => n.id === pendingSaveNodeId)?.data as PolicyCenterNodeData)?.name || "New Policy"
            : "New Policy"
        }
        hasConditions={pendingSaveNodeId ? countConnectedConditions(pendingSaveNodeId) > 0 : false}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-[400px]">
          {(() => {
            const policyNode = nodes.find(n => n.id === pendingDeleteNodeId);
            const policyData = policyNode?.data as PolicyCenterNodeData | undefined;
            const isPublished = policyData?.status === "published";

            return (
              <>
                <DialogHeader>
                  <DialogTitle className={`flex items-center gap-2 ${isPublished ? "text-orange-600" : "text-red-600"}`}>
                    <Trash2 className="h-5 w-5" />
                    Delete {isPublished ? "Published " : "Draft "}Policy
                  </DialogTitle>
                  <DialogDescription>
                    {isPublished
                      ? "Warning: You are about to permanently delete a published policy. This will remove the policy from the compliance system and cannot be undone."
                      : "Are you sure you want to delete this draft policy? This action cannot be undone."}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className={`${isPublished ? "bg-orange-50 border-orange-200" : "bg-red-50 border-red-200"} border rounded-lg p-3`}>
                    <p className={`text-sm font-medium ${isPublished ? "text-orange-800" : "text-red-800"}`}>
                      {policyData?.name || "Unnamed Policy"}
                    </p>
                    <p className={`text-xs ${isPublished ? "text-orange-600" : "text-red-600"} mt-1`}>
                      This will permanently remove the policy and all its connected condition nodes from the canvas.
                    </p>
                    {isPublished && (
                      <p className="text-xs text-orange-700 mt-2 font-medium">
                        This is a published policy currently in use!
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirmDialog(false);
                      setPendingDeleteNodeId(null);
                      setPendingDeletePolicyId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className={isPublished ? "bg-orange-600 hover:bg-orange-700" : ""}
                    onClick={handleConfirmDeletePolicy}
                    disabled={pendingDeleteNodeId ? deletingPolicies.has(pendingDeleteNodeId) : false}
                  >
                    {pendingDeleteNodeId && deletingPolicies.has(pendingDeleteNodeId) ? (
                      <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-1" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Delete
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
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

