import { AuthConfig } from "convex/server";

// Convex Auth Configuration for Clerk JWT Verification
// This file tells Convex how to verify JWT tokens from Clerk
// The CLERK_JWT_ISSUER_DOMAIN must be set in the Convex Dashboard

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;