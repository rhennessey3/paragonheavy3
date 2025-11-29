import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface RoleManagementProps {
  orgId: Id<"organizations">;
  currentUserId: string;
  currentUserRole: string;
  orgType: "shipper" | "carrier" | "escort";
}

export function RoleManagement({ orgId, currentUserId, currentUserRole, orgType }: RoleManagementProps) {
  const { toast } = useToast();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const members = useQuery(api.users.getOrganizationMembers, { orgId });
  const invitations = useQuery(api.invitations.getOrgInvitations, { orgId });
  const updateMemberRole = useMutation(api.users.updateMemberRole);
  const revokeInvitation = useMutation(api.invitations.revokeInvitation);

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    if (currentUserRole !== "admin") {
      toast({
        title: "Error",
        description: "Only admins can update member roles",
        variant: "destructive",
      });
      return;
    }

    setUpdatingUserId(userId);
    try {
      await updateMemberRole({
        orgId,
        userId,
        newRole: newRole as any,
      });

      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: Id<"invitations">) => {
    try {
      await revokeInvitation({ invitationId });
      toast({
        title: "Success",
        description: "Invitation revoked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke invitation",
        variant: "destructive",
      });
    }
  };

  if (!members) {
    return <div>Loading members...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingInvitations = invitations?.filter((inv) => inv.status === "pending") || [];
  const acceptedInvitations = invitations?.filter((inv) => inv.status === "accepted") || [];
  const revokedInvitations = invitations?.filter((inv) => inv.status === "revoked") || [];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "manager":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "operator":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "dispatcher":
      case "driver":
      case "safety":
      case "accounting":
      case "escort":
      case "planner":
      case "ap":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team Management</CardTitle>
        {currentUserRole === "admin" && (
          <Link href="/dashboard/team">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members">
              Active Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Invitation History ({invitations?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={getRoleBadgeColor(member.role)}
                  >
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                </div>

                {currentUserRole === "admin" && member.clerkUserId !== currentUserId && (
                  <div className="flex items-center space-x-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleUpdate(member.clerkUserId, value)}
                      disabled={updatingUserId === member.clerkUserId}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orgType !== "escort" && orgType !== "shipper" && (
                          <>
                            <SelectItem value="operator">Operator</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </>
                        )}
                        <SelectItem value="admin">Admin</SelectItem>

                        {orgType === "shipper" && (
                          <>
                            <SelectItem value="planner">Planner</SelectItem>
                            <SelectItem value="dispatcher">Dispatcher</SelectItem>
                            <SelectItem value="ap">AP</SelectItem>
                          </>
                        )}

                        {orgType === "carrier" && (
                          <>
                            <SelectItem value="dispatcher">Dispatcher</SelectItem>
                            <SelectItem value="driver">Driver</SelectItem>
                            <SelectItem value="safety">Safety</SelectItem>
                            <SelectItem value="accounting">Accounting</SelectItem>
                            <SelectItem value="escort">Escort</SelectItem>
                          </>
                        )}
                        {orgType === "escort" && (
                          <>
                            <SelectItem value="dispatcher">Dispatcher</SelectItem>
                            <SelectItem value="driver">Driver</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Pending ({pendingInvitations.length})
                </h3>
                {pendingInvitations.map((invite) => (
                  <div
                    key={invite._id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invite.email}</p>
                        {getStatusBadge(invite.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Invited as {invite.role} • {formatDate(invite.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {invite.inviterName}
                      </p>
                    </div>
                    {currentUserRole === "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvitation(invite._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Accepted Invitations */}
            {acceptedInvitations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Accepted ({acceptedInvitations.length})
                </h3>
                {acceptedInvitations.map((invite) => (
                  <div
                    key={invite._id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invite.email}</p>
                        {getStatusBadge(invite.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Invited as {invite.role} • {formatDate(invite.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {invite.inviterName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Revoked Invitations */}
            {revokedInvitations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Revoked ({revokedInvitations.length})
                </h3>
                {revokedInvitations.map((invite) => (
                  <div
                    key={invite._id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invite.email}</p>
                        {getStatusBadge(invite.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Invited as {invite.role} • {formatDate(invite.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {invite.inviterName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!invitations || invitations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No invitation history found.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}