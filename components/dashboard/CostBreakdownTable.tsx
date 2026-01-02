"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

export interface EscortInfo {
  type: "Front" | "Rear" | "Front and Rear";
  cost: number;
}

export interface StateCost {
  state: string;
  oversize: number;
  overweight: number;
  serviceFee: number;
  escort: EscortInfo | null;
  superload: boolean;
  policeEscort: boolean;
  routeSurvey: boolean;
  distance: number;
  truckRate: number;
  total: number;
}

interface CostBreakdownTableProps {
  costs: StateCost[];
  margin?: number;
  onClose?: () => void;
}

// Mock data matching the screenshot
export const MOCK_COST_DATA: StateCost[] = [
  {
    state: "TEXAS",
    oversize: 60.0,
    overweight: 210.0,
    serviceFee: 29.0,
    escort: null,
    superload: false,
    policeEscort: false,
    routeSurvey: false,
    distance: 292.0,
    truckRate: 1673.6,
    total: 1912.6,
  },
  {
    state: "ARKANSAS",
    oversize: 17.0,
    overweight: 272.0,
    serviceFee: 29.0,
    escort: null,
    superload: false,
    policeEscort: false,
    routeSurvey: false,
    distance: 273.0,
    truckRate: 1564.7,
    total: 1882.7,
  },
  {
    state: "TENNESSEE",
    oversize: 20.0,
    overweight: 272.0,
    serviceFee: 29.0,
    escort: { type: "Front and Rear", cost: 917.6 },
    superload: false,
    policeEscort: false,
    routeSurvey: false,
    distance: 248.0,
    truckRate: 1421.4,
    total: 2660.0,
  },
  {
    state: "KENTUCKY",
    oversize: 60.0,
    overweight: 60.0,
    serviceFee: 29.0,
    escort: { type: "Rear", cost: 429.2 },
    superload: false,
    policeEscort: false,
    routeSurvey: false,
    distance: 232.0,
    truckRate: 1329.7,
    total: 1847.9,
  },
  {
    state: "OHIO",
    oversize: 75.0,
    overweight: 135.0,
    serviceFee: 29.0,
    escort: { type: "Front", cost: 584.6 },
    superload: false,
    policeEscort: false,
    routeSurvey: false,
    distance: 316.0,
    truckRate: 1811.1,
    total: 2559.7,
  },
  {
    state: "PENNSYLVANIA",
    oversize: 36.0,
    overweight: 31.0,
    serviceFee: 29.0,
    escort: { type: "Front and Rear", cost: 170.2 },
    superload: false,
    policeEscort: false,
    routeSurvey: false,
    distance: 46.0,
    truckRate: 263.6,
    total: 529.8,
  },
  {
    state: "NEW YORK",
    oversize: 40.0,
    overweight: 40.0,
    serviceFee: 29.0,
    escort: { type: "Rear", cost: 131.4 },
    superload: false,
    policeEscort: false,
    routeSurvey: false,
    distance: 71.0,
    truckRate: 406.9,
    total: 607.3,
  },
];

export function CostBreakdownTable({
  costs,
  margin = 0,
  onClose,
}: CostBreakdownTableProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate totals
  const totals = costs.reduce(
    (acc, cost) => ({
      oversize: acc.oversize + cost.oversize,
      overweight: acc.overweight + cost.overweight,
      serviceFee: acc.serviceFee + cost.serviceFee,
      escort: acc.escort + (cost.escort?.cost || 0),
      distance: acc.distance + cost.distance,
      truckRate: acc.truckRate + cost.truckRate,
      total: acc.total + cost.total,
    }),
    {
      oversize: 0,
      overweight: 0,
      serviceFee: 0,
      escort: 0,
      distance: 0,
      truckRate: 0,
      total: 0,
    }
  );

  const grandTotal = totals.total + margin;

  const formatCurrency = (value: number) => {
    return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  const formatDistance = (value: number) => {
    return value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " mi";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 mt-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white text-xs">▶</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {/* Table */}
      {isExpanded && (
        <div className="px-6 pb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-600">State</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Oversize</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">
                  <span className="flex items-center gap-1">
                    Overweight
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Service Fee</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Escort</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">
                  <span className="flex items-center gap-1">
                    Superload
                    <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-[10px]">▶</span>
                    </div>
                  </span>
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Police Escort</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Route survey</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Distance</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Truck Rate</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((cost, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-2 font-medium text-gray-900">{cost.state}</td>
                  <td className="py-3 px-2 text-gray-600">
                    <span className="line-through text-gray-400">{formatCurrency(cost.oversize)}</span>
                  </td>
                  <td className="py-3 px-2 text-gray-900">
                    <span className="flex items-center gap-1">
                      {formatCurrency(cost.overweight)}
                      <Info className="h-3.5 w-3.5 text-gray-400" />
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-900">{formatCurrency(cost.serviceFee)}</td>
                  <td className="py-3 px-2 text-gray-900">
                    {cost.escort ? (
                      <div>
                        <div className="text-green-600">{cost.escort.type}</div>
                        <div className="text-gray-600">{formatCurrency(cost.escort.cost)}</div>
                      </div>
                    ) : (
                      <span className="text-green-600">NO</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-gray-600">{cost.superload ? "YES" : "NO"}</td>
                  <td className="py-3 px-2 text-gray-600">{cost.policeEscort ? "YES" : "NO"}</td>
                  <td className="py-3 px-2 text-gray-600">{cost.routeSurvey ? "YES" : "NO"}</td>
                  <td className="py-3 px-2 text-gray-900">{formatDistance(cost.distance)}</td>
                  <td className="py-3 px-2 text-gray-900">{formatCurrency(cost.truckRate)}</td>
                  <td className="py-3 px-2 text-gray-900">{formatCurrency(cost.total)}</td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="py-3 px-2 font-semibold text-gray-900">Totals</td>
                <td className="py-3 px-2 font-medium text-gray-900">{formatCurrency(totals.oversize)}</td>
                <td className="py-3 px-2 font-medium text-gray-900">{formatCurrency(totals.overweight)}</td>
                <td className="py-3 px-2 font-medium text-gray-900">{formatCurrency(totals.serviceFee)}</td>
                <td className="py-3 px-2 font-medium text-gray-900">{formatCurrency(totals.escort)}</td>
                <td className="py-3 px-2"></td>
                <td className="py-3 px-2"></td>
                <td className="py-3 px-2"></td>
                <td className="py-3 px-2 font-medium text-gray-900">{formatDistance(totals.distance)}</td>
                <td className="py-3 px-2 font-medium text-gray-900">{formatCurrency(totals.truckRate)}</td>
                <td className="py-3 px-2 font-medium text-gray-900">{formatCurrency(totals.total)}</td>
              </tr>

              {/* Margin Row */}
              <tr>
                <td colSpan={9}></td>
                <td className="py-2 px-2 text-right text-gray-600">Margin</td>
                <td className="py-2 px-2 text-gray-900">{formatCurrency(margin)}</td>
              </tr>

              {/* Grand Total Row */}
              <tr>
                <td colSpan={9}></td>
                <td className="py-2 px-2 text-right text-gray-600">Total</td>
                <td className="py-2 px-2 font-bold text-green-600 text-lg">{formatCurrency(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}






