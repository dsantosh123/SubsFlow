import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500';

  const variants = {
    default: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-sm active:scale-[0.99]',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-[0.99]',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 active:scale-[0.99]',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs hover:border-slate-300 active:scale-[0.99]',
    ghost: 'bg-transparent hover:bg-slate-100/80 text-slate-600 hover:text-slate-900',
    soft: 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-100',
    destructive: 'bg-red-500 hover:bg-red-600 text-white shadow-xs',
    subtleRed: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1.5',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm md:text-base gap-2.5 font-semibold',
    icon: 'p-2 w-9 h-9',
    iconSm: 'p-1.5 w-7 h-7',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
