import React, { useState } from 'react';
import { PolicyRule, Scenario } from '../../types';
import {
  SlidersHorizontal,
  Plus,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DecisionBadge, SeverityBadge } from '../common/Badge';
import { AddPolicyModal } from './AddPolicyModal';
import { DEFAULT_POLICIES } from '../../data/defaultPolicies';

interface PolicyCenterProps {
  policies: PolicyRule[];
  onTogglePolicy: (id: string) => void;
  onAddPolicy: (policy: PolicyRule) => void;
  onResetPolicies: () => void;
  scenarios: Scenario[];
}

export const PolicyCenter: React.FC<PolicyCenterProps> = ({
  policies,
  onTogglePolicy,
  onAddPolicy,
  onResetPolicies,
  scenarios,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string>(policies[0]?.id || 'POL-001');

  const activeCount = policies.filter(p => p.enabled).length;
  const selectedRule = policies.find(p => p.id === selectedRuleId) || policies[0];

  // Calculate impact simulation: which scenarios rely on the currently disabled policies
  const disabledRuleIds = new Set(policies.filter(p => !p.enabled).map(p => p.id));
  const impactedScenarios = scenarios.filter(s => {
    if (disabledRuleIds.has('POL-001') && s.id === 'SCN-010') return true;
    if (disabledRuleIds.has('POL-002') && (s.id === 'SCN-004' || s.id === 'SCN-002')) return true;
    if (disabledRuleIds.has('POL-003') && (s.id === 'SCN-005' || s.id === 'SCN-006')) return true;
    if (disabledRuleIds.has('POL-004') && s.id === 'SCN-009') return true;
    if (disabledRuleIds.has('POL-005') && s.id === 'SCN-011') return true;
    if (disabledRuleIds.has('POL-007') && (s.id === 'SCN-002' || s.id === 'SCN-003')) return true;
    return false;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Deterministic Policy Enforcement Center
            </h1>
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              {activeCount} of {policies.length} Policies Active
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Configure authorization bounds, domain whitelists, Indian PII redaction, and human review thresholds.
            Modifying rules re-evaluates tool dispatch without code modification or LLM fine-tuning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetPolicies}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset rules to default baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Policy</span>
          </button>
        </div>
      </div>

      {/* Impact Simulation Alert if any policy is disabled */}
      {impactedScenarios.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-amber-900">
              Policy Deviation Impact Warning ({impactedScenarios.length} Scenarios Affected)
            </div>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Disabling active rules has relaxed tool boundary constraints. The following benchmark scenarios will now permit unauthorized actions or leak sensitive data:{' '}
              <span className="font-semibold">{impactedScenarios.map(s => s.id).join(', ')}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Policy List (left) + Selected Policy Inspector (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Rule list (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
            Prioritized Security Rules (Ranked by Evaluation Priority)
          </div>

          <div className="space-y-2">
            {policies.map(rule => {
              const isSelected = selectedRule?.id === rule.id;
              return (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`bg-white border rounded-lg p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          {rule.id}
                        </span>
                        <SeverityBadge severity={rule.severity} size="sm" />
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          Priority {rule.priority}
                        </span>
                        {rule.isCustom && (
                          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            Custom
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-xs text-slate-900">{rule.name}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{rule.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <DecisionBadge decision={rule.decision} size="sm" />
                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onTogglePolicy(rule.id);
                          }}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                            rule.enabled ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              rule.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <span
                        className={`text-[10px] font-semibold ${
                          rule.enabled ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Rule Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 h-fit sticky top-20 text-xs">
          {selectedRule && (
            <>
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-slate-500">{selectedRule.id}</span>
                  <DecisionBadge decision={selectedRule.decision} />
                </div>
                <h2 className="text-sm font-bold text-slate-900 mt-1">{selectedRule.name}</h2>
                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                  {selectedRule.description}
                </p>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Evaluation Priority:</span>
                  <span className="font-bold text-slate-800">{selectedRule.priority} / 100</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Enforcement Status:</span>
                  <span
                    className={`font-bold ${
                      selectedRule.enabled ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {selectedRule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Applicable Tools */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Applicable Tools
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedRule.applicableTools === 'ALL' ? (
                    <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium">
                      ALL TOOLS (Global Boundary)
                    </span>
                  ) : (
                    selectedRule.applicableTools.map(t => (
                      <span
                        key={t}
                        className="font-mono text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-medium"
                      >
                        {t}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Conditions Detail */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Match Conditions
                </span>
                <div className="space-y-1.5">
                  {selectedRule.conditions.map((cond, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] space-y-1"
                    >
                      <div>
                        <span className="text-slate-400">Field: </span>
                        <span className="text-blue-700 font-semibold">{cond.field}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Operator: </span>
                        <span className="text-purple-700 font-semibold">{cond.operator}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Value: </span>
                        <span className="text-slate-800 font-semibold break-all">
                          {typeof cond.value === 'object'
                            ? JSON.stringify(cond.value)
                            : String(cond.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Human Reason */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Enforcement Justification
                </span>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700 leading-relaxed text-[11px]">
                  {selectedRule.reason}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Custom Policy Modal */}
      <AddPolicyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPolicy={onAddPolicy}
      />
    </div>
  );
};
