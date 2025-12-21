"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Search, ArrowLeft, ChevronLeft, ChevronRight, Shield, Layers, Map, List } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { JurisdictionMap, JurisdictionData } from "@/components/compliance/JurisdictionMap";
import { JurisdictionInfoPanel } from "@/components/compliance/JurisdictionInfoPanel";

ModuleRegistry.registerModules([AllCommunityModule]);

interface JurisdictionRow {
  _id: Id<"jurisdictions">;
  name: string;
  abbreviation: string;
  type: string;
  fipsCode: string;
  policyCount: number;
}

export default function JurisdictionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "map">("map");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<JurisdictionData | null>(null);
  const pageSize = 15;

  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });
  const allPolicies = useQuery(api.policies.searchPolicies, {});

  const jurisdictionsWithPolicyCounts = useMemo(() => {
    if (!jurisdictions) return [];

    return jurisdictions.map((j) => {
      const policyCount = allPolicies?.filter((p) => p.jurisdictionId === j._id).length || 0;
      return {
        _id: j._id,
        name: j.name,
        abbreviation: j.abbreviation || "",
        type: j.type,
        fipsCode: j.fipsCode || "",
        policyCount,
      };
    });
  }, [jurisdictions, allPolicies]);

  const filteredJurisdictions = useMemo(() => {
    if (!searchQuery) return jurisdictionsWithPolicyCounts;

    const query = searchQuery.toLowerCase();
    return jurisdictionsWithPolicyCounts.filter(
      (j) =>
        j.name.toLowerCase().includes(query) ||
        j.abbreviation.toLowerCase().includes(query)
    );
  }, [jurisdictionsWithPolicyCounts, searchQuery]);

  const totalPages = Math.ceil(filteredJurisdictions.length / pageSize);
  const paginatedJurisdictions = filteredJurisdictions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const PolicyCountRenderer = (params: ICellRendererParams<JurisdictionRow>) => {
    const count = params.value as number;
    return (
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-gray-400" />
        <span>{count} {count === 1 ? "policy" : "policies"}</span>
      </div>
    );
  };

  const TypeRenderer = (params: ICellRendererParams<JurisdictionRow>) => {
    const type = params.value as string;
    return (
      <Badge variant="secondary" className="capitalize">
        {type}
      </Badge>
    );
  };

  const columnDefs: ColDef<JurisdictionRow>[] = [
    {
      headerName: "NAME",
      field: "name",
      flex: 2,
      sortable: true,
    },
    {
      headerName: "ABBR",
      field: "abbreviation",
      width: 100,
      sortable: true,
    },
    {
      headerName: "TYPE",
      field: "type",
      width: 120,
      sortable: true,
      cellRenderer: TypeRenderer,
    },
    {
      headerName: "FIPS CODE",
      field: "fipsCode",
      width: 120,
      sortable: true,
    },
    {
      headerName: "POLICIES",
      field: "policyCount",
      width: 130,
      sortable: true,
      cellRenderer: PolicyCountRenderer,
    },
    {
      headerName: "ACTIONS",
      width: 140,
      cellRenderer: (params: ICellRendererParams<JurisdictionRow>) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/compliance/policies?jurisdiction=${params.data?._id}`)}
        >
          View Policies
        </Button>
      ),
    },
  ];

  const defaultColDef: ColDef = {
    resizable: true,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-white">
        <div className="px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/compliance")}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Jurisdictions</h1>
                <p className="text-gray-600 text-sm">
                  {filteredJurisdictions.length} jurisdictions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={viewMode === "table" ? "bg-white shadow-sm" : ""}
                >
                  <List className="h-4 w-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className={viewMode === "map" ? "bg-white shadow-sm" : ""}
                >
                  <Map className="h-4 w-4 mr-1" />
                  Map
                </Button>
              </div>
              <Button
                onClick={() => router.push("/dashboard/compliance/jurisdictions/manage")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Layers className="h-4 w-4 mr-2" />
                Manage Districts
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {selectedJurisdiction ? (
              <>
                {/* State-specific stats */}
                <Card className="p-4">
                  <div className="text-sm text-gray-600">Total Policies</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {allPolicies?.filter((p) => p.jurisdictionId === selectedJurisdiction._id).length || 0}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600">Published</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {allPolicies?.filter((p) => p.jurisdictionId === selectedJurisdiction._id && p.status === "published").length || 0}
                  </div>
                </Card>
              </>
            ) : (
              <>
                {/* Global stats */}
                <Card className="p-4">
                  <div className="text-sm text-gray-600">Total States</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {jurisdictions?.filter((j) => j.type === "state").length || 0}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600">States with Policies</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {jurisdictionsWithPolicyCounts.filter((j) => j.policyCount > 0).length}
                  </div>
                </Card>
              </>
            )}
          </div>

          {viewMode === "table" ? (
            <>
              {/* Search */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jurisdictions..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                <div
                  className="ag-theme-quartz rounded-lg overflow-hidden bg-white"
                  style={{
                    height: "500px",
                    width: "100%",
                    "--ag-header-background-color": "#f9fafb",
                    "--ag-header-foreground-color": "#374151",
                    "--ag-header-font-weight": "600",
                    "--ag-header-font-size": "12px",
                    "--ag-border-color": "#e5e7eb",
                    "--ag-row-hover-color": "#f9fafb",
                    "--ag-background-color": "#ffffff",
                    "--ag-odd-row-background-color": "#ffffff",
                    "--ag-font-size": "14px",
                    "--ag-font-family": "inherit",
                  } as React.CSSProperties}
                >
                  <AgGridReact<JurisdictionRow>
                    theme="legacy"
                    rowData={paginatedJurisdictions}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    animateRows={true}
                    pagination={false}
                    domLayout="normal"
                    headerHeight={48}
                    rowHeight={56}
                    suppressCellFocus={true}
                  />
                </div>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, filteredJurisdictions.length)} to{" "}
                    {Math.min(currentPage * pageSize, filteredJurisdictions.length)} of{" "}
                    {filteredJurisdictions.length} jurisdictions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {Math.max(1, totalPages)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Map View */
            <>
              <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ height: "600px" }}>
                <JurisdictionMap
                  jurisdictions={jurisdictionsWithPolicyCounts}
                  selectedJurisdiction={selectedJurisdiction}
                  onJurisdictionSelect={setSelectedJurisdiction}
                />
              </div>
              {selectedJurisdiction && (
                <JurisdictionInfoPanel
                  jurisdiction={selectedJurisdiction}
                  onClose={() => setSelectedJurisdiction(null)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
