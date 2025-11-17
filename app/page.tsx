import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Paragon Heavy
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Heavy haul logistics platform connecting shippers, carriers, and escorts for seamless transportation management.
          </p>
          
          <SignedOut>
            <div className="space-x-4">
              <Link 
                href="/sign-in"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </SignedOut>
          
          <SignedIn>
            <div className="flex items-center justify-center space-x-4">
              <Link 
                href="/dashboard"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">For Shippers</h3>
            <p className="text-gray-600">
              Create loads, track shipments, and manage your heavy haul transportation needs.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-green-600 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">For Carriers</h3>
            <p className="text-gray-600">
              Find available loads, manage assignments, and optimize your fleet operations.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-purple-600 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">For Escorts</h3>
            <p className="text-gray-600">
              Provide escort services, track assignments, and ensure safe transport.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}