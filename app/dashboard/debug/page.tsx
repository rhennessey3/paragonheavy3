"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { useUser } from "@clerk/nextjs";

export default function DebugPage() {
    const { getToken, isLoaded, isSignedIn, userId, sessionId } = useAuth();
    const { user, isLoaded: isUserLoaded, isSignedIn: isUserSignedIn } = useUser();
    const [tokenStatus, setTokenStatus] = useState<string>("Checking...");
    const debugState = useQuery(api.debug_state.debugState);

    useEffect(() => {
        async function checkToken() {
            if (!isLoaded) return;
            if (!isSignedIn) {
                setTokenStatus("Not signed in");
                return;
            }
            try {
                const token = await getToken({ template: "convex" });
                setTokenStatus(token ? "Token received (length: " + token.length + ")" : "No token received (check Clerk JWT template)");
            } catch (e: any) {
                setTokenStatus("Error fetching token: " + e.message);
            }
        }
        checkToken();
    }, [isLoaded, isSignedIn, getToken]);

    if (debugState === undefined) {
        return <div>Loading debug info...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug State</h1>
            <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
                <p><strong>Clerk Auth Status:</strong> {isLoaded ? (isSignedIn ? "Signed In" : "Signed Out") : "Loading..."}</p>
                <p><strong>User ID (useAuth):</strong> {userId || "None"}</p>
                <p><strong>Session ID (useAuth):</strong> {sessionId || "None"}</p>
                <hr className="my-2" />
                <p><strong>User Status (useUser):</strong> {isUserLoaded ? (isUserSignedIn ? "Signed In" : "Signed Out") : "Loading..."}</p>
                <p><strong>User ID (useUser):</strong> {user?.id || "None"}</p>
                <p><strong>User Email:</strong> {user?.primaryEmailAddress?.emailAddress || "None"}</p>
                <hr className="my-2" />
                <p><strong>Convex Token Status:</strong> {tokenStatus}</p>
            </div>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugState, null, 2)}
            </pre>
        </div>
    );
}
