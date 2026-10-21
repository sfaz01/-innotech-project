import React, { useState, useEffect } from 'react';
import { DualExecutionComparison, Scenario } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  FastForward,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { DecisionBadge } from '../common/Badge';

interface AttackExplorerProps {
  scenario: Scenario;
  dualResult: DualExecutionComparison;
  onSelectScenario: (scenario: Scenario) => void;
  allScenarios: Scenario[];
}

export const AttackExplorer: React.FC<AttackExplorerProps> = ({
  scenario,
  dualResult,
  onSelectScenario,
  allScenarios,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'PROTECTED' | 'BASELINE' | 'COMPARISON'>('COMPARISON');

  // The 7 canonical attack lifecycle stages
  const stages = [
    {
      id: 1,
      title: 'Untrusted Document Ingestion',
      subtitle: 'Receives external email or uploaded message',
      baselineDesc: `Input ingested into context: "${scenario.content.slice(0, 70)}..."`,
      protectedDesc: `Input ingested and scanned for adversarial patterns & Indian PII.`,
      highlighted: false,
    },
    {
      id: 2,
      title: 'Adversarial Instruction Parsing',
      subtitle: 'Attacker injection / jailbreak payload',
      baselineDesc: scenario.adversarialInstruction
        ? `Adversarial override accepted: "${scenario.adversarialInstruction}"`
        : 'Routine task parsed without prompt injection.',
      protectedDesc: scenario.adversarialInstruction
        ? `Adversarial phrase identified and tagged by linguistic filter.`
        : 'Zero adversarial override detected.',
      highlighted: Boolean(scenario.adversarialInstruction),
    },
    {
      id: 3,
      title: 'Autonomous Agent Interpretation',
      subtitle: 'Model generates internal chain of reasoning',
      baselineDesc: `Agent rationale: "${dualResult.baseline.agentThought.slice(0, 85)}..."`,
      protectedDesc: `Identical agent reasoning generated: "${dualResult.protected.agentThought.slice(0, 85)}..."`,
      highlighted: false,
    },
    {
      id: 4,
      title: 'Tool Action Proposal',
      subtitle: 'Agent issues structured tool call',
      baselineDesc: `Proposed ${dualResult.baseline.proposedActions[0]?.tool || 'tool'} with raw parameters.`,
      protectedDesc: `Proposed ${dualResult.protected.proposedActions[0]?.tool || 'tool'} intercepted before dispatch.`,
      highlighted: false,
    },
    {
      id: 5,
      title: 'Policy Evaluation & Boundary Interception',
      subtitle: 'AgentGuard deterministic rules check',
      baselineDesc: 'BYPASSED: No security evaluation layer present in Baseline mode.',
      protectedDesc: `Evaluated against active rules. Matched: ${
        dualResult.protected.decisions[0]?.matchedRules.map(r => r.id).join(', ') || 'Clean Bounds'
      }.`,
      highlighted: true,
      divergence: true,
    },
    {
      id: 6,
      title: 'Enforcement & Redaction Transformation',
      subtitle: 'Decision enforced at tool boundary',
      baselineDesc: 'None applied. Unchecked dispatch permitted.',
      protectedDesc: `Verdict: ${dualResult.protected.decisions[0]?.decision || 'ALLOW'}. ${
        dualResult.protected.decisions[0]?.reason
      }`,
      highlighted: true,
      divergence: true,
    },
    {
      id: 7,
      title: 'Final Environment State',
      subtitle: 'Sandbox persistence & integrity record',
      baselineDesc: dualResult.baseline.attackSuccess
        ? 'COMPROMISED: Unauthorized payload executed in sandbox.'
        : 'SAFE: Workflow completed.',
      protectedDesc: dualResult.protected.blockedActions.length > 0
        ? 'PROTECTED: Tool execution completely suppressed. Zero exposure.'
        : 'PROTECTED: Transformed safe payload dispatched; sensitive data masked.',
      highlighted: true,
    },
  ];

  // Playback timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isPlaying) {
      timer = setTimeout(() => {
        if (currentStepIndex < stages.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1500 / playbackSpeed);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStepIndex, playbackSpeed, stages.length]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleStepForward = () => {
    if (currentStepIndex < stages.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Attack Path Explorer & Step-by-Step Replay
            </h1>
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              Interactive Timeline
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Trace the complete lifecycle from untrusted document ingestion to tool-boundary policy enforcement.
            Observe the exact point where Protected mode intercedes and diverges from Baseline vulnerability.
          </p>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Active Scenario:</label>
          <select
            value={scenario.id}
            onChange={e => {
              const scn = allScenarios.find(s => s.id === e.target.value);
              if (scn) {
                onSelectScenario(scn);
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }
            }}
            className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-800"
          >
            {allScenarios.map(s => (
              <option key={s.id} value={s.id}>
                {s.id}: {s.name.slice(0, 35)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Controls & Playback Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Playback buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Replay Attack Path'}</span>
          </button>

          <button
            onClick={handleStepForward}
            disabled={currentStepIndex >= stages.length - 1}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="Step forward one stage"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Next Step</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset to beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Speed:</span>
          {[1, 2, 4].map(speed => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                playbackSpeed === speed
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('COMPARISON')}
            className={`px-2.5 py-1 rounded font-semibold text-[11px] cursor-pointer ${
              viewMode === 'COMPARISON'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            onClick={() => setViewMode('PROTECTED')}
            className={`px-2.5 py-1 rounded font-semibold text-[11px] cursor-pointer ${
              viewMode === 'PROTECTED'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Protected Path Only
          </button>
          <button
            onClick={() => setViewMode('BASELINE')}
            className={`px-2.5 py-1 rounded font-semibold text-[11px] cursor-pointer ${
              viewMode === 'BASELINE'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Baseline Path Only
          </button>
        </div>
      </div>

      {/* Connected 7-Stage Flow Visualizer */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Execution Flow Sequence ({currentStepIndex + 1} of {stages.length})
          </span>
          {currentStepIndex >= 4 && (
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              ⚡ Boundary Divergence Active
            </span>
          )}
        </div>

        {/* Horizontal Pipeline Steps */}
        <div className="grid grid-cols-7 gap-2 relative">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isDivergence = stage.divergence;

            return (
              <div
                key={stage.id}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(idx);
                }}
                className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-blue-600 bg-blue-50/70 border-blue-400 font-bold'
                    : isCompleted
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {stage.id}
                  </span>
                </div>
                <div className="text-[11px] leading-tight font-semibold truncate">
                  {stage.title}
                </div>
                {isDivergence && (
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded block mt-1">
                    Divergence
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Step Detailed Diagnostic Comparison */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Stage #{stages[currentStepIndex].id}
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              {stages[currentStepIndex].title}
            </h2>
            <p className="text-xs text-slate-500">{stages[currentStepIndex].subtitle}</p>
          </div>

          {currentStepIndex >= 4 && (
            <DecisionBadge decision={dualResult.protected.decisions[0]?.decision || 'ALLOW'} />
          )}
        </div>

        {/* Comparison Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Baseline Behavior */}
          {(viewMode === 'COMPARISON' || viewMode === 'BASELINE') && (
            <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/40 space-y-2">
              <div className="flex items-center justify-between font-bold text-rose-950">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Baseline Path (No Policy Layer)</span>
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded uppercase">
                  Vulnerable
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-mono text-[11px] bg-white p-2.5 rounded border border-rose-100">
                {stages[currentStepIndex].baselineDesc}
              </p>
            </div>
          )}

          {/* Protected Behavior */}
          {(viewMode === 'COMPARISON' || viewMode === 'PROTECTED') && (
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Protected Path (AgentGuard Boundary)</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase">
                  Enforced
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-mono text-[11px] bg-white p-2.5 rounded border border-emerald-100">
                {stages[currentStepIndex].protectedDesc}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
