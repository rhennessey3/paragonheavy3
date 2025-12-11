"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Building2,
  Layers,
  Plus,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JurisdictionTreeProps {
  onSelectState?: (stateId: Id<"jurisdictions">) => void;
  onSelectDistrict?: (districtId: Id<"jurisdictions">) => void;
  onCreateDistrict?: (stateId: Id<"jurisdictions">) => void;
  selectedId?: Id<"jurisdictions">;
}

type JurisdictionType = "state" | "county" | "city" | "district" | "region" | "custom";

interface Jurisdiction {
  _id: Id<"jurisdictions">;
  name: string;
  type: JurisdictionType;
  abbreviation?: string;
  code?: string;
  composedOf?: Id<"jurisdictions">[];
}

export function JurisdictionTree({
  onSelectState,
  onSelectDistrict,
  onCreateDistrict,
  selectedId,
}: JurisdictionTreeProps) {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());

  const states = useQuery(api.compliance.getJurisdictions, { type: "state" });

  const toggleState = (stateId: string) => {
    setExpandedStates((prev) => {
      const next = new Set(prev);
      if (next.has(stateId)) {
        next.delete(stateId);
      } else {
        next.add(stateId);
      }
      return next;
    });
  };

  const getTypeIcon = (type: JurisdictionType) => {
    switch (type) {
      case "state":
        return <MapPin className="h-4 w-4" />;
      case "district":
        return <Layers className="h-4 w-4" />;
      case "county":
        return <Building2 className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: JurisdictionType) => {
    const colors: Record<JurisdictionType, string> = {
      state: "bg-blue-100 text-blue-800",
      district: "bg-purple-100 text-purple-800",
      county: "bg-green-100 text-green-800",
      city: "bg-yellow-100 text-yellow-800",
      region: "bg-orange-100 text-orange-800",
      custom: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (!states) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading jurisdictions...
      </div>
    );
  }

  if (states.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>No states found.</p>
        <p className="text-sm">Seed US states to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {states
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((state) => (
          <StateNode
            key={state._id}
            state={state as Jurisdiction}
            isExpanded={expandedStates.has(state._id)}
            isSelected={selectedId === state._id}
            onToggle={() => toggleState(state._id)}
            onSelect={() => onSelectState?.(state._id)}
            onSelectDistrict={onSelectDistrict}
            onCreateDistrict={onCreateDistrict}
            selectedId={selectedId}
            getTypeIcon={getTypeIcon}
            getTypeBadge={getTypeBadge}
          />
        ))}
    </div>
  );
}

interface StateNodeProps {
  state: Jurisdiction;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onSelectDistrict?: (districtId: Id<"jurisdictions">) => void;
  onCreateDistrict?: (stateId: Id<"jurisdictions">) => void;
  selectedId?: Id<"jurisdictions">;
  getTypeIcon: (type: JurisdictionType) => React.ReactNode;
  getTypeBadge: (type: JurisdictionType) => string;
}

function StateNode({
  state,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onSelectDistrict,
  onCreateDistrict,
  selectedId,
  getTypeIcon,
  getTypeBadge,
}: StateNodeProps) {
  const hierarchy = useQuery(
    api.compliance.getJurisdictionHierarchy,
    isExpanded ? { stateId: state._id } : "skip"
  );

  const hasChildren =
    hierarchy &&
    (hierarchy.districts.length > 0 ||
      hierarchy.counties.length > 0 ||
      hierarchy.regions.length > 0);

  return (
    <div>
      {/* State row */}
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
          isSelected
            ? "bg-blue-100 text-blue-900"
            : "hover:bg-gray-100"
        )}
      >
        <button
          onClick={onToggle}
          className="p-0.5 hover:bg-gray-200 rounded"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </button>
        <button
          onClick={onSelect}
          className="flex-1 flex items-center gap-2 text-left"
        >
          {getTypeIcon("state")}
          <span className="font-medium">{state.name}</span>
          {state.abbreviation && (
            <span className="text-gray-500 text-sm">({state.abbreviation})</span>
          )}
        </button>
        {onCreateDistrict && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCreateDistrict(state._id);
            }}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            title="Create district"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Children */}
      {isExpanded && hierarchy && (
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
          {/* Districts */}
          {hierarchy.districts.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase px-2 py-1">
                Districts ({hierarchy.districts.length})
              </div>
              {hierarchy.districts
                .sort((a, b) => {
                  const aCode = parseInt(a.code || "0");
                  const bCode = parseInt(b.code || "0");
                  return aCode - bCode;
                })
                .map((district) => (
                  <DistrictNode
                    key={district._id}
                    district={district as Jurisdiction}
                    isSelected={selectedId === district._id}
                    onSelect={() => onSelectDistrict?.(district._id)}
                    getTypeIcon={getTypeIcon}
                    getTypeBadge={getTypeBadge}
                  />
                ))}
            </div>
          )}

          {/* Counties (if no districts, show counties directly) */}
          {hierarchy.districts.length === 0 && hierarchy.counties.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase px-2 py-1">
                Counties ({hierarchy.counties.length})
              </div>
              {hierarchy.counties.slice(0, 10).map((county) => (
                <div
                  key={county._id}
                  className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600"
                >
                  {getTypeIcon("county")}
                  <span>{county.name}</span>
                </div>
              ))}
              {hierarchy.counties.length > 10 && (
                <div className="px-2 py-1 text-xs text-gray-400">
                  +{hierarchy.counties.length - 10} more counties
                </div>
              )}
            </div>
          )}

          {/* Regions */}
          {hierarchy.regions.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase px-2 py-1">
                Regions ({hierarchy.regions.length})
              </div>
              {hierarchy.regions.map((region) => (
                <div
                  key={region._id}
                  className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600"
                >
                  {getTypeIcon("region")}
                  <span>{region.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!hasChildren && (
            <div className="px-2 py-2 text-sm text-gray-400 italic">
              No sub-jurisdictions defined
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface DistrictNodeProps {
  district: Jurisdiction;
  isSelected: boolean;
  onSelect: () => void;
  getTypeIcon: (type: JurisdictionType) => React.ReactNode;
  getTypeBadge: (type: JurisdictionType) => string;
}

function DistrictNode({
  district,
  isSelected,
  onSelect,
  getTypeIcon,
  getTypeBadge,
}: DistrictNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const details = useQuery(
    api.compliance.getDistrictDetails,
    isExpanded ? { districtId: district._id } : "skip"
  );

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
          isSelected
            ? "bg-purple-100 text-purple-900"
            : "hover:bg-gray-100"
        )}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 hover:bg-gray-200 rounded"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-gray-500" />
          ) : (
            <ChevronRight className="h-3 w-3 text-gray-500" />
          )}
        </button>
        <button
          onClick={onSelect}
          className="flex-1 flex items-center gap-2 text-left"
        >
          {getTypeIcon("district")}
          <span className="text-sm font-medium">{district.name}</span>
          <Badge variant="outline" className={cn("text-xs", getTypeBadge("district"))}>
            {district.composedOf?.length || 0} counties
          </Badge>
        </button>
      </div>

      {/* District counties */}
      {isExpanded && details && details.counties.length > 0 && (
        <div className="ml-6 mt-1 space-y-0.5 border-l border-gray-200 pl-2">
          {details.counties.map((county) => (
            <div
              key={county._id}
              className="flex items-center gap-2 px-2 py-0.5 text-xs text-gray-500"
            >
              <Building2 className="h-3 w-3" />
              <span>{county.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
