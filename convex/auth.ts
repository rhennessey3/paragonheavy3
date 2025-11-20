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
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return identity as unknown as ClerkSessionClaim;
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