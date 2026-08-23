import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  ShieldCheck, 
  Mail, 
  Clock, 
  Check, 
  Trash2, 
  Edit3, 
  Filter,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Dropdown, DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { Tabs } from '../ui/Tabs';

export function TeamRolesTable({
  members = [],
  onInviteClick,
  onUpdateRole,
  onDeleteMember,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const roleDescriptions = {
    owner: { label: 'Owner', scope: 'Full Control & Account Ownership' },
    admin: { label: 'Admin', scope: 'Workspace Settings & Team Management' },
    editor: { label: 'Editor', scope: 'Plans, Invoices & API Integrations' },
    viewer: { label: 'Viewer', scope: 'Read-Only Metrics & Analytics' },
    developer: { label: 'Developer', scope: 'API Keys & Gateway Sandbox' },
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || member.role.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || member.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  const roleTabItems = [
    { id: 'all', label: 'All Roles', count: members.length },
    { id: 'admin', label: 'Admins', count: members.filter(m => m.role === 'admin').length },
    { id: 'editor', label: 'Editors', count: members.filter(m => m.role === 'editor').length },
    { id: 'viewer', label: 'Viewers', count: members.filter(m => m.role === 'viewer').length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Team & Role Governance
            </h2>
            <Badge variant="primary" size="md">
              {members.length} Active Members
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your workspace collaboration hierarchy, team seat allocations, and role permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="md"
            onClick={onInviteClick}
            className="shadow-xs font-semibold"
          >
            <UserPlus size={15} />
            <span>Invite Team Member</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Role Pill Tabs */}
        <Tabs
          tabs={roleTabItems}
          activeTab={roleFilter}
          onChange={setRoleFilter}
        />

        {/* Search Input */}
        <div className="w-full md:w-72">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={15} />}
          />
        </div>
      </div>

      {/* Main Roles Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5 font-bold">Team Member</th>
                <th className="py-3.5 px-5 font-bold">Assigned Role</th>
                <th className="py-3.5 px-5 font-bold hidden md:table-cell">Access Scope</th>
                <th className="py-3.5 px-5 font-bold">Status</th>
                <th className="py-3.5 px-5 font-bold hidden lg:table-cell">Last Active</th>
                <th className="py-3.5 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-600">No members found matching your search</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const roleMeta = roleDescriptions[member.role.toLowerCase()] || {
                    label: member.role,
                    scope: 'Standard Access',
                  };

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Member Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${member.color || 'bg-slate-100 text-slate-700'} flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs`}
                          >
                            {member.avatar || member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {member.role === 'owner' && (
                                <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-mono font-bold">
                                  Workspace Owner
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-xs font-mono">{member.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-5">
                        <Badge variant={member.role.toLowerCase()} size="md">
                          {roleMeta.label.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Scope Description */}
                      <td className="py-4 px-5 text-slate-500 hidden md:table-cell text-xs">
                        {roleMeta.scope}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.status === 'Active'
                                ? 'bg-emerald-500 ring-2 ring-emerald-100'
                                : 'bg-amber-400 ring-2 ring-amber-100'
                            }`}
                          />
                          <span className={member.status === 'Active' ? 'text-slate-700' : 'text-amber-700'}>
                            {member.status}
                          </span>
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="py-4 px-5 text-slate-500 font-mono text-[11px] hidden lg:table-cell">
                        {member.lastActive || 'Today, 2:45 PM'}
                      </td>

                      {/* Actions Dropdown */}
                      <td className="py-4 px-5 text-right">
                        <Dropdown
                          align="right"
                          trigger={
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                              <MoreHorizontal size={16} />
                            </button>
                          }
                        >
                          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Manage Member
                          </div>

                          <div className="px-3 py-1 text-xs font-medium text-slate-600">
                            Change Role to:
                          </div>

                          <div className="px-1 space-y-0.5">
                            {['admin', 'editor', 'viewer'].map((targetRole) => (
                              <button
                                key={targetRole}
                                onClick={() => onUpdateRole(member.id, targetRole)}
                                className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer ${
                                  member.role === targetRole
                                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className="capitalize">{targetRole}</span>
                                {member.role === targetRole && <Check size={12} />}
                              </button>
                            ))}
                          </div>

                          <DropdownSeparator />

                          {member.role !== 'owner' && (
                            <DropdownItem
                              danger
                              onClick={() => onDeleteMember(member.id)}
                              icon={<Trash2 size={13} />}
                            >
                              Remove from Workspace
                            </DropdownItem>
                          )}
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredMembers.length}</span> of <span className="font-bold text-slate-800">{members.length}</span> team members
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span>Multi-Tenant Access Model: Strict Tenant ID Isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
