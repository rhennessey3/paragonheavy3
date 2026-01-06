"use client";

import { useCallback, useRef, useState, useMemo } from "react";
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
import { Save, Play, Trash2, Undo, Redo } from "lucide-react";

import { NodePalette } from "./NodePalette";
import { AttributeNode } from "./nodes/AttributeNode";
import { OperatorNode } from "./nodes/OperatorNode";
import { ValueNode } from "./nodes/ValueNode";
import { OutputNode } from "./nodes/OutputNode";
import { PolicyCenterNode } from "./nodes/PolicyCenterNode";
import { ConditionLogicNode } from "./nodes/ConditionLogicNode";
import { ConditionGroupNode } from "./nodes/ConditionGroupNode";
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
  conditionLogic: ConditionLogicNode,
  conditionGroup: ConditionGroupNode,
};

// Port type compatibility rules
const PORT_COMPATIBILITY: Record<string, string[]> = {
  attribute: ["operator"],                    // Attributes connect to operators
  operator: ["value"],                        // Operators connect to values
  value: ["output", "conditionGroup", "conditionLogic"],  // Values connect to outputs, groups, or logic
  conditionGroup: ["conditionLogic"],         // Groups connect to logic nodes
  conditionLogic: ["output"],                 // Logic nodes connect to outputs
  output: ["policyCenter"],                   // Outputs connect to policy center
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

interface CanvasBuilderProps {
  /** Initial policy to load (for editing) */
  initialPolicy?: CompliancePolicy;
  /** Policy type for new policies */
  policyType: PolicyType;
  /** Jurisdiction ID */
  jurisdictionId: string;
  /** Callback when policy is saved */
  onSave: (policy: Partial<CompliancePolicy>) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

// Generate unique ID
function generateId() {
  return `node_${Math.random().toString(36).substring(2, 9)}`;
}

export function CanvasBuilder({
  initialPolicy,
  policyType,
  jurisdictionId,
  onSave,
  onCancel,
}: CanvasBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [policyName, setPolicyName] = useState(initialPolicy?.name || "");

  // Initialize with a central policy node
  const initialNodes: Node[] = useMemo(() => {
    return [
      {
        id: "policy_center",
        type: "policyCenter",
        position: { x: 600, y: 300 },
        data: {
          policyType,
          name: initialPolicy?.name || `New ${policyType} Policy`,
          status: initialPolicy?.status || "draft",
        },
      },
    ];
  }, [policyType, initialPolicy]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Validate connection based on port types
  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return false;
    
    const sourceType = sourceNode.type || "";
    const targetType = targetNode.type || "";
    
    // Check if source can connect to target
    const allowedTargets = PORT_COMPATIBILITY[sourceType] || [];
    return allowedTargets.includes(targetType);
  }, [nodes]);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (isValidConnection(params)) {
        setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
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

      const newNode: Node = {
        id: generateId(),
        type,
        position,
        data: {
          ...data,
          id: generateId(),
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  // Delete selected nodes
  const onDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected || node.id === "policy_center"));
    setEdges((eds) => eds.filter((edge) => {
      const sourceSelected = nodes.find(n => n.id === edge.source)?.selected;
      const targetSelected = nodes.find(n => n.id === edge.target)?.selected;
      return !sourceSelected && !targetSelected;
    }));
  }, [nodes, setNodes, setEdges]);

  // Helper to trace back a complete condition chain from a given node
  const traceConditionChain = useCallback((startNodeId: string): PolicyCondition | null => {
    // Find the value node that connects to this node
    const valueEdge = edges.find(e => e.target === startNodeId);
    if (!valueEdge) return null;

    const valueNode = nodes.find(n => n.id === valueEdge.source && n.type === "value");
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
    };
  }, [nodes, edges]);

  // Serialize canvas to policy format
  const serializeToPolicy = useCallback((): Partial<CompliancePolicy> => {
    const conditions: PolicyCondition[] = [];

    // Find all complete chains that connect to policyCenter
    const outputNodes = nodes.filter(n => n.type === "output");

    for (const outputNode of outputNodes) {
      // Check if this output is connected to the policy center
      const toPolicy = edges.find(e => e.source === outputNode.id && e.target === "policy_center");
      if (!toPolicy) continue;

      // Check what connects to this output node
      const inputEdge = edges.find(e => e.target === outputNode.id);
      if (!inputEdge) continue;

      const sourceNode = nodes.find(n => n.id === inputEdge.source);
      if (!sourceNode) continue;

      // Case 1: Direct value -> output connection (simple chain)
      if (sourceNode.type === "value") {
        const condition = traceConditionChain(outputNode.id);
        if (condition) {
          conditions.push({
            ...condition,
            output: outputNode.data.output,
          });
        }
      }

      // Case 2: conditionLogic -> output connection (combined conditions)
      else if (sourceNode.type === "conditionLogic") {
        const logicNode = sourceNode;
        const logicType = logicNode.data.conditionLogic as "AND" | "OR";

        // Find all edges that connect TO the logic node
        const logicInputEdges = edges.filter(e => e.target === logicNode.id);
        const subConditions: PolicyCondition[] = [];

        for (const logicInputEdge of logicInputEdges) {
          const inputNode = nodes.find(n => n.id === logicInputEdge.source);
          if (!inputNode) continue;

          // If input is a value node, trace back the chain
          if (inputNode.type === "value") {
            const condition = traceConditionChain(logicNode.id);
            if (condition) {
              subConditions.push(condition);
            }
          }

          // If input is from a conditionGroup, trace each branch
          else if (inputNode.type === "conditionGroup") {
            // Find what connects to the group (parent condition)
            const parentCondition = traceConditionChain(inputNode.id);
            if (parentCondition) {
              subConditions.push(parentCondition);
            }
          }
        }

        // Add all sub-conditions with the output
        for (const subCond of subConditions) {
          conditions.push({
            ...subCond,
            output: outputNode.data.output,
          });
        }
      }
    }

    const policyCenterNode = nodes.find(n => n.id === "policy_center");

    return {
      _id: initialPolicy?._id,
      jurisdictionId,
      policyType,
      name: policyCenterNode?.data.name || policyName || `New ${policyType} Policy`,
      description: policyCenterNode?.data.description,
      status: "draft",
      conditions,
      baseOutput: policyCenterNode?.data.baseOutput,
      mergeStrategies: policyCenterNode?.data.mergeStrategies,
    };
  }, [nodes, edges, initialPolicy, jurisdictionId, policyType, policyName, traceConditionChain]);

  // Handle save
  const handleSave = useCallback(() => {
    const policy = serializeToPolicy();
    onSave(policy);
  }, [serializeToPolicy, onSave]);

  // Count connected conditions
  const conditionCount = useMemo(() => {
    const outputNodes = nodes.filter(n => n.type === "output");
    return outputNodes.filter(on => 
      edges.some(e => e.source === on.id && e.target === "policy_center")
    ).length;
  }, [nodes, edges]);

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Node Palette */}
      <NodePalette policyType={policyType} />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b bg-white px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              placeholder="Policy Name..."
              className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0"
            />
            <Badge variant="outline" className="text-xs">
              {conditionCount} condition{conditionCount !== 1 ? "s" : ""}
            </Badge>
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
            <div className="h-6 w-px bg-gray-200" />
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save Policy
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
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
            minZoom={0.2}
            maxZoom={2}
            defaultEdgeOptions={defaultEdgeOptions}
            deleteKeyCode={["Backspace", "Delete"]}
            multiSelectionKeyCode={["Shift"]}
            snapToGrid
            snapGrid={[15, 15]}
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
                switch (node.type) {
                  case "attribute": return "#dbeafe";
                  case "operator": return "#e9d5ff";
                  case "value": return "#d1fae5";
                  case "output": return "#fed7aa";
                  case "policyCenter": return "#c7d2fe";
                  default: return "#f3f4f6";
                }
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />

            {/* Help Panel */}
            <Panel position="bottom-right" className="m-4">
              <div className="bg-white rounded-lg p-3 shadow-sm text-xs max-w-[200px]">
                <div className="font-medium text-gray-700 mb-2">How to Build</div>
                <ol className="space-y-1 text-gray-500 list-decimal list-inside">
                  <li>Drag nodes from the palette</li>
                  <li>Connect: Attribute → Operator → Value → Output → Policy</li>
                  <li>Click Save when done</li>
                </ol>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}



