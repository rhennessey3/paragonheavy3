"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { RULE_CATEGORIES, RULE_STATUSES, getStatusInfo, getCategoryInfo } from "@/lib/compliance";

ModuleRegistry.registerModules([AllCommunityModule]);

interface RuleRow {
  _id: Id<"complianceRules">;
  title: string;
  category: string;
  status: string;
  jurisdictionName: string;
  summary: string;
  updatedAt: number;
}

const StatusBadgeRenderer = (params: ICellRendererParams<RuleRow>) => {
  const status = params.value as string;
  const info = getStatusInfo(status as any);
  return (
    <Badge className={info.color} variant="secondary">
      {info.label}
    </Badge>
  );
};

const CategoryRenderer = (params: ICellRendererParams<RuleRow>) => {
  const category = params.value as string;
  const info = getCategoryInfo(category as any);
  return <span>{info.label}</span>;
};

const DateRenderer = (params: ICellRendererParams<RuleRow>) => {
  const timestamp = params.value as number;
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString();
};

export default function ComplianceRulesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const rules = useQuery(api.compliance.searchRules, {});
  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });

  const filteredRules = useMemo(() => {
    if (!rules) return [];

    let filtered = rules.map(rule => ({
      _id: rule._id,
      title: rule.title,
      category: rule.category,
      status: rule.status,
      jurisdictionName: rule.jurisdiction?.name || "Unknown",
      summary: rule.summary,
      updatedAt: rule.updatedAt,
    }));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r => r.title.toLowerCase().includes(query) || 
             r.summary.toLowerCase().includes(query)
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(r => r.status === selectedStatus);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    if (selectedJurisdiction !== "all") {
      filtered = filtered.filter(r => r.jurisdictionName === selectedJurisdiction);
    }

    return filtered;
  }, [rules, searchQuery, selectedStatus, selectedCategory, selectedJurisdiction]);

  const totalPages = Math.ceil(filteredRules.length / pageSize);
  const paginatedRules = filteredRules.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columnDefs: ColDef<RuleRow>[] = [
    {
      headerName: "TITLE",
      field: "title",
      flex: 2,
      sortable: true,
      cellRenderer: (params: ICellRendererParams<RuleRow>) => (
        <button
          className="text-blue-600 hover:underline text-left"
          onClick={() => router.push(`/dashboard/compliance/rules/${params.data?._id}`)}
        >
          {params.value}
        </button>
      ),
    },
    {
      headerName: "JURISDICTION",
      field: "jurisdictionName",
      width: 150,
      sortable: true,
    },
    {
      headerName: "CATEGORY",
      field: "category",
      width: 160,
      sortable: true,
      cellRenderer: CategoryRenderer,
    },
    {
      headerName: "STATUS",
      field: "status",
      width: 130,
      sortable: true,
      cellRenderer: StatusBadgeRenderer,
    },
    {
      headerName: "LAST UPDATED",
      field: "updatedAt",
      width: 140,
      sortable: true,
      cellRenderer: DateRenderer,
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
                <h1 className="text-2xl font-bold text-gray-900">Compliance Rules</h1>
                <p className="text-gray-600 text-sm">
                  {filteredRules.length} rules found
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/dashboard/compliance/rules/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              <Select 
                value={selectedJurisdiction} 
                onValueChange={(v) => {
                  setSelectedJurisdiction(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  {jurisdictions?.map((j) => (
                    <SelectItem key={j._id} value={j.name}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedCategory} 
                onValueChange={(v) => {
                  setSelectedCategory(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {RULE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedStatus} 
                onValueChange={(v) => {
                  setSelectedStatus(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {RULE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <AgGridReact<RuleRow>
                theme="legacy"
                rowData={paginatedRules}
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
                Showing {Math.min((currentPage - 1) * pageSize + 1, filteredRules.length)} to{" "}
                {Math.min(currentPage * pageSize, filteredRules.length)} of {filteredRules.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
