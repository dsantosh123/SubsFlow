import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './Button';

export function Dropdown({
  trigger,
  children,
  align = 'left',
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-1.5 min-w-[200px] rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 focus:outline-none',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
            onClick={() => setIsOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({ className, icon, children, danger, ...props }) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer select-none',
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        className
      )}
      {...props}
    >
      {icon && <span className="text-slate-400 text-sm">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="h-px bg-slate-100 my-1 -mx-1" />;
}
