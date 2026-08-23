import React from 'react';
import { 
  Search, 
  Bell, 
  UserPlus, 
  HelpCircle, 
  LogOut, 
  ExternalLink, 
  User, 
  Shield, 
  Sparkles,
  Command
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dropdown, DropdownItem, DropdownSeparator } from '../ui/Dropdown';

export function DashboardHeader({
  activeWorkspace,
  onOpenSearch,
  onInviteClick,
  onSignOut,
  onBackToLanding,
  currentUser = { name: 'Sarah Connor', email: 'sarah@acme.io', role: 'Owner' },
}) {
  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: Breadcrumbs / Workspace context */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Workspaces</span>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <span>{activeWorkspace?.name || 'Acme Corp'}</span>
          <Badge variant="success" size="sm">
            ONLINE
          </Badge>
        </span>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-400 transition-colors cursor-pointer text-left shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-slate-400 group-hover:text-slate-600" />
            <span className="truncate">Search workspace members, roles, plans...</span>
          </div>

          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-2xs">
            <Command size={10} />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Actions: Invite Button, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        <Button
          variant="default"
          size="sm"
          onClick={onInviteClick}
          className="hidden sm:inline-flex shadow-xs"
        >
          <UserPlus size={13} />
          <span>Invite</span>
        </Button>

        {/* Notification Bell */}
        <Dropdown
          align="right"
          className="w-72"
          trigger={
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            </button>
          }
        >
          <div className="p-3 border-b border-slate-100 font-bold text-xs text-slate-900 flex justify-between items-center">
            <span>Workspace Notifications</span>
            <span className="text-[10px] text-indigo-600 font-normal cursor-pointer">Mark all read</span>
          </div>
          <div className="p-2 space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-indigo-50/50 text-slate-700 text-[11px]">
              <span className="font-bold text-indigo-900 block">Seat Limit Warning</span>
              Your workspace is at 80% seat capacity (8/10 seats).
            </div>
            <div className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 text-[11px]">
              <span className="font-bold text-slate-800 block">Postgres RLS Verified</span>
              Row-level security audit passed with zero leaks.
            </div>
          </div>
        </Dropdown>

        {/* User Avatar Dropdown */}
        <Dropdown
          align="right"
          className="w-56"
          trigger={
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-xs font-mono flex items-center justify-center shadow-2xs">
                {currentUser?.name?.substring(0, 2).toUpperCase() || 'SC'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {currentUser?.name || 'Sarah Connor'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono capitalize">
                  {currentUser?.role || 'Owner'}
                </div>
              </div>
            </div>
          }
        >
          <div className="p-3 border-b border-slate-100">
            <div className="font-bold text-xs text-slate-900">{currentUser?.name}</div>
            <div className="text-[11px] text-slate-500 font-mono truncate">{currentUser?.email}</div>
            <div className="mt-2">
              <Badge variant="owner" size="sm">
                ROLE: {currentUser?.role?.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="py-1">
            <DropdownItem onClick={onBackToLanding} icon={<ExternalLink size={14} />}>
              Landing Page View
            </DropdownItem>
            <DropdownItem onClick={onInviteClick} icon={<UserPlus size={14} />}>
              Invite Colleagues
            </DropdownItem>
          </div>

          <DropdownSeparator />

          <DropdownItem danger onClick={onSignOut} icon={<LogOut size={14} />}>
            Sign Out Workspace
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
