import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Sign In</h1>
        <p className="mt-2 text-muted-foreground">Welcome back to Paragon Heavy</p>
      </div>
      
      <SignIn 
        redirectUrl="/dashboard"
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm normal-case",
            card: "shadow-lg",
          },
        }}
      />
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link 
            href="/sign-up" 
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}