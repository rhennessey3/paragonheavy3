"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Filter,
  GitBranch,
  Layers,
  ArrowRight,
} from "lucide-react";

import { PolicyNode, type PolicyNodeData } from "./nodes/PolicyNode";
import { ConditionNode, type ConditionNodeData } from "./nodes/ConditionNode";
import { RuleNode, type RuleNodeData } from "./nodes/RuleNode";
import { FacetNode, type FacetNodeData } from "./nodes/FacetNode";
import {
  type PolicyType,
  type CompliancePolicy,
  type PolicyCondition,
  type PolicyRelationship,
  POLICY_TYPES,
  DEFAULT_MERGE_POLICIES,
} from "@/lib/compliance";

// Register custom node types
const nodeTypes = {
  policy: PolicyNode,
  condition: ConditionNode,
  rule: RuleNode,  // Keep for backward compatibility
  facet: FacetNode, // Keep for backward compatibility
};

// Edge styles for different relationship types
const edgeStyles = {
  condition_to_policy: {
    stroke: "#6366f1",
    strokeWidth: 2,
    animated: true,
  },
  requires: {
    stroke: "#22c55e",
    strokeWidth: 2,
  },
  exempts_from: {
    stroke: "#f59e0b",
    strokeWidth: 2,
    strokeDasharray: "5,5",
  },
  modifies: {
    stroke: "#8b5cf6",
    strokeWidth: 2,
    strokeDasharray: "3,3",
  },
  conflicts_with: {
    stroke: "#ef4444",
    strokeWidth: 2,
  },
};

export interface PolicyGraphProps {
  /** Policies to display */
  policies: CompliancePolicy[];
  /** Relationships between policies */
  relationships?: PolicyRelationship[];
  /** Jurisdiction info */
  jurisdictionName?: string;
  jurisdictionAbbr?: string;
  /** Callback when a policy node is clicked */
  onPolicyClick?: (policyId: string) => void;
  /** Callback when a condition is clicked */
  onConditionClick?: (policyId: string, conditionId: string) => void;
  /** Callback to add a new policy */
  onAddPolicy?: () => void;
  /** Callback to add a condition to a policy */
  onAddCondition?: (policyId: string) => void;
  /** Callback to edit policy settings */
  onEditPolicy?: (policyId: string) => void;
  /** Callback when a relationship is created */
  onCreateRelationship?: (sourcePolicyId: string, targetPolicyId: string) => void;
}

/**
 * Calculate layout positions for policy-centric graph.
 * Policies are the central nodes, with conditions flowing into them.
 */
function calculatePolicyLayout(
  policies: CompliancePolicy[]
): { policyNodes: Node[]; conditionNodes: Node[]; edges: Edge[] } {
  const policyNodes: Node[] = [];
  const conditionNodes: Node[] = [];
  const edges: Edge[] = [];

  // Layout constants
  const POLICY_WIDTH = 340;
  const POLICY_HEIGHT = 200;
  const CONDITION_WIDTH = 200;
  const CONDITION_HEIGHT = 80;
  const HORIZONTAL_GAP = 80;
  const VERTICAL_GAP = 120;
  const CONDITIONS_ABOVE_OFFSET = 180;

  // Group policies by type for organized layout
  const policiesByType: Record<PolicyType, CompliancePolicy[]> = {
    escort: [],
    permit: [],
    speed: [],
    hours: [],
    route: [],
    utility: [],
    dimension: [],
  };

  for (const policy of policies) {
    policiesByType[policy.policyType].push(policy);
  }

  // Calculate grid layout for policies
  let currentX = 0;
  let currentY = CONDITIONS_ABOVE_OFFSET + VERTICAL_GAP;
  let maxRowHeight = 0;
  const policiesPerRow = 3;
  let policiesInCurrentRow = 0;

  for (const policyType of Object.keys(policiesByType) as PolicyType[]) {
    const typePolicies = policiesByType[policyType];
    
    for (const policy of typePolicies) {
      // Create policy node
      const policyNodeId = `policy_${policy._id}`;
      
      policyNodes.push({
        id: policyNodeId,
        type: "policy",
        position: { x: currentX, y: currentY },
        data: {
          id: policy._id,
          policyType: policy.policyType,
          name: policy.name,
          description: policy.description,
          status: policy.status,
          conditionsCount: policy.conditions?.length || 0,
          mergeStrategies: policy.mergeStrategies || DEFAULT_MERGE_POLICIES[policy.policyType],
          outputPreview: policy.baseOutput,
        } as PolicyNodeData,
      });

      // Create condition nodes for this policy
      const conditions = policy.conditions || [];
      const conditionStartX = currentX - ((conditions.length - 1) * (CONDITION_WIDTH + 20)) / 2;
      
      conditions.forEach((condition, idx) => {
        const conditionNodeId = `condition_${policy._id}_${condition.id}`;
        const conditionX = conditionStartX + idx * (CONDITION_WIDTH + 20);
        const conditionY = currentY - CONDITIONS_ABOVE_OFFSET;

        conditionNodes.push({
          id: conditionNodeId,
          type: "condition",
          position: { x: conditionX, y: conditionY },
          data: {
            id: condition.id,
            attribute: condition.attribute,
            operator: condition.operator,
            value: condition.value,
            sourceRegulation: condition.sourceRegulation,
            notes: condition.notes,
            priority: condition.priority,
            targetPolicyId: policy._id,
            targetPolicyType: policy.policyType,
          } as ConditionNodeData,
        });

        // Edge from condition to policy
        edges.push({
          id: `edge_${conditionNodeId}_to_${policyNodeId}`,
          source: conditionNodeId,
          target: policyNodeId,
          targetHandle: "conditions",
          type: "smoothstep",
          style: edgeStyles.condition_to_policy,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#6366f1",
          },
        });
      });

      // Move to next position
      policiesInCurrentRow++;
      if (policiesInCurrentRow >= policiesPerRow) {
        currentX = 0;
        currentY += POLICY_HEIGHT + VERTICAL_GAP + CONDITIONS_ABOVE_OFFSET;
        policiesInCurrentRow = 0;
      } else {
        currentX += POLICY_WIDTH + HORIZONTAL_GAP;
      }
    }
  }

  return { policyNodes, conditionNodes, edges };
}

