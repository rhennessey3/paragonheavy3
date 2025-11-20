"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function DebugAuthInfo() {
  const { userId, orgId, getToken, sessionClaims } = useAuth();
  const [convexTokenClaims, setConvexTokenClaims] = useState<any>(null);
  const [defaultTokenClaims, setDefaultTokenClaims] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTokens = async () => {
    if (!userId) return;
    
    try {
      // Fetch Convex Token
      const convexToken = await getToken({ template: "convex" });
      if (convexToken) {
        const payload = JSON.parse(atob(convexToken.split('.')[1]));
        setConvexTokenClaims(payload);
      }

      // Fetch Default Session Token
      const defaultToken = await getToken();
      if (defaultToken) {
        const payload = JSON.parse(atob(defaultToken.split('.')[1]));
        setDefaultTokenClaims(payload);
      }
      
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch tokens", e);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [getToken, userId]);

  if (!userId) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        <div className="flex gap-2">
          <button
            onClick={fetchTokens}
            className="bg-slate-700 text-white px-3 py-2 rounded-full shadow-lg text-xs font-mono mb-2 hover:bg-slate-600 transition-colors"
            title="Refresh Tokens"
          >
            ↻
          </button>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg text-xs font-mono mb-2 hover:bg-slate-800 transition-colors"
          >
            {isVisible ? "Hide Auth Debug" : "Show Auth Debug"}
          </button>
        </div>
      </div>
      
      {isVisible && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xl w-[600px] max-h-[80vh] overflow-auto text-xs pointer-events-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="font-bold text-sm">Auth Debugger</h2>
                <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-[10px]">Updated: {lastUpdated.toLocaleTimeString()}</span>
                    <div className="text-slate-500">
                        {userId ? <span className="text-green-600">● Authenticated</span> : <span className="text-red-600">● Signed Out</span>}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-1 text-slate-700">Current Context</h3>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border">
                        <div>
                            <span className="text-slate-500 block">User ID</span>
                            <span className="font-mono">{userId}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Org ID</span>
                            <span className="font-mono">{orgId || "None"}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <h3 className="font-semibold mb-1 text-slate-700">Default Session Token (Decoded)</h3>
                      <p className="text-[10px] text-slate-500 mb-1">Raw JWT content from getToken()</p>
                      <pre className="bg-slate-900 text-slate-50 p-3 rounded overflow-auto max-h-64 font-mono text-[10px]">
                          {defaultTokenClaims ? JSON.stringify(defaultTokenClaims, null, 2) : "Loading..."}
                      </pre>
                  </div>

                  <div>
                      <h3 className="font-semibold mb-1 text-slate-700">Convex Token Claims</h3>
                      <p className="text-[10px] text-slate-500 mb-1">getToken({'{'} template: "convex" {'}'})</p>
                      <pre className="bg-slate-900 text-slate-50 p-3 rounded overflow-auto max-h-64 font-mono text-[10px]">
                          {convexTokenClaims ? JSON.stringify(convexTokenClaims, null, 2) : "Loading..."}
                      </pre>
                  </div>
                </div>

                <div>
                    <h3 className="font-semibold mb-1 text-slate-700">useAuth().sessionClaims</h3>
                    <p className="text-[10px] text-slate-500 mb-1">Object provided by Clerk React SDK</p>
                    <pre className="bg-slate-100 text-slate-700 p-3 rounded overflow-auto max-h-32 font-mono text-[10px]">
                        {JSON.stringify(sessionClaims, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}