"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  CheckCircle,
  Car,
  FileText,
  Gauge,
  Clock,
  MapPin,
  Zap,
  Ruler,
  ArrowLeft,
  GitBranch,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { type PolicyType, POLICY_TYPES } from "@/lib/compliance";
import { toast } from "sonner";

const policyIcons: Record<PolicyType, React.ReactNode> = {
  escort: <Car className="h-5 w-5" />,
  permit: <FileText className="h-5 w-5" />,
  speed: <Gauge className="h-5 w-5" />,
  hours: <Clock className="h-5 w-5" />,
  route: <MapPin className="h-5 w-5" />,
  utility: <Zap className="h-5 w-5" />,
  dimension: <Ruler className="h-5 w-5" />,
};

const policyColors: Record<PolicyType, string> = {
  escort: "bg-blue-100 text-blue-700 border-blue-200",
  permit: "bg-green-100 text-green-700 border-green-200",
  speed: "bg-red-100 text-red-700 border-red-200",
  hours: "bg-amber-100 text-amber-700 border-amber-200",
  route: "bg-orange-100 text-orange-700 border-orange-200",
  utility: "bg-cyan-100 text-cyan-700 border-cyan-200",
  dimension: "bg-purple-100 text-purple-700 border-purple-200",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-600",
};

export default function PoliciesPage() {
  const router = useRouter();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch jurisdictions
  const jurisdictions = useQuery(api.compliance.getJurisdictions, { type: "state" });

  // Fetch policies
  const policies = useQuery(api.policies.searchPolicies, {
    jurisdictionId: selectedJurisdiction !== "all" 
      ? selectedJurisdiction as Id<"jurisdictions"> 
      : undefined,
    policyType: selectedType !== "all" ? selectedType as PolicyType : undefined,
    searchTerm: searchQuery || undefined,
  });

  // Mutations
  const updatePolicyStatus = useMutation(api.policies.updatePolicyStatus);
  const deletePolicy = useMutation(api.policies.deletePolicy);

  // Get selected jurisdiction info
  const selectedJurisdictionInfo = useMemo(() => {
    if (selectedJurisdiction === "all" || !jurisdictions) return null;
    return jurisdictions.find(j => j._id === selectedJurisdiction);
  }, [jurisdictions, selectedJurisdiction]);

  // Handle status change
  const handleStatusChange = async (policyId: string, newStatus: "draft" | "published" | "archived") => {
    try {
      await updatePolicyStatus({
        policyId: policyId as Id<"compliancePolicies">,
        status: newStatus,
      });
      toast.success(`Policy ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Handle delete
  const handleDelete = async (policyId: string) => {
    try {
      await deletePolicy({
        policyId: policyId as Id<"compliancePolicies">,
      });
      toast.success("Policy deleted");
    } catch (error) {
      toast.error("Failed to delete policy");
    }
  };

  // Group policies by type for display
  const policiesByType = useMemo(() => {
    if (!policies) return {};
    
    const grouped: Record<PolicyType, typeof policies> = {
      escort: [],
      permit: [],
      speed: [],
      hours: [],
      route: [],
      utility: [],
      dimension: [],
    };

    for (const policy of policies) {
      const type = policy.policyType as PolicyType;
      if (grouped[type]) {
        grouped[type].push(policy);
      }
    }

    return grouped;
  }, [policies]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/compliance")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Compliance Policies</h1>
            <p className="text-gray-500 text-sm">
              Manage policy-centric compliance rules
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/compliance/graph")}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            View Graph
          </Button>
          <Button onClick={() => router.push("/dashboard/compliance/policies/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Jurisdiction Filter */}
            <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Jurisdictions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                {jurisdictions?.map((j) => (
                  <SelectItem key={j._id} value={j._id}>
                    {j.abbreviation ? `${j.abbreviation} - ` : ""}{j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {POLICY_TYPES.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policies List */}
      {!policies ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading policies...</p>
        </div>
      ) : policies.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Policies Found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedType !== "all" || selectedJurisdiction !== "all"
                ? "Try adjusting your filters"
                : "Create your first compliance policy to get started"}
            </p>
            <Button onClick={() => router.push("/dashboard/compliance/policies/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(policiesByType).map(([type, typePolicies]) => {
            if (typePolicies.length === 0) return null;
            
            const policyType = type as PolicyType;
            const typeConfig = POLICY_TYPES.find(t => t.key === type);

            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${policyColors[policyType]}`}>
                    {policyIcons[policyType]}
                  </div>
                  <h2 className="font-semibold">{typeConfig?.label || type}</h2>
                  <Badge variant="outline" className="text-xs">
                    {typePolicies.length}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {typePolicies.map((policy) => (
                    <Card
                      key={policy._id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/dashboard/compliance/policies/${policy._id}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-1">
                              {policy.name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                              {policy.description || "No description"}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/compliance/policies/${policy._id}`);
                              }}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {policy.status === "draft" && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(policy._id, "published");
                                }}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {policy.status === "published" && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(policy._id, "archived");
                                }}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              {policy.status === "draft" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(policy._id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[policy.status]}>
                              {policy.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {policy.conditions?.length || 0} conditions
                            </Badge>
                          </div>
                          {policy.jurisdiction && (
                            <Badge variant="secondary" className="text-xs">
                              {policy.jurisdiction.abbreviation || policy.jurisdiction.name}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