export function PolicyGraph({
  policies,
  relationships = [],
  jurisdictionName,
  jurisdictionAbbr,
  onPolicyClick,
  onConditionClick,
  onAddPolicy,
  onAddCondition,
  onEditPolicy,
  onCreateRelationship,
}: PolicyGraphProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<PolicyType[]>([]);

  // Calculate initial layout
  const { policyNodes: initialPolicyNodes, conditionNodes: initialConditionNodes, edges: initialEdges } = useMemo(
    () => calculatePolicyLayout(policies),
    [policies]
  );

  // Add relationship edges between policies
  const relationshipEdges: Edge[] = useMemo(() => {
    return relationships.map((rel) => ({
      id: `rel_${rel._id}`,
      source: `policy_${rel.sourcePolicyId}`,
      target: `policy_${rel.targetPolicyId}`,
      sourceHandle: "outgoing-relationship",
      targetHandle: "incoming-relationship",
      type: "smoothstep",
      style: edgeStyles[rel.relationshipType] || edgeStyles.requires,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeStyles[rel.relationshipType]?.stroke || "#22c55e",
      },
      label: rel.relationshipType.replace(/_/g, " "),
      labelStyle: { fontSize: 9, fill: edgeStyles[rel.relationshipType]?.stroke || "#22c55e" },
      labelBgStyle: { fill: "white" },
      data: { relationshipType: rel.relationshipType, notes: rel.notes },
    }));
  }, [relationships]);

  // Enrich policy nodes with callbacks
  const enrichedPolicyNodes = useMemo(() => {
    return initialPolicyNodes.map((node) => {
      const nodeData = node.data as PolicyNodeData;
      return {
        ...node,
        data: {
          ...nodeData,
          onEdit: onEditPolicy ? () => onEditPolicy(nodeData.id) : undefined,
          onAddCondition: onAddCondition ? () => onAddCondition(nodeData.id) : undefined,
        },
      };
    });
  }, [initialPolicyNodes, onEditPolicy, onAddCondition]);

  // Enrich condition nodes with callbacks
  const enrichedConditionNodes = useMemo(() => {
    return initialConditionNodes.map((node) => {
      const nodeData = node.data as ConditionNodeData;
      return {
        ...node,
        data: {
          ...nodeData,
          onEdit: onConditionClick && nodeData.targetPolicyId 
            ? () => onConditionClick(nodeData.targetPolicyId!, nodeData.id) 
            : undefined,
        },
      };
    });
  }, [initialConditionNodes, onConditionClick]);

  // Filter nodes based on search and type selection
  const filteredPolicyNodes = useMemo(() => {
    let filtered = enrichedPolicyNodes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((node) => {
        const nodeData = node.data as PolicyNodeData;
        return (
          nodeData.name.toLowerCase().includes(query) ||
          (nodeData.description?.toLowerCase().includes(query) ?? false)
        );
      });
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((node) => {
        const nodeData = node.data as PolicyNodeData;
        return selectedTypes.includes(nodeData.policyType);
      });
    }

    return filtered;
  }, [enrichedPolicyNodes, searchQuery, selectedTypes]);

  // Filter condition nodes to match filtered policies
  const filteredConditionNodes = useMemo(() => {
    const visiblePolicyIds = new Set(
      filteredPolicyNodes.map(n => (n.data as PolicyNodeData).id)
    );
    return enrichedConditionNodes.filter((node) => {
      const nodeData = node.data as ConditionNodeData;
      return visiblePolicyIds.has(nodeData.targetPolicyId || "");
    });
  }, [enrichedConditionNodes, filteredPolicyNodes]);

  // Filter edges to match visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set([
      ...filteredPolicyNodes.map(n => n.id),
      ...filteredConditionNodes.map(n => n.id),
    ]);
    return [...initialEdges, ...relationshipEdges].filter(
      edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [initialEdges, relationshipEdges, filteredPolicyNodes, filteredConditionNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState([
    ...filteredConditionNodes,
    ...filteredPolicyNodes,
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges);

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "policy" && onPolicyClick) {
        const nodeData = node.data as PolicyNodeData;
        onPolicyClick(nodeData.id);
      } else if (node.type === "condition" && onConditionClick) {
        const nodeData = node.data as ConditionNodeData;
        if (nodeData.targetPolicyId) {
          onConditionClick(nodeData.targetPolicyId, nodeData.id);
        }
      }
    },
    [onPolicyClick, onConditionClick]
  );

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      // Check if this is a policy-to-policy connection
      const isPolicyToPolicy =
        params.source.startsWith("policy_") && params.target.startsWith("policy_");

      if (isPolicyToPolicy && onCreateRelationship) {
        const sourcePolicyId = params.source.replace("policy_", "");
        const targetPolicyId = params.target.replace("policy_", "");
        onCreateRelationship(sourcePolicyId, targetPolicyId);
      }
    },
    [onCreateRelationship]
  );

  const toggleTypeFilter = (type: PolicyType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="w-full h-full bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        
        {/* Top Panel - Search and Filters */}
        <Panel position="top-left" className="m-4">
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-white shadow-sm"
              />
            </div>

            {/* Policy Type Filters */}
            <div className="flex flex-wrap gap-1.5 bg-white rounded-lg p-2 shadow-sm">
              <div className="flex items-center gap-1 mr-2 text-xs text-gray-500">
                <Filter className="h-3 w-3" />
                Filter:
              </div>
              {POLICY_TYPES.map((policyType) => (
                <Badge
                  key={policyType.key}
                  variant={selectedTypes.includes(policyType.key) ? "default" : "outline"}
                  className={`cursor-pointer text-[10px] ${
                    selectedTypes.includes(policyType.key)
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => toggleTypeFilter(policyType.key)}
                >
                  {policyType.label}
                </Badge>
              ))}
            </div>
          </div>
        </Panel>

        {/* Top Right Panel - Info and Actions */}
        <Panel position="top-right" className="m-4">
          <div className="flex flex-col gap-2 items-end">
            {/* Jurisdiction Badge */}
            {jurisdictionName && (
              <Badge variant="outline" className="bg-white shadow-sm">
                {jurisdictionAbbr && <span className="font-semibold mr-1">{jurisdictionAbbr}</span>}
                {jurisdictionName}
              </Badge>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-500 bg-white rounded-lg px-3 py-1.5 shadow-sm">
              <div className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {policies.length} policies
              </div>
              <div className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                {relationships.length} relationships
              </div>
            </div>

            {/* Add Policy Button */}
            {onAddPolicy && (
              <Button onClick={onAddPolicy} size="sm" className="shadow-sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Policy
              </Button>
            )}
          </div>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-left" className="m-4">
          <div className="bg-white rounded-lg p-3 shadow-sm text-xs">
            <div className="font-medium text-gray-700 mb-2">Graph Elements</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
                <span className="text-gray-600">Condition (flows into policy)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600" />
                <span className="text-gray-600">Policy (central node)</span>
              </div>
              <div className="h-px bg-gray-200 my-2" />
              <div className="font-medium text-gray-700 mb-1">Relationships</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-green-500" />
                <span className="text-gray-600">Requires</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-amber-500" style={{ borderStyle: "dashed" }} />
                <span className="text-gray-600">Exempts from</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-purple-500" style={{ borderStyle: "dashed" }} />
                <span className="text-gray-600">Modifies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-red-500" />
                <span className="text-gray-600">Conflicts with</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Controls */}
        <Controls className="bg-white shadow-md rounded-lg" />
        
        {/* MiniMap */}
        <MiniMap
          className="bg-white rounded-lg shadow-md"
          nodeColor={(node) => {
            if (node.type === "policy") return "#dbeafe";
            if (node.type === "condition") return "#e0e7ff";
            return "#f3f4f6";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}


