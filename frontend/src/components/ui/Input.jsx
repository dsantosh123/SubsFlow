import React from 'react';
import { cn } from './Button';

export const Input = React.forwardRef(({
  className,
  type = 'text',
  error,
  icon,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-2xs transition-colors',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600',
          'disabled:cursor-not-allowed disabled:opacity-50',
          icon && 'pl-9',
          error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Select = React.forwardRef(({
  className,
  error,
  children,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          'flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-2xs transition-colors cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
