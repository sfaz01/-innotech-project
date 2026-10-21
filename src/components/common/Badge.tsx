// AgentGuard — Reusable Status & Severity Badges
import React from 'react';
import { PolicyDecision, Severity } from '../../types';
import { ShieldCheck, ShieldAlert, ShieldX, Eye, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

interface DecisionBadgeProps {
  decision: PolicyDecision | string;
  size?: 'sm' | 'md';
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({ decision, size = 'md' }) => {
  const isSm = size === 'sm';
  const baseClasses = `inline-flex items-center gap-1.5 font-medium rounded-md ${
    isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  }`;

  switch (decision) {
    case 'ALLOW':
      return (
        <span className={`${baseClasses} bg-emerald-50 text-emerald-800 border border-emerald-200`}>
          <ShieldCheck className={isSm ? 'w-3 h-3 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
          <span>ALLOW</span>
        </span>
      );
    case 'BLOCK':
      return (
        <span className={`${baseClasses} bg-rose-50 text-rose-800 border border-rose-200`}>
          <ShieldX className={isSm ? 'w-3 h-3 text-rose-600' : 'w-3.5 h-3.5 text-rose-600'} />
          <span>BLOCK</span>
        </span>
      );
    case 'REDACT':
      return (
        <span className={`${baseClasses} bg-amber-50 text-amber-800 border border-amber-200`}>
          <Eye className={isSm ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
          <span>REDACT</span>
        </span>
      );
    case 'REVIEW':
      return (
        <span className={`${baseClasses} bg-blue-50 text-blue-800 border border-blue-200`}>
          <AlertTriangle className={isSm ? 'w-3 h-3 text-blue-600' : 'w-3.5 h-3.5 text-blue-600'} />
          <span>REVIEW</span>
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-slate-100 text-slate-700 border border-slate-200`}>
          <span>{decision}</span>
        </span>
      );
  }
};

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm' }) => {
  const isSm = size === 'sm';
  const baseClasses = `inline-flex items-center gap-1 font-medium rounded ${
    isSm ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
  }`;

  switch (severity) {
    case 'CRITICAL':
      return (
        <span className={`${baseClasses} bg-rose-100 text-rose-900 border border-rose-300 font-semibold`}>
          <ShieldAlert className="w-3 h-3 text-rose-700" />
          <span>CRITICAL</span>
        </span>
      );
    case 'HIGH':
      return (
        <span className={`${baseClasses} bg-amber-100 text-amber-900 border border-amber-300`}>
          <AlertTriangle className="w-3 h-3 text-amber-700" />
          <span>HIGH</span>
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`${baseClasses} bg-blue-50 text-blue-800 border border-blue-200`}>
          <Info className="w-3 h-3 text-blue-600" />
          <span>MEDIUM</span>
        </span>
      );
    case 'LOW':
      return (
        <span className={`${baseClasses} bg-slate-100 text-slate-700 border border-slate-200`}>
          <span>LOW</span>
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-slate-50 text-slate-600 border border-slate-200`}>
          <span>INFO</span>
        </span>
      );
  }
};

interface OutcomeBadgeProps {
  passed: boolean;
  label?: string;
}

export const OutcomeBadge: React.FC<OutcomeBadgeProps> = ({ passed, label }) => {
  return passed ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>{label || 'PASSED'}</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-rose-50 text-rose-800 border border-rose-200">
      <XCircle className="w-3.5 h-3.5 text-rose-600" />
      <span>{label || 'FAILED'}</span>
    </span>
  );
};
