"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { Copy, Check } from "lucide-react";

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: Id<"organizations">;
    orgType: "shipper" | "carrier" | "escort";
}

export function InviteMemberModal({ isOpen, onClose, orgId, orgType }: InviteMemberModalProps) {
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "manager" | "operator" | "dispatcher" | "driver" | "safety" | "accounting" | "escort" | "planner" | "ap">(
        orgType === "escort" ? "driver" : orgType === "shipper" ? "planner" : "operator"
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const createInvitation = useMutation(api.invitations.createInvitationWithClerk);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Step 1: Create Convex invitation record
            const convexResult = await createInvitation({
                email,
                orgId,
                role,
            });

            // Step 2: Call Clerk API to send the actual invitation email
            const clerkResponse = await fetch("/api/invitations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    role,
                    convexInviteId: convexResult.inviteId,
                }),
            });

            if (!clerkResponse.ok) {
                const errorData = await clerkResponse.json();
                console.error("Clerk invitation failed:", errorData);
                // Still show the link as fallback
                const link = `${window.location.origin}/invite/${convexResult.token}`;
                setInviteLink(link);
                toast({
                    title: "Invitation Created (Email may not have sent)",
                    description: errorData.error || "The email might not have been sent. Please share the link manually.",
                    variant: "default",
                });
                return;
            }

            const clerkData = await clerkResponse.json();
            console.log("✅ Clerk invitation created:", clerkData);

            // Show success - email was sent via Clerk
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

    const handleClose = () => {
        setInviteLink(null);
        setEmail("");
        setRole("operator");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>

                {!inviteLink ? (
                    <form onSubmit={handleInvite} className="space-y-4 py-4">
                        <div className="space-y-2">
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
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={(val: any) => setRole(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {orgType !== "escort" && orgType !== "shipper" && (
                                        <>
                                            <SelectItem value="operator">Operator (Standard access)</SelectItem>
                                            <SelectItem value="manager">Manager (Can edit settings)</SelectItem>
                                        </>
                                    )}
                                    <SelectItem value="admin">Admin (Full access)</SelectItem>

                                    {orgType === "shipper" && (
                                        <>
                                            <SelectItem value="planner">Planner</SelectItem>
                                            <SelectItem value="dispatcher">Dispatcher</SelectItem>
                                            <SelectItem value="ap">AP (Accounts Payable)</SelectItem>
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
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Generate Invite Link"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted rounded-md text-center space-y-2">
                            <p className="text-sm font-medium">Invitation Link Generated!</p>
                            <p className="text-xs text-muted-foreground">
                                Share this link with <strong>{email}</strong> to join your organization.
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Input value={inviteLink} readOnly className="font-mono text-xs" />
                            <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleClose}>Done</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
