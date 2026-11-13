'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TabCarouselItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ScrollableTabCarouselProps {
  items: TabCarouselItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'dossier' | 'pills' | 'underline';
  desktopGridClassName?: string;
  className?: string;
}

/**
 * نوار تب‌های واکنش‌گرا: در نمایش‌های فشرده تب فعال را در مرکز قرار می‌دهد،
 * تب‌های قبلی و بعدی در دو طرف آن به‌صورت فید نمایش داده می‌شوند و کاربر با فلش‌های چپ/راست،
 * لمس و کشیدن افقی یا نوار اسکرول می‌تواند بین تب‌ها جابه‌جا شود.
 */
export const ScrollableTabCarousel: React.FC<ScrollableTabCarouselProps> = ({
  items,
  activeId,
  onChange,
  variant = 'dossier',
  desktopGridClassName = '',
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hasCenteredOnceRef = useRef(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  );
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < items.length - 1;

  const checkOverflow = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const computedDisplay = window.getComputedStyle(container).display;
    if (computedDisplay === 'grid') {
      setIsOverflowing(false);
      return;
    }

    const totalTabsWidth = items.reduce((sum, item) => {
      const btn = tabRefs.current[item.id];
      return sum + (btn ? btn.offsetWidth : 0);
    }, 0);
    const totalGaps = Math.max(0, items.length - 1) * 8;

    setIsOverflowing((prev) => {
      const reserveArrowsPx = prev ? 76 : 0;
      return totalTabsWidth + totalGaps > container.clientWidth + reserveArrowsPx + 2;
    });
  }, [items]);

  const centerActiveTab = useCallback(
    (smooth: boolean) => {
      const container = scrollRef.current;
      const activeEl = tabRefs.current[activeId];
      if (!container || !activeEl || !isOverflowing) return;

      const cRect = container.getBoundingClientRect();
      const bRect = activeEl.getBoundingClientRect();
      const delta = bRect.left + bRect.width / 2 - (cRect.left + cRect.width / 2);

      if (Math.abs(delta) > 1) {
        container.scrollBy({
          left: delta,
          behavior: smooth ? 'smooth' : 'auto',
        });
      }
    },
    [activeId, isOverflowing]
  );

  useEffect(() => {
    checkOverflow();
    const container = scrollRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      checkOverflow();
    });
    ro.observe(container);
    if (container.parentElement) {
      ro.observe(container.parentElement);
    }

    return () => ro.disconnect();
  }, [checkOverflow]);

  useEffect(() => {
    if (!isOverflowing) {
      hasCenteredOnceRef.current = false;
      return;
    }

    const smooth = hasCenteredOnceRef.current;
    const rafId = window.requestAnimationFrame(() => {
      centerActiveTab(smooth);
      hasCenteredOnceRef.current = true;
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [activeId, isOverflowing, centerActiveTab]);

  const handleStep = (direction: -1 | 1) => {
    const targetIdx = activeIndex + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    onChange(items[targetIdx].id);
  };

  const wrapperClasses =
    variant === 'dossier'
      ? 'w-full p-1.5 sm:p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[50px] sm:min-h-[58px] select-none'
      : variant === 'pills'
      ? 'w-full p-1.5 bg-slate-200/70 rounded-2xl select-none'
      : 'w-full border-b border-slate-100 bg-white pb-0 text-xs font-semibold select-none';

  const fadeRightClass =
    variant === 'pills'
      ? 'bg-gradient-to-l from-slate-200 via-slate-200/85 to-transparent'
      : 'bg-gradient-to-l from-white via-white/85 to-transparent';

  const fadeLeftClass =
    variant === 'pills'
      ? 'bg-gradient-to-r from-slate-200 via-slate-200/85 to-transparent'
      : 'bg-gradient-to-r from-white via-white/85 to-transparent';

  const arrowBtnClass =
    variant === 'pills'
      ? 'size-8 sm:size-9 shrink-0 rounded-xl bg-white/90 hover:bg-white border border-slate-300/80 text-slate-700 flex items-center justify-center shadow-2xs transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed'
      : 'size-8 sm:size-9 shrink-0 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shadow-2xs transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed';

  return (
    <nav className={`${wrapperClasses} ${className}`} dir="rtl">
      <div className="flex items-center gap-1.5 w-full min-w-0">
        {/* فلش راست (انتقال به تب قبلی در چیدمان راست‌به‌چپ) */}
        {isOverflowing && (
          <button
            type="button"
            onClick={() => handleStep(-1)}
            disabled={!canGoPrev}
            aria-label="تب قبلی"
            title="تب قبلی"
            className={arrowBtnClass}
          >
            <ChevronRight className="size-4" />
          </button>
        )}

        {/* کانتینر اسکرول تب‌ها به همراه افکت فید در دو طرف */}
        <div className="relative flex-1 min-w-0">
          <div
            ref={scrollRef}
            className={`flex items-center gap-2 touch-pan-x ${desktopGridClassName} ${
              isOverflowing
                ? 'overflow-x-auto visible-tab-scrollbar pb-2'
                : 'overflow-x-hidden'
            }`}
          >
            {/* فاصله ابتدایی برای قرارگیری دقیق اولین تب در مرکز هنگام اسکرول */}
            {isOverflowing && <div className="w-[24%] shrink-0" aria-hidden="true" />}

            {items.map((item) => {
              const IconComp = item.icon;
              const isActive = item.id === activeId;

              let btnClass = '';
              if (variant === 'dossier') {
                btnClass = `h-10 sm:h-12 shrink-0 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 text-center whitespace-nowrap cursor-pointer px-3.5 sm:px-2 ${
                  isActive
                    ? 'bg-[#173f6b] text-white shadow-sm ring-1 ring-[#173f6b] opacity-100'
                    : `text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 ${
                        isOverflowing ? 'opacity-70 hover:opacity-100' : ''
                      }`
                }`;
              } else if (variant === 'pills') {
                btnClass = `shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#173f6b] text-white shadow-xs opacity-100'
                    : `text-slate-600 hover:bg-white/80 ${
                        isOverflowing ? 'opacity-70 hover:opacity-100' : ''
                      }`
                }`;
              } else {
                btnClass = `shrink-0 flex items-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-bold opacity-100'
                    : `border-transparent text-slate-500 hover:text-slate-800 ${
                        isOverflowing ? 'opacity-70 hover:opacity-100' : ''
                      }`
                }`;
              }

              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[item.id] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(item.id)}
                  className={btnClass}
                >
                  {IconComp && <IconComp className="size-3.5 sm:size-4 shrink-0" />}
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* فاصله انتهایی برای قرارگیری دقیق آخرین تب در مرکز هنگام اسکرول */}
            {isOverflowing && <div className="w-[24%] shrink-0" aria-hidden="true" />}
          </div>

          {/* گرادیانت فید دو طرف تب فعال (بالاتر از نوار اسکرول تا خود اسکرول‌بار کاملاً شفاف و خوانا بماند) */}
          {isOverflowing && (
            <>
              <div
                className={`pointer-events-none absolute top-0 bottom-2 right-0 w-7 sm:w-10 ${fadeRightClass}`}
                aria-hidden="true"
              />
              <div
                className={`pointer-events-none absolute top-0 bottom-2 left-0 w-7 sm:w-10 ${fadeLeftClass}`}
                aria-hidden="true"
              />
            </>
          )}
        </div>

        {/* فلش چپ (انتقال به تب بعدی در چیدمان راست‌به‌چپ) */}
        {isOverflowing && (
          <button
            type="button"
            onClick={() => handleStep(1)}
            disabled={!canGoNext}
            aria-label="تب بعدی"
            title="تب بعدی"
            className={arrowBtnClass}
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
      </div>
    </nav>
  );
};
