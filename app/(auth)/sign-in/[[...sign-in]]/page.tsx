
"use client";

import { useSignIn, useClerk, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
      } else {
        // Handle other statuses (e.g. MFA)
        console.log("⚠️ Sign-in: Status not complete", JSON.stringify(result, null, 2));
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

      console.error("❌ Sign-in: Error details", JSON.stringify(err, null, 2));
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

      <Card>
        <CardContent className="pt-6">
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
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
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