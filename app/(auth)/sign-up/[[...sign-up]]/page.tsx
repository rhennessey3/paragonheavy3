"use client";

import { useSignUp, useClerk, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { LogOut, AlertTriangle } from "lucide-react";

// Helper to decode JWT payload (no verification, just for display)
function decodeTicketPayload(ticket: string): { oid?: string; sid?: string } | null {
  try {
    const parts = ticket.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      oid: payload.oid, // Clerk org ID
      sid: payload.sid, // Clerk invitation ID
    };
  } catch (e) {
    console.error("Failed to decode ticket:", e);
    return null;
  }
}

function SignUpContent() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const clerk = useClerk();
  const { user, isSignedIn } = useUser();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInvitation, setHasInvitation] = useState(false);
  const [clerkTicket, setClerkTicket] = useState<string | null>(null);
  const [clerkOrgId, setClerkOrgId] = useState<string | null>(null);
  const [clerkInvitationId, setClerkInvitationId] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Query org details if we have a Clerk org ID
  const organization = useQuery(
    api.organizations.getOrganization,
    clerkOrgId ? { clerkOrgId } : "skip"
  );

  // Query invitation details if we have a Clerk invitation ID
  const invitation = useQuery(
    api.invitations.getByClerkId,
    clerkInvitationId ? { clerkInvitationId } : "skip"
  );

  // Check if user is signed in with a different email than the invitation
  const signedInEmail = user?.primaryEmailAddress?.emailAddress;
  const invitationEmail = invitation?.email;
  const hasSessionConflict = isSignedIn && hasInvitation && invitationEmail && signedInEmail !== invitationEmail;

  // Handle sign out to accept invitation
  const handleSignOutAndAccept = async () => {
    setIsSigningOut(true);
    try {
      // Preserve the current URL with invitation params
      const currentUrl = window.location.href;
      await clerk.signOut();
      // Redirect back to this page after sign out
      window.location.href = currentUrl;
    } catch (error) {
      console.error("Failed to sign out:", error);
      setIsSigningOut(false);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mutation to link user to org after invitation sign-up
  const linkUserToOrg = useMutation(api.users.linkUserToOrgAfterInvite);

  // Check for invitation parameters and decode ticket
  useEffect(() => {
    const ticket = searchParams.get("__clerk_ticket");
    const invitationId = searchParams.get("__clerk_invitation_id");
    const redirectUrl = searchParams.get("redirect_url");
    
    console.log("🎫 Sign-up page invitation check:", { ticket: !!ticket, invitationId, redirectUrl });
    
    if (ticket) {
      setClerkTicket(ticket);
      setHasInvitation(true);
      
      // Decode the ticket to get org and invitation IDs
      const decoded = decodeTicketPayload(ticket);
      if (decoded) {
        console.log("🔓 Decoded ticket:", decoded);
        if (decoded.oid) setClerkOrgId(decoded.oid);
        if (decoded.sid) setClerkInvitationId(decoded.sid);
      }
      
      console.log("✅ Clerk ticket detected on sign-up page");
    } else if (invitationId) {
      setHasInvitation(true);
      setClerkInvitationId(invitationId);
      console.log("✅ Invitation ID detected on sign-up page");
    }
  }, [searchParams]);

  // Pre-fill email from invitation when available
  useEffect(() => {
    if (invitation?.email && !email) {
      setEmail(invitation.email);
      console.log("📧 Pre-filled email from invitation:", invitation.email);
    }
  }, [invitation?.email, email]);

  // Handle submission of the sign-up form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsSubmitting(true);

    try {
      let result;
      
      // If we have a Clerk ticket (from organization invitation), use ticket strategy
      // This properly connects the user to the organization
      if (clerkTicket) {
        console.log("🎫 Using ticket strategy for invitation sign-up");
        
        // Step 1: Create sign-up with ticket strategy - this accepts the invitation
        result = await signUp.create({
          strategy: "ticket",
          ticket: clerkTicket,
        });
        
        console.log("📝 Ticket sign-up result:", { status: result.status, missingFields: result.missingFields });
        
        // Step 2: If sign-up needs more fields (name, password), update them
        if (result.status === "missing_requirements") {
          console.log("📝 Updating sign-up with additional fields...");
          result = await signUp.update({
            firstName,
            lastName,
            password,
          });
          console.log("📝 After update:", { status: result.status, missingFields: result.missingFields });
        }
      } else {
        // Regular sign-up flow (no invitation)
        console.log("🚀 Creating regular sign-up...");
        result = await signUp.create({
          firstName,
          lastName,
          emailAddress: email,
          password,
        });
        console.log("📝 Sign-up create result:", { status: result.status, missingFields: result.missingFields });
      }

      // If sign-up is complete (ticket flow often completes immediately)
      if (result.status === "complete") {
        console.log("✅ Sign-up complete, setting active session...");
        await setActive({ session: result.createdSessionId });
        
        // IMPORTANT: Set the organization as active so JWT includes org info
        if (clerkOrgId) {
          try {
            console.log("🏢 Setting organization as active:", clerkOrgId);
            await clerk.setActive({ 
              session: result.createdSessionId,
              organization: clerkOrgId 
            });
            console.log("✅ Organization set as active");
          } catch (orgError) {
            console.error("⚠️ Failed to set active org:", orgError);
          }
          
          // Link user to organization in Convex
          try {
            console.log("🔗 Linking user to organization in Convex...");
            await linkUserToOrg({
              clerkOrgId,
              clerkInvitationId: clerkInvitationId || undefined,
              role: invitation?.role,
            });
            console.log("✅ User linked to organization successfully");
          } catch (linkError) {
            console.error("⚠️ Failed to link user to org (will retry via webhook):", linkError);
            // Continue anyway - webhook should handle it
          }
        }
        
        window.location.href = "/dashboard";
        return;
      }

      // If email verification is still needed
      if (result.status === "missing_requirements" && result.unverifiedFields?.includes("email_address")) {
        console.log("📧 Email verification required, sending code...");
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
        toast({
          title: "Verification email sent",
          description: "Please check your email for the verification code.",
        });
        return;
      }

      // Send the verification email (normal sign-up flow)
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Change the UI to our pending section.
      setPendingVerification(true);
      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification code.",
      });
    } catch (err: any) {
      console.error("❌ Sign-up error:", JSON.stringify(err, null, 2));
      const errorMessage = err.errors?.[0]?.message || "Something went wrong during sign up.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submission of the verification form
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsSubmitting(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== "complete") {
        // The status can also be `abandoned` or `missing_requirements`
        // Please see https://clerk.com/docs/references/react/use-sign-up#result-status for  more information
        console.log(JSON.stringify(completeSignUp, null, 2));
        toast({
          title: "Verification incomplete",
          description: "Please check the code and try again.",
          variant: "destructive",
        });
      }

      if (completeSignUp.status === "complete") {
        console.log("✅ Verification complete, setting active session...");
        await setActive({ session: completeSignUp.createdSessionId });
        
        // If user came from an invitation, set org as active and link them
        if (hasInvitation && clerkOrgId) {
          // IMPORTANT: Set the organization as active so JWT includes org info
          try {
            console.log("🏢 Setting organization as active:", clerkOrgId);
            await clerk.setActive({ 
              session: completeSignUp.createdSessionId,
              organization: clerkOrgId 
            });
            console.log("✅ Organization set as active");
          } catch (orgError) {
            console.error("⚠️ Failed to set active org:", orgError);
          }
          
          // Link user to organization in Convex
          try {
            console.log("🔗 Linking user to organization after verification...");
            await linkUserToOrg({
              clerkOrgId,
              clerkInvitationId: clerkInvitationId || undefined,
              role: invitation?.role,
            });
            console.log("✅ User linked to organization successfully");
          } catch (linkError) {
            console.error("⚠️ Failed to link user to org (will retry via webhook):", linkError);
            // Continue anyway - webhook should handle it
          }
        }
        
        // If user came from an invitation, redirect to dashboard (they're joining existing org)
        // Otherwise, redirect to create-organization (new user flow)
        const redirectUrl = searchParams.get("redirect_url");
        const destination = hasInvitation 
          ? (redirectUrl || "/dashboard") 
          : "/sign-up/tasks/create-organization";
        
        console.log("✅ Session set, redirecting to:", destination, { hasInvitation, redirectUrl });
        // Use window.location.href to force a full page load and ensure cookies are sent to the server
        window.location.href = destination;
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const errorMessage = err.errors?.[0]?.message || "Verification failed.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Verify your email</h1>
          <p className="mt-2 text-muted-foreground">
            Enter the verification code sent to {email}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter code"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show session conflict UI if user is signed in with different email
  if (hasSessionConflict) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Session Conflict</h1>
          <p className="mt-2 text-muted-foreground">
            You're signed in with a different account
          </p>
        </div>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold text-amber-900">
                Different Account Detected
              </p>
              <p className="text-sm text-amber-700">
                You're currently signed in as:
              </p>
              <p className="font-mono text-sm bg-amber-100 px-3 py-1.5 rounded-md inline-block text-amber-800">
                {signedInEmail}
              </p>
            </div>

            <div className="border-t border-amber-200 pt-4 space-y-2">
              <p className="text-sm text-amber-700">
                This invitation is for:
              </p>
              <p className="font-mono text-sm bg-green-100 px-3 py-1.5 rounded-md inline-block text-green-800">
                {invitationEmail}
              </p>
              {organization && (
                <p className="text-sm text-amber-600 mt-2">
                  To join <span className="font-semibold">{organization.name}</span>
                  {invitation?.role && (
                    <span> as <Badge className="ml-1 bg-amber-600 hover:bg-amber-700 capitalize">{invitation.role}</Badge></span>
                  )}
                </p>
              )}
            </div>

            <div className="border-t border-amber-200 pt-4 space-y-3">
              <p className="text-sm text-amber-600">
                To accept this invitation, please sign out first.
              </p>
              <Button
                onClick={handleSignOutAndAccept}
                disabled={isSigningOut}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSigningOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out & Accept Invitation
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Stay signed in as {signedInEmail?.split('@')[0]}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Sign Up</h1>
        <p className="mt-2 text-muted-foreground">
          {hasInvitation 
            ? "Create your account to accept the invitation" 
            : "Create your Paragon Heavy account"}
        </p>
      </div>

      {hasInvitation && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">🎉</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-900">
                You've been invited!
              </div>
              {organization ? (
                <div className="text-sm text-green-700 mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <span>Join <span className="font-semibold">{organization.name}</span></span>
                  {organization.type && (
                    <Badge variant="secondary" className="capitalize">
                      {organization.type}
                    </Badge>
                  )}
                </div>
              ) : clerkOrgId ? (
                <div className="text-sm text-green-600 mt-1">Loading organization details...</div>
              ) : null}
              {invitation?.role && (
                <div className="text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
                  <span>Role:</span>
                  <Badge className="bg-green-600 hover:bg-green-700 capitalize">{invitation.role}</Badge>
                </div>
              )}
            </div>
            <div className="text-xs text-green-600 border-t border-green-200 pt-3">
              Complete the form below to create your account and accept the invitation.
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                disabled={isSubmitting}
                readOnly={hasInvitation && !!invitation?.email}
                className={hasInvitation && invitation?.email ? "bg-muted cursor-not-allowed" : ""}
              />
              {hasInvitation && invitation?.email && (
                <p className="text-xs text-muted-foreground">
                  This email was specified in your invitation and cannot be changed.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
            <div id="clerk-captcha" />
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}