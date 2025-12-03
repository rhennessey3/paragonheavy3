"use client";

import { useSignIn, useClerk, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

function SignInContent() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInvitation, setHasInvitation] = useState(false);
  const [invitationParams, setInvitationParams] = useState<string>("");
  const [needsMFA, setNeedsMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStrategy, setMfaStrategy] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Check for invitation parameters
  useEffect(() => {
    const ticket = searchParams.get("__clerk_ticket");
    const invitationId = searchParams.get("__clerk_invitation_id");
    const redirectUrl = searchParams.get("redirect_url");
    
    console.log("🎫 Sign-in page checking for invitation:", { ticket: !!ticket, invitationId, redirectUrl });
    
    if (ticket || invitationId) {
      setHasInvitation(true);
      // Build params string for passing to sign-up
      const params = new URLSearchParams();
      if (ticket) params.set("__clerk_ticket", ticket);
      if (invitationId) params.set("__clerk_invitation_id", invitationId);
      if (redirectUrl) params.set("redirect_url", redirectUrl);
      setInvitationParams(params.toString());
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.refresh();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (err) {
      console.error("Error signing out:", err);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔵 Sign-in: Form submitted");

    if (!isLoaded) {
      console.log("⚠️ Sign-in: Clerk not loaded yet");
      return;
    }

    console.log("🔵 Sign-in: Starting sign-in process", { email });
    setIsSubmitting(true);

    try {
      console.log("🔵 Sign-in: Calling signIn.create()");
      const result = await signIn.create({
        identifier: email,
        password,
      });

      console.log("🔵 Sign-in: Result received", { status: result.status });

      if (result.status === "complete") {
        console.log("✅ Sign-in: Status is complete, setting active session");
        await setActive({ session: result.createdSessionId });
        console.log("✅ Sign-in: Session activated");
        // Use full page redirect instead of client-side navigation
        // This ensures session cookies are sent to the server
        console.log("✅ Sign-in: Performing full page redirect to dashboard");
        window.location.href = "/dashboard";
        return; // Stop execution after redirect
      } else if (result.status === "needs_second_factor") {
        // Handle MFA requirement
        console.log("🔐 Sign-in: MFA required", {
          supportedSecondFactors: result.supportedSecondFactors,
        });
        
        // Find the first available second factor strategy (usually totp or phone_code)
        const availableStrategy = result.supportedSecondFactors?.[0]?.strategy;
        if (availableStrategy) {
          setMfaStrategy(availableStrategy);
          setNeedsMFA(true);
          
          // Prepare the second factor
          await signIn.prepareSecondFactor({ strategy: availableStrategy });
          
          toast({
            title: "Two-factor authentication required",
            description: "Please enter your verification code.",
          });
        } else {
          toast({
            title: "MFA setup required",
            description: "Please set up two-factor authentication in your account settings.",
            variant: "destructive",
          });
        }
      } else {
        // Handle other statuses
        console.log("⚠️ Sign-in: Status not complete", {
          status: result.status,
          supportedFirstFactors: result.supportedFirstFactors,
          supportedSecondFactors: result.supportedSecondFactors,
        });
        toast({
          title: "Sign in incomplete",
          description: "Additional verification required.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("❌ Sign-in: Error caught", err);

      // Check for "already signed in" error
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "";
      const isAlreadySignedIn = errorMessage.toLowerCase().includes("already signed in");

      if (isAlreadySignedIn) {
        console.log("⚠️ Sign-in: Already signed in error detected, signing out stale session");
        try {
          await signOut();
          console.log("✅ Sign-in: Signed out, performing full page reload");
          // Force a full page reload to clear all client state
          window.location.reload();
        } catch (signOutErr) {
          console.error("❌ Sign-in: Error signing out", signOutErr);
          // Fallback to reload even if sign out fails, to try to clear state
          window.location.reload();
        }
        return;
      }

      // Extract only safe error properties to avoid circular reference errors
      console.error("❌ Sign-in: Error details", {
        message: err.message,
        errors: err.errors?.map((e: any) => ({
          message: e.message,
          longMessage: e.longMessage,
          code: e.code,
        })),
      });
      toast({
        title: "Error",
        description: err.errors?.[0]?.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      console.log("🔵 Sign-in: Resetting isSubmitting");
      setIsSubmitting(false);
    }
  };

  // Handle MFA code submission (also handles password reset codes)
  const handleMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !mfaStrategy) return;

    setIsSubmitting(true);

    try {
      let result;
      
      // Check if this is a password reset flow or MFA flow
      if (mfaStrategy === "reset_password_email_code") {
        // This is a password reset code verification
        result = await signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code: mfaCode,
        });
        
        // After password reset code is verified, we need to handle setting a new password
        if (result.status === "needs_new_password") {
          toast({
            title: "Code verified",
            description: "Please set your new password.",
          });
          // TODO: Show password reset form (for now, redirect to sign-in)
          // In a full implementation, you'd show a form to set the new password
          setNeedsMFA(false);
          setMfaCode("");
          setMfaStrategy(null);
          toast({
            title: "Password reset in progress",
            description: "Please use the link in your email to complete password reset.",
          });
          return;
        }
      } else {
        // This is regular MFA (second factor)
        result = await signIn.attemptSecondFactor({
          strategy: mfaStrategy,
          code: mfaCode,
        });
      }

      if (result.status === "complete") {
        console.log("✅ Verification complete, setting active session");
        await setActive({ session: result.createdSessionId });
        console.log("✅ Session activated");
        window.location.href = "/dashboard";
        return;
      } else {
        toast({
          title: "Verification failed",
          description: "Invalid code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("❌ Verification error", {
        message: err.message,
        errors: err.errors?.map((e: any) => ({
          message: e.message,
          longMessage: e.longMessage,
          code: e.code,
        })),
      });
      toast({
        title: "Error",
        description: err.errors?.[0]?.message || "Invalid verification code.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password reset using Clerk's sign-in flow with password reset strategy
  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Use Clerk's sign-in flow to initiate password reset
      // This creates a sign-in attempt that can be used for password reset
      const result = await signIn.create({
        identifier: email,
      });

      console.log("🔍 Sign-in result for password reset:", {
        status: result.status,
        supportedFirstFactors: result.supportedFirstFactors,
        firstFactorVerification: result.firstFactorVerification,
      });

      // Prepare password reset using email code strategy
      if (result.supportedFirstFactors) {
        // Find the password reset strategy (usually "reset_password_email_code")
        const resetStrategy = result.supportedFirstFactors.find(
          (factor: any) => factor.strategy === "reset_password_email_code"
        );

        if (resetStrategy) {
          // Extract email address ID from the first factor verification or strategy
          // The email address ID is needed for password reset
          const emailAddressId = resetStrategy.emailAddressId || 
                                 result.firstFactorVerification?.emailAddressId ||
                                 result.supportedFirstFactors.find((f: any) => f.emailAddressId)?.emailAddressId;

          if (!emailAddressId) {
            console.error("❌ No email address ID found in sign-in result");
            throw new Error("Unable to initiate password reset. Please try again.");
          }

          console.log("📧 Preparing password reset with email address ID:", emailAddressId);

          await signIn.prepareFirstFactor({
            strategy: "reset_password_email_code",
            emailAddressId: emailAddressId,
          });

          toast({
            title: "Password reset code sent",
            description: "Check your email for a verification code.",
          });
          
          // Switch to password reset mode
          setNeedsMFA(true);
          setMfaStrategy("reset_password_email_code");
        } else {
          // Fallback: try to use magic link for password reset
          try {
            const { startMagicLinkFlow } = signIn.createMagicLinkFlow();
            await startMagicLinkFlow({
              emailAddress: email,
              redirectUrl: `${window.location.origin}/sign-in`,
            });
            
            toast({
              title: "Password reset email sent",
              description: "Check your email for a password reset link.",
            });
          } catch (magicLinkError) {
            console.error("❌ Magic link error:", magicLinkError);
            toast({
              title: "Password reset not available",
              description: "Please contact support for password reset assistance.",
              variant: "destructive",
            });
          }
        }
      } else {
        // Fallback: try to use magic link for password reset
        try {
          const { startMagicLinkFlow } = signIn.createMagicLinkFlow();
          await startMagicLinkFlow({
            emailAddress: email,
            redirectUrl: `${window.location.origin}/sign-in`,
          });
          
          toast({
            title: "Password reset email sent",
            description: "Check your email for a password reset link.",
          });
        } catch (magicLinkError) {
          console.error("❌ Magic link error:", magicLinkError);
          // If magic link also fails, show generic message
          toast({
            title: "Password reset initiated",
            description: "If an account exists with this email, you'll receive reset instructions.",
          });
        }
      }
    } catch (err: any) {
      console.error("❌ Password reset error:", {
        message: err.message,
        errors: err.errors?.map((e: any) => ({
          message: e.message,
          code: e.code,
        })),
      });
      
      // Don't reveal if user exists (security best practice)
      toast({
        title: "Password reset initiated",
        description: "If an account exists with this email, you'll receive reset instructions.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSignedIn) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
          <p className="mt-2 text-muted-foreground">You are already signed in to Paragon Heavy</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100 mb-4">
              <p className="text-green-800 font-medium">Active Session Detected</p>
            </div>

            <Button
              className="w-full"
              onClick={() => window.location.href = "/dashboard"}
            >
              Go to Dashboard
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Sign In</h1>
        <p className="mt-2 text-muted-foreground">Welcome back to Paragon Heavy</p>
      </div>

      {/* Show prominent sign-up option for invited users who don't have an account */}
      {hasInvitation && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <p className="text-sm font-medium text-primary">
                🎉 You've been invited to join an organization!
              </p>
              <p className="text-sm text-muted-foreground">
                Don't have an account yet? Create one to accept the invitation.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push(`/sign-up${invitationParams ? `?${invitationParams}` : ""}`)}
              >
                Create Account to Accept Invitation
              </Button>
              <p className="text-xs text-muted-foreground">
                Already have an account? Sign in below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {!needsMFA ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                    disabled={isSubmitting}
                  >
                    Forgot password?
                  </button>
                </div>
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
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMFA} className="space-y-4">
              <div className="text-center space-y-2 mb-4">
                <h3 className="text-lg font-semibold">
                  {mfaStrategy === "reset_password_email_code" 
                    ? "Password Reset" 
                    : "Two-Factor Authentication"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {mfaStrategy === "reset_password_email_code"
                    ? "Enter the verification code sent to your email"
                    : "Enter the verification code from your authenticator app"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mfaCode">Verification Code</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={isSubmitting}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setNeedsMFA(false);
                    setMfaCode("");
                    setMfaStrategy(null);
                  }}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting || mfaCode.length !== 6}>
                  {isSubmitting ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}