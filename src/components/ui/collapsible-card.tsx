'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export interface CollapsibleCardProps {
  id?: string;
  as?: 'div' | 'section';
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

/**
 * Animated collapsible card with RTL support and safe interactive header controls.
 */
export function CollapsibleCard({
  id,
  as: Component = 'div',
  title,
  subtitle,
  icon,
  headerExtra,
  defaultOpen = false,
  children,
  footer,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <Component
      id={id}
      className={cn(
        'min-w-0 bg-white rounded-3xl border border-slate-200/90 shadow-2xs transition-[border-color,box-shadow] duration-200',
        !isOpen && 'hover:border-slate-300 hover:shadow-xs',
        className
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 text-right cursor-pointer select-none group transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
          isOpen ? 'rounded-t-3xl' : 'rounded-3xl hover:bg-slate-50/70',
          headerClassName
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1">
            {typeof title === 'string' ? (
              <h2 className="text-sm font-extrabold text-slate-900 leading-snug">{title}</h2>
            ) : (
              title
            )}
            {subtitle && (
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{subtitle}</div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 max-w-full shrink-0">
          {headerExtra && (
            <div
              className="flex flex-wrap items-center gap-1.5 max-w-full"
              onClick={(e) => {
                e.stopPropagation();
                if (!isOpen) setIsOpen(true);
              }}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {headerExtra}
            </div>
          )}
          <span
            aria-hidden="true"
            className={cn(
              'w-7 h-7 rounded-xl inline-flex items-center justify-center transition-all duration-300 shrink-0',
              isOpen
                ? 'bg-slate-100 text-slate-600 rotate-180 group-hover:bg-slate-200/80'
                : 'bg-slate-100/80 text-slate-500 rotate-0 group-hover:bg-blue-50 group-hover:text-blue-600'
            )}
          >
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>
      </div>

      <div
        aria-hidden={!isOpen}
        className={cn(
          'grid grid-cols-1 transition-[grid-template-rows,opacity,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] print:!grid-rows-[1fr] print:!opacity-100 print:!visible',
          isOpen
            ? 'grid-rows-[1fr] opacity-100 visible'
            : 'grid-rows-[0fr] opacity-0 invisible pointer-events-none'
        )}
      >
        <div className="overflow-hidden min-h-0 min-w-0">
          <div
            className={cn(
              'px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4 border-t border-slate-100',
              bodyClassName
            )}
          >
            {children}
            {footer && (
              <div className={cn('mt-4 pt-3 border-t border-slate-100', footerClassName)}>
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </Component>
  );
}
