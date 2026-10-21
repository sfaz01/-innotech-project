import React, { useState } from 'react';
import { AuditEvent, AuditEventType, ExecutionMode, PolicyDecision } from '../../types';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Copy,
  Hash,
  ShieldCheck,
  Check,
  Terminal,
} from 'lucide-react';
import { DecisionBadge } from '../common/Badge';
import { verifyAuditChain } from '../../engine/auditLogger';
import { exportAuditCSV, triggerFileDownload } from '../../engine/reportExporter';

interface AuditLogsProps {
  events: AuditEvent[];
  onSelectEvent: (event: AuditEvent) => void;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ events, onSelectEvent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | ExecutionMode>('ALL');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter events
  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.scenarioId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.payloadPreview && e.payloadPreview.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMode = modeFilter === 'ALL' || e.mode === modeFilter;
    const matchesDecision = decisionFilter === 'ALL' || e.decision === decisionFilter;

    return matchesSearch && matchesMode && matchesDecision;
  });

  const chainStatus = verifyAuditChain(events);

  const handleExportCSV = () => {
    const csv = exportAuditCSV(filteredEvents);
    triggerFileDownload(`agentguard_audit_ledger_${Date.now()}.csv`, csv, 'text/csv');
  };

  const handleCopyJSON = (e: AuditEvent, evt: React.MouseEvent) => {
    evt.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(e, null, 2));
    setCopiedId(e.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Audit Event Ledger & Tamper-Evident Trail
            </h1>
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              {events.length} Total Events
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Append-only chronological record of every input ingestion, agent proposal, boundary policy evaluation, and tool dispatch decision.
          </p>
        </div>

        {/* Cryptographic Chain Integrity Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Chain Integrity: {chainStatus.valid ? 'Verified (100% Intact)' : 'Broken'}</span>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit logs by ID, scenario, or keyword..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={modeFilter}
            onChange={e => setModeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Modes</option>
            <option value="protected">Protected Mode</option>
            <option value="baseline">Baseline Mode</option>
          </select>

          <select
            value={decisionFilter}
            onChange={e => setDecisionFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Decisions</option>
            <option value="ALLOW">ALLOW</option>
            <option value="BLOCK">BLOCK</option>
            <option value="REDACT">REDACT</option>
            <option value="REVIEW">REVIEW</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold bg-slate-50/70">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3">Explanation</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map(evt => (
                <tr
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-400 text-[11px]">
                    {evt.sequence}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 font-medium">
                    {evt.id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{evt.scenarioId}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        evt.mode === 'protected'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {evt.mode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">{evt.eventType}</td>
                  <td className="py-2.5 px-3">
                    {evt.decision ? (
                      <DecisionBadge decision={evt.decision} size="sm" />
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-sm truncate">
                    {evt.explanation}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={e => handleCopyJSON(evt, e)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="Copy Event JSON"
                    >
                      {copiedId === evt.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 inline" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 inline" />
                      )}
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
