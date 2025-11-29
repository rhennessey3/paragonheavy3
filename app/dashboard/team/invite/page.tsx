"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";

type Role =
    | "admin"
    | "manager"
    | "dispatcher"
    | "planner"
    | "operator"
    | "driver"
    | "escort"
    | "safety"
    | "accounting"
    | "member";

export default function InviteTeamMemberPage() {
    const { organization } = useOrganization();
    const { user } = useUser();
    const { toast } = useToast();

    const userProfile = useQuery(
        api.users.getUserProfile,
        user?.id ? { clerkUserId: user.id } : "skip"
    );

    const createInvitation = useMutation(api.invitations.createInvitationWithClerk);
    const linkClerkInvitation = useMutation(api.invitations.linkClerkInvitation);

    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Role>("member");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInvite = async (e: FormEvent) => {
        e.preventDefault();

        if (!organization || !userProfile?.orgId) {
            toast({
                title: "Error",
                description: "Organization not found",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Create invitation in Convex
            const { inviteId, clerkOrgId } = await createInvitation({
                email,
                orgId: userProfile.orgId as Id<"organizations">,
                role,
            });

            // 2. Create invitation in Clerk
            const clerkInvite = await organization.inviteMember({
                emailAddress: email,
                role: "org:member", // Always use member, we'll upgrade via webhook
            });

            // 3. Link Clerk invitation to Convex invitation
            await linkClerkInvitation({
                inviteId,
                clerkInvitationId: clerkInvite.id,
            });

            toast({
                title: "Invitation sent!",
                description: `An invitation has been sent to ${email}`,
            });

            // Reset form
            setEmail("");
            setRole("member");
        } catch (error: any) {
            console.error("Failed to send invitation:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send invitation",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!userProfile) {
        return <div>Loading...</div>;
    }

    if (userProfile.role !== "admin") {
        return (
            <div className="container max-w-2xl mx-auto py-10">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">
                            Only admins can invite team members.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Invite Team Member</CardTitle>
                    <CardDescription>
                        Send an invitation to join your organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvite} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@example.com"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={role}
                                onValueChange={(value: Role) => setRole(value)}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="dispatcher">Dispatcher</SelectItem>
                                    <SelectItem value="planner">Planner</SelectItem>
                                    <SelectItem value="operator">Operator</SelectItem>
                                    <SelectItem value="driver">Driver</SelectItem>
                                    <SelectItem value="escort">Escort</SelectItem>
                                    <SelectItem value="safety">Safety</SelectItem>
                                    <SelectItem value="accounting">Accounting</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Select the role for this team member
                            </p>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Sending invitation..." : "Send Invitation"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
