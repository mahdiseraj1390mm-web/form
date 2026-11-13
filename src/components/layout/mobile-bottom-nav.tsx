'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  Eye,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  PenTool,
  Settings,
  Sparkles,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isSuperAdmin: boolean;
  allowedTabs?: string[];
}

interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  {
    id: 'dashboard',
    label: 'داشبورد',
    icon: LayoutDashboard,
  },
  {
    id: 'forms',
    label: 'فرم‌ها',
    icon: FolderKanban,
  },
  {
    id: 'submissions',
    label: 'پرونده مراجعان',
    icon: Inbox,
  },
  {
    id: 'builder',
    label: 'طراحی فرم',
    icon: PenTool,
  },
  {
    id: 'runner',
    label: 'پیش‌نمایش',
    icon: Eye,
  },
  {
    id: 'consultants',
    label: 'مشاوران',
    icon: CalendarClock,
  },
  {
    id: 'analytics',
    label: 'آمار و تحلیل',
    icon: BarChart3,
  },
  {
    id: 'templates',
    label: 'قالب‌های آماده',
    icon: Sparkles,
  },
  {
    id: 'settings',
    label: 'تنظیمات',
    icon: Settings,
  },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  isSuperAdmin,
  allowedTabs,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hasScrolledInitiallyRef = useRef(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const visibleItems = useMemo(() => {
    const hasCustomTabs = Array.isArray(allowedTabs) && allowedTabs.length > 0;
    return SIDEBAR_BOTTOM_NAV_ITEMS.filter((item) => {
      if (isSuperAdmin) return true;
      if (hasCustomTabs) return allowedTabs.includes(item.id);
      return item.id === 'submissions';
    });
  }, [isSuperAdmin, allowedTabs]);

  const updateScrollEdges = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || visibleItems.length === 0) {
      setCanScrollRight(false);
      setCanScrollLeft(false);
      return;
    }

    const firstEl = itemRefs.current[visibleItems[0].id];
    const lastEl = itemRefs.current[visibleItems[visibleItems.length - 1].id];
    if (!firstEl || !lastEl) return;

    const containerRect = container.getBoundingClientRect();
    const firstRect = firstEl.getBoundingClientRect();
    const lastRect = lastEl.getBoundingClientRect();

    setCanScrollRight(firstRect.right > containerRect.right + 4);
    setCanScrollLeft(lastRect.left < containerRect.left - 4);
  }, [visibleItems]);

  useEffect(() => {
    updateScrollEdges();
    const container = scrollContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      updateScrollEdges();
    });
    ro.observe(container);

    return () => ro.disconnect();
  }, [updateScrollEdges]);

  useEffect(() => {
    const activeEl = itemRefs.current[currentTab];
    if (!activeEl) return;

    const smooth = hasScrolledInitiallyRef.current;
    hasScrolledInitiallyRef.current = true;

    activeEl.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      inline: 'center',
      block: 'nearest',
    });

    const rafId = window.requestAnimationFrame(updateScrollEdges);
    return () => window.cancelAnimationFrame(rafId);
  }, [currentTab, visibleItems, updateScrollEdges]);

  if (visibleItems.length === 0) return null;

  return (
    <nav
      aria-label="ناوبری پایین"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-safe"
    >
      <div className="relative w-full">
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollEdges}
          className="overflow-x-auto no-scrollbar touch-pan-x"
        >
          <div className="flex items-center justify-around gap-1 min-w-full w-max px-2 py-1.5">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onSelectTab(item.id)}
                  className={`shrink-0 flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[64px] select-none whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600 font-extrabold'
                      : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`}
                >
                  <div
                    className={`p-1 rounded-xl transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 tracking-tight leading-none ${
                      isActive ? 'font-black' : 'font-semibold'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* نشانگر محو شدن لبه‌ها برای هدایت اسکرول افقی */}
        {canScrollRight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/95 to-transparent"
          />
        )}
        {canScrollLeft && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/95 to-transparent"
          />
        )}
      </div>
    </nav>
  );
};
