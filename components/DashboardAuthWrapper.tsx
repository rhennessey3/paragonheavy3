"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser, useOrganizationList } from "@clerk/nextjs";

export default function DashboardAuthWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isLoaded: isAuthLoaded, user } = useUser();
    const userId = user?.id;
    const [isLinking, setIsLinking] = useState(false);
    const [linkAttempted, setLinkAttempted] = useState(false);

    // Get user's Clerk organizations
    const { organizationList, isLoaded: isOrgListLoaded } = useOrganizationList({
        userMemberships: { infinite: true },
    });

    // Fetch user profile and organization
    const userProfile = useQuery(api.users.getUserProfile,
        userId ? { clerkUserId: userId } : "skip"
    );

    // We can also fetch the org directly if we have the ID from the profile
    const org = useQuery(api.organizations.getOrganizationById,
        userProfile?.orgId ? { orgId: userProfile.orgId } : "skip"
    );

    // Mutation to link user to org
    const linkUserToOrg = useMutation(api.users.linkUserToOrgAfterInvite);

    // Auto-link user to their Clerk organization if profile exists but has no orgId
    useEffect(() => {
        const autoLinkToOrg = async () => {
            console.log("🔗 Auto-link check:", {
                isAuthLoaded,
                isOrgListLoaded,
                linkAttempted,
                isLinking,
                hasProfile: !!userProfile,
                profileOrgId: userProfile?.orgId,
                orgListLength: organizationList?.length,
                orgList: organizationList?.map(m => ({ 
                    orgId: m.organization.id, 
                    orgName: m.organization.name,
                    role: m.membership.role 
                }))
            });

            if (!isAuthLoaded || !isOrgListLoaded || linkAttempted || isLinking) return;
            if (!userProfile || userProfile.orgId) return; // Profile doesn't exist or already has org
            
            // Check if user has any Clerk organizations
            const memberships = organizationList;
            if (!memberships || memberships.length === 0) {
                console.log("🔗 User has no Clerk organizations, cannot auto-link");
                setLinkAttempted(true);
                return;
            }

            // Use the first organization membership
            const firstMembership = memberships[0];
            const clerkOrgId = firstMembership.organization.id;
            const role = firstMembership.membership.role;

            console.log("🔗 Auto-linking user to Clerk organization:", {
                clerkOrgId,
                role,
                orgName: firstMembership.organization.name
            });

            setIsLinking(true);
            try {
                await linkUserToOrg({
                    clerkOrgId,
                    role: role === "org:admin" ? "admin" : "member",
                });
                console.log("✅ Auto-linked user to organization successfully!");
                // The query will automatically refetch and update the UI
            } catch (error) {
                console.error("❌ Failed to auto-link user to organization:", error);
            } finally {
                setIsLinking(false);
                setLinkAttempted(true);
            }
        };

        autoLinkToOrg();
    }, [isAuthLoaded, isOrgListLoaded, userProfile, organizationList, linkUserToOrg, linkAttempted, isLinking]);

    useEffect(() => {
        if (!isAuthLoaded) return;

        console.log("🔒 DashboardAuthWrapper check:", {
            isAuthLoaded,
            userId,
            user: user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress } : null,
            hasProfile: !!userProfile,
            orgId: userProfile?.orgId,
            clerkOrgs: organizationList?.map(m => m.organization.name)
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
    }, [isAuthLoaded, userId, userProfile, router, user, organizationList]);

    // Show loading if:
    // 1. Auth is not loaded
    // 2. User profile is loading (undefined)
    // 3. User profile exists but orgId is missing (syncing or auto-linking)
    const needsLoading = !isAuthLoaded || userProfile === undefined || 
        (userProfile && !userProfile.orgId && (!linkAttempted || isLinking));

    if (needsLoading) {
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

        const loadingMessage = !isAuthLoaded 
            ? "Checking authentication..." 
            : !userProfile 
            ? "Loading profile..." 
            : isLinking 
            ? "Linking you to your organization..." 
            : "Setting up your organization...";

        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">{loadingMessage}</p>
                </div>
            </div>
        );
    }

    // If link was attempted but failed and user still has no org, show create org option
    if (userProfile && !userProfile.orgId && linkAttempted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Welcome to Paragon Heavy</h1>
                        <p className="text-muted-foreground mt-2">
                            You need to be part of an organization to access the dashboard.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <button
                            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            onClick={() => router.push("/sign-up/tasks/create-organization")}
                        >
                            Create an Organization
                        </button>
                        <p className="text-sm text-muted-foreground">
                            Or ask an organization admin to invite you.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
