// Core CRUD testing framework types and utilities

export type CrudOperation = 'create' | 'read' | 'update' | 'delete';
export type ResourceType = 'loads' | 'userProfiles' | 'organizations';
export type TestPhase = 1 | 2 | 3 | 4 | 5 | 6;

export interface TestResult {
  operation: CrudOperation;
  resourceType: ResourceType;
  success: boolean;
  expectedSuccess: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface PhaseTestResults {
  phase: TestPhase;
  results: TestResult[];
  invariants: InvariantResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    passedExpected: number;
    failedExpected: number;
    unexpectedSuccess: number;
    unexpectedFailure: number;
  };
}

export interface InvariantResult {
  invariant: string;
  passed: boolean;
  message: string;
  details?: any;
}

export interface PhaseConfig {
  phase: TestPhase;
  name: string;
  description: string;
  invariants: string[];
  permissions: {
    admin: CrudOperation[];
    manager: CrudOperation[];
    operator: CrudOperation[];
  };
  features: string[];
}

export const PHASE_CONFIGS: Record<TestPhase, PhaseConfig> = {
  1: {
    phase: 1,
    name: "Identity + Org State",
    description: "Authentication and organization context without role-based permissions",
    invariants: [
      "No role-based permissions are enforced",
      "Operations are restricted to user's organization only",
      "Organization context is properly established and maintained"
    ],
    permissions: {
      admin: ['create', 'read', 'update', 'delete'],
      manager: ['create', 'read', 'update', 'delete'],
      operator: ['create', 'read', 'update', 'delete']
    },
    features: ["Organization CRUD", "User authentication", "Context switching"]
  },
  2: {
    phase: 2,
    name: "Roles State",
    description: "Roles exist purely as data without affecting access control",
    invariants: [
      "Roles exist purely as data without affecting access control",
      "Role data is properly stored and retrievable",
      "Role-based permissions are NOT enforced"
    ],
    permissions: {
      admin: ['create', 'read', 'update', 'delete'],
      manager: ['create', 'read', 'update', 'delete'],
      operator: ['create', 'read', 'update', 'delete']
    },
    features: ["Role data management", "Role assignment", "Role vocabulary"]
  },
  3: {
    phase: 3,
    name: "Permissions State",
    description: "Role-based permissions are actively enforced",
    invariants: [
      "Role-based permissions are enforced for all CRUD operations",
      "Admin users can create, read, update, delete",
      "Manager users can create, read, update but NOT delete",
      "Operator users can read only but NOT create, update, delete"
    ],
    permissions: {
      admin: ['create', 'read', 'update', 'delete'],
      manager: ['create', 'read', 'update'],
      operator: ['read']
    },
    features: ["RBAC enforcement", "Permission checking", "Role-based access control"]
  },
  4: {
    phase: 4,
    name: "Global Discovery State",
    description: "Global discovery tables with read-only access",
    invariants: [
      "All Phase 3 permission enforcement is maintained",
      "Global access is read-only without subscription logic",
      "Global records are linked to owning organizations"
    ],
    permissions: {
      admin: ['create', 'read', 'update', 'delete'],
      manager: ['create', 'read', 'update'],
      operator: ['read']
    },
    features: ["Global discovery tables", "Cross-organization browsing", "Read-only global access"]
  },
  5: {
    phase: 5,
    name: "Subscription State",
    description: "Subscription-based access control for global resources",
    invariants: [
      "All Phase 3-4 behaviors are maintained",
      "Subscription-based access control is enforced",
      "Explicit access levels are properly enforced"
    ],
    permissions: {
      admin: ['create', 'read', 'update', 'delete'],
      manager: ['create', 'read', 'update'],
      operator: ['read']
    },
    features: ["Subscription management", "Access level enforcement", "Global resource access control"]
  },
  6: {
    phase: 6,
    name: "ACL State",
    description: "ACL-based explicit cross-organization sharing",
    invariants: [
      "All Phase 3-5 behaviors are maintained",
      "ACL-based access is enforced for cross-organization sharing",
      "Hierarchical permission levels and expiration model"
    ],
    permissions: {
      admin: ['create', 'read', 'update', 'delete'],
      manager: ['create', 'read', 'update'],
      operator: ['read']
    },
    features: ["ACL management", "Cross-organization sharing", "Hierarchical permissions"]
  }
};

export function getExpectedOperations(phase: TestPhase, role: 'admin' | 'manager' | 'operator'): CrudOperation[] {
  return PHASE_CONFIGS[phase].permissions[role];
}

export function shouldOperationSucceed(phase: TestPhase, role: 'admin' | 'manager' | 'operator', operation: CrudOperation): boolean {
  const expectedOps = getExpectedOperations(phase, role);
  return expectedOps.includes(operation);
}

export function createTestResult(
  operation: CrudOperation,
  resourceType: ResourceType,
  success: boolean,
  expectedSuccess: boolean,
  message: string,
  data?: any,
  error?: string
): TestResult {
  return {
    operation,
    resourceType,
    success,
    expectedSuccess,
    message,
    data,
    error,
    timestamp: Date.now()
  };
}

export function calculateSummary(results: TestResult[]) {
  const total = results.length;
  const passed = results.filter(r => r.success === r.expectedSuccess).length;
  const failed = total - passed;
  const passedExpected = results.filter(r => r.success && r.expectedSuccess).length;
  const failedExpected = results.filter(r => !r.success && !r.expectedSuccess).length;
  const unexpectedSuccess = results.filter(r => r.success && !r.expectedSuccess).length;
  const unexpectedFailure = results.filter(r => !r.success && r.expectedSuccess).length;

  return {
    total,
    passed,
    failed,
    passedExpected,
    failedExpected,
    unexpectedSuccess,
    unexpectedFailure
  };
}