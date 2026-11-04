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

  return (
    <div className="w-full space-y-3">
      {(title || subtitle || badgeText || unit) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1.5">
          <div>
            {title && (
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                {title}
              </h4>
            )}
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
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

      {/* کانتینر اسکرول در صورت زیاد بودن تعداد میله‌ها */}
      <div className={isScrollNeeded ? 'w-full overflow-x-auto pb-2 custom-scrollbar' : 'w-full'}>
        <div
          className={`w-full flex items-end justify-between gap-2 sm:gap-3.5 pt-8 pb-3 px-2 sm:px-4 bg-slate-50/70 rounded-2xl border border-slate-100/90 relative ${
            isScrollNeeded ? 'min-w-[520px]' : ''
          }`}
          style={{ minHeight: `${height}px` }}
        >
          {/* خطوط کمکی مقیاس پس‌زمینه (۲۵٪، ۵۰٪، ۷۵٪، ۱۰۰٪) */}
          <div className="absolute inset-x-0 bottom-12 top-7 pointer-events-none flex flex-col justify-between px-3 opacity-30">
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
                className="flex-1 flex flex-col items-center justify-end h-full min-w-[38px] group relative cursor-pointer z-10"
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

      {/* نوار راهنمای تعاملی کوچک در زیر نمودار در صورت هاور */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs flex items-center justify-between animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor:
                  data[hoveredIdx].color && (data[hoveredIdx].color!.startsWith('#') || data[hoveredIdx].color!.startsWith('rgb'))
                    ? data[hoveredIdx].color
                    : '#173f6b',
              }}
            />
            <span className="font-bold text-slate-800">{data[hoveredIdx].label}</span>
            {data[hoveredIdx].badge && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                {data[hoveredIdx].badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-500 text-[11px]">مقدار:</span>
            <span className="font-black text-slate-900 text-xs">
              {toPersianDigits(data[hoveredIdx].value)} {unit}
            </span>
            {data[hoveredIdx].percentage !== undefined && (
              <span className="text-[11px] text-slate-400">
                ({toPersianDigits(data[hoveredIdx].percentage)}٪)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
