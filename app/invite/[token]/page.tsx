"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, useUser, SignInButton, SignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const token = params.token as string;

    const invite = useQuery(api.invitations.getInvitationByToken, { token });
    const acceptInvitation = useMutation(api.invitations.acceptInvitation);
    const [isAccepting, setIsAccepting] = useState(false);
    const [showSignUp, setShowSignUp] = useState(false);

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            await acceptInvitation({ token });
            toast({
                title: "Welcome!",
                description: "You have successfully joined the organization.",
            });

            // Use window.location.href for a full page reload
            // This ensures Clerk session and org context are properly refreshed
            window.location.href = "/dashboard";
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to accept invitation. It may be invalid or expired.",
                variant: "destructive",
            });
        } finally {
            setIsAccepting(false);
        }
    };

    if (!isLoaded || invite === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-lg">Loading invitation...</div>
            </div>
        );
    }

    if (invite === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
                        <CardDescription>
                            This invitation link is invalid, expired, or has already been used.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => router.push("/")}>
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>You've been invited!</CardTitle>
                    <CardDescription>
                        You have been invited to join <strong>{invite.orgName}</strong> as a{" "}
                        <strong>{invite.role}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isSignedIn ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-md text-sm">
                                Signed in as <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
                            </div>
                            <Button
                                className="w-full"
                                onClick={handleAccept}
                                disabled={isAccepting}
                            >
                                {isAccepting ? "Joining..." : "Accept Invitation"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {showSignUp ? (
                                <div className="flex justify-center">
                                    <SignUp
                                        initialValues={{ emailAddress: invite.email }}
                                        forceRedirectUrl={`/invite/${token}`}
                                        signInUrl={`/sign-in?redirect_url=/invite/${token}`}
                                    />
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-center text-muted-foreground">
                                        Please sign in or create an account to accept this invitation.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <SignInButton mode="modal" forceRedirectUrl={`/invite/${token}`}>
                                            <Button variant="outline" className="w-full">Sign In</Button>
                                        </SignInButton>
                                        <Button
                                            className="w-full"
                                            onClick={() => setShowSignUp(true)}
                                        >
                                            Sign Up
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
