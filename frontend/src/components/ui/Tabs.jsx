import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './Button';

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className,
  variant = 'pill',
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors select-none cursor-pointer flex items-center gap-2',
              isActive
                ? 'text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-white rounded-lg shadow-xs"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                    isActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
