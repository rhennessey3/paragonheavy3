"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export default function DashboardAuthWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isLoaded: isAuthLoaded, userId } = useAuth();

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

        if (!userId) {
            router.push("/sign-in");
            return;
        }

        // If we have a user profile but no organization, redirect to create org
        // Note: We need to be careful about loading states
        if (userProfile !== undefined && !userProfile?.orgId) {
            console.log("🔒 DashboardAuthWrapper: User has no organization, redirecting to create-organization");
            router.push("/sign-up/tasks/create-organization");
        }
    }, [isAuthLoaded, userId, userProfile, router]);

    if (!isAuthLoaded || userProfile === undefined) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
