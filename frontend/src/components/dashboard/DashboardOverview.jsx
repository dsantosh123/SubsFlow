import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  ShieldCheck, 
  Layers, 
  Receipt, 
  Key, 
  ArrowUpRight,
  UserPlus,
  Zap,
  Building2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function DashboardOverview({
  workspace,
  membersCount = 4,
  onNavigateTab,
  onInviteClick,
}) {
  const stats = [
    {
      title: 'Monthly Recurring Revenue',
      value: '$128,450',
      change: '+14.2%',
      trend: 'up',
      subtitle: 'vs. previous month ($112,500)',
      icon: TrendingUp,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Active Team Seats',
      value: `${membersCount} / 10`,
      change: '80% Quota',
      trend: 'neutral',
      subtitle: 'Growth Tier (2 seats remaining)',
      icon: Users,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Metered Usage Events',
      value: '1.42M',
      change: '+28.5%',
      trend: 'up',
      subtitle: 'Redis Rate-Limited stream',
      icon: Activity,
      iconColor: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'PostgreSQL RLS Status',
      value: 'Enforced',
      change: '100% Secure',
      trend: 'up',
      subtitle: `Binding: ${workspace?.id || 't_prod_89a'}`,
      icon: ShieldCheck,
      iconColor: 'text-purple-600 bg-purple-50 border-purple-100',
    },
  ];

  const recentEvents = [
    { action: 'Role updated to Admin for Alex Rivera', time: '10m ago', actor: 'Sarah Connor', type: 'role' },
    { action: 'New team member invited (marcus@acme.io)', time: '42m ago', actor: 'Sarah Connor', type: 'invite' },
    { action: 'Subscription plan upgraded to Growth', time: '2h ago', actor: 'System', type: 'plan' },
    { action: 'Usage spike throttled gracefully by Redis limiter', time: '4h ago', actor: 'Gateway', type: 'usage' },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-indigo-200">
              <Building2 size={13} />
              <span>{workspace?.name || 'Acme Corp'}</span>
              <span>•</span>
              <span className="text-emerald-300 font-bold">{workspace?.tier || 'Growth Tier'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Multi-Tenant Workspace Cockpit
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm max-w-xl">
              Manage workspace collaboration, assign user roles (Admin, Editor, Viewer), and inspect real-time usage metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="default"
              size="md"
              onClick={onInviteClick}
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold shadow-xs border-0"
            >
              <UserPlus size={15} />
              <span>Invite Team Member</span>
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigateTab('team')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <span>Manage Roles</span>
              <ArrowUpRight size={15} />
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{stat.title}</span>
                  <div className={`p-2 rounded-xl border ${stat.iconColor}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">{stat.value}</span>
                  <Badge variant={stat.trend === 'up' ? 'success' : 'primary'} size="sm">
                    {stat.change}
                  </Badge>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400 font-medium pt-3 border-t border-slate-100">
                {stat.subtitle}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Two Column Section: Quick Actions & Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Workspace Health & Subscriptions */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Workspace Tenant Allocation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated PostgreSQL RLS & schema session quotas</p>
              </div>
              <Badge variant="primary" size="md">
                Healthy 99.99%
              </Badge>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1.5">
                  <span>Team Seats (RBAC Allocated)</span>
                  <span>{membersCount} / 10 Used</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${(membersCount / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1.5">
                  <span>Monthly Metered Usage Limit</span>
                  <span>1.42M / 2.0M API Calls</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: '71%' }}
                  />
                </div>
              </div>

              <div className="pt-3 grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Admins</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">2</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Editors</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">1</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Viewers</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">1</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Recent Audit Log */}
        <div>
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900">Audit Stream</h3>
                <span className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer" onClick={() => onNavigateTab('team')}>
                  View all
                </span>
              </div>

              <div className="space-y-3">
                {recentEvents.map((evt, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800 leading-snug">{evt.action}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{evt.actor}</span>
                        <span>•</span>
                        <span>{evt.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => onNavigateTab('team')}>
                Inspect Member Roles Table
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
