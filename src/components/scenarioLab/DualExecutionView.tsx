import React from 'react';
import { DualExecutionComparison, ExecutionResult, ToolAction } from '../../types';
import {
  ShieldX,
  ShieldCheck,
  Eye,
  AlertTriangle,
  ArrowRight,
  Database,
  Mail,
  CreditCard,
  FileText,
  UserCheck,
} from 'lucide-react';
import { DecisionBadge } from '../common/Badge';

interface DualExecutionViewProps {
  comparison: DualExecutionComparison;
  onApproveReview?: (actionId: string) => void;
  onRejectReview?: (actionId: string) => void;
}

export const DualExecutionView: React.FC<DualExecutionViewProps> = ({
  comparison,
  onApproveReview,
  onRejectReview,
}) => {
  const { baseline, protected: protectedRun, divergencePoint } = comparison;

  return (
    <div className="space-y-4">
      {/* Divergence Point Banner */}
      {divergencePoint && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
            ⚡
          </div>
          <div className="text-xs">
            <div className="font-bold text-blue-950 flex items-center gap-1.5">
              <span>Execution Path Divergence Detected</span>
              <span className="text-[10px] font-normal text-blue-700 bg-blue-100 px-2 py-0.2 rounded">
                Step #{divergencePoint.stepIndex}
              </span>
            </div>
            <div className="text-slate-600 mt-1 flex flex-col md:flex-row md:items-center gap-2">
              <span className="text-rose-700 font-medium">
                Baseline: {divergencePoint.baselineBehavior}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden md:inline shrink-0" />
              <span className="text-emerald-700 font-semibold">
                Protected: {divergencePoint.protectedBehavior}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Execution Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
        {/* ================= BASELINE MODE ================= */}
        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-rose-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="font-bold text-slate-900 text-sm">Baseline Mode</span>
              <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                Unprotected
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {baseline.executionTimeMs}ms
            </span>
          </div>

          <div className="space-y-3">
            {/* Agent Thought */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Agent Reasoning & Thought
              </span>
              <p className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700 leading-relaxed italic">
                "{baseline.agentThought}"
              </p>
            </div>

            {/* Proposed & Executed Tool Actions */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Proposed Action & Boundary Result
              </span>
              {baseline.proposedActions.map(action => (
                <div
                  key={action.id}
                  className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-rose-950 text-xs">
                      {action.tool}()
                    </span>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                      EXECUTED WITHOUT ENFORCEMENT
                    </span>
                  </div>

                  <pre className="p-2 bg-slate-900 text-slate-200 font-mono text-[10px] rounded overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(action.parameters, null, 2)}
                  </pre>
                </div>
              ))}
            </div>

            {/* Simulated Sandbox State Impact */}
            <div className="border-t border-slate-100 pt-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Sandbox Environment Impact</span>
              </span>

              {baseline.attackSuccess ? (
                <div className="p-2.5 bg-rose-100 text-rose-900 rounded border border-rose-300 font-medium space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldX className="w-4 h-4 text-rose-600" />
                    <span>Security Posture Compromised</span>
                  </div>
                  <div className="text-[11px] text-rose-800">
                    The agent fulfilled the unconstrained action without tool-boundary policy evaluation.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded border border-emerald-200 font-medium">
                  No adversarial effect recorded.
                </div>
              )}

              {/* Leaked Outbox or Payments */}
              {baseline.stateAfter.outbox.length > 0 && (
                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1">
                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-rose-600" />
                    <span>Exfiltrated Outbox Message:</span>
                  </div>
                  <div className="text-slate-600">
                    To: <span className="font-mono text-slate-900">{baseline.stateAfter.outbox[0].to}</span>
                  </div>
                  <div className="text-slate-500 truncate">
                    Body: {baseline.stateAfter.outbox[0].body}
                  </div>
                </div>
              )}

              {baseline.stateAfter.paymentsLedger.length > 0 && (
                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1">
                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                    <span>Dispatched Payment Transfer:</span>
                  </div>
                  <div className="text-slate-600">
                    Recipient: {baseline.stateAfter.paymentsLedger[0].recipientUpiOrAccount}
                  </div>
                  <div className="font-bold text-rose-700">
                    Amount: ₹{baseline.stateAfter.paymentsLedger[0].amount.toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= PROTECTED MODE ================= */}
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-900 text-sm">Protected Mode</span>
              <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                AgentGuard Active
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {protectedRun.executionTimeMs}ms
            </span>
          </div>

          <div className="space-y-3">
            {/* Policy Decision Summary */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Security Policy Verdict
              </span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <DecisionBadge decision={protectedRun.decisions[0]?.decision || 'ALLOW'} />
                  <span className="text-[11px] font-mono text-slate-500">
                    {protectedRun.decisions[0]?.matchedRules.length || 0} Rule(s) Matched
                  </span>
                </div>
                <div className="text-slate-800 text-xs font-medium">
                  {protectedRun.decisions[0]?.reason}
                </div>
              </div>
            </div>

            {/* Interactive Human-in-the-Loop Review Prompt if needed */}
            {protectedRun.decisions[0]?.decision === 'REVIEW' && !protectedRun.decisions[0]?.reviewApproved && (
              <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  <span>Mandatory Human Review Required</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  High-impact action held at boundary. Execution is suspended until authorized by supervisor.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() =>
                      onApproveReview &&
                      onApproveReview(protectedRun.proposedActions[0]?.id || '')
                    }
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Approve Action
                  </button>
                  <button
                    onClick={() =>
                      onRejectReview && onRejectReview(protectedRun.proposedActions[0]?.id || '')
                    }
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Reject Action
                  </button>
                </div>
              </div>
            )}

            {/* Transformed / Redacted Payload Diff */}
            {protectedRun.redactedActions.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Redacted Safe Payload Sent to Tool</span>
                </span>
                <pre className="p-2 bg-emerald-950 text-emerald-200 font-mono text-[10px] rounded overflow-x-auto whitespace-pre-wrap border border-emerald-800">
                  {JSON.stringify(protectedRun.redactedActions[0].transformed.parameters, null, 2)}
                </pre>
              </div>
            )}

            {/* Protected Sandbox Environment Impact */}
            <div className="border-t border-slate-100 pt-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected Sandbox State</span>
              </span>

              {protectedRun.blockedActions.length > 0 ? (
                <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded border border-emerald-200 font-medium">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Attack Successfully Neutralized</span>
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Tool execution was blocked at boundary. Zero sensitive data leaked; zero unauthorized payments made.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 text-slate-700 rounded border border-slate-200 font-medium">
                  {protectedRun.executedActions.length} authorized action(s) executed safely within policy constraints.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
