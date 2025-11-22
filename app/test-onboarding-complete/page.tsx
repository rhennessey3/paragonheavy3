"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function TestOnboardingComplete() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("shipper");
  const [cookies, setCookies] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Read cookies to check onboarding status
    const allCookies = document.cookie;
    setCookies(allCookies);
  }, []);

  const handleCompleteOnboarding = async () => {
    if (!orgName.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      console.log("🧪 Testing onboarding completion...", {
        orgName,
        orgType,
        userId: user?.id,
      });
      
      const response = await fetch('/api/onboarding-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgName,
          orgType,
        }),
      });
      
      if (!response.ok) {
        console.error("❌ Test failed:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error details:", errorText);
        throw new Error(`Failed to complete onboarding: ${response.statusText}`);
      }
      
      // Check if redirected
      if (response.redirected) {
        console.log("✅ API redirected to:", response.url);
        window.location.href = response.url;
        return;
      }
      
      // If no redirect, manually redirect
      console.log("✅ Onboarding completed successfully");
      toast({
        title: "Success",
        description: "Onboarding completed! Redirecting to dashboard...",
      });
      
      // Refresh cookies and redirect
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (error) {
      console.error("❌ Test failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!isUserLoaded) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return <div>Please sign in to test onboarding completion</div>;
  }

  const hasOnboardingCookie = cookies.includes("ph_onboarding_completed=true");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Test Onboarding Completion</h1>
          <p className="mt-2 text-muted-foreground">
            User: {user.primaryEmailAddress?.emailAddress}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>User ID</Label>
                <p className="text-sm text-muted-foreground font-mono break-all">{user.id}</p>
              </div>
              <div>
                <Label>Onboarding Cookie</Label>
                <p className={`text-sm font-medium ${hasOnboardingCookie ? 'text-green-600' : 'text-red-600'}`}>
                  {hasOnboardingCookie ? '✅ Completed' : '❌ Not completed'}
                </p>
              </div>
              <div>
                <Label>All Cookies</Label>
                <p className="text-xs text-muted-foreground font-mono break-all whitespace-pre-wrap">
                  {cookies || 'No cookies found'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Test Form */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Onboarding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <Label htmlFor="orgType">Organization Type</Label>
                <Select value={orgType} onValueChange={setOrgType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipper">Shipper</SelectItem>
                    <SelectItem value="carrier">Carrier</SelectItem>
                    <SelectItem value="escort">Escort / Pilot Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCompleteOnboarding} 
                disabled={isCreating || !orgName.trim()}
                className="w-full"
              >
                {isCreating ? "Completing Onboarding..." : "Complete Onboarding"}
              </Button>
              <p className="text-xs text-muted-foreground">
                This will create an organization, mark onboarding as complete, 
                set the completion cookie, and redirect to the dashboard.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Test Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Test Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/sign-up/tasks/create-org-name'}>
                Go to Create Org Name
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/sign-up/tasks/select-org-type'}>
                Go to Select Org Type
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Test middleware behavior: With onboarding completed, you should be able to access /dashboard 
              but should be redirected away from /sign-up/tasks/* pages.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}