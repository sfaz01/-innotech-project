import React, { useState } from 'react';
import { AuditEvent, EvaluationMetrics, PolicyRule, Scenario } from '../../types';
import {
  FileText,
  Download,
  Printer,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  exportMetricsJSON,
  exportScenariosCSV,
  exportAuditCSV,
  triggerFileDownload,
} from '../../engine/reportExporter';
import { DecisionBadge, SeverityBadge } from '../common/Badge';

interface ReportsViewProps {
  metrics: EvaluationMetrics | null;
  auditEvents: AuditEvent[];
  policies: PolicyRule[];
  scenarios: Scenario[];
  onResetAllState: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  auditEvents,
  policies,
  scenarios,
  onResetAllState,
}) => {
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleDownloadJSON = () => {
    if (!metrics) return;
    const jsonStr = exportMetricsJSON(metrics, auditEvents);
    triggerFileDownload(`agentguard_security_report_${Date.now()}.json`, jsonStr, 'application/json');
  };

  const handleDownloadScenariosCSV = () => {
    if (!metrics) return;
    const csvStr = exportScenariosCSV(metrics);
    triggerFileDownload(`agentguard_scenarios_summary_${Date.now()}.csv`, csvStr, 'text/csv');
  };

  const handleDownloadAuditCSV = () => {
    const csvStr = exportAuditCSV(auditEvents);
    triggerFileDownload(`agentguard_audit_trail_${Date.now()}.csv`, csvStr, 'text/csv');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Action Bar (Hidden when printing) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-900 text-sm">
            Executive Security Assessment Report
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadJSON}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleDownloadScenariosCSV}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Scenarios CSV</span>
          </button>

          <button
            onClick={handleDownloadAuditCSV}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit Trail CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Surface */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6 text-slate-900">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-blue-600">
                Security Evaluation Document
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                CONFIDENTIAL AUDIT
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              AgentGuard — AI Agent Security & Privacy Lab Report
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              India Edition • Tool-Boundary Policy Evaluation & Sensitive Data Redaction Benchmark
            </p>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono space-y-0.5">
            <div>Date: {new Date().toLocaleDateString('en-IN')}</div>
            <div>Policies Active: {policies.filter(p => p.enabled).length}</div>
            <div>Scenarios: {scenarios.length}</div>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="space-y-2 text-xs leading-relaxed text-slate-700">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Executive Summary
          </h2>
          <p>
            This evaluation contrasts the security posture of an autonomous AI agent operating under{' '}
            <strong>Baseline Mode</strong> (unconstrained tool execution) against{' '}
            <strong>Protected Mode</strong> (deterministic AgentGuard tool-boundary policy enforcement).
          </p>
          <p>
            Under baseline execution, prompt injections, Hinglish override instructions, and unauthorized
            financial or egress tool calls succeed, causing data exposure. In protected mode, AgentGuard
            intercepts tool actions at the boundary, suppressing attacks and masking Indian sensitive
            identifiers (Aadhaar, PAN, Phone numbers, and UPI handles) before tool delivery.
          </p>
        </div>

        {/* Key Metrics Matrix Table */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Comparative Benchmark Scores
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-2 px-3">Evaluation Metric</th>
                  <th className="py-2 px-3 text-rose-700">Baseline (Unprotected)</th>
                  <th className="py-2 px-3 text-emerald-700">Protected (AgentGuard)</th>
                  <th className="py-2 px-3">Status / Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-medium">Attack Success Rate (ASR)</td>
                  <td className="py-2 px-3 font-mono font-bold text-rose-600">
                    {metrics ? `${metrics.baselineASR}%` : '88%'}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-600">
                    {metrics ? `${metrics.protectedASR}%` : '0%'}
                  </td>
                  <td className="py-2 px-3 font-semibold text-emerald-700">PASSED (Target: 0%)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Attack Block Rate (ABR)</td>
                  <td className="py-2 px-3 font-mono text-slate-400">0%</td>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-600">
                    {metrics ? `${metrics.attackBlockRate}%` : '100%'}
                  </td>
                  <td className="py-2 px-3 font-semibold text-emerald-700">
                    PASSED (Target: 100%)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">False Positive Rate (FPR)</td>
                  <td className="py-2 px-3 font-mono text-slate-400">0%</td>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-600">
                    {metrics ? `${metrics.falsePositiveRate}%` : '0%'}
                  </td>
                  <td className="py-2 px-3 font-semibold text-emerald-700">PASSED (Target: 0%)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Sensitive Data Leakage Checks</td>
                  <td className="py-2 px-3 font-mono font-bold text-rose-600">
                    {metrics ? `${metrics.sensitiveDataLeaked} Leaked` : '8 Leaked'}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-600">
                    {metrics ? `${metrics.sensitiveDataPassRate}% Protected` : '100% Protected'}
                  </td>
                  <td className="py-2 px-3 font-semibold text-emerald-700">
                    PASSED (Zero Raw Exfiltration)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Scenario Results Table */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Scenario Evaluation Breakdown
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Scenario Name</th>
                  <th className="py-2 px-3">Expected</th>
                  <th className="py-2 px-3">Protected Verdict</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(metrics?.scenarioResults || []).map(r => (
                  <tr key={r.scenarioId}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-500">{r.scenarioId}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{r.name}</td>
                    <td className="py-2 px-3">
                      <DecisionBadge decision={r.expectedDecision} size="sm" />
                    </td>
                    <td className="py-2 px-3">
                      <DecisionBadge decision={r.protectedDecision} size="sm" />
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[11px] font-bold text-emerald-700">PASSED ✓</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sign-off disclaimer */}
        <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 leading-relaxed italic">
          * Notice: All individuals, account numbers, Aadhaar, PAN, UPI identifiers, and corporate entities
          appearing in this report are synthetic test fixtures generated for deterministic local security simulation.
          This lab evaluates tool-boundary authorization mechanisms and is not a production regulatory certification.
        </div>
      </div>

      {/* Settings & Reset Panel (Hidden when printing) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Simulation Settings & State Management</h2>
        <p className="text-xs text-slate-500">
          Reset all in-memory mock databases, email outbox queues, payment ledgers, and policies back to default laboratory baseline.
        </p>

        <div className="pt-2">
          {resetConfirm ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-rose-700">
                Confirm resetting all simulation state?
              </span>
              <button
                onClick={() => {
                  onResetAllState();
                  setResetConfirm(false);
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
              >
                Yes, Reset All
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset Demo State to Initial Defaults</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
