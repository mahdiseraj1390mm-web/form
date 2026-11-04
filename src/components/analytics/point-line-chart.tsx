'use client';

import React, { useState } from 'react';
import { toPersianDigits } from '@/lib/persian';

export interface PointLineChartItem {
  id?: string | number;
  label: string;
  value: number;
  secondaryLabel?: string;
  badge?: string;
  tooltip?: string;
  color?: string;
}

interface PointLineChartProps {
  data: PointLineChartItem[];
  title?: string;
  subtitle?: string;
  unit?: string;
  height?: number; // default 220
  lineColor?: string; // hex, default #173f6b
  areaColor?: string; // hex
  showPoints?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  minScale?: number;
  maxScale?: number;
  badgeText?: string;
}

export const PointLineChart: React.FC<PointLineChartProps> = ({
  data,
  title,
  subtitle,
  unit = '',
  height = 220,
  lineColor = '#173f6b',
  areaColor,
  showPoints = true,
  showValues = true,
  showGrid = true,
  minScale = 0,
  maxScale,
  badgeText = 'نمودار نقطه و خط پیشرفت',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        داده‌ای برای نمایش در نمودار نقطه و خط وجود ندارد.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const dataMax = Math.max(...values, 1);
  const resolvedMax = maxScale !== undefined ? maxScale : Math.ceil(dataMax * 1.15);
  const resolvedMin = minScale;
  const valueRange = Math.max(resolvedMax - resolvedMin, 1);

  // مختصات ابعاد SVG
  const svgWidth = 600;
  const svgHeight = height;
  const paddingX = 56;
  const paddingTop = 42;
  const paddingBottom = 45;

  const chartInnerWidth = svgWidth - paddingX * 2;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  // محاسبه مختصات نقاط (X و Y)
  const points = data.map((item, idx) => {
    const x =
      data.length === 1
        ? svgWidth / 2
        : paddingX + (idx / (data.length - 1)) * chartInnerWidth;
    const clampedVal = Math.min(Math.max(item.value, resolvedMin), resolvedMax);
    const normalizedY = (clampedVal - resolvedMin) / valueRange;
    const y = svgHeight - paddingBottom - normalizedY * chartInnerHeight;
    return { x, y, item, idx };
  });

  // تولید مسیر Bezier نرم برای خط نمودار
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const linePath = buildSmoothPath(points);

  // مسیر سطح زیر خط (ناحیه گرادینت)
  const baselineY = svgHeight - paddingBottom;
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
      : '';

  // خطوط افقی گرید (۰٪، ۲۵٪، ۵۰٪، ۷۵٪، ۱۰۰٪)
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];
  const gradientId = `point-line-gradient-${lineColor.replace('#', '')}-${Math.floor(svgHeight)}`;

  // محاسبه جهت پیشرفت (مثبت، خنثی، نیازمند بهبود)
  const firstVal = data[0]?.value || 0;
  const lastVal = data[data.length - 1]?.value || 0;
  const delta = lastVal - firstVal;
  const isPositiveProgress = delta > 0;

  return (
    <div className="w-full space-y-3">
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1.5">
          <div>
            {title && (
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>{title}</span>
              </h4>
            )}
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {badgeText && (
              <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full shrink-0">
                {badgeText}
              </span>
            )}
            {data.length > 1 && (
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  isPositiveProgress
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : delta === 0
                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isPositiveProgress ? '▲ رشد ' : delta < 0 ? '▼ تغییر ' : '● تثبیت '}
                {toPersianDigits(Math.abs(delta))} {unit}
              </span>
            )}
          </div>
        </div>
      )}

      {/* محدوده اصلی رسم نمودار نقطه و خط */}
      <div className="relative w-full bg-slate-50/70 rounded-2xl border border-slate-100/90 p-2 sm:p-3 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          style={{ maxHeight: `${height + 30}px` }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaColor || lineColor} stopOpacity="0.25" />
              <stop offset="60%" stopColor={areaColor || lineColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={areaColor || lineColor} stopOpacity="0.00" />
            </linearGradient>
            <filter id="point-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={lineColor} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* خطوط شبکه و برچسب‌های محور Y */}
          {showGrid &&
            gridSteps.map((step) => {
              const yPos = svgHeight - paddingBottom - step * chartInnerHeight;
              const stepVal = Math.round(resolvedMin + step * valueRange);
              return (
                <g key={step}>
                  <line
                    x1={paddingX - 10}
                    y1={yPos}
                    x2={svgWidth - paddingX + 10}
                    y2={yPos}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={step === 0 ? '0' : '3,3'}
                  />
                  <text
                    x={paddingX - 12}
                    y={yPos + 3}
                    textAnchor="end"
                    className="text-[9.5px] fill-slate-400 font-mono select-none"
                  >
                    {toPersianDigits(stepVal)}
                  </text>
                </g>
              );
            })}

          {/* ناحیه گرادینت زیر خط پیشرفت */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* خط ممتد پیشرفت (Line) */}
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-700 ease-out"
          />

          {/* خط اتصال عمودی نقطه فعال به محور افقی هنگام Hover */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <line
              x1={points[hoveredIdx].x}
              y1={paddingTop}
              x2={points[hoveredIdx].x}
              y2={baselineY}
              stroke={lineColor}
              strokeWidth="1.5"
              strokeDasharray="2,2"
              opacity="0.6"
            />
          )}

          {/* نقاط عطف پیشرفت (Points / Dots) */}
          {showPoints &&
            points.map((pt) => {
              const isHovered = hoveredIdx === pt.idx;
              const ptColor = pt.item.color || lineColor;

              return (
                <g
                  key={pt.item.id || pt.idx}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredIdx(pt.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* هاله بیرونی نقطه */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 12 : 7.5}
                    fill={ptColor}
                    opacity={isHovered ? 0.35 : 0.18}
                    className="transition-all duration-300"
                  />

                  {/* بدنه سفید نقطه */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6.5 : 5}
                    fill="#ffffff"
                    stroke={ptColor}
                    strokeWidth="2.8"
                    filter="url(#point-glow)"
                    className="transition-all duration-200"
                  />

                  {/* هسته مرکزی نقطه */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 3.5 : 2.2}
                    fill={ptColor}
                    className="transition-all duration-200"
                  />

                  {/* مقدار بالای هر نقطه */}
                  {showValues && (
                    <g
                      transform={`translate(${pt.x}, ${Math.max(16, pt.y - (isHovered ? 16 : 12))})`}
                      className="transition-transform duration-200"
                    >
                      <rect
                        x="-20"
                        y="-14"
                        width="40"
                        height="16"
                        rx="5"
                        fill={isHovered ? ptColor : '#ffffff'}
                        stroke={isHovered ? ptColor : '#cbd5e1'}
                        strokeWidth="1"
                        className="transition-colors duration-200"
                      />
                      <text
                        x="0"
                        y="-3"
                        textAnchor="middle"
                        className={`text-[9.5px] font-mono font-black ${
                          isHovered ? 'fill-white' : 'fill-slate-800'
                        }`}
                      >
                        {toPersianDigits(pt.item.value)}
                        {unit}
                      </text>
                    </g>
                  )}

                  {/* برچسب محور افقی (X) زیر نقطه */}
                  <g transform={`translate(${pt.x}, ${baselineY + 16})`}>
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      className={`text-[10px] font-bold select-none ${
                        isHovered ? 'fill-slate-900 font-black' : 'fill-slate-600'
                      }`}
                    >
                      {pt.item.label}
                    </text>
                    {pt.item.secondaryLabel && (
                      <text
                        x="0"
                        y="12"
                        textAnchor="middle"
                        className="text-[8.5px] fill-slate-400 font-mono select-none"
                      >
                        {pt.item.secondaryLabel}
                      </text>
                    )}
                  </g>
                </g>
              );
            })}
        </svg>

        {/* کارت راهنما یا توضیحات تعاملی نقطه فعال در پایین */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div className="mt-2 p-2 rounded-xl bg-white/95 border border-slate-200/90 shadow-2xs text-xs flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: points[hoveredIdx].item.color || lineColor }}
              />
              <span className="font-bold text-slate-800">
                {points[hoveredIdx].item.label}
              </span>
              {points[hoveredIdx].item.badge && (
                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                  {points[hoveredIdx].item.badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-500 text-[11px]">
                {points[hoveredIdx].item.tooltip ? 'وضعیت:' : 'مقدار:'}
              </span>
              <span className="font-black text-slate-900 text-xs">
                {points[hoveredIdx].item.tooltip || `${toPersianDigits(points[hoveredIdx].item.value)} ${unit}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
