import React, { useState } from 'react';
import { ConditionOperator, PolicyDecision, PolicyRule, Severity, ToolName } from '../../types';
import { X, Plus, ShieldCheck } from 'lucide-react';

interface AddPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPolicy: (policy: PolicyRule) => void;
}

export const AddPolicyModal: React.FC<AddPolicyModalProps> = ({ isOpen, onClose, onAddPolicy }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('HIGH');
  const [priority, setPriority] = useState<number>(80);
  const [applicableTools, setApplicableTools] = useState<ToolName[] | 'ALL'>('ALL');
  const [field, setField] = useState<'payload' | 'tool' | 'destination' | 'amount' | 'prompt'>('payload');
  const [operator, setOperator] = useState<ConditionOperator>('REGEX_MATCH');
  const [conditionValue, setConditionValue] = useState('(?i)(confidential|classified|leak)');
  const [decision, setDecision] = useState<PolicyDecision>('BLOCK');
  const [reason, setReason] = useState('Custom policy triggered: Prohibited keyword detected in payload.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !conditionValue.trim()) return;

    const newRule: PolicyRule = {
      id: `POL-CUST-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      description: description.trim() || 'Custom user-defined security rule.',
      enabled: true,
      severity,
      priority,
      applicableTools,
      conditions: [
        {
          field,
          operator,
          value: field === 'amount' ? Number(conditionValue) : conditionValue,
        },
      ],
      decision,
      reason: reason.trim() || 'Action violated custom security policy.',
      isCustom: true,
    };

    onAddPolicy(newRule);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">Add Custom Security Policy</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rule Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Block Keyword Exfiltration"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. Intercepts outbound payloads containing sensitive keywords"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as Severity)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Priority (Higher = Evaluated First)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={priority}
                onChange={e => setPriority(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
              />
            </div>
          </div>

          {/* Structured Condition Builder */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <span className="font-bold text-slate-700 text-xs block">
              Structured Match Condition (Safe Rule Definition)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Target Field</label>
                <select
                  value={field}
                  onChange={e => setField(e.target.value as any)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                >
                  <option value="payload">Payload String</option>
                  <option value="destination">Destination / Recipient</option>
                  <option value="amount">Transaction Amount</option>
                  <option value="prompt">Prompt Content</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Operator</label>
                <select
                  value={operator}
                  onChange={e => setOperator(e.target.value as any)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                >
                  <option value="REGEX_MATCH">Regex Match</option>
                  <option value="CONTAINS">Contains Substring</option>
                  <option value="EQUALS">Exact Equals</option>
                  <option value="GREATER_THAN">Greater Than (Number)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Condition Value / Pattern
              </label>
              <input
                type="text"
                required
                value={conditionValue}
                onChange={e => setConditionValue(e.target.value)}
                placeholder="e.g. (?i)(confidential|token)"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Policy Decision</label>
              <select
                value={decision}
                onChange={e => setDecision(e.target.value as PolicyDecision)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
              >
                <option value="BLOCK">BLOCK</option>
                <option value="REVIEW">REVIEW (Hold for human)</option>
                <option value="REDACT">REDACT</option>
                <option value="ALLOW">ALLOW</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Human Reason</label>
              <input
                type="text"
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Policy Rule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
