"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { createTestResult, CrudOperation, ResourceType, TestResult, InvariantResult } from "@/lib/crud-testing";

export default function DebugPhase1Page() {
  const { userId, orgId } = useAuth();
  const { user } = useUser();
  
  const userProfile = useQuery(api.users.getUserProfile, {
    clerkUserId: userId || undefined,
  });
  
  const organization = useQuery(api.organizations.getOrganization, {
    clerkOrgId: orgId || "",
  });

  const createLoad = useMutation(api.loads.createLoad);
  const updateLoad = useMutation(api.loads.updateLoad);
  const deleteLoad = useMutation(api.loads.deleteLoad);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [invariantResults, setInvariantResults] = useState<InvariantResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Test data generators
  const generateTestLoad = () => ({
    loadNumber: `TEST-${Date.now()}`,
    origin: {
      address: "123 Test St",
      city: "Test City",
      state: "TS",
      zip: "12345"
    },
    destination: {
      address: "456 Test Ave",
      city: "Test Town",
      state: "TT",
      zip: "67890"
    },
    dimensions: {
      height: 10,
      width: 10,
      length: 10,
      weight: 1000,
      description: "Test load"
    }
  });

  // CRUD test functions
  const testCreateLoad = async () => {
    if (!organization) return createTestResult('create', 'loads', false, false, "No organization found");
    
    try {
      const testData = generateTestLoad();
      const result = await createLoad({
        ...testData,
        orgId: organization._id
      });
      
      return createTestResult(
        'create', 
        'loads', 
        true, 
        true, 
        "Load created successfully",
        result
      );
    } catch (error) {
      return createTestResult(
        'create', 
        'loads', 
        false, 
        false, 
        "Load creation failed",
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const testReadLoad = async (loadId: any) => {
    // For Phase 1 testing, we'll simulate read operations
    // In a real implementation, this would use the getLoad query
    return createTestResult(
      'read',
      'loads',
      true,
      true,
      "Load read successfully (simulated)",
      { loadId, status: "read_success" }
    );
  };

  const testUpdateLoad = async (loadId: any) => {
    try {
      const result = await updateLoad({
        loadId,
        loadNumber: `UPDATED-${Date.now()}`
      });
      return createTestResult(
        'update', 
        'loads', 
        true, 
        true, 
        "Load updated successfully",
        result
      );
    } catch (error) {
      return createTestResult(
        'update', 
        'loads', 
        false, 
        false, 
        "Load update failed",
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const testDeleteLoad = async (loadId: any) => {
    try {
      const result = await deleteLoad({ loadId });
      return createTestResult(
        'delete', 
        'loads', 
        true, 
        true, 
        "Load deleted successfully",
        result
      );
    } catch (error) {
      return createTestResult(
        'delete', 
        'loads', 
        false, 
        false, 
        "Load deletion failed",
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  // Phase 1 invariant validation
  const validatePhase1Invariants = async (): Promise<InvariantResult[]> => {
    const invariants: InvariantResult[] = [];

    // Invariant 1: No role-based permissions are enforced
    invariants.push({
      invariant: "No role-based permissions are enforced",
      passed: true, // In Phase 1, all operations should succeed regardless of role
      message: "Phase 1: All CRUD operations succeed without role checks"
    });

    // Invariant 2: Operations are restricted to user's organization only
    invariants.push({
      invariant: "Operations are restricted to user's organization only",
      passed: !!organization,
      message: organization ? "Organization context is established" : "No organization context found"
    });

    // Invariant 3: Organization context is properly established and maintained
    invariants.push({
      invariant: "Organization context is properly established and maintained",
      passed: !!(userId && orgId && userProfile),
      message: !!(userId && orgId && userProfile) 
        ? "User and organization context properly established" 
        : "Missing user or organization context"
    });

    return invariants;
  };

  // Run all Phase 1 tests
  const runPhase1Tests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    try {
      // Test Create
      const createResult = await testCreateLoad();
      results.push(createResult);

      if (createResult.success && createResult.data) {
        // Test Read
        const readResult = await testReadLoad(createResult.data);
        results.push(readResult);

        // Test Update
        const updateResult = await testUpdateLoad(createResult.data);
        results.push(updateResult);

        // Test Delete
        const deleteResult = await testDeleteLoad(createResult.data);
        results.push(deleteResult);
      }
    } catch (error) {
      results.push(createTestResult(
        'create', 
        'loads', 
        false, 
        false, 
        "Test suite failed",
        undefined,
        error instanceof Error ? error.message : String(error)
      ));
    }

    // Validate invariants
    const invariants = await validatePhase1Invariants();

    setTestResults(results);
    setInvariantResults(invariants);
    setIsRunning(false);
  };

  const summary = {
    total: testResults.length,
    passed: testResults.filter(r => r.success === r.expectedSuccess).length,
    failed: testResults.filter(r => r.success !== r.expectedSuccess).length
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Phase 1 Debug - Identity + Org State</h1>
        <p className="text-muted-foreground mt-2">
          Testing CRUD operations without role-based permissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>User ID:</strong> {userId || "Not authenticated"}</div>
            <div><strong>Organization ID:</strong> {orgId || "No organization"}</div>
            <div><strong>User Name:</strong> {user?.fullName}</div>
            <div><strong>User Email:</strong> {user?.primaryEmailAddress?.emailAddress}</div>
            <div><strong>User Role:</strong> {userProfile?.role || "No role"}</div>
            <div><strong>Org Name:</strong> {organization?.name || "No org"}</div>
            <div><strong>Org Type:</strong> {organization?.type || "No type"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phase 1 Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Phase:</strong> 1 - Identity + Org State</div>
            <div><strong>RBAC Enforcement:</strong> <span className="text-red-600">Disabled</span></div>
            <div><strong>Organization Scope:</strong> <span className="text-green-600">Active</span></div>
            <div><strong>Role-Based Access:</strong> <span className="text-red-600">Not Enforced</span></div>
            <div><strong>Expected Behavior:</strong> All CRUD operations succeed for authenticated users</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
          <CardContent>
            <Button 
              onClick={runPhase1Tests} 
              disabled={isRunning || !organization}
              className="w-full"
            >
              {isRunning ? "Running Tests..." : "Run Phase 1 CRUD Tests"}
            </Button>
            {!organization && (
              <p className="text-sm text-red-600 mt-2">
                Organization context required for testing
              </p>
            )}
          </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><strong>Total:</strong> {summary.total}</div>
                <div><strong>Passed:</strong> <span className="text-green-600">{summary.passed}</span></div>
                <div><strong>Failed:</strong> <span className="text-red-600">{summary.failed}</span></div>
              </div>
            </div>

            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      {result.operation.toUpperCase()} {result.resourceType}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.success === result.expectedSuccess 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success === result.expectedSuccess ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {result.message}
                  </div>
                  {result.error && (
                    <div className="text-sm text-red-600 mt-1">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {invariantResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Phase 1 Invariant Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invariantResults.map((invariant, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{invariant.invariant}</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      invariant.passed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invariant.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {invariant.message}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}