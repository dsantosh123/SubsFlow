import React, { useState } from 'react';
import { Building2, Check, ChevronsUpDown, Plus, Sparkles } from 'lucide-react';
import { Dropdown, DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { Badge } from '../ui/Badge';

export function WorkspaceSwitcher({
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreateNewWorkspace,
}) {
  return (
    <Dropdown
      align="left"
      className="w-64"
      trigger={
        <div className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors text-left group">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0">
              <Building2 size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">
                {activeWorkspace?.name || 'Acme Corp'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <span>{activeWorkspace?.tier || 'Growth Tier'}</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">Active</span>
              </div>
            </div>
          </div>
          <ChevronsUpDown size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0 ml-1" />
        </div>
      }
    >
      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Switch Tenant Workspace
      </div>

      <div className="max-h-60 overflow-y-auto space-y-0.5">
        {workspaces.map((ws) => {
          const isSelected = ws.id === activeWorkspace?.id;
          return (
            <DropdownItem
              key={ws.id}
              onClick={() => onSelectWorkspace(ws)}
              className={isSelected ? 'bg-indigo-50/70 text-indigo-900 font-bold' : ''}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ws.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="block text-xs truncate">{ws.name}</span>
                    <span className="block text-[9px] text-slate-400 font-mono">{ws.id}</span>
                  </div>
                </div>
                {isSelected && <Check size={14} className="text-indigo-600 ml-2 shrink-0" />}
              </div>
            </DropdownItem>
          );
        })}
      </div>

      <DropdownSeparator />

      <DropdownItem
        onClick={onCreateNewWorkspace}
        className="text-indigo-600 hover:bg-indigo-50 font-semibold"
        icon={<Plus size={14} className="text-indigo-600" />}
      >
        <span>Create New Workspace</span>
      </DropdownItem>
    </Dropdown>
  );
}
