'use client';

import React from 'react';
import { toPersianDigits } from '@/lib/persian';

export interface BarChartItem {
  id?: string;
  label: string;
  value: number;
  percentage?: number;
  secondaryLabel?: string;
  color?: string;
  badge?: string;
}

interface VerticalBarChartProps {
  data: BarChartItem[];
  title?: string;
  subtitle?: string;
  unit?: string;
  height?: number; // px, default 200
  barColor?: string;
  showValues?: boolean;
}

export const VerticalBarChart: React.FC<VerticalBarChartProps> = ({
  data,
  title,
  subtitle,
  unit = '',
  height = 200,
  barColor = 'bg-[#173f6b]',
  showValues = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        داده‌ای برای نمایش در نمودار میله‌ای وجود ندارد.
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full space-y-3">
      {(title || subtitle) && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            {title && <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{title}</h4>}
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {unit && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              واحد: {unit}
            </span>
          )}
        </div>
      )}

      {/* ناحیه نمودار میله‌ای عمودی */}
      <div
        className="w-full flex items-end justify-between gap-2 sm:gap-4 pt-8 pb-2 px-1 sm:px-3 bg-slate-50/60 rounded-2xl border border-slate-100"
        style={{ minHeight: `${height}px` }}
      >
        {data.map((item, idx) => {
          const pct = Math.max(0, Math.min(100, Math.round((item.value / maxValue) * 100)));
          const displayPct = item.percentage !== undefined ? item.percentage : pct;
          const barBg = item.color || barColor;

          return (
            <div
              key={item.id || idx}
              className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group relative"
            >
              {/* مقدار بالای میله */}
              {showValues && (
                <div className="mb-1.5 flex flex-col items-center transition-all group-hover:-translate-y-0.5">
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

              {/* کانتینر میله با زمینه خاکستری برای مقیاس */}
              <div
                className="w-full max-w-[44px] bg-slate-200/70 rounded-t-xl relative flex items-end justify-center overflow-hidden transition-all duration-300 group-hover:bg-slate-200"
                style={{ height: `${height - 70}px` }}
              >
                {/* میله عمودی پر شونده */}
                <div
                  className={`w-full rounded-t-xl transition-all duration-700 ease-out shadow-xs ${barBg}`}
                  style={{
                    height: `${Math.max(pct, 6)}%`,
                  }}
                />
              </div>

              {/* عنوان زیر میله */}
              <div className="mt-2 text-center w-full px-0.5">
                <span
                  className="block text-[10px] sm:text-[11px] font-bold text-slate-700 truncate"
                  title={item.label}
                >
                  {item.label}
                </span>
                {item.secondaryLabel && (
                  <span className="block text-[9px] text-slate-400 truncate">
                    {item.secondaryLabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
