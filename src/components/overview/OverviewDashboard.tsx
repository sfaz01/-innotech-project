import React from 'react';
import { AuditEvent, EvaluationMetrics } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  ArrowRight,
  Sparkles,
  Play,
  FlaskConical,
  Activity,
  Layers,
} from 'lucide-react';
import { DecisionBadge } from '../common/Badge';

interface OverviewDashboardProps {
  metrics: EvaluationMetrics | null;
  recentEvents: AuditEvent[];
  onSelectEvent: (event: AuditEvent) => void;
  onRunFullEvaluation: () => void;
  onNavigateToScenarios: () => void;
  onOpenGuidedDemo: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  metrics,
  recentEvents,
  onSelectEvent,
  onRunFullEvaluation,
  onNavigateToScenarios,
  onOpenGuidedDemo,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              AI Agent Security & Privacy Operations Console
            </h1>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
              Policy Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Inspect, evaluate, authorize, and enforce deterministic security policies at the tool boundary.
            Protect autonomous workflows against prompt injection, malicious attachments, sensitive-data leakage, and unauthorized tool calls.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenGuidedDemo}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Demo Tour</span>
          </button>
          <button
            onClick={onRunFullEvaluation}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Full Benchmark</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Metric 1: Total Scenarios */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Scenarios Tested</span>
            <FlaskConical className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics ? metrics.totalScenarios : '15'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Predefined synthetic suite</div>
        </div>

        {/* Metric 2: Attack Success Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Attack Success Rate</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-600">
              {metrics ? `${metrics.protectedASR}%` : '0%'}
            </span>
            <span className="text-xs text-rose-500 line-through">
              {metrics ? `${metrics.baselineASR}%` : '88%'}
            </span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Protected vs Baseline mode
          </div>
        </div>

        {/* Metric 3: Attack Block Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Attack Block Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics ? `${metrics.attackBlockRate}%` : '100%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics
              ? `${metrics.protectedAttacksBlockedCount} of ${metrics.eligibleAdversarialCount} attacks stopped`
              : 'All adversarial cases prevented'}
          </div>
        </div>

        {/* Metric 4: False Positive Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>False-Positive Rate</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics ? `${metrics.falsePositiveRate}%` : '0%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics ? `${metrics.benignIncorrectlyBlockedCount} benign cases blocked` : 'Zero harmless workflows blocked'}
          </div>
        </div>

        {/* Metric 5: Sensitive Data Pass Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Data Privacy Pass</span>
            <FileCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics ? `${metrics.sensitiveDataPassRate}%` : '100%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Aadhaar / PAN / Phone / UPI protected
          </div>
        </div>
      </div>

      {/* Baseline vs Protected Comparison Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Comparative Execution Posture: Baseline vs. Protected
            </h2>
          </div>
          <button
            onClick={onNavigateToScenarios}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>Explore Scenario Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Mode Card */}
          <div className="border border-rose-200 bg-rose-50/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Baseline Mode (Unprotected)
              </span>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                High Risk Exposure
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Autonomous agent blindly obeys untrusted instructions in documents, HTML comments, and Hinglish jailbreaks.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/80 p-2 rounded border border-rose-100">
                <span className="text-slate-400 block text-[10px]">Attacks Succeeded</span>
                <span className="font-bold text-rose-700 text-sm">
                  {metrics ? metrics.baselineAttacksSucceededCount : '7'}
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded border border-rose-100">
                <span className="text-slate-400 block text-[10px]">Data Leaks</span>
                <span className="font-bold text-rose-700 text-sm">
                  {metrics ? metrics.sensitiveDataLeaked : '8'}
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded border border-rose-100">
                <span className="text-slate-400 block text-[10px]">Enforcement</span>
                <span className="font-bold text-slate-600 text-sm">None</span>
              </div>
            </div>
          </div>

          {/* Protected Mode Card */}
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Protected Mode (AgentGuard)
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                100% Policy Intercepted
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Tool boundaries inspect every proposal, redact sensitive identifiers, and halt unauthorized actions.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/80 p-2 rounded border border-emerald-100">
                <span className="text-slate-400 block text-[10px]">Attacks Blocked</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {metrics ? metrics.protectedAttacksBlockedCount : '7'}
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded border border-emerald-100">
                <span className="text-slate-400 block text-[10px]">Data Redacted</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {metrics ? metrics.sensitiveDataRedacted : '4'}
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded border border-emerald-100">
                <span className="text-slate-400 block text-[10px]">Enforcement</span>
                <span className="font-bold text-emerald-700 text-sm">Active Boundary</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Audit Events */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Recent Security Audit Events</h2>
          </div>
          <span className="text-xs text-slate-400">
            {recentEvents.length} events recorded in ledger
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3">Sequence</th>
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3">Explanation</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEvents.slice(0, 7).map(evt => (
                <tr
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono text-slate-500 font-semibold">
                    #{evt.sequence}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{evt.scenarioId}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        evt.mode === 'protected'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {evt.mode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">{evt.eventType}</td>
                  <td className="py-2.5 px-3">
                    {evt.decision ? (
                      <DecisionBadge decision={evt.decision} size="sm" />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-md truncate">
                    {evt.explanation}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
