import React, { useState } from 'react';
import {
  DualExecutionComparison,
  ExecutionMode,
  ExecutionResult,
  PolicyRule,
  Scenario,
  ScenarioCategory,
  Severity,
} from '../../types';
import {
  Play,
  PlayCircle,
  Plus,
  Search,
  SlidersHorizontal,
  FileText,
  Code,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Globe,
  Sparkles,
} from 'lucide-react';
import { DecisionBadge, SeverityBadge } from '../common/Badge';
import { DualExecutionView } from './DualExecutionView';
import { CustomScenarioModal } from './CustomScenarioModal';
import { detectPII } from '../../engine/piiDetector';

interface ScenarioLabProps {
  scenarios: Scenario[];
  activePolicies: PolicyRule[];
  selectedScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  onRunScenario: (scenario: Scenario, mode: ExecutionMode) => ExecutionResult;
  onRunDual: (scenario: Scenario) => DualExecutionComparison;
  onCreateCustomScenario: (scenario: Scenario) => void;
  dualResult: DualExecutionComparison | null;
  onApproveReview?: (actionId: string) => void;
  onRejectReview?: (actionId: string) => void;
}

export const ScenarioLab: React.FC<ScenarioLabProps> = ({
  scenarios,
  selectedScenario,
  onSelectScenario,
  onRunScenario,
  onRunDual,
  onCreateCustomScenario,
  dualResult,
  onApproveReview,
  onRejectReview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [languageFilter, setLanguageFilter] = useState<string>('ALL');
  const [docViewMode, setDocViewMode] = useState<'RENDERED' | 'RAW' | 'HIGHLIGHTED'>('HIGHLIGHTED');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Filter scenarios
  const filteredScenarios = scenarios.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesSeverity = severityFilter === 'ALL' || s.severity === severityFilter;
    const matchesLang = languageFilter === 'ALL' || s.language === languageFilter;
    return matchesSearch && matchesCategory && matchesSeverity && matchesLang;
  });

  // Highlight suspicious instructions and PII
  const renderHighlightedContent = () => {
    let content = selectedScenario.content;
    const piiDetections = detectPII(content);

    return (
      <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        {content}

        {/* Highlight Summary Pills */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Detections:</span>
          {selectedScenario.adversarialInstruction && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-300">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              <span>Adversarial Injection Pattern Detected</span>
            </span>
          )}
          {piiDetections.map((pii, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300"
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>
                Synthetic {pii.category}: {pii.raw}
              </span>
            </span>
          ))}
          {!selectedScenario.adversarialInstruction && piiDetections.length === 0 && (
            <span className="text-slate-400 text-[11px] italic">No suspicious spans or PII detected.</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search scenarios by title, keyword, or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="PROMPT_INJECTION">Prompt Injection</option>
            <option value="HINGLISH_JAILBREAK">Hinglish Jailbreak</option>
            <option value="SYNTHETIC_PII_EXPOSURE">PII Exposure</option>
            <option value="FINANCIAL_FRAUD">Financial Fraud</option>
            <option value="UNAUTHORIZED_TOOL">Unauthorized Tool</option>
            <option value="BENIGN_WORKFLOW">Benign Workflows</option>
            <option value="FALSE_POSITIVE_CHECK">False Positive Checks</option>
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={languageFilter}
            onChange={e => setLanguageFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Languages</option>
            <option value="English">English</option>
            <option value="Hinglish">Hinglish (Hindi+English)</option>
          </select>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>New Custom Scenario</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Scenario Selector List + Detail Execution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Scenarios List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col h-[750px]">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Test Scenarios ({filteredScenarios.length})</span>
            <span className="text-[10px] text-slate-500 font-normal">Click to Inspect</span>
          </div>

          <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 mt-2">
            {filteredScenarios.map(s => {
              const isSelected = selectedScenario.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => onSelectScenario(s)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{s.id}</span>
                    <div className="flex items-center gap-1.5">
                      {s.language === 'Hinglish' && (
                        <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-1 rounded border border-purple-200">
                          Hinglish
                        </span>
                      )}
                      <SeverityBadge severity={s.severity} size="sm" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-xs text-slate-900 leading-snug">{s.name}</h3>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="truncate max-w-[150px]">{s.category.replace(/_/g, ' ')}</span>
                    <DecisionBadge decision={s.expectedDecision} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Scenario Details & Dual Execution (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Scenario Overview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {selectedScenario.id}
                  </span>
                  <SeverityBadge severity={selectedScenario.severity} />
                  <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {selectedScenario.category}
                  </span>
                  {selectedScenario.language === 'Hinglish' && (
                    <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                      Hinglish Content
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">{selectedScenario.name}</h2>
              </div>

              {/* Execution Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRunScenario(selectedScenario, 'baseline')}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Run without AgentGuard policies"
                >
                  <Play className="w-3.5 h-3.5 text-rose-600" />
                  <span>Run Baseline</span>
                </button>

                <button
                  onClick={() => onRunScenario(selectedScenario, 'protected')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Run through AgentGuard tool-boundary policies"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Run Protected</span>
                </button>

                <button
                  onClick={() => onRunDual(selectedScenario)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  title="Run both modes side-by-side with fresh state"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Run Both Modes</span>
                </button>
              </div>
            </div>

            {/* Description & Objective */}
            <p className="text-xs text-slate-600 mb-3">{selectedScenario.description}</p>

            {/* Scoped Permissions & Trusted Task Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Trusted User Task
                </span>
                <span className="font-medium text-slate-800">{selectedScenario.task}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Permitted Tool Permissions
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedScenario.permittedTools.map(t => (
                    <span
                      key={t}
                      className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Inspection with View Toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Untrusted Document / Email Content
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-[11px]">
                  <button
                    onClick={() => setDocViewMode('HIGHLIGHTED')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      docViewMode === 'HIGHLIGHTED'
                        ? 'bg-white text-blue-700 shadow-xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    Security Highlights
                  </button>
                  <button
                    onClick={() => setDocViewMode('RENDERED')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      docViewMode === 'RENDERED'
                        ? 'bg-white text-blue-700 shadow-xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    Rendered Preview
                  </button>
                  <button
                    onClick={() => setDocViewMode('RAW')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      docViewMode === 'RAW'
                        ? 'bg-white text-blue-700 shadow-xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    Raw Content
                  </button>
                </div>
              </div>

              {docViewMode === 'HIGHLIGHTED' && renderHighlightedContent()}

              {docViewMode === 'RAW' && (
                <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {selectedScenario.content}
                </pre>
              )}

              {docViewMode === 'RENDERED' && (
                <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 space-y-2">
                  <div className="text-[11px] text-slate-400 border-b pb-1">
                    Synthetic Email Client Simulation
                  </div>
                  <div className="whitespace-pre-line">{selectedScenario.content}</div>
                </div>
              )}
            </div>
          </div>

          {/* Execution Results View */}
          {dualResult && dualResult.scenarioId === selectedScenario.id && (
            <DualExecutionView
              comparison={dualResult}
              onApproveReview={onApproveReview}
              onRejectReview={onRejectReview}
            />
          )}
        </div>
      </div>

      {/* Custom Scenario Creator Modal */}
      <CustomScenarioModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onCreateScenario={onCreateCustomScenario}
      />
    </div>
  );
};
