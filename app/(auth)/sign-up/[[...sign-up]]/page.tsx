"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Sign Up</h1>
        <p className="mt-2 text-muted-foreground">Create your Paragon Heavy account</p>
      </div>
      
      <SignUp
        forceRedirectUrl="/sign-up/tasks/create-organization"
        redirectUrl="/sign-up/tasks/create-organization"
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm normal-case",
            card: "shadow-lg",
          },
        }}
      />
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link 
            href="/sign-in" 
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}