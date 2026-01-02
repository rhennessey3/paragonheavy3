"use client";

import { useCallback, useMemo } from "react";
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  addEdge,
} from "@xyflow/react";
import {
  type CompliancePolicy,
  type PolicyCondition,
  type PolicyType,
} from "@/lib/compliance";

// Port type compatibility rules
const PORT_COMPATIBILITY: Record<string, string[]> = {
  attribute: ["operator"],
  operator: ["value"],
  value: ["output"],
  output: ["policyCenter"],
};

// Generate unique ID
function generateId() {
  return `node_${Math.random().toString(36).substring(2, 9)}`;
}

interface UseCanvasStateOptions {
  initialPolicy?: CompliancePolicy;
  policyType: PolicyType;
  jurisdictionId: string;
}

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: (connection: Connection) => void;
  isValidConnection: (connection: Connection) => boolean;
  addNode: (type: string, position: { x: number; y: number }, data: any) => void;
  removeNode: (nodeId: string) => void;
  serializeToPolicy: () => Partial<CompliancePolicy>;
  loadFromPolicy: (policy: CompliancePolicy) => void;
  conditionCount: number;
}

export function useCanvasState({
  initialPolicy,
  policyType,
  jurisdictionId,
}: UseCanvasStateOptions): CanvasState {
  // Initialize with a central policy node
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [
      {
        id: "policy_center",
        type: "policyCenter",
        position: { x: 600, y: 300 },
        data: {
          policyType,
          name: initialPolicy?.name || `New ${policyType} Policy`,
          description: initialPolicy?.description,
          status: initialPolicy?.status || "draft",
          baseOutput: initialPolicy?.baseOutput,
          mergeStrategies: initialPolicy?.mergeStrategies,
        },
      },
    ];

    // If editing an existing policy, load conditions as nodes
    if (initialPolicy?.conditions) {
      let yOffset = 100;
      initialPolicy.conditions.forEach((condition, index) => {
        const baseX = 50;
        const spacing = 150;

        // Create attribute node
        const attrId = `attr_${condition.id}`;
        nodes.push({
          id: attrId,
          type: "attribute",
          position: { x: baseX, y: yOffset },
          data: {
            id: condition.id,
            attribute: condition.attribute,
            label: condition.attribute.replace(/_/g, " "),
            sourceRegulation: condition.sourceRegulation,
          },
        });

        // Create operator node
        const opId = `op_${condition.id}`;
        nodes.push({
          id: opId,
          type: "operator",
          position: { x: baseX + spacing, y: yOffset },
          data: {
            id: `op_${condition.id}`,
            operator: condition.operator,
            label: condition.operator,
            symbol: getOperatorSymbol(condition.operator),
          },
        });

        // Create value node
        const valId = `val_${condition.id}`;
        nodes.push({
          id: valId,
          type: "value",
          position: { x: baseX + spacing * 2, y: yOffset },
          data: {
            id: `val_${condition.id}`,
            valueType: getValueType(condition.value),
            value: condition.value,
          },
        });

        // Create output node
        const outId = `out_${condition.id}`;
        nodes.push({
          id: outId,
          type: "output",
          position: { x: baseX + spacing * 3, y: yOffset },
          data: {
            id: `out_${condition.id}`,
            outputType: policyType,
            label: `${policyType} Output`,
            output: condition.output || {},
          },
        });

        yOffset += 150;
      });
    }

    return nodes;
  }, [initialPolicy, policyType]);

  // Initialize edges for existing policy
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    if (initialPolicy?.conditions) {
      initialPolicy.conditions.forEach((condition) => {
        const attrId = `attr_${condition.id}`;
        const opId = `op_${condition.id}`;
        const valId = `val_${condition.id}`;
        const outId = `out_${condition.id}`;

        edges.push(
          { id: `e_${attrId}_${opId}`, source: attrId, target: opId },
          { id: `e_${opId}_${valId}`, source: opId, target: valId },
          { id: `e_${valId}_${outId}`, source: valId, target: outId },
          { id: `e_${outId}_policy`, source: outId, target: "policy_center" }
        );
      });
    }

    return edges;
  }, [initialPolicy]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Validate connection
  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      const sourceType = sourceNode.type || "";
      const targetType = targetNode.type || "";

      const allowedTargets = PORT_COMPATIBILITY[sourceType] || [];
      return allowedTargets.includes(targetType);
    },
    [nodes]
  );

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      if (isValidConnection(connection)) {
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: "smoothstep",
              animated: true,
              style: { stroke: "#6366f1", strokeWidth: 2 },
            },
            eds
          )
        );
      }
    },
    [setEdges, isValidConnection]
  );

  // Add a new node
  const addNode = useCallback(
    (type: string, position: { x: number; y: number }, data: any) => {
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
    [setNodes]
  );

  // Remove a node
  const removeNode = useCallback(
    (nodeId: string) => {
      if (nodeId === "policy_center") return; // Prevent deleting policy center
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

  // Serialize canvas to policy format
  const serializeToPolicy = useCallback((): Partial<CompliancePolicy> => {
    const conditions: PolicyCondition[] = [];

    // Find all complete chains
    const outputNodes = nodes.filter((n) => n.type === "output");

    for (const outputNode of outputNodes) {
      const toPolicy = edges.find(
        (e) => e.source === outputNode.id && e.target === "policy_center"
      );
      if (!toPolicy) continue;

      const valueEdge = edges.find((e) => e.target === outputNode.id);
      if (!valueEdge) continue;
      const valueNode = nodes.find(
        (n) => n.id === valueEdge.source && n.type === "value"
      );
      if (!valueNode) continue;

      const operatorEdge = edges.find((e) => e.target === valueNode.id);
      if (!operatorEdge) continue;
      const operatorNode = nodes.find(
        (n) => n.id === operatorEdge.source && n.type === "operator"
      );
      if (!operatorNode) continue;

      const attributeEdge = edges.find((e) => e.target === operatorNode.id);
      if (!attributeEdge) continue;
      const attributeNode = nodes.find(
        (n) => n.id === attributeEdge.source && n.type === "attribute"
      );
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

    const policyCenterNode = nodes.find((n) => n.id === "policy_center");

    return {
      _id: initialPolicy?._id,
      jurisdictionId,
      policyType,
      name: policyCenterNode?.data.name || `New ${policyType} Policy`,
      description: policyCenterNode?.data.description,
      status: "draft",
      conditions,
      baseOutput: policyCenterNode?.data.baseOutput,
      mergeStrategies: policyCenterNode?.data.mergeStrategies,
    };
  }, [nodes, edges, initialPolicy, jurisdictionId, policyType]);

  // Load policy into canvas
  const loadFromPolicy = useCallback(
    (policy: CompliancePolicy) => {
      // Reset canvas and reload from policy
      // This would be similar to the initial setup logic
    },
    []
  );

  // Count connected conditions
  const conditionCount = useMemo(() => {
    const outputNodes = nodes.filter((n) => n.type === "output");
    return outputNodes.filter((on) =>
      edges.some((e) => e.source === on.id && e.target === "policy_center")
    ).length;
  }, [nodes, edges]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isValidConnection,
    addNode,
    removeNode,
    serializeToPolicy,
    loadFromPolicy,
    conditionCount,
  };
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



