import { TestResult, PhaseTestResults, InvariantResult, TestPhase, PHASE_CONFIGS } from "@/lib/crud-testing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TestResultVisualizationProps {
  phaseResults: Record<TestPhase, PhaseTestResults>;
  selectedPhase?: TestPhase;
  onPhaseSelect?: (phase: TestPhase) => void;
}

export function TestResultVisualization({ phaseResults, selectedPhase, onPhaseSelect }: TestResultVisualizationProps) {
  const getOverallStats = () => {
    const allResults = Object.values(phaseResults).flatMap(phase => phase.results);
    const total = allResults.length;
    const passed = allResults.filter(r => r.success === r.expectedSuccess).length;
    const failed = total - passed;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    return { total, passed, failed, successRate };
  };

  const getPhaseStatus = (phaseResult: PhaseTestResults) => {
    const { passed, total } = phaseResult.summary;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    
    if (successRate >= 90) return { status: 'excellent', color: 'bg-green-100 text-green-800' };
    if (successRate >= 75) return { status: 'good', color: 'bg-blue-100 text-blue-800' };
    if (successRate >= 50) return { status: 'warning', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'critical', color: 'bg-red-100 text-red-800' };
  };

  const overallStats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{overallStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{overallStats.passed}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{overallStats.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{overallStats.successRate}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>

          {/* Success Rate Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-green-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${overallStats.successRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Phase Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((phase) => {
              const phaseResult = phaseResults[phase as TestPhase];
              if (!phaseResult) return null;
              
              const status = getPhaseStatus(phaseResult);
              const config = PHASE_CONFIGS[phase as TestPhase];
              
              return (
                <div 
                  key={phase}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPhase === phase ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onPhaseSelect?.(phase as TestPhase)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Phase {phase}</h3>
                    <Badge className={status.color}>
                      {status.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {config.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Tests:</span> {phaseResult.summary.total}
                    </div>
                    <div>
                      <span className="font-medium">Passed:</span> 
                      <span className="text-green-600">{phaseResult.summary.passed}</span>
                    </div>
                    <div>
                      <span className="font-medium">Failed:</span> 
                      <span className="text-red-600">{phaseResult.summary.failed}</span>
                    </div>
                    <div>
                      <span className="font-medium">Invariants:</span> 
                      {phaseResult.invariants.filter(inv => inv.passed).length}/{phaseResult.invariants.length}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Phase Results */}
      {selectedPhase && phaseResults[selectedPhase] && (
        <Card>
          <CardHeader>
            <CardTitle>
              Phase {selectedPhase}: {PHASE_CONFIGS[selectedPhase].name} - Detailed Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Test Results */}
              <div>
                <h4 className="font-semibold mb-3">CRUD Test Results</h4>
                <div className="space-y-2">
                  {phaseResults[selectedPhase].results.map((result, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {result.operation.toUpperCase()} {result.resourceType}
                        </span>
                        <Badge className={
                          result.success === result.expectedSuccess 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }>
                          {result.success === result.expectedSuccess ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {result.message}
                      </div>
                      {result.error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          <strong>Error:</strong> {result.error}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        Timestamp: {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invariant Results */}
              <div>
                <h4 className="font-semibold mb-3">Invariant Validation</h4>
                <div className="space-y-2">
                  {phaseResults[selectedPhase].invariants.map((invariant, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{invariant.invariant}</span>
                        <Badge className={
                          invariant.passed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }>
                          {invariant.passed ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {invariant.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phase Configuration */}
              <div>
                <h4 className="font-semibold mb-3">Phase Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium mb-2">Features</h5>
                    <ul className="text-sm space-y-1">
                      {PHASE_CONFIGS[selectedPhase].features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Permission Matrix</h5>
                    <div className="text-sm space-y-1">
                      {Object.entries(PHASE_CONFIGS[selectedPhase].permissions).map(([role, operations]) => (
                        <div key={role} className="flex items-center">
                          <span className="w-16 capitalize">{role}:</span>
                          <span className="text-green-600">
                            {operations.join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}