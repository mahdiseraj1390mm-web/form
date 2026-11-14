'use client';

import React, { useState } from 'react';
import { toPersianDigits } from '@/lib/persian';

export interface PieChartItem {
  id?: string | number;
  label: string;
  value: number;
  percentage?: number;
  color: string;
  secondaryLabel?: string;
  desc?: string;
  badge?: string;
}

export interface PieChartProps {
  data: PieChartItem[];
  title?: string;
  subtitle?: string;
  unit?: string;
  size?: number; // default 210
  badgeText?: string;
  donut?: boolean; // default false: true pizza/pie sliced chart
  donutThickness?: number;
  showLegend?: boolean;
  showSliceLabels?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  subtitle,
  unit = 'نفر',
  size = 210,
  badgeText,
  donut = false,
  donutThickness = 42,
  showLegend = true,
  showSliceLabels = true,
  centerLabel,
  centerValue,
  className = '',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        داده‌ای برای نمایش در نمودار دایره‌ای وجود ندارد.
      </div>
    );
  }

  const totalValue = data.reduce((acc, item) => acc + (Math.max(0, item.value) || 0), 0);

  if (totalValue <= 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        مجموع داده‌ها صفر است و امکان ترسیم نمودار دایره‌ای وجود ندارد.
      </div>
    );
  }

  const center = size / 2;
  // Margin for the pizza pull-out effect on hover
  const pullOutDistance = 9;
  const radius = center - pullOutDistance - 4;
  const innerRadius = donut ? radius - donutThickness : 0;

  // محاسبه برش‌های پیتزایی
  let currentAngle = -Math.PI / 2; // شروع از ساعت ۱۲

  const slices = data.map((item, idx) => {
    const val = Math.max(0, item.value);
    const fraction = totalValue > 0 ? val / totalValue : 0;
    const angleSpan = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    currentAngle = endAngle;

    const midAngle = startAngle + angleSpan / 2;
    const dx = Math.cos(midAngle) * pullOutDistance;
    const dy = Math.sin(midAngle) * pullOutDistance;

    const pct = item.percentage !== undefined ? item.percentage : Math.round(fraction * 100);

    // محاسبه مختصات کمان بیرونی
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArcFlag = angleSpan > Math.PI ? 1 : 0;

    let path = '';
    const isFullCircle = Math.abs(angleSpan - 2 * Math.PI) < 0.001 || data.filter((d) => d.value > 0).length === 1;

    if (!isFullCircle) {
      if (donut && innerRadius > 0) {
        // دونات با کمان درونی
        const ix1 = center + innerRadius * Math.cos(endAngle);
        const iy1 = center + innerRadius * Math.sin(endAngle);
        const ix2 = center + innerRadius * Math.cos(startAngle);
        const iy2 = center + innerRadius * Math.sin(startAngle);
        path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix1.toFixed(2)} ${iy1.toFixed(2)} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)} Z`;
      } else {
        // برش اصیل پیتزایی (قطاع دایره‌ای متصل به مرکز)
        path = `M ${center.toFixed(2)} ${center.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
      }
    }

    // محل قرارگیری درصد داخل برش
    const textRadius = donut ? (radius + innerRadius) / 2 : radius * 0.63;
    const tx = center + textRadius * Math.cos(midAngle);
    const ty = center + textRadius * Math.sin(midAngle);

    return {
      item,
      idx,
      fraction,
      pct,
      path,
      isFullCircle,
      angleSpan,
      dx,
      dy,
      tx,
      ty,
      midAngle,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className={`w-full min-w-0 space-y-3 ${className}`}>
      {/* هدر اختیاری نمودار */}
      {(title || subtitle || badgeText) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1.5">
          <div className="min-w-0">
            {title && (
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                {title}
              </h4>
            )}
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {badgeText && (
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              {badgeText}
            </span>
          )}
        </div>
      )}

      {/* بخش اصلی: نمودار دایره‌ای پیتزایی + راهنمای آماری */}
      <div className="p-3 sm:p-4 bg-slate-50/70 rounded-2xl border border-slate-100/90">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
          
          {/* کانتینر نمودار دایره‌ای SVG */}
          <div className="relative shrink-0 flex items-center justify-center p-2">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="overflow-visible select-none drop-shadow-sm"
              role="img"
              aria-label="نمودار دایره‌ای پیتزایی"
            >
              {slices.map((slice) => {
                if (slice.item.value <= 0) return null;
                const isHovered = hoveredIdx === slice.idx;

                return (
                  <g
                    key={slice.item.id || slice.idx}
                    className="cursor-pointer transition-transform duration-250 ease-out"
                    style={{
                      transform: isHovered
                        ? `translate(${slice.dx.toFixed(2)}px, ${slice.dy.toFixed(2)}px)`
                        : 'translate(0px, 0px)',
                    }}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setHoveredIdx(hoveredIdx === slice.idx ? null : slice.idx)}
                  >
                    {slice.isFullCircle ? (
                      <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill={slice.item.color}
                        stroke="#ffffff"
                        strokeWidth={2.5}
                        className="transition-all duration-200"
                        style={{
                          filter: isHovered
                            ? 'brightness(1.08) drop-shadow(0 4px 10px rgba(0,0,0,0.22))'
                            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))',
                        }}
                      />
                    ) : (
                      <path
                        d={slice.path}
                        fill={slice.item.color}
                        stroke="#ffffff"
                        strokeWidth={2.5}
                        strokeLinejoin="round"
                        className="transition-all duration-200"
                        style={{
                          filter: isHovered
                            ? 'brightness(1.08) drop-shadow(0 5px 12px rgba(0,0,0,0.25))'
                            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))',
                        }}
                      />
                    )}

                    {/* درج درصد در داخل برش اگر زاویه برش به اندازه کافی پهن باشد */}
                    {showSliceLabels && slice.angleSpan >= 0.42 && (
                      <text
                        x={slice.tx.toFixed(2)}
                        y={slice.ty.toFixed(2)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        className="text-[11px] sm:text-xs font-black font-mono select-none pointer-events-none"
                        style={{
                          textShadow: '0 1px 3px rgba(0,0,0,0.65)',
                        }}
                      >
                        {toPersianDigits(slice.pct)}٪
                      </text>
                    )}
                  </g>
                );
              })}

              {/* سوراخ وسط در صورت فعال بودن دونات */}
              {donut && innerRadius > 0 && (
                <circle
                  cx={center}
                  cy={center}
                  r={innerRadius}
                  fill="#ffffff"
                  className="pointer-events-none"
                />
              )}
            </svg>

            {/* کادر شناور راهنمای سریع هنگام مکث موس (Tooltip) */}
            {activeSlice && (
              <div className="absolute -top-3 z-30 pointer-events-none bg-slate-900/95 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl border border-slate-700/80 whitespace-nowrap flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-1.5 font-bold">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: activeSlice.item.color }}
                  />
                  <span>{activeSlice.item.label}</span>
                </div>
                <div className="font-mono font-black text-amber-300 mt-0.5">
                  {toPersianDigits(activeSlice.item.value)} {unit} ({toPersianDigits(activeSlice.pct)}٪)
                </div>
                <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-2.5 mt-0.5" />
              </div>
            )}
          </div>

          {/* راهنمای آماری کارت‌ها (Legend / Stat Blocks) */}
          {showLegend && (
            <div className="flex-1 w-full space-y-2 sm:space-y-2.5 min-w-0">
              {slices.map((slice) => {
                const isHovered = hoveredIdx === slice.idx;

                return (
                  <div
                    key={slice.item.id || slice.idx}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setHoveredIdx(hoveredIdx === slice.idx ? null : slice.idx)}
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                      isHovered
                        ? 'bg-white border-slate-400 shadow-md ring-2 ring-sky-200/80 -translate-y-0.5'
                        : 'bg-white/85 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                    style={{
                      borderRightColor: slice.item.color,
                      borderRightWidth: '4px',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-2 ring-white"
                          style={{ backgroundColor: slice.item.color }}
                        />
                        <span className="text-xs font-black text-slate-800 truncate">
                          {slice.item.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 shrink-0 font-mono">
                        <span
                          className="text-base sm:text-lg font-black"
                          style={{ color: slice.item.color }}
                        >
                          {toPersianDigits(slice.pct)}٪
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100/80">
                      <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {slice.item.desc || slice.item.secondaryLabel || 'تفکیک آماری'}
                      </span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10.5px]">
                        {toPersianDigits(slice.item.value)} {unit}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* خلاصه کل مراجعین */}
              <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400 font-mono">
                <span>کل مراجعان بررسی‌شده:</span>
                <span className="font-bold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md">
                  {toPersianDigits(totalValue)} {unit}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
