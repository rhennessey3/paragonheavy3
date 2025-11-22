"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function TestOnboardingPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const userProfile = useQuery(api.users.getUserProfile, 
    user ? { clerkUserId: user.id } : "skip"
  );
  const markOnboardingCompleted = useMutation(api.users.markOnboardingCompleted);

  const handleMarkOnboardingCompleted = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      // Mark onboarding complete in Convex
      await markOnboardingCompleted({
        clerkUserId: user.id,
      });
      
      // Set onboarding completion cookie
      console.log("🍪 TestOnboarding: Setting onboarding completion cookie...");
      const cookieResponse = await fetch('/api/onboarding-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!cookieResponse.ok) {
        console.error("❌ TestOnboarding: Failed to set onboarding cookie", {
          status: cookieResponse.status,
          statusText: cookieResponse.statusText
        });
        throw new Error("Failed to set onboarding completion cookie");
      }
      
      console.log("✅ TestOnboarding: Onboarding completion cookie set");
      
      toast({
        title: "Success",
        description: "Onboarding marked as completed and cookie set!",
      });
      
      // Refresh the user profile to show updated state
      window.location.reload();
    } catch (error) {
      console.error("Error marking onboarding complete:", error);
      toast({
        title: "Error",
        description: "Failed to mark onboarding as complete. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isUserLoaded) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return <div>Please sign in to test onboarding.</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Test Onboarding Completion</h1>
          <p className="mt-2 text-muted-foreground">
            Test the onboarding completion functionality
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>User Profile Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">User Profile Status:</h3>
              {userProfile ? (
                <div>
                  <p><strong>Onboarding Completed:</strong> {userProfile.onboardingCompleted ? "✅ Yes" : "❌ No"}</p>
                  <p><strong>Role:</strong> {userProfile.role}</p>
                  <p><strong>Organization:</strong> {userProfile.orgId}</p>
                </div>
              ) : (
                <p>No user profile found in Convex</p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Actions:</h3>
              <Button 
                onClick={handleMarkOnboardingCompleted}
                disabled={isUpdating || userProfile?.onboardingCompleted}
                className="w-full"
              >
                {isUpdating ? "Updating..." : userProfile?.onboardingCompleted ? "Onboarding Already Completed" : "Mark Onboarding as Completed"}
              </Button>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Debug Info:</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
                <p><strong>Org Memberships:</strong> {user.organizationMemberships?.length || 0}</p>
                {user.organizationMemberships && user.organizationMemberships.length > 0 && (
                  <p><strong>First Org ID:</strong> {user.organizationMemberships[0].organization.id}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}