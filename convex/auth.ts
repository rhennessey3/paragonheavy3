import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";

export interface ClerkSessionClaim {
  aud: string;
  name: string;
  email: string;
  org_id: string;
  orgType: string;
  picture: string;
  nickname: string;
  "org.role": string;
  org_name: string;
  given_name: string;
  updated_at: string;
  email_verified: boolean;
  sub: string; // Clerk user ID is always in 'sub'
  iss: string;
  sid: string;
}

export async function getAuthSession(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<ClerkSessionClaim | null> {
  console.log("🔍 getAuthSession called");
  const identity = await ctx.auth.getUserIdentity();
  console.log("🔑 Identity retrieved:", {
    hasIdentity: !!identity,
    identityKeys: identity ? Object.keys(identity) : null,
    subject: identity?.subject,
    tokenIdentifier: identity?.tokenIdentifier,
    rawIdentity: identity
  });
  
  if (!identity) {
    console.log("❌ No identity found");
    return null;
  }
  
  // Log the raw identity structure to understand the mapping issue
  console.log("🔍 Raw identity structure:", JSON.stringify(identity, null, 2));
  
  // Map the identity fields to match ClerkSessionClaim interface
  const session: ClerkSessionClaim = {
    ...identity,
    sub: identity.subject, // Map subject to sub for compatibility
    aud: identity.tokenIdentifier?.split('|')[0] || 'convex',
    name: identity.name || '',
    email: identity.email || '',
    org_id: String(identity.org_id || ''),
    orgType: String(identity.orgType || ''),
    org_name: String(identity.org_name || ''),
    "org.role": String(identity['org.role'] || ''),
    picture: identity.pictureUrl || '',
    nickname: identity.name || '',
    given_name: identity.givenName || '',
    updated_at: identity.updatedAt || '',
    email_verified: identity.emailVerified || false,
    iss: identity.issuer || '',
    sid: '', // Not available in identity object
  };
  
  console.log("✅ Session created:", {
    sub: session.sub,
    email: session.email,
    name: session.name,
    sessionSubType: typeof session.sub
  });
  
  return session;
}

export async function requireAuthSession(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<ClerkSessionClaim> {
  const session = await getAuthSession(ctx);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}