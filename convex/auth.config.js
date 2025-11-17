import { convexAuth } from "@convex-dev/auth/server";
import { verifyToken } from "@clerk/backend";

const clerkAuth = {
  id: "clerk",
  authorize: async (token) => {
    try {
      // Verify the JWT token from Clerk
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      
      if (payload) {
        return {
          id: payload.sub,
          name: payload.first_name && payload.last_name 
            ? `${payload.first_name} ${payload.last_name}`
            : payload.username || payload.email,
          email: payload.email,
          image: payload.picture_url,
          orgId: payload.org_id, // Include organization ID from JWT
          orgRole: payload.org_role, // Include organization role from JWT
        };
      }
    } catch (error) {
      console.error("Error verifying Clerk token:", error);
      return null;
    }
    
    return null;
  },
};

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [clerkAuth],
});