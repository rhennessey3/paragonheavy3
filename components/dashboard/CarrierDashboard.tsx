import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RoleManagement } from "./RoleManagement";
import { LoadCreationModal } from "./LoadCreationModal";
import { Button } from "@/components/ui/button";
import { AssignOrganizationModal } from "./AssignOrganizationModal";
import type { Id } from "@/convex/_generated/dataModel";

export function CarrierDashboard() {
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Id<"loads"> | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningLoadId, setAssigningLoadId] = useState<Id<"loads"> | null>(null);
  const [assignmentType, setAssignmentType] = useState<"carrier" | "escort">("carrier");
  const { userId } = useAuth();

  const userProfile = useQuery(api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  // Get loads for this user within their organization
  const loads = useQuery(api.loads.getUserLoads,
    userProfile?.orgId && userId ? {
      userId: userId,
      orgId: userProfile.orgId
    } : "skip"
  );

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Not set";
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Assigned Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {loads?.filter(l => l.status === "assigned").length || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Ready for pickup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">
              {loads?.filter(l => l.status === "in_transit").length || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-2">On the road</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">{loads?.length || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Members Section */}
      {userProfile?.orgId && (
        <RoleManagement
          orgId={userProfile.orgId}
          currentUserId={userId || ""}
          currentUserRole={userProfile.role}
        />
      )}

      <div className="p-4 border rounded-lg bg-muted/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Carrier Actions</h3>
          <button
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            onClick={() => {
              setEditingLoad(null);
              setIsLoadModalOpen(true);
            }}
          >
            Create New Load
          </button>
        </div>

        {/* Loads Table */}
        {loads && loads.length > 0 ? (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Load #</th>
                  <th className="text-left p-3 text-sm font-medium">Origin</th>
                  <th className="text-left p-3 text-sm font-medium">Destination</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Pickup</th>
                  <th className="text-right p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loads.map((load) => (
                  <tr key={load._id} className="border-t hover:bg-muted/50">
                    <td className="p-3 text-sm font-mono">{load.loadNumber}</td>
                    <td className="p-3 text-sm">
                      {load.origin.city}, {load.origin.state}
                    </td>
                    <td className="p-3 text-sm">
                      {load.destination.city}, {load.destination.state}
                    </td>
                    <td className="p-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${load.status === "draft" ? "bg-gray-100 text-gray-800" :
                        load.status === "available" ? "bg-blue-100 text-blue-800" :
                          load.status === "assigned" ? "bg-yellow-100 text-yellow-800" :
                            load.status === "in_transit" ? "bg-green-100 text-green-800" :
                              load.status === "delivered" ? "bg-purple-100 text-purple-800" :
                                "bg-red-100 text-red-800"
                        }`}>
                        {load.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{formatDate(load.pickupDate)}</td>
                    <td className="p-3 text-sm text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingLoad(load._id);
                          setIsLoadModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAssigningLoadId(load._id);
                          setAssignmentType("carrier");
                          setAssignModalOpen(true);
                        }}>
                        Assign Carrier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAssigningLoadId(load._id);
                          setAssignmentType("escort");
                          setAssignModalOpen(true);
                        }}>
                        Assign Escort
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-4">No loads created yet. Create your first load to get started!</p>
        )}
      </div>

      <LoadCreationModal
        isOpen={isLoadModalOpen}
        onClose={() => {
          setIsLoadModalOpen(false);
          setEditingLoad(null);
        }}
        orgType="carrier"
        editingLoadId={editingLoad}
      />
      <AssignOrganizationModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        loadId={assigningLoadId}
        type={assignmentType}
      />
    </div>
  );
}