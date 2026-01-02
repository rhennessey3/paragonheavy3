"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  FileText, 
  Scale, 
  Clock, 
  Car, 
  AlertTriangle, 
  Route,
  Gauge,
  ChevronRight,
  Zap,
  Ruler
} from "lucide-react";

import { JurisdictionData } from "./JurisdictionMap";

interface JurisdictionInfoPanelProps {
  jurisdiction: JurisdictionData;
  onClose: () => void;
}

const POLICY_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  escort: { label: "Escort Policy", icon: Car, color: "bg-orange-100 text-orange-700" },
  permit: { label: "Permit Policy", icon: FileText, color: "bg-blue-100 text-blue-700" },
  speed: { label: "Speed Policy", icon: Gauge, color: "bg-red-100 text-red-700" },
  hours: { label: "Hours Policy", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  route: { label: "Route Policy", icon: Route, color: "bg-green-100 text-green-700" },
  utility: { label: "Utility Policy", icon: Zap, color: "bg-cyan-100 text-cyan-700" },
  dimension: { label: "Dimension Policy", icon: Ruler, color: "bg-purple-100 text-purple-700" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-700",
};

export function JurisdictionInfoPanel({ jurisdiction, onClose }: JurisdictionInfoPanelProps) {
  const router = useRouter();
  
  const policies = useQuery(api.policies.getPoliciesForJurisdiction, {
    jurisdictionId: jurisdiction._id,
  });

  const typeCounts = policies?.reduce((acc, policy) => {
    acc[policy.policyType] = (acc[policy.policyType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">{jurisdiction.name}</h2>
            <div className="flex items-center gap-2">
              {jurisdiction.abbreviation && (
                <Badge variant="secondary">{jurisdiction.abbreviation}</Badge>
              )}
              {jurisdiction.fipsCode && (
                <span className="text-sm text-gray-500">FIPS: {jurisdiction.fipsCode}</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* Left - Stats and Actions */}
          <div className="w-64 flex-shrink-0 space-y-4">
            {Object.keys(typeCounts).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Policies by Type</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(typeCounts).map(([policyType, count]) => {
                    const config = POLICY_TYPE_CONFIG[policyType];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <div
                        key={policyType}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${config.color}`}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push(`/dashboard/compliance/policies?jurisdiction=${jurisdiction._id}`)}
              >
                View All Policies
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push(`/dashboard/compliance/policies/new?jurisdiction=${jurisdiction._id}`)}
              >
                Add Policy
              </Button>
            </div>
          </div>

          {/* Right - Policies list */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-500 mb-3">Compliance Policies</div>
            
            {!policies ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Loading policies...</p>
              </div>
            ) : policies.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No policies defined for this jurisdiction</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push(`/dashboard/compliance/policies/new?jurisdiction=${jurisdiction._id}`)}
                >
                  Add First Policy
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                {policies.map((policy) => {
                  const config = POLICY_TYPE_CONFIG[policy.policyType];
                  const Icon = config?.icon || FileText;
                  
                  return (
                    <button
                      key={policy._id}
                      onClick={() => router.push(`/dashboard/compliance/graph?jurisdiction=${jurisdiction._id}`)}
                      className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {policy.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{policy.description || "No description"}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${STATUS_COLORS[policy.status]}`}>
                              {policy.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {policy.conditions.length} condition{policy.conditions.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
