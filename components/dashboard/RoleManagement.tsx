import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { InviteMemberModal } from "./InviteMemberModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface RoleManagementProps {
  orgId: Id<"organizations">;
  currentUserId: string;
  currentUserRole: string;
}

export function RoleManagement({ orgId, currentUserId, currentUserRole }: RoleManagementProps) {
  const { toast } = useToast();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

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
        newRole: newRole as "admin" | "manager" | "operator",
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

  const handleRevoke = async (invitationId: Id<"invitations">) => {
    try {
      await revokeInvitation({ invitationId });
      toast({
        title: "Invitation Revoked",
        description: "The invitation link is no longer valid.",
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "manager":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "operator":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Organization Members</CardTitle>
        {currentUserRole === "admin" && (
          <Button onClick={() => setIsInviteModalOpen(true)}>
            Invite Member
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members">
          <TabsList className="mb-4">
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            {currentUserRole === "admin" && (
              <TabsTrigger value="invitations">
                Pending Invitations ({invitations?.length || 0})
              </TabsTrigger>
            )}
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
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
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

          <TabsContent value="invitations" className="space-y-4">
            {invitations?.map((invite) => (
              <div
                key={invite._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited as {invite.role} • {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRevoke(invite._id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke
                </Button>
              </div>
            ))}
            {(!invitations || invitations.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No pending invitations.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        orgId={orgId}
      />
    </Card>
  );
}