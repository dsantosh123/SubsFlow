import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Search, 
  MoreHorizontal, 
  TrendingUp, 
  CreditCard,
  Plus,
  LayoutDashboard,
  Layers,
  Activity,
  Key,
  CheckCircle2,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function DashboardMockup({ onOpenApp }) {
  const [activeTab, setActiveTab] = useState('team'); // 'team' | 'overview' | 'subscriptions' | 'api'

  const mockUsers = [
    { name: 'Sarah Connor', email: 'sarah@acme.io', role: 'owner', status: 'Active', avatar: 'SC', color: 'bg-purple-100 text-purple-700 font-bold', lastActive: 'Just now' },
    { name: 'Alex Rivera', email: 'alex@acme.io', role: 'admin', status: 'Active', avatar: 'AR', color: 'bg-indigo-100 text-indigo-700 font-bold', lastActive: '14m ago' },
    { name: 'Elena Rostova', email: 'elena@acme.io', role: 'editor', status: 'Active', avatar: 'ER', color: 'bg-emerald-100 text-emerald-700 font-bold', lastActive: '1h ago' },
    { name: 'Marcus Chen', email: 'marcus@acme.io', role: 'viewer', status: 'Invited', avatar: 'MC', color: 'bg-slate-100 text-slate-700 font-bold', lastActive: 'Yesterday' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-5xl group">
      {/* Background Soft Glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-purple-500/20 blur-xl opacity-70 group-hover:opacity-100 transition duration-700 pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full rounded-2xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/40 overflow-hidden text-left">
        {/* Top Window Chrome & Navigation Header */}
        <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 ml-2 px-3 py-1 bg-white rounded-md border border-slate-200/80 text-xs text-slate-500 font-mono shadow-2xs">
              <Lock size={10} className="text-slate-400" />
              <span>app.subsflow.io/acme-corp/{activeTab}</span>
            </div>
          </div>

          {/* Active Workspace Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
            <Building2 size={13} className="text-indigo-600 shrink-0" />
            <span className="font-bold">Acme Corp</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">
              Production
            </span>
          </div>
        </div>

        {/* Mockup Layout: Mini Sidebar + Workspace Content */}
        <div className="flex flex-col md:flex-row min-h-[460px] bg-white">
          {/* Mini Sidebar */}
          <div className="w-full md:w-52 bg-slate-50/70 border-r border-slate-200/80 p-3 space-y-1 shrink-0 flex md:flex-col justify-between overflow-x-auto">
            <div className="space-y-1 w-full flex md:flex-col gap-1 md:gap-0">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden md:block">
                Workspace Tabs
              </div>

              {[
                { id: 'team', label: 'Team & Roles', icon: Users, badge: '4' },
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'subscriptions', label: 'Subscriptions', icon: Layers },
                { id: 'api', label: 'API Keys', icon: Key },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono hidden md:inline-block ${
                        isActive ? 'bg-indigo-200/70 text-indigo-900 font-bold' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quota Mini Meter in Sidebar */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs hidden md:block space-y-1.5 shadow-2xs">
              <div className="flex justify-between text-[11px] font-bold text-slate-700">
                <span>Team Seats</span>
                <span className="text-indigo-600">8 / 10</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="w-[80%] h-full bg-indigo-600 rounded-full" />
              </div>
              <span className="text-[10px] text-slate-400 block">Growth Tier</span>
            </div>
          </div>

          {/* Main Mockup Workspace Body */}
          <div className="flex-1 p-5 sm:p-6 space-y-5 overflow-hidden">
            {/* View 1: Team & Roles Table */}
            {activeTab === 'team' && (
              <div className="space-y-4">
                {/* Header with Search & Invite Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Team Collaboration & Access Roles</h3>
                    <p className="text-xs text-slate-500">Manage member privileges and isolated workspace access.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search members..."
                        disabled
                        className="h-7 pl-7 pr-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 w-36 sm:w-44 focus:outline-none"
                      />
                    </div>
                    <Button size="xs" variant="default" onClick={onOpenApp}>
                      <Plus size={12} />
                      <span>Invite Member</span>
                    </Button>
                  </div>
                </div>

                {/* Clean Team Members Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 hidden sm:table-cell">Last Active</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {mockUsers.map((user, i) => (
                        <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full ${user.color} flex items-center justify-center text-[11px] shrink-0`}>
                                {user.avatar}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 leading-tight">{user.name}</div>
                                <div className="text-[11px] text-slate-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={user.role} size="sm">
                              {user.role.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                              <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-amber-400 ring-2 ring-amber-100'}`} />
                              <span className={user.status === 'Active' ? 'text-slate-700' : 'text-amber-700'}>{user.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 hidden sm:table-cell text-xs">
                            {user.lastActive}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="p-1 rounded text-slate-400 hover:text-slate-600" onClick={onOpenApp}>
                              <MoreHorizontal size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <ShieldCheck size={14} />
                    <span>Row-Level Security Active (Tenant Isolated)</span>
                  </div>
                  <span className="text-slate-400">4 of 10 seats filled</span>
                </div>
              </div>
            )}

            {/* View 2: Overview & Analytics */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 block">Monthly Recurring Revenue</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-extrabold text-slate-900">$128,450</span>
                      <span className="text-xs font-bold text-emerald-600">+14.2%</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 block">Ingested Events / Sec</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-extrabold text-slate-900">4,820</span>
                      <span className="text-xs font-bold text-indigo-600">Redis Relay</span>
                    </div>
                  </div>
                </div>

                {/* SVG Revenue Area Chart Mockup */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-800">Usage & Billing Trajectory</span>
                    <span className="text-[11px] text-slate-400">Last 30 Days</span>
                  </div>
                  <div className="h-28 w-full">
                    <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,90 Q 70,60 140,75 T 280,45 T 420,20 L 500,10 L 500,120 L 0,120 Z"
                        fill="url(#chartGrad)"
                      />
                      <path
                        d="M 0,90 Q 70,60 140,75 T 280,45 T 420,20 L 500,10"
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="500" cy="10" r="4" fill="#4f46e5" className="animate-pulse" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* View 3: Subscriptions */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex justify-between items-center">
                  <div>
                    <Badge variant="primary" size="sm">ACTIVE PLAN</Badge>
                    <h4 className="text-base font-extrabold text-slate-900 mt-1">Growth Subscription Tier ($79/mo)</h4>
                    <p className="text-xs text-slate-500">Includes 20 team seats, PostgreSQL RLS, and transactional outbox relay.</p>
                  </div>
                  <Button size="xs" variant="default" onClick={onOpenApp}>
                    Manage Plan
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Next Invoice Date</span>
                    <span className="text-slate-900 font-bold mt-1 block">May 01, 2026</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Payment Method</span>
                    <span className="text-slate-900 font-bold mt-1 block">Visa •••• 4242</span>
                  </div>
                </div>
              </div>
            )}

            {/* View 4: API Keys */}
            {activeTab === 'api' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Workspace Live API Key</span>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value="sk_live_acme_prod_9921e4881"
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 font-mono text-xs text-slate-700"
                    />
                    <Button size="xs" variant="outline" onClick={onOpenApp}>Copy</Button>
                  </div>
                  <span className="text-[11px] text-slate-500 block">Restricted to tenant_id: t_acme_prod</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
