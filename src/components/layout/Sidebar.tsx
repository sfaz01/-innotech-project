import React from 'react';
import {
  LayoutDashboard,
  FlaskConical,
  Crosshair,
  SlidersHorizontal,
  BarChart3,
  ScrollText,
  FileText,
  Shield,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'scenarios'
  | 'attack_explorer'
  | 'policies'
  | 'evaluation'
  | 'audit'
  | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  scenarioCount: number;
  activePolicyCount: number;
  auditCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  scenarioCount,
  activePolicyCount,
  auditCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'scenarios', label: 'Scenario Lab', icon: FlaskConical, count: scenarioCount },
    { id: 'attack_explorer', label: 'Attack Explorer', icon: Crosshair },
    { id: 'policies', label: 'Policy Center', icon: SlidersHorizontal, count: activePolicyCount },
    { id: 'evaluation', label: 'Evaluation & Benchmarks', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText, count: auditCount },
    { id: 'reports', label: 'Reports & Settings', icon: FileText },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-3.5rem)] select-none">
      <div className="p-3">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Security Console
        </div>
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600 rounded-l-none'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-blue-200/60 text-blue-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Product principle callout in footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 m-2 rounded-lg border">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-[11px] font-semibold text-slate-800">Core Principle</div>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
              Never trust an agent's action because the agent generated it. Enforce policies at the tool boundary.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
