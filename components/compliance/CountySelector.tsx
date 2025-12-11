"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountySelectorProps {
  stateId: Id<"jurisdictions">;
  selectedCountyIds: Id<"jurisdictions">[];
  onSelectionChange: (countyIds: Id<"jurisdictions">[]) => void;
  existingDistrictCounties?: Set<string>; // Counties already in other districts
}

export function CountySelector({
  stateId,
  selectedCountyIds,
  onSelectionChange,
  existingDistrictCounties = new Set(),
}: CountySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const hierarchy = useQuery(api.compliance.getJurisdictionHierarchy, {
    stateId,
  });

  const counties = hierarchy?.counties || [];

  const filteredCounties = useMemo(() => {
    if (!searchQuery) return counties;
    const query = searchQuery.toLowerCase();
    return counties.filter((c) => c.name.toLowerCase().includes(query));
  }, [counties, searchQuery]);

  const selectedSet = new Set(selectedCountyIds);

  const toggleCounty = (countyId: Id<"jurisdictions">) => {
    const newSelection = selectedSet.has(countyId)
      ? selectedCountyIds.filter((id) => id !== countyId)
      : [...selectedCountyIds, countyId];
    onSelectionChange(newSelection);
  };

  const selectAll = () => {
    const allIds = filteredCounties
      .filter((c) => !existingDistrictCounties.has(c._id))
      .map((c) => c._id);
    onSelectionChange(allIds);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  if (!hierarchy) {
    return (
      <div className="p-4 text-center text-gray-500">Loading counties...</div>
    );
  }

  if (counties.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No counties found for this state.</p>
        <p className="text-sm">Seed county data to enable district creation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search counties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedCountyIds.length} of {counties.length} selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={filteredCounties.length === selectedCountyIds.length}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={selectedCountyIds.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Selected counties summary */}
      {selectedCountyIds.length > 0 && (
        <div className="p-3 border-b bg-blue-50">
          <div className="text-sm font-medium text-blue-800 mb-2">
            Selected Counties:
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedCountyIds.slice(0, 8).map((countyId) => {
              const county = counties.find((c) => c._id === countyId);
              return (
                <Badge
                  key={countyId}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                  onClick={() => toggleCounty(countyId)}
                >
                  {county?.name.replace(" County", "")}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              );
            })}
            {selectedCountyIds.length > 8 && (
              <Badge variant="outline" className="text-blue-600">
                +{selectedCountyIds.length - 8} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* County list */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {filteredCounties.map((county) => {
            const isSelected = selectedSet.has(county._id);
            const isInOtherDistrict = existingDistrictCounties.has(county._id);

            return (
              <label
                key={county._id}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                  isSelected && "bg-blue-50",
                  isInOtherDistrict && "opacity-50 cursor-not-allowed",
                  !isSelected && !isInOtherDistrict && "hover:bg-gray-50"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => {
                    if (!isInOtherDistrict) {
                      toggleCounty(county._id);
                    }
                  }}
                  disabled={isInOtherDistrict}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{county.name}</div>
                  {county.fipsCode && (
                    <div className="text-xs text-gray-500">
                      FIPS: {county.fipsCode}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
                {isInOtherDistrict && (
                  <Badge variant="outline" className="text-xs">
                    In another district
                  </Badge>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
