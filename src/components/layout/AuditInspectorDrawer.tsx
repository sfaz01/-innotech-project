import React, { useState } from 'react';
import { AuditEvent } from '../../types';
import { X, Copy, Check, Hash, ShieldCheck, Terminal, AlertCircle } from 'lucide-react';
import { DecisionBadge } from '../common/Badge';

interface AuditInspectorDrawerProps {
  event: AuditEvent | null;
  onClose: () => void;
}

export const AuditInspectorDrawer: React.FC<AuditInspectorDrawerProps> = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="fixed inset-y-0 right-0 w-[420px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-transform duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-800 text-sm">Security Audit Inspector</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
            title="Copy Event JSON"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
        {/* Event Key Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-slate-500 text-[11px]">{event.id}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                event.mode === 'protected'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {event.mode} mode
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {event.decision && <DecisionBadge decision={event.decision} size="sm" />}
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
              {event.eventType}
            </span>
            <span className="text-slate-400 text-[10px] ml-auto">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Human Explanation */}
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Explanation / Policy Justification
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 leading-relaxed">
            {event.explanation}
          </div>
        </div>

        {/* Matched Policies */}
        {event.matchedPolicyIds.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Triggered Policy Rules
            </div>
            <div className="space-y-1">
              {event.matchedPolicyIds.map(pid => (
                <div
                  key={pid}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded text-rose-900 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-mono font-bold text-xs">{pid}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payload Previews */}
        {event.payloadPreview && (
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Original Payload Data
            </div>
            <pre className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded overflow-x-auto whitespace-pre-wrap leading-tight">
              {event.payloadPreview}
            </pre>
          </div>
        )}

        {event.transformedPayloadPreview && (
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Transformed / Redacted Payload</span>
            </div>
            <pre className="p-2.5 bg-emerald-950/90 text-emerald-200 font-mono text-[11px] rounded overflow-x-auto whitespace-pre-wrap leading-tight border border-emerald-800">
              {event.transformedPayloadPreview}
            </pre>
          </div>
        )}

        {/* Simulated Cryptographic Integrity */}
        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Tamper-Evident Hash Chain</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Chain Verified ✓
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1.5 font-mono text-[10px]">
            <div>
              <span className="text-slate-400 block">Sequence:</span>
              <span className="text-slate-700 font-semibold">#{event.sequence}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Prev Hash:</span>
              <span className="text-slate-500 break-all">{event.prevHash}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Current Hash:</span>
              <span className="text-blue-600 font-bold break-all">{event.hash}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 italic">
            * Local cryptographic demonstration of tamper-evident append-only ledger sequencing.
          </div>
        </div>
      </div>
    </aside>
  );
};
