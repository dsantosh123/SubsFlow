import React from 'react';
import { cn } from './Button';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/90 rounded-xl shadow-xs transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('p-6 pb-3 flex flex-col space-y-1.5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-lg font-bold tracking-tight text-slate-900', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-xs md:text-sm text-slate-500', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6 pt-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('p-6 pt-0 flex items-center border-t border-slate-100 mt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}
