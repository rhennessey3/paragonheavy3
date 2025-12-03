"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import {
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Search,
  MoreHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FALLBACK_ROLES } from "@/lib/constants";

export default function TeamManagementTab() {
  const { user } = useUser();
  const userId = user?.id;
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<"members" | "invitations">("members");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("org:member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [editingRoleFor, setEditingRoleFor] = useState<string | null>(null);

  // State for roles
  const [clerkRoles, setClerkRoles] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Queries
  const userProfile = useQuery(api.users.getUserProfile,
    userId ? { clerkUserId: userId } : "skip"
  );

  const organization = useQuery(api.organizations.getOrganizationById,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  const members = useQuery(api.users.getOrganizationMembers,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  const invitations = useQuery(api.invitations.getOrgInvitations,
    userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
  );

  // Fetch roles from Clerk
  useEffect(() => {
    async function fetchRoles() {
      if (!organization?.clerkOrgId) return;

      try {
        setIsLoadingRoles(true);
        const response = await fetch(`/api/roles?orgId=${organization.clerkOrgId}`);
        if (response.ok) {
          const data = await response.json();
          setClerkRoles(data.roles && data.roles.length > 0 ? data.roles : FALLBACK_ROLES);
        } else {
          setClerkRoles(FALLBACK_ROLES);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        setClerkRoles(FALLBACK_ROLES);
      } finally {
        setIsLoadingRoles(false);
      }
    }

    fetchRoles();
  }, [organization?.clerkOrgId]);

  // Mutations
  const createInvitation = useMutation(api.invitations.createInvitationWithClerk);
  const revokeInvitation = useMutation(api.invitations.revokeInvitation);
  const updateMemberRole = useMutation(api.users.updateMemberRole);

  const orgType = organization?.type || "carrier";
  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "org:admin";
  const pendingInvitations = invitations?.filter((inv) => inv.status === "pending") || [];

  // Loading state
  if (!userProfile || !organization) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team...</p>
        </div>
      </div>
    );
  }

  // Helpers
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredMembers = members?.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  }) || [];

  const filteredPendingInvitations = pendingInvitations.filter((invite) => {
    if (!searchQuery) return true;
    return invite.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get role options
  const getRoleOptions = () => {
    if (!clerkRoles.length) return [];

    const formattedRoles = clerkRoles.map(role => ({
      value: role.key,
      label: role.name,
      clerkKey: role.key,
      description: role.description
    }));

    let filtered = formattedRoles;

    if (orgType === "shipper") {
      filtered = formattedRoles.filter(r =>
        ["org:admin", "org:dispatch", "org:accounting", "org:member"].includes(r.clerkKey)
      );
    } else if (orgType === "carrier") {
      filtered = formattedRoles.filter(r =>
        ["org:admin", "org:dispatch", "org:accounting", "org:heavy_haul_rig_operator", "org:escort_operator", "org:member"].includes(r.clerkKey)
      );
    } else if (orgType === "escort") {
      filtered = formattedRoles.filter(r =>
        ["org:admin", "org:dispatch", "org:escort_operator", "org:member"].includes(r.clerkKey)
      );
    }

    if (filtered.length === 0 && formattedRoles.length > 0) {
      return formattedRoles;
    }

    return filtered;
  };

  // Handlers
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.orgId) return;

    const roleOptions = getRoleOptions();
    const selectedRole = roleOptions.find(r => r.value === role);
    const clerkRoleKey = selectedRole?.clerkKey || "org:member";

    setIsSubmitting(true);
    try {
      const convexResult = await createInvitation({
        email,
        orgId: userProfile.orgId,
        role: role as any,
      });

      const clerkResponse = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          clerkRole: clerkRoleKey,
          convexInviteId: convexResult.inviteId,
          orgId: organization.clerkOrgId,
        }),
      });

      if (!clerkResponse.ok) {
        const errorData = await clerkResponse.json();
        const link = `${window.location.origin}/invite/${convexResult.token}`;
        setInviteLink(link);
        toast({
          title: "Invitation Created (Email may not have sent)",
          description: errorData.error || "The email might not have been sent. Please share the link manually.",
          variant: "default",
        });
        return;
      }

      const link = `${window.location.origin}/invite/${convexResult.token}`;
      setInviteLink(link);

      toast({
        title: "Invitation Sent!",
        description: `An email has been sent to ${email}. You can also share the link below.`,
      });
    } catch (error) {
      console.error("Invitation error:", error);
      toast({
        title: "Error",
        description: "Failed to create invitation. It may already exist.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard.",
      });
    }
  };

  const resetInviteForm = () => {
    setInviteLink(null);
    setEmail("");
    setRole(orgType === "escort" ? "org:driver" : orgType === "shipper" ? "org:planner" : "org:operator");
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

  const handleRoleUpdate = async (memberId: string, newRole: string) => {
    if (!userProfile?.orgId || !organization?.clerkOrgId) return;

    setUpdatingUserId(memberId);
    try {
      const clerkResponse = await fetch("/api/members/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkOrgId: organization.clerkOrgId,
          clerkUserId: memberId,
          newRole: newRole,
        }),
      });

      if (!clerkResponse.ok) {
        const errorData = await clerkResponse.json();
        throw new Error(errorData.error || "Failed to update role in Clerk");
      }

      await updateMemberRole({
        orgId: userProfile.orgId,
        userId: memberId,
        newRole: newRole as any,
      });

      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
    } catch (error: any) {
      console.error("Role update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update member role",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    toast({
      title: "Coming Soon",
      description: "Member removal will be available in a future update.",
    });
    setMemberToRemove(null);
  };

  return (
    <div className="space-y-6">
      {/* Tabs - Invitations tab only visible to admins */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 border-b">
          <button
            onClick={() => setActiveTab("members")}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "members"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Members <span className="ml-1 text-muted-foreground">{members?.length || 0}</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("invitations")}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "invitations"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Invitations <span className="ml-1 text-muted-foreground">{pendingInvitations.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Invite */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && activeTab === "members" && (
          <Button onClick={() => setActiveTab("invitations")}>
            Invite
          </Button>
        )}
      </div>

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Joined</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member._id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{member.name}</span>
                          {member.clerkUserId === userId && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="p-3">
                    {isAdmin && member.clerkUserId !== userId && editingRoleFor === member.clerkUserId ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => {
                            handleRoleUpdate(member.clerkUserId, value);
                            setEditingRoleFor(null);
                          }}
                          disabled={updatingUserId === member.clerkUserId}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getRoleOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground"
                          onClick={() => setEditingRoleFor(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {getRoleOptions().find(r => r.value === member.role)?.label || member.role?.replace('org:', '') || 'Member'}
                        </Badge>
                        {isAdmin && member.clerkUserId !== userId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setEditingRoleFor(member.clerkUserId)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {isAdmin && member.clerkUserId !== userId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setMemberToRemove({ id: member.clerkUserId, name: member.name })}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {searchQuery ? "No members match your search." : "No members found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invitations Tab - Admin only */}
      {activeTab === "invitations" && isAdmin && (
        <div className="space-y-6">
          {/* Invite Form */}
          {!inviteLink && (
            <form onSubmit={handleInvite} className="flex items-end gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="w-40 space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {getRoleOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Invite"}
              </Button>
            </form>
          )}

          {/* Invite Success */}
          {inviteLink && (
            <div className="p-4 border rounded-lg bg-green-50 border-green-200 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-900">Invitation sent to {email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="outline" onClick={resetInviteForm}>
                Invite Another
              </Button>
            </div>
          )}

          {/* Pending Invitations Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Invited</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPendingInvitations.map((invite) => (
                  <tr key={invite._id} className="border-t">
                    <td className="p-3">
                      <span className="text-sm">{invite.email}</span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatDate(invite.createdAt)}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="capitalize">
                        {invite.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRevokeInvitation(invite._id)}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredPendingInvitations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {searchQuery ? "No invitations match your search." : "No pending invitations."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Remove Member Dialog */}
      <Dialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {memberToRemove?.name} from the organization?
              They will lose access to all organization resources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember}>
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

