import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Box,
  Layers, 
  Receipt, 
  Activity, 
  Key, 
  Settings, 
  Sparkles,
  Shield,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function DashboardSidebar({
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspaceClick,
  activeTab,
  onSelectTab,
  membersCount = 4,
  productsCount = 0,
  onOpenPricing,
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'SaaS Products', icon: Box, badge: productsCount > 0 ? `${productsCount}` : null },
    { id: 'team', label: 'Team & Roles', icon: Users, badge: `${membersCount}` },
    { id: 'subscriptions', label: 'Subscriptions', icon: Layers },
    { id: 'invoices', label: 'Invoices & Billing', icon: Receipt },
    { id: 'usage', label: 'Usage Metering', icon: Activity },
    { id: 'apikeys', label: 'API Keys & Relays', icon: Key },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      <div className="p-4 space-y-5">
        {/* Top: Brand Logo + Tenant Switcher */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <Zap size={16} className="fill-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                SubsFlow
              </span>
              <Badge variant="primary" size="sm">
                Cloud
              </Badge>
            </div>
          </div>

          {/* Multi-Tenant Workspace Switcher */}
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onSelectWorkspace={onSelectWorkspace}
            onCreateNewWorkspace={onCreateWorkspaceClick}
          />
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspace Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Pro Upsell Card */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="p-3.5 bg-gradient-to-b from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              {activeWorkspace?.tier || 'Growth Plan'}
            </span>
            <Badge variant="success" size="sm">
              RLS Active
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Multi-Tenant Isolation enforced via Postgres session context.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPricing}
            className="w-full text-xs font-semibold bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50/50 justify-center gap-1"
          >
            <span>Upgrade Tier</span>
            <ArrowUpRight size={13} />
          </Button>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
          <span>SubsFlow v0.3.0</span>
          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Phase 3</span>
        </div>
      </div>
    </aside>
  );
}
