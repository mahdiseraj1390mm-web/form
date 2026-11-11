'use client';

import React, { useState, useRef, useEffect } from 'react';
import { EvaluationComponentScore } from '@/types/form';
import { toPersianDigits } from '@/lib/persian';

interface SvgRadarChartProps {
  items: EvaluationComponentScore[];
  size?: number;
  primaryColor?: string;
}

export const SvgRadarChart: React.FC<SvgRadarChartProps> = ({
  items,
  size = 520,
  primaryColor = '#0284c7',
}) => {
  const [hoveredItem, setHoveredItem] = useState<EvaluationComponentScore | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollWidth > el.clientWidth) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, [items.length, size]);

  if (!items || items.length < 3) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        داده‌های کافی برای رسم نمودار چندبعدی وجود ندارد (حداقل ۳ مؤلفه لازم است).
      </div>
    );
  }

  const center = size / 2;
  const radius = Math.round(size * 0.336);
  const labelOffset = Math.round(size * 0.06);
  const padX = radius + Math.max(185, Math.round(size * 0.36));
  const padY = radius + Math.max(62, Math.round(size * 0.13));
  const vbX = center - padX;
  const vbY = center - padY;
  const vbW = padX * 2;
  const vbH = padY * 2;
  const labelFontSize = size < 460 ? 9 : 10;
  const labelHoverFontSize = size < 460 ? 10.5 : 11.5;

  const count = items.length;
  const angleStep = (Math.PI * 2) / count;

  // سطوح دایره‌ای راهنما
  const levels = [20, 40, 60, 80, 100];

  // محاسبه نقاط چندضلعی و خطوط محور
  const polygonPoints: string[] = [];
  const axisLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const labels: Array<{
    x: number;
    y: number;
    textAnchor: 'start' | 'middle' | 'end';
    item: EvaluationComponentScore;
    vx: number;
    vy: number;
  }> = [];

  items.forEach((item, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const xOuter = center + Math.cos(angle) * radius;
    const yOuter = center + Math.sin(angle) * radius;
    axisLines.push({ x1: center, y1: center, x2: xOuter, y2: yOuter });

    // نقطه نمره روی نمودار
    const clampedScore = Math.max(0, Math.min(100, item.score));
    const valR = (clampedScore / 100) * radius;
    const vx = center + Math.cos(angle) * valR;
    const vy = center + Math.sin(angle) * valR;
    polygonPoints.push(`${vx.toFixed(1)},${vy.toFixed(1)}`);

    // موقعیت برچسب
    const labelR = radius + labelOffset;
    const lx = center + Math.cos(angle) * labelR;
    const ly = center + Math.sin(angle) * labelR;

    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    if (Math.cos(angle) > 0.3) textAnchor = 'start';
    else if (Math.cos(angle) < -0.3) textAnchor = 'end';

    labels.push({ x: lx, y: ly, textAnchor, item, vx, vy });
  });

  const polygonStr = polygonPoints.join(' ');

  return (
    <div className="relative w-full min-w-0 max-w-[600px] mx-auto select-none">
      <div
        ref={scrollRef}
        dir="ltr"
        className="w-full max-w-full overflow-x-auto pb-2 custom-scrollbar"
      >
        <div className="w-full min-w-[500px] sm:min-w-0" dir="rtl">
          <svg
            viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
            className="w-full h-auto drop-shadow-xs block"
          >
        <defs>
          <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.4" />
            <stop offset="70%" stopColor={primaryColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.05" />
          </radialGradient>
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={primaryColor} floodOpacity="0.3" />
          </filter>
        </defs>

        {/* دایره‌ها و خطوط شبکه پس‌زمینه */}
        {levels.map((lvl) => {
          const r = (lvl / 100) * radius;
          return (
            <g key={lvl}>
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={lvl === 100 ? 'none' : '3,3'}
              />
              <text
                x={center + 4}
                y={center - r + 11}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="var(--font-vazirmatn), Vazirmatn, sans-serif"
                className="font-medium"
              >
                {toPersianDigits(lvl)}
              </text>
            </g>
          );
        })}

        {/* خطوط محور از مرکز به بیرون */}
        {axisLines.map((l, idx) => (
          <line
            key={idx}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        ))}

        {/* چندضلعی پرشده مقادیر مراجع */}
        <polygon
          points={polygonStr}
          fill="url(#radarFillGrad)"
          stroke={primaryColor}
          strokeWidth="2.5"
          filter="url(#radarGlow)"
          className="transition-all duration-700 ease-out"
        />

        {/* نقاط گره‌ها و متن عناوین */}
        {labels.map((lbl, idx) => {
          const isHovered = hoveredItem?.code === lbl.item.code;
          return (
            <g
              key={idx}
              className="cursor-pointer transition-transform duration-200"
              onMouseEnter={() => setHoveredItem(lbl.item)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* نقطه روی نمودار */}
              <circle
                cx={lbl.vx}
                cy={lbl.vy}
                r={isHovered ? 6 : 4}
                fill={isHovered ? '#f97316' : primaryColor}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-200"
              />

              {/* برچسب متن */}
              <text
                x={lbl.x}
                y={lbl.y + 4}
                textAnchor={lbl.textAnchor}
                fontSize={isHovered ? labelHoverFontSize : labelFontSize}
                fontWeight={isHovered ? '800' : '600'}
                fontFamily="var(--font-vazirmatn), Vazirmatn, sans-serif"
                fill={isHovered ? '#0284c7' : '#334155'}
                className="transition-colors duration-200 select-none font-sans"
              >
                {lbl.item.code}. {lbl.item.title.length > 15 ? lbl.item.title.slice(0, 14) + '…' : lbl.item.title} ({toPersianDigits(lbl.item.score)})
              </text>
            </g>
          );
        })}
          </svg>
        </div>
      </div>

      {/* تول‌تیپ تعاملی شناور روی هاور */}
      {hoveredItem && (
        <div
          dir="rtl"
          className="absolute top-2 left-2 z-10 bg-slate-900/95 text-white px-3 py-2 rounded-xl text-xs shadow-lg backdrop-blur-xs border border-slate-700 max-w-xs animate-in fade-in zoom-in-95 pointer-events-none"
        >
          <div className="flex items-center justify-between gap-3 font-bold border-b border-slate-800 pb-1 mb-1">
            <span>مؤلفه {toPersianDigits(hoveredItem.code)}: {hoveredItem.title}</span>
            <span className="text-sky-400 font-mono">نمره: {toPersianDigits(hoveredItem.score)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>فاصله رشد: {toPersianDigits(hoveredItem.growthGap)}%</span>
            <span style={{ color: hoveredItem.statusColor }}>{hoveredItem.statusLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
};
