"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

// Add diagnostic logging
console.log("ConvexClientProvider: NEXT_PUBLIC_CONVEX_URL =", process.env.NEXT_PUBLIC_CONVEX_URL);
console.log("ConvexClientProvider: Initializing Convex client");

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Add connection state monitoring
let connectionAttempts = 0;
const maxConnectionAttempts = 5;

// Monitor connection state through the client's internal state
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
  if (args[0] && typeof args[0] === 'string' && args[0].includes('WebSocket')) {
    connectionAttempts++;
    if (connectionAttempts > maxConnectionAttempts) {
      console.error(`🚨 Too many WebSocket connection attempts (${connectionAttempts}). Possible configuration issue.`);
    }
  }
};

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}