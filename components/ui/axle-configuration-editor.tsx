"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Types for axle configuration
export interface AxleWeight {
  position: number;
  weight?: number;
}

export interface AxleDistance {
  fromPosition: number;
  toPosition: number;
  distance: string;
}

export interface AxleConfiguration {
  axleCount: number;
  axleWeights: AxleWeight[];
  axleDistances: AxleDistance[];
}

export interface CombinedAxleConfiguration {
  powerUnit: AxleConfiguration & { truckId?: string };
  drawnUnit?: AxleConfiguration & { trailerId?: string };
  kingpinToFirstAxle?: string;
  totalAxles: number;
  grossWeight: number;
}

// Helper functions for distance format parsing/formatting
export function parseDistance(distance: string): { feet: number; inches: number } {
  // Parse formats like "4'6\"", "4' 6\"", "4'6", "4 6", etc.
  const match = distance.match(/(\d+)['\s]*(\d+)?["\s]*/);
  if (match) {
    return {
      feet: parseInt(match[1], 10) || 0,
      inches: parseInt(match[2], 10) || 0,
    };
  }
  return { feet: 0, inches: 0 };
}

export function formatDistance(feet: number, inches: number): string {
  return `${feet}'${inches}"`;
}

// Helper to get axle label
function getAxleLabel(position: number, isPowerUnit: boolean, powerUnitAxleCount: number = 0): string {
  if (isPowerUnit) {
    if (position === 1) return "Front";
    return `${position}${getOrdinalSuffix(position)}`;
  } else {
    // For drawn unit, continue numbering from power unit
    const globalPosition = powerUnitAxleCount + position;
    return `${globalPosition}${getOrdinalSuffix(globalPosition)}`;
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Props for the component
interface AxleConfigurationEditorProps {
  /** The current axle configuration */
  value: AxleConfiguration;
  /** Callback when configuration changes */
  onChange: (config: AxleConfiguration) => void;
  /** Whether this is for a power unit (truck) or drawn unit (trailer) */
  unitType: "power" | "drawn";
  /** For drawn units, how many axles does the power unit have */
  powerUnitAxleCount?: number;
  /** Maximum number of axles to support */
  maxAxles?: number;
  /** Whether the inputs are disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Title for the section */
  title?: string;
  /** Show compact mode (for smaller spaces) */
  compact?: boolean;
}

export function AxleConfigurationEditor({
  value,
  onChange,
  unitType,
  powerUnitAxleCount = 0,
  maxAxles = 15,
  disabled = false,
  className,
  title,
  compact = false,
}: AxleConfigurationEditorProps) {
  const isPowerUnit = unitType === "power";
  const { axleCount, axleWeights, axleDistances } = value;

  // Handler for axle count change
  const handleAxleCountChange = (newCount: number) => {
    const clampedCount = Math.max(1, Math.min(newCount, maxAxles));
    
    // Adjust weights array
    const newWeights: AxleWeight[] = [];
    for (let i = 1; i <= clampedCount; i++) {
      const existing = axleWeights.find((w) => w.position === i);
      newWeights.push(existing || { position: i, weight: undefined });
    }
    
    // Adjust distances array
    const newDistances: AxleDistance[] = [];
    for (let i = 1; i < clampedCount; i++) {
      const existing = axleDistances.find(
        (d) => d.fromPosition === i && d.toPosition === i + 1
      );
      newDistances.push(
        existing || { fromPosition: i, toPosition: i + 1, distance: "" }
      );
    }
    
    onChange({
      axleCount: clampedCount,
      axleWeights: newWeights,
      axleDistances: newDistances,
    });
  };

  // Handler for weight change
  const handleWeightChange = (position: number, weight: string) => {
    const numWeight = weight === "" ? undefined : parseInt(weight, 10);
    const newWeights = axleWeights.map((w) =>
      w.position === position ? { ...w, weight: numWeight } : w
    );
    onChange({ ...value, axleWeights: newWeights });
  };

  // Handler for distance change
  const handleDistanceChange = (fromPosition: number, distance: string) => {
    const newDistances = axleDistances.map((d) =>
      d.fromPosition === fromPosition ? { ...d, distance } : d
    );
    onChange({ ...value, axleDistances: newDistances });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      )}
      
      {/* Axle Count Selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-gray-600 whitespace-nowrap">
          Number of Axles:
        </Label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleAxleCountChange(axleCount - 1)}
            disabled={disabled || axleCount <= 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <span className="w-8 text-center font-medium">{axleCount}</span>
          <button
            type="button"
            onClick={() => handleAxleCountChange(axleCount + 1)}
            disabled={disabled || axleCount >= maxAxles}
            className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Axle Weights Grid */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Total Axle Weights (LBS.)
        </Label>
        <div
          className={cn(
            "grid gap-2",
            compact ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9"
          )}
        >
          {Array.from({ length: axleCount }).map((_, idx) => {
            const position = idx + 1;
            const weight = axleWeights.find((w) => w.position === position);
            const label = getAxleLabel(position, isPowerUnit, powerUnitAxleCount);
            
            return (
              <div key={position} className="space-y-1">
                <Label className="text-xs text-gray-500 block text-center">
                  {label} Axle
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={weight?.weight ?? ""}
                  onChange={(e) => handleWeightChange(position, e.target.value)}
                  disabled={disabled}
                  className="text-center h-9 text-sm"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Axle Distances Grid */}
      {axleCount > 1 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Axle Distances (Ft.In.)
          </Label>
          <div
            className={cn(
              "grid gap-2",
              compact ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8"
            )}
          >
            {Array.from({ length: axleCount - 1 }).map((_, idx) => {
              const fromPosition = idx + 1;
              const toPosition = idx + 2;
              const distance = axleDistances.find(
                (d) => d.fromPosition === fromPosition
              );
              
              const fromLabel = getAxleLabel(fromPosition, isPowerUnit, powerUnitAxleCount);
              const toLabel = getAxleLabel(toPosition, isPowerUnit, powerUnitAxleCount);
              
              return (
                <div key={fromPosition} className="space-y-1">
                  <Label className="text-xs text-gray-500 block text-center truncate">
                    {fromLabel} → {toLabel}
                  </Label>
                  <Input
                    type="text"
                    placeholder="0'0&quot;"
                    value={distance?.distance ?? ""}
                    onChange={(e) =>
                      handleDistanceChange(fromPosition, e.target.value)
                    }
                    disabled={disabled}
                    className="text-center h-9 text-sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Combined editor for both power unit and drawn unit
interface CombinedAxleConfigurationEditorProps {
  /** Power unit (truck) configuration */
  powerUnit: AxleConfiguration;
  /** Drawn unit (trailer) configuration */
  drawnUnit?: AxleConfiguration;
  /** Distance from last power unit axle to first trailer axle */
  kingpinToFirstAxle?: string;
  /** Callback when power unit changes */
  onPowerUnitChange: (config: AxleConfiguration) => void;
  /** Callback when drawn unit changes */
  onDrawnUnitChange?: (config: AxleConfiguration) => void;
  /** Callback when kingpin distance changes */
  onKingpinDistanceChange?: (distance: string) => void;
  /** Whether to show the drawn unit section */
  showDrawnUnit?: boolean;
  /** Maximum axles per unit */
  maxAxlesPerUnit?: number;
  /** Whether inputs are disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

export function CombinedAxleConfigurationEditor({
  powerUnit,
  drawnUnit,
  kingpinToFirstAxle = "",
  onPowerUnitChange,
  onDrawnUnitChange,
  onKingpinDistanceChange,
  showDrawnUnit = true,
  maxAxlesPerUnit = 10,
  disabled = false,
  className,
}: CombinedAxleConfigurationEditorProps) {
  const totalAxles =
    powerUnit.axleCount + (drawnUnit?.axleCount ?? 0);
  const totalWeight =
    powerUnit.axleWeights.reduce((sum, w) => sum + (w.weight ?? 0), 0) +
    (drawnUnit?.axleWeights.reduce((sum, w) => sum + (w.weight ?? 0), 0) ?? 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Stats */}
      <div className="flex items-center gap-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Total Axles</span>
          <p className="text-lg font-semibold text-gray-900">{totalAxles}</p>
        </div>
        <div className="h-8 w-px bg-gray-300" />
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Gross Weight</span>
          <p className="text-lg font-semibold text-gray-900">
            {totalWeight.toLocaleString()} lbs
          </p>
        </div>
      </div>

      {/* Power Unit */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h3 className="font-medium text-gray-900">Power Unit (Truck)</h3>
          <span className="text-sm text-gray-500">
            {powerUnit.axleCount} axle{powerUnit.axleCount !== 1 ? "s" : ""}
          </span>
        </div>
        <AxleConfigurationEditor
          value={powerUnit}
          onChange={onPowerUnitChange}
          unitType="power"
          maxAxles={maxAxlesPerUnit}
          disabled={disabled}
        />
      </div>

      {/* Kingpin Distance */}
      {showDrawnUnit && drawnUnit && (
        <div className="flex items-center gap-4 px-4">
          <div className="flex-1 h-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500 whitespace-nowrap">
              Kingpin to 1st Trailer Axle:
            </Label>
            <Input
              type="text"
              placeholder="0'0&quot;"
              value={kingpinToFirstAxle}
              onChange={(e) => onKingpinDistanceChange?.(e.target.value)}
              disabled={disabled}
              className="w-24 text-center h-9 text-sm"
            />
          </div>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
      )}

      {/* Drawn Unit */}
      {showDrawnUnit && drawnUnit && onDrawnUnitChange && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="font-medium text-gray-900">Drawn Unit (Trailer)</h3>
            <span className="text-sm text-gray-500">
              {drawnUnit.axleCount} axle{drawnUnit.axleCount !== 1 ? "s" : ""}
            </span>
          </div>
          <AxleConfigurationEditor
            value={drawnUnit}
            onChange={onDrawnUnitChange}
            unitType="drawn"
            powerUnitAxleCount={powerUnit.axleCount}
            maxAxles={maxAxlesPerUnit}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

// Helper to create empty configuration
export function createEmptyAxleConfiguration(axleCount: number = 2): AxleConfiguration {
  const axleWeights: AxleWeight[] = [];
  const axleDistances: AxleDistance[] = [];
  
  for (let i = 1; i <= axleCount; i++) {
    axleWeights.push({ position: i, weight: undefined });
    if (i < axleCount) {
      axleDistances.push({ fromPosition: i, toPosition: i + 1, distance: "" });
    }
  }
  
  return { axleCount, axleWeights, axleDistances };
}

// Helper to format axle weights for permit display
export function formatAxleWeightsSummary(
  powerUnitWeights: AxleWeight[],
  drawnUnitWeights?: AxleWeight[]
): string {
  const allWeights = [
    ...powerUnitWeights,
    ...(drawnUnitWeights?.map((w) => ({
      ...w,
      position: w.position + powerUnitWeights.length,
    })) ?? []),
  ];
  
  return allWeights
    .filter((w) => w.weight !== undefined)
    .map((w) => {
      const label = w.position === 1 ? "Front" : `${w.position}${getOrdinalSuffix(w.position)}`;
      return `${label}: ${w.weight?.toLocaleString()}`;
    })
    .join(", ");
}

// Helper to format axle distances for permit display
export function formatAxleDistancesSummary(
  powerUnitDistances: AxleDistance[],
  drawnUnitDistances?: AxleDistance[],
  kingpinDistance?: string,
  powerUnitAxleCount: number = 0
): string {
  const parts: string[] = [];
  
  // Power unit distances
  for (const d of powerUnitDistances) {
    if (d.distance) {
      parts.push(`${d.fromPosition}-${d.toPosition}: ${d.distance}`);
    }
  }
  
  // Kingpin distance
  if (kingpinDistance && drawnUnitDistances && drawnUnitDistances.length > 0) {
    const firstTrailerPosition = powerUnitAxleCount + 1;
    parts.push(`${powerUnitAxleCount}-${firstTrailerPosition}: ${kingpinDistance}`);
  }
  
  // Drawn unit distances (with offset positions)
  if (drawnUnitDistances) {
    for (const d of drawnUnitDistances) {
      if (d.distance) {
        const from = d.fromPosition + powerUnitAxleCount;
        const to = d.toPosition + powerUnitAxleCount;
        parts.push(`${from}-${to}: ${d.distance}`);
      }
    }
  }
  
  return parts.join(", ");
}


