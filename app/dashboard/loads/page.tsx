"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Search, Filter, ChevronUp, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

type JobStatus = "In Progress" | "Complete" | "Pending Approval" | "On Hold" | "Cancelled";

interface JobRow {
  _id: Id<"loads">;
  jobId: string;
  description: string;
  loads: number;
  progress: number;
  origin: string;
  destination: string;
  state: JobStatus;
  status: string; // Original load status
}

// Map load status to job state
const mapStatusToState = (status: string): JobStatus => {
  switch (status) {
    case "in_transit":
      return "In Progress";
    case "delivered":
      return "Complete";
    case "draft":
    case "available":
      return "Pending Approval";
    case "assigned":
      return "On Hold";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending Approval";
  }
};

// Calculate progress based on status
const calculateProgress = (status: string): number => {
  switch (status) {
    case "delivered":
      return 100;
    case "in_transit":
      return 75;
    case "assigned":
      return 20;
    case "draft":
    case "available":
      return 0;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
};

// Get progress bar color
const getProgressColor = (status: string): string => {
  switch (status) {
    case "delivered":
      return "bg-green-500";
    case "in_transit":
      return "bg-blue-500";
    case "assigned":
      return "bg-orange-500";
    default:
      return "bg-gray-300";
  }
};

// Get state badge color
const getStateBadgeColor = (state: JobStatus): string => {
  switch (state) {
    case "In Progress":
      return "bg-blue-100 text-blue-800";
    case "Complete":
      return "bg-green-100 text-green-800";
    case "Pending Approval":
      return "bg-orange-100 text-orange-800";
    case "On Hold":
      return "bg-orange-100 text-orange-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Progress bar cell renderer
const ProgressBarRenderer = (params: ICellRendererParams<JobRow>) => {
  const progress = params.value || 0;
  const status = params.data?.status || "";
  const color = getProgressColor(status);
  
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// State badge cell renderer
const StateBadgeRenderer = (params: ICellRendererParams<JobRow>) => {
  const state = params.value as JobStatus;
  const colorClass = getStateBadgeColor(state);
  
  return (
    <Badge className={colorClass} variant="secondary">
      {state}
    </Badge>
  );
};

export default function JobsPage() {
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedOperator, setSelectedOperator] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("creationDate");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Get user profile and organization
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  const organization = useQuery(
    api.organizations.getOrganizationById,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  // Get loads based on tab
  const allLoads = useQuery(
    api.loads.getOrganizationLoads,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  // Transform loads to jobs
  const jobs = useMemo(() => {
    if (!allLoads) return [];
    
    return allLoads.map((load) => ({
      _id: load._id,
      jobId: `#JB${load.loadNumber.slice(-5)}`,
      description: load.dimensions.description || load.loadNumber,
      loads: 1, // For now, each load is 1 job
      progress: calculateProgress(load.status),
      origin: `${load.origin.city}, ${load.origin.state}`,
      destination: `${load.destination.city}, ${load.destination.state}`,
      state: mapStatusToState(load.status),
      status: load.status,
    })) as JobRow[];
  }, [allLoads]);

  // Filter jobs based on tab
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Filter by tab
    if (activeTab === "active") {
      filtered = filtered.filter(job => 
        job.state === "In Progress" || job.state === "On Hold" || job.state === "Pending Approval"
      );
    } else if (activeTab === "completed") {
      filtered = filtered.filter(job => job.state === "Complete");
    }
    // "all" shows everything

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.jobId.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    }

    // Filter by state
    if (selectedState !== "all") {
      filtered = filtered.filter(job => job.state === selectedState);
    }

    // Sort
    if (sortBy === "creationDate") {
      filtered = [...filtered].sort((a, b) => {
        const loadA = allLoads?.find(l => l._id === a._id);
        const loadB = allLoads?.find(l => l._id === b._id);
        return (loadB?.createdAt || 0) - (loadA?.createdAt || 0);
      });
    }

    return filtered;
  }, [jobs, activeTab, searchQuery, selectedState, sortBy, allLoads]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / pageSize);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // AG Grid column definitions
  const columnDefs: ColDef<JobRow>[] = [
    {
      headerName: "",
      field: "checkbox",
      width: 50,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      pinned: "left",
    },
    {
      headerName: "JOB ID",
      field: "jobId",
      width: 120,
      sortable: true,
    },
    {
      headerName: "DESCRIPTION",
      field: "description",
      width: 200,
      sortable: true,
      flex: 1,
    },
    {
      headerName: "LOADS",
      field: "loads",
      width: 100,
      sortable: true,
      cellRenderer: (params: ICellRendererParams<JobRow>) => {
        const loads = params.value || 0;
        return `${loads} ${loads === 1 ? "Load" : "Loads"}`;
      },
    },
    {
      headerName: "PROGRESS",
      field: "progress",
      width: 150,
      sortable: true,
      cellRenderer: ProgressBarRenderer,
    },
    {
      headerName: "ORIGIN",
      field: "origin",
      width: 150,
      sortable: true,
    },
    {
      headerName: "DESTINATION",
      field: "destination",
      width: 150,
      sortable: true,
    },
    {
      headerName: "STATE",
      field: "state",
      width: 150,
      sortable: true,
      cellRenderer: StateBadgeRenderer,
    },
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: false, // We'll handle sorting manually
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-white">
        <div className="space-y-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
            <Button 
              onClick={() => router.push("/dashboard/loads/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Job
            </Button>
          </div>

          {/* Tabs */}
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => {
              setActiveTab(v as "active" | "completed" | "all");
              setCurrentPage(1); // Reset to first page when switching tabs
            }}
            className="px-6"
          >
            <div className="border-b border-gray-200">
              <TabsList className="h-auto p-0 bg-transparent inline-flex">
                <TabsTrigger 
                  value="active"
                  className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 font-medium transition-colors"
                >
                  Active Jobs
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 font-medium transition-colors"
                >
                  Completed
                </TabsTrigger>
                <TabsTrigger 
                  value="all"
                  className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 font-medium transition-colors"
                >
                  All Jobs
                </TabsTrigger>
              </TabsList>
            </div>

        <TabsContent value={activeTab} className="mt-6 px-6 pb-6">
          {/* Search and Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by ID, description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <Select value={selectedState} onValueChange={(v) => {
                setSelectedState(v);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  {/* Add operators here when available */}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creationDate">Sort by: Creation Date</SelectItem>
                  <SelectItem value="jobId">Sort by: Job ID</SelectItem>
                  <SelectItem value="description">Sort by: Description</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" size="icon">
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* AG Grid Table */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm mb-4">

            <div 
              className="ag-theme-quartz rounded-lg overflow-hidden bg-white" 
              style={{ 
              height: "600px", 
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
            <AgGridReact<JobRow>
              theme="legacy"
              rowData={paginatedJobs}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection="multiple"
              suppressRowClickSelection={true}
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
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length} results
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}

