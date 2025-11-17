import { convexAuth } from "@convex-dev/auth/server";

// Clerk JWT verification - Clerk is the JWT issuer and verifier
// Convex will verify Clerk JWTs using the JWKS endpoint from the issuer domain

console.log("auth.config.js: Clerk JWT verification");
console.log("auth.config.js: CLERK_JWT_ISSUER_DOMAIN =", process.env.CLERK_JWT_ISSUER_DOMAIN);

const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!domain) {
  console.error("auth.config.js: MISSING CLERK_JWT_ISSUER_DOMAIN - auth will fail!");
}

const clerkProvider = {
  domain,
  applicationID: "convex", // Matches your Clerk JWT template 'name': 'convex'
  // TODO: If needed, change to template ID: 'jtmp_35cHby2MaraTJG2IbsBzf3quUfz' and test
};
console.log("auth.config.js: Clerk provider config:", JSON.stringify(clerkProvider));

export default convexAuth({
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
});