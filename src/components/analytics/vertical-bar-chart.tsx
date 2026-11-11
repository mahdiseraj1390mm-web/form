'use client';

import React, { useState } from 'react';
import { toPersianDigits } from '@/lib/persian';

export interface BarChartItem {
  id?: string;
  label: string;
  value: number;
  percentage?: number;
  secondaryLabel?: string;
  color?: string; // hex or Tailwind bg class
  badge?: string;
}

interface VerticalBarChartProps {
  data: BarChartItem[];
  title?: string;
  subtitle?: string;
  unit?: string;
  height?: number; // px, default 200
  barColor?: string; // default bg-[#173f6b]
  showValues?: boolean;
  maxScale?: number; // fixed maximum scale (e.g. 100 for percentages)
  badgeText?: string;
  scrollable?: boolean; // enable horizontal scroll for many items
}

export const VerticalBarChart: React.FC<VerticalBarChartProps> = ({
  data,
  title,
  subtitle,
  unit = '',
  height = 200,
  barColor = 'bg-[#173f6b]',
  showValues = true,
  maxScale,
  badgeText,
  scrollable,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        داده‌ای برای نمایش در نمودار میله‌ای وجود ندارد.
      </div>
    );
  }

  const rawMax = Math.max(...data.map((d) => d.value), 1);
  const maxValue = maxScale !== undefined ? maxScale : rawMax;
  const isScrollNeeded = scrollable || data.length > 7;
  const minChartWidth = isScrollNeeded
    ? Math.max(520, data.length * 68)
    : Math.max(240, data.length * 56 + 24);

  return (
    <div className="w-full min-w-0 space-y-3">
      {(title || subtitle || badgeText || unit) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1.5">
          <div className="min-w-0">
            {title && (
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                {title}
              </h4>
            )}
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {badgeText && (
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {badgeText}
              </span>
            )}
            {unit && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                واحد: {unit}
              </span>
            )}
          </div>
        </div>
      )}

      {/* کانتینر اسکرول افقی اختصاصی نمودار (در موبایل یا هنگام زیاد بودن تعداد میله‌ها فقط خود نمودار اسکرول می‌خورد) */}
      <div className="w-full max-w-full min-w-0 overflow-x-auto pb-2 custom-scrollbar">
        <div
          className="w-full flex items-end justify-between gap-2 sm:gap-3.5 pt-14 pb-3 px-2 sm:px-4 bg-slate-50/70 rounded-2xl border border-slate-100/90 relative"
          style={{ minHeight: `${height}px`, minWidth: `${minChartWidth}px` }}
        >
          {/* خطوط کمکی مقیاس پس‌زمینه (۲۵٪، ۵۰٪، ۷۵٪، ۱۰۰٪) */}
          <div className="absolute inset-x-0 bottom-12 top-12 pointer-events-none flex flex-col justify-between px-3 opacity-30">
            <div className="border-b border-dashed border-slate-300 w-full" />
            <div className="border-b border-dashed border-slate-300 w-full" />
            <div className="border-b border-dashed border-slate-300 w-full" />
            <div className="border-b border-slate-300 w-full" />
          </div>

          {data.map((item, idx) => {
            const pct = Math.max(0, Math.min(100, Math.round((item.value / maxValue) * 100)));
            const displayPct = item.percentage !== undefined ? item.percentage : pct;
            const barBg = item.color || barColor;
            const isHexOrRgb = barBg.startsWith('#') || barBg.startsWith('rgb');
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.id || idx}
                className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group relative cursor-pointer z-10"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* مقدار بالای میله */}
                {showValues && (
                  <div className={`mb-1.5 flex flex-col items-center transition-all duration-200 ${isHovered ? '-translate-y-1 scale-105' : ''}`}>
                    <span className="text-[11px] sm:text-xs font-black font-mono text-slate-800 tabular-nums">
                      {toPersianDigits(item.value)}
                    </span>
                    {item.percentage !== undefined && (
                      <span className="text-[9px] font-bold text-slate-400 font-mono">
                        {toPersianDigits(displayPct)}٪
                      </span>
                    )}
                  </div>
                )}

                {/* استوانه یا کانتینر مقیاس میله عمودی */}
                <div
                  className={`w-full max-w-[48px] bg-slate-200/60 rounded-t-xl relative flex items-end justify-center overflow-hidden transition-all duration-300 ${
                    isHovered ? 'bg-slate-200 ring-2 ring-sky-300/60' : 'group-hover:bg-slate-200/80'
                  }`}
                  style={{ height: `${height - 75}px` }}
                >
                  {/* میله عمودی پر شونده */}
                  <div
                    className={`w-full rounded-t-xl transition-all duration-700 ease-out shadow-xs ${!isHexOrRgb ? barBg : ''}`}
                    style={{
                      height: `${Math.max(pct, 5)}%`,
                      backgroundColor: isHexOrRgb ? barBg : undefined,
                      filter: isHovered ? 'brightness(1.08)' : undefined,
                    }}
                  />
                </div>

                {/* عنوان و برچسب زیر میله */}
                {/* کادر شناور راهنما (Tooltip) - دقیقاً هنگام مکث موس زیر/بالای ستون ظاهر می‌شود و هنگام خروج ناپدید می‌گردد */}
                {isHovered && (
                  <div className="absolute -top-12 z-30 pointer-events-none bg-slate-900/95 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl border border-slate-700/80 whitespace-nowrap flex flex-col items-center animate-in fade-in zoom-in-95 duration-100">
                    <span className="font-bold">{item.label}</span>
                    <span className="font-mono font-black text-amber-300">
                      {toPersianDigits(item.value)} {unit} {item.percentage !== undefined ? `(${toPersianDigits(item.percentage)}٪)` : ''}
                    </span>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-2.5 mt-0.5" />
                  </div>
                )}

                <div className="mt-2 text-center w-full px-0.5">
                  <span
                    className={`block text-[10.5px] sm:text-[11px] truncate select-none transition-colors ${
                      isHovered ? 'font-black text-slate-900' : 'font-bold text-slate-700'
                    }`}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                  {item.secondaryLabel && (
                    <span className="block text-[9px] text-slate-400 truncate font-mono">
                      {item.secondaryLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
