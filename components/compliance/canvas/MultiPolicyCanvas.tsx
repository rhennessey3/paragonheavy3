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
  type ReactFlowInstance,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Trash2, Undo, Info, AlertCircle } from "lucide-react";
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

interface MultiPolicyCanvasProps {
  /** Existing policies to display */
  policies: CompliancePolicy[];
  /** Current jurisdiction ID */
  jurisdictionId?: string;
  /** Callback when a policy needs to be created */
  onCreatePolicy: (policy: Partial<CompliancePolicy>) => Promise<string>;
  /** Callback when a policy needs to be updated */
  onUpdatePolicy: (policyId: string, updates: Partial<CompliancePolicy>) => Promise<void>;
  /** Callback when a policy is deleted */
  onDeletePolicy?: (policyId: string) => Promise<void>;
  /** Callback when a policy is clicked (for navigation) */
  onPolicyClick?: (policyId: string) => void;
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

export function MultiPolicyCanvas({
  policies,
  jurisdictionId,
  onCreatePolicy,
  onUpdatePolicy,
  onDeletePolicy,
  onPolicyClick,
}: MultiPolicyCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [savingPolicies, setSavingPolicies] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Convert existing policies to nodes
  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    policies.forEach((policy, index) => {
      const row = Math.floor(index / POLICIES_PER_ROW);
      const col = index % POLICIES_PER_ROW;
      const policyNodeId = `policy_${policy._id}`;

      // Create policy center node
      nodes.push({
        id: policyNodeId,
        type: "policyCenter",
        position: { 
          x: 100 + col * POLICY_SPACING_X, 
          y: 200 + row * POLICY_SPACING_Y 
        },
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
          nodes.push({
            id: attrId,
            type: "attribute",
            position: { x: baseX, y: baseY },
            data: {
              id: condition.id,
              attribute: condition.attribute,
              label: condition.attribute.replace(/_/g, " "),
              sourceRegulation: condition.sourceRegulation,
            },
          });

          // Operator node
          const opId = `op_${policy._id}_${condition.id}`;
          nodes.push({
            id: opId,
            type: "operator",
            position: { x: baseX + spacing, y: baseY },
            data: {
              id: `op_${condition.id}`,
              operator: condition.operator,
              label: condition.operator,
              symbol: getOperatorSymbol(condition.operator),
            },
          });

          // Value node
          const valId = `val_${policy._id}_${condition.id}`;
          nodes.push({
            id: valId,
            type: "value",
            position: { x: baseX + spacing * 2, y: baseY },
            data: {
              id: `val_${condition.id}`,
              valueType: getValueType(condition.value),
              value: condition.value,
            },
          });

          // Output node
          const outId = `out_${policy._id}_${condition.id}`;
          nodes.push({
            id: outId,
            type: "output",
            position: { x: baseX + spacing * 3, y: baseY },
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
  }, [policies]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialNodes.edges);

  // Re-initialize when policies change
  useEffect(() => {
    setNodes(initialNodes.nodes);
    setEdges(initialNodes.edges);
  }, [initialNodes, setNodes, setEdges]);

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
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteSelected}
              title="Delete selected"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {hasUnsavedChanges && (
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
            nodeTypes={nodeTypes}
            isValidConnection={isValidConnection}
            fitView
            fitViewOptions={{ padding: 0.2 }}
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

