import React from 'react';
import { ShieldCheck, Play, Sparkles, Database, Layers } from 'lucide-react';

interface NavbarProps {
  onRunFullBenchmark: () => void;
  onOpenGuidedDemo: () => void;
  isRunningBenchmark?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRunFullBenchmark,
  onOpenGuidedDemo,
  isRunningBenchmark = false,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none sticky top-0 z-30 shadow-xs">
      {/* Brand & Workspace */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                AgentGuard
              </span>
              <span className="text-[10px] uppercase font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                v1.0 • India Lab
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium leading-none block mt-0.5">
              Tool-Boundary Security & Privacy Enforcement
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-200 text-xs text-slate-600">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Workspace:</span>
          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            Fintech KYC & Banking Gateway
          </span>
        </div>
      </div>

      {/* Center status indicators */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Deterministic Sandbox:</span>
          <span className="text-slate-500">Active</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-medium">Simulation Mode:</span>
          <span className="text-amber-700 font-normal">100% Local (Zero External API)</span>
        </div>
      </div>

      {/* Right operational controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenGuidedDemo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
          title="Interactive presentation walkthrough"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Guided Attack Demo</span>
        </button>

        <button
          onClick={onRunFullBenchmark}
          disabled={isRunningBenchmark}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors shadow-xs cursor-pointer"
        >
          <Play className={`w-3.5 h-3.5 ${isRunningBenchmark ? 'animate-spin' : ''}`} />
          <span>{isRunningBenchmark ? 'Running Benchmark...' : 'Run Full Benchmark'}</span>
        </button>
      </div>
    </header>
  );
};
