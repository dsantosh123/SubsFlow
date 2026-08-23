import React from 'react';
import { cn } from './Button';

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const variants = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200/80',
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    outline: 'bg-transparent text-slate-600 border border-slate-300',
    
    // Role-specific badges
    admin: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold',
    editor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    viewer: 'bg-slate-100 text-slate-600 border border-slate-200 font-semibold',
    owner: 'bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold',
    developer: 'bg-cyan-50 text-cyan-700 border border-cyan-200/80 font-semibold',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-500',
    blue: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    destructive: 'bg-rose-500',
    purple: 'bg-purple-500',
    outline: 'bg-slate-400',
    admin: 'bg-indigo-500',
    editor: 'bg-emerald-500',
    viewer: 'bg-slate-400',
    owner: 'bg-purple-500',
    developer: 'bg-cyan-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-xs md:text-sm gap-2',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant] || 'bg-current')} />
      )}
      {children}
    </span>
  );
}
