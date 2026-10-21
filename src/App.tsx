import React, { useState, useEffect } from 'react';
import {
  AuditEvent,
  DualExecutionComparison,
  EvaluationMetrics,
  ExecutionMode,
  ExecutionResult,
  PolicyRule,
  Scenario,
} from './types';
import { BENCHMARK_SCENARIOS } from './data/scenarios';
import { DEFAULT_POLICIES } from './data/defaultPolicies';
import { runScenario, runDualExecution } from './engine/scenarioRunner';
import { runFullEvaluation } from './engine/evaluationEngine';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { AuditInspectorDrawer } from './components/layout/AuditInspectorDrawer';
import { OverviewDashboard } from './components/overview/OverviewDashboard';
import { ScenarioLab } from './components/scenarioLab/ScenarioLab';
import { AttackExplorer } from './components/attackExplorer/AttackExplorer';
import { PolicyCenter } from './components/policyCenter/PolicyCenter';
import { EvaluationBenchmarks } from './components/evaluation/EvaluationBenchmarks';
import { AuditLogs } from './components/auditLogs/AuditLogs';
import { ReportsView } from './components/reports/ReportsView';
import { GuidedDemoModal } from './components/demo/GuidedDemoModal';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [scenarios, setScenarios] = useState<Scenario[]>(BENCHMARK_SCENARIOS);
  const [policies, setPolicies] = useState<PolicyRule[]>(DEFAULT_POLICIES);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(BENCHMARK_SCENARIOS[2]); // SCN-003 Hinglish Jailbreak
  const [dualResults, setDualResults] = useState<Record<string, DualExecutionComparison>>({});
  const [allAuditEvents, setAllAuditEvents] = useState<AuditEvent[]>([]);
  const [evaluationMetrics, setEvaluationMetrics] = useState<EvaluationMetrics | null>(null);
  const [selectedAuditEvent, setSelectedAuditEvent] = useState<AuditEvent | null>(null);
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState(false);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);

  // Initial benchmark run on app load to populate operational stats & audit trail
  useEffect(() => {
    const initialMetrics = runFullEvaluation(scenarios, policies);
    setEvaluationMetrics(initialMetrics);

    // Run dual comparison for the default scenario so it's ready immediately
    const initialDual = runDualExecution(selectedScenario, policies);
    setDualResults({ [selectedScenario.id]: initialDual });

    // Populate initial audit events from the initial run
    const events = [...initialDual.protected.auditEvents, ...initialDual.baseline.auditEvents];
    setAllAuditEvents(events);
  }, []);

  // Run a scenario in single mode
  const handleRunScenario = (
    scenario: Scenario,
    mode: ExecutionMode,
    options?: { humanApprovedReview?: boolean }
  ): ExecutionResult => {
    const result = runScenario(scenario, mode, policies, options);
    setAllAuditEvents(prev => [...result.auditEvents, ...prev]);
    return result;
  };

  // Run dual execution side-by-side
  const handleRunDual = (
    scenario: Scenario,
    options?: { humanApprovedReview?: boolean }
  ): DualExecutionComparison => {
    const comparison = runDualExecution(scenario, policies);

    if (options?.humanApprovedReview) {
      // Re-run protected mode with approval
      const approvedProtected = runScenario(scenario, 'protected', policies, {
        humanApprovedReview: true,
      });
      comparison.protected = approvedProtected;
    }

    setDualResults(prev => ({
      ...prev,
      [scenario.id]: comparison,
    }));

    setAllAuditEvents(prev => [
      ...comparison.protected.auditEvents,
      ...comparison.baseline.auditEvents,
      ...prev,
    ]);

    return comparison;
  };

  // Run full evaluation suite
  const handleRunFullBenchmark = () => {
    setIsRunningBenchmark(true);
    setTimeout(() => {
      const metrics = runFullEvaluation(scenarios, policies);
      setEvaluationMetrics(metrics);

      // Collect all audit events from running scenarios
      const freshEvents: AuditEvent[] = [];
      for (const scn of scenarios) {
        const dual = runDualExecution(scn, policies);
        freshEvents.push(...dual.protected.auditEvents, ...dual.baseline.auditEvents);
      }
      setAllAuditEvents(freshEvents);
      setIsRunningBenchmark(false);
    }, 250);
  };

  // Policy management
  const handleTogglePolicy = (policyId: string) => {
    const updated = policies.map(p => (p.id === policyId ? { ...p, enabled: !p.enabled } : p));
    setPolicies(updated);

    // Re-run active scenario dual comparison if available
    const freshDual = runDualExecution(selectedScenario, updated);
    setDualResults(prev => ({
      ...prev,
      [selectedScenario.id]: freshDual,
    }));

    // Update evaluation metrics
    const freshMetrics = runFullEvaluation(scenarios, updated);
    setEvaluationMetrics(freshMetrics);
  };

  const handleAddPolicy = (newPolicy: PolicyRule) => {
    const updated = [newPolicy, ...policies];
    setPolicies(updated);
    const freshMetrics = runFullEvaluation(scenarios, updated);
    setEvaluationMetrics(freshMetrics);
  };

  const handleResetPolicies = () => {
    setPolicies(DEFAULT_POLICIES);
    const freshMetrics = runFullEvaluation(scenarios, DEFAULT_POLICIES);
    setEvaluationMetrics(freshMetrics);
  };

  // Custom scenario creation
  const handleCreateCustomScenario = (newScenario: Scenario) => {
    const updated = [newScenario, ...scenarios];
    setScenarios(updated);
    setSelectedScenario(newScenario);
    const dual = runDualExecution(newScenario, policies);
    setDualResults(prev => ({ ...prev, [newScenario.id]: dual }));
    setAllAuditEvents(prev => [...dual.protected.auditEvents, ...dual.baseline.auditEvents, ...prev]);
    setActiveTab('scenarios');
  };

  // Reset entire application state
  const handleResetAllState = () => {
    setScenarios(BENCHMARK_SCENARIOS);
    setPolicies(DEFAULT_POLICIES);
    setSelectedScenario(BENCHMARK_SCENARIOS[2]);
    const initialDual = runDualExecution(BENCHMARK_SCENARIOS[2], DEFAULT_POLICIES);
    setDualResults({ [BENCHMARK_SCENARIOS[2].id]: initialDual });
    setAllAuditEvents([
      ...initialDual.protected.auditEvents,
      ...initialDual.baseline.auditEvents,
    ]);
    const metrics = runFullEvaluation(BENCHMARK_SCENARIOS, DEFAULT_POLICIES);
    setEvaluationMetrics(metrics);
  };

  // Human-in-the-loop review actions
  const handleApproveReview = (actionId: string) => {
    handleRunDual(selectedScenario, { humanApprovedReview: true });
  };

  const handleRejectReview = (actionId: string) => {
    // Action remains blocked
    handleRunDual(selectedScenario);
  };

  const currentDual =
    dualResults[selectedScenario.id] || runDualExecution(selectedScenario, policies);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172033] flex flex-col font-sans">
      {/* Top Application Bar */}
      <Navbar
        onRunFullBenchmark={handleRunFullBenchmark}
        onOpenGuidedDemo={() => setIsGuidedDemoOpen(true)}
        isRunningBenchmark={isRunningBenchmark}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Persistent Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          scenarioCount={scenarios.length}
          activePolicyCount={policies.filter(p => p.enabled).length}
          auditCount={allAuditEvents.length}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewDashboard
              metrics={evaluationMetrics}
              recentEvents={allAuditEvents}
              onSelectEvent={setSelectedAuditEvent}
              onRunFullEvaluation={handleRunFullBenchmark}
              onNavigateToScenarios={() => setActiveTab('scenarios')}
              onOpenGuidedDemo={() => setIsGuidedDemoOpen(true)}
            />
          )}

          {activeTab === 'scenarios' && (
            <ScenarioLab
              scenarios={scenarios}
              activePolicies={policies}
              selectedScenario={selectedScenario}
              onSelectScenario={s => {
                setSelectedScenario(s);
                if (!dualResults[s.id]) {
                  const d = runDualExecution(s, policies);
                  setDualResults(prev => ({ ...prev, [s.id]: d }));
                }
              }}
              onRunScenario={handleRunScenario}
              onRunDual={handleRunDual}
              onCreateCustomScenario={handleCreateCustomScenario}
              dualResult={currentDual}
              onApproveReview={handleApproveReview}
              onRejectReview={handleRejectReview}
            />
          )}

          {activeTab === 'attack_explorer' && (
            <AttackExplorer
              scenario={selectedScenario}
              dualResult={currentDual}
              onSelectScenario={s => {
                setSelectedScenario(s);
                if (!dualResults[s.id]) {
                  const d = runDualExecution(s, policies);
                  setDualResults(prev => ({ ...prev, [s.id]: d }));
                }
              }}
              allScenarios={scenarios}
            />
          )}

          {activeTab === 'policies' && (
            <PolicyCenter
              policies={policies}
              onTogglePolicy={handleTogglePolicy}
              onAddPolicy={handleAddPolicy}
              onResetPolicies={handleResetPolicies}
              scenarios={scenarios}
            />
          )}

          {activeTab === 'evaluation' && (
            <EvaluationBenchmarks
              metrics={evaluationMetrics}
              onRunBenchmark={handleRunFullBenchmark}
              isRunningBenchmark={isRunningBenchmark}
              policies={policies}
              scenarios={scenarios}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogs events={allAuditEvents} onSelectEvent={setSelectedAuditEvent} />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              metrics={evaluationMetrics}
              auditEvents={allAuditEvents}
              policies={policies}
              scenarios={scenarios}
              onResetAllState={handleResetAllState}
            />
          )}
        </main>
      </div>

      {/* Right Contextual Audit Evidence Drawer */}
      <AuditInspectorDrawer
        event={selectedAuditEvent}
        onClose={() => setSelectedAuditEvent(null)}
      />

      {/* Guided Attack Presentation Walkthrough */}
      <GuidedDemoModal
        isOpen={isGuidedDemoOpen}
        onClose={() => setIsGuidedDemoOpen(false)}
        onNavigateToTab={setActiveTab}
        onSelectScenario={setSelectedScenario}
        sampleScenario={scenarios[2]} // SCN-003 Hinglish Exfiltration
        onRunDual={handleRunDual}
        onRunBenchmark={handleRunFullBenchmark}
      />
    </div>
  );
}

export default App;
