import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function DebugAuthPage() {
  const { userId, orgId, sessionClaims } = await auth();
  
  let userMetadata = null;
  let orgMetadata = null;
  let orgData = null;

  if (userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      userMetadata = user.publicMetadata;

      if (orgId) {
        const org = await client.organizations.getOrganization({ organizationId: orgId });
        orgData = org;
        orgMetadata = org.publicMetadata;
      }
    } catch (e) {
      console.error("Failed to fetch user or org", e);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      
      <h2 className="text-xl font-semibold mt-4">Session Claims (from Token)</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Note: If orgType is missing here, it means it's not in the Clerk <strong>Session Token</strong> configuration.
        The "convex" JWT template is separate.
      </p>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify({ userId, orgId, sessionClaims }, null, 2)}
      </pre>

      <h2 className="text-xl font-semibold mt-4">User Metadata (from API)</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(userMetadata, null, 2)}
      </pre>

      <h2 className="text-xl font-semibold mt-4">Organization Metadata (from API)</h2>
      <p className="text-sm text-muted-foreground mb-2">
        This is fetched directly from Clerk's backend API. If <strong>type</strong> is present here but missing from Session Claims,
        you need to add <code>orgType</code> (mapped to <code>{"{{org.public_metadata.type}}"}</code>) to your Clerk Session Token template.
      </p>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(orgMetadata, null, 2)}
      </pre>
      
      <details className="mt-2">
        <summary className="text-sm cursor-pointer text-blue-600">Full Organization Object</summary>
        <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs mt-2">
          {JSON.stringify(orgData, null, 2)}
        </pre>
      </details>

      <div className="mt-4">
        <p>If you see this page, routing is working.</p>
        <p>UserId: {userId ? "Present" : "Missing"}</p>
        <p>OrgId: {orgId ? "Present" : "Missing"}</p>
      </div>
    </div>
  );
}