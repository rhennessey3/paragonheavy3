import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Paragon Heavy
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Heavy haul logistics platform connecting shippers, carriers, and escorts for seamless transportation management.
          </p>
          
          <SignedOut>
            <div className="flex items-center justify-center space-x-4">
              <Button asChild>
                <Link href="/sign-in">
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sign-up">
                  Get Started
                </Link>
              </Button>
            </div>
          </SignedOut>
          
          <SignedIn>
            <div className="flex items-center justify-center space-x-4">
              <Button asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <div className="w-6 h-6 bg-primary rounded"></div>
              </div>
              <CardTitle className="text-lg">For Shippers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create loads, track shipments, and manage your heavy haul transportation needs.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                <div className="w-6 h-6 bg-secondary-foreground rounded"></div>
              </div>
              <CardTitle className="text-lg">For Carriers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Find available loads, manage assignments, and optimize your fleet operations.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                <div className="w-6 h-6 bg-accent-foreground rounded"></div>
              </div>
              <CardTitle className="text-lg">For Escorts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Provide escort services, track assignments, and ensure safe transport.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}