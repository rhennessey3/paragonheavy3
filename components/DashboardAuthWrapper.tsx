"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function DashboardAuthWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isLoaded: isAuthLoaded, user } = useUser();
    const userId = user?.id;

    // Fetch user profile and organization
    const userProfile = useQuery(api.users.getUserProfile,
        userId ? { clerkUserId: userId } : "skip"
    );

    // We can also fetch the org directly if we have the ID from the profile
    const org = useQuery(api.organizations.getOrganizationById,
        userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
    );

    useEffect(() => {
        if (!isAuthLoaded) return;

        console.log("🔒 DashboardAuthWrapper check:", {
            isAuthLoaded,
            userId,
            user: user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress } : null,
            hasProfile: !!userProfile,
            orgId: userProfile?.orgId
        });

        if (!userId) {
            console.log("🔒 DashboardAuthWrapper: No userId, redirecting to sign-in");
            router.push("/sign-in");
            return;
        }

        // If we have a user profile but no organization, it might be syncing
        // Don't redirect immediately, just wait (the UI will show loading)
        if (userProfile !== undefined && !userProfile?.orgId) {
            console.log("🔒 DashboardAuthWrapper: User has profile but no orgId. Waiting for sync...");
            // We could redirect to create-organization here, but only if we are SURE they need to create one.
            // Since we just came from onboarding, it's likely just a sync delay.
        }
    }, [isAuthLoaded, userId, userProfile, router, user]);

    // Show loading if:
    // 1. Auth is not loaded
    // 2. User profile is loading (undefined)
    // 3. User profile exists but orgId is missing (syncing)
    if (!isAuthLoaded || userProfile === undefined || (userProfile && !userProfile.orgId)) {
        // DEBUG: If auth loaded but no user, show error
        if (isAuthLoaded && !userId) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
                    <div className="text-destructive font-bold text-xl">Authentication Error</div>
                    <p>User ID is missing.</p>
                    <pre className="bg-muted p-4 rounded text-xs">
                        {JSON.stringify({ isAuthLoaded, userId, user: user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress } : null, userProfile }, null, 2)}
                    </pre>
                    <button
                        className="bg-primary text-primary-foreground px-4 py-2 rounded"
                        onClick={() => router.push("/sign-in")}
                    >
                        Go to Sign In
                    </button>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                        {!isAuthLoaded ? "Checking authentication..." :
                            !userProfile ? "Loading profile..." :
                                "Setting up your organization..."}
                    </p>
                    <pre className="bg-muted p-4 rounded text-xs text-left max-w-md">
                        {JSON.stringify({
                            isAuthLoaded,
                            hasUser: !!user,
                            userId,
                            userProfileState: userProfile === undefined ? "loading" : userProfile === null ? "not found" : "loaded",
                            orgId: userProfile?.orgId
                        }, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
