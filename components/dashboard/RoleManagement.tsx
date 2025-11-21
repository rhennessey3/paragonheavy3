"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";

const updateRoleSchema = z.object({
  newRole: z.enum(["admin", "manager", "operator"]),
});

type UpdateRoleValues = z.infer<typeof updateRoleSchema>;

interface RoleManagementProps {
  orgId: Id<"organizations">;
  currentUserId: string;
  currentUserRole: string;
}

export function RoleManagement({ orgId, currentUserId, currentUserRole }: RoleManagementProps) {
  const { toast } = useToast();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  const members = useQuery(api.users.getOrganizationMembers, { orgId });
  const updateMemberRole = useMutation(api.users.updateMemberRole);

  const form = useForm<UpdateRoleValues>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      newRole: "operator",
    },
  });

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

  if (!members) {
    return <div>Loading members...</div>;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "operator":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                    member.role
                  )}`}
                >
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
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
                  {updatingUserId === member.clerkUserId && (
                    <span className="text-sm text-muted-foreground">Updating...</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No members found in this organization.
          </div>
        )}
      </CardContent>
    </Card>
  );
}