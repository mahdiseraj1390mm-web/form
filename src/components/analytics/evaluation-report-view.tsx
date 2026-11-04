'use client';

import React, { useState } from 'react';
import { EvaluationResult, Form } from '@/types/form';
import { SvgRadarChart } from './radar-chart';
import { VerticalBarChart } from './vertical-bar-chart';
import { PointLineChart } from './point-line-chart';
import { toPersianDigits } from '@/lib/persian';
import { getFourColorByIndex, getSemanticColorByPercentage } from '@/lib/chart-colors';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  HeartHandshake,
  BarChart3,
  LineChart,
} from 'lucide-react';

interface EvaluationReportViewProps {
  evaluation: EvaluationResult;
  formTitle?: string;
}

export const EvaluationReportView: React.FC<EvaluationReportViewProps> = ({
  evaluation,
  formTitle = 'ارزیابی خودسنجی',
}) => {
  const [componentChartType, setComponentChartType] = useState<'radar' | 'bar' | 'line'>('bar');
  // تفکیک مؤلفه‌ها برای نمودار رادار (معمولاً بخش اول یا مؤلفه‌های ۱ تا ۱۶)
  const radarComponents =
    evaluation.componentScores.length > 16
      ? evaluation.componentScores.slice(0, 16)
      : evaluation.componentScores;

  // مؤلفه غایت قرآنی ـ ولایی (مؤلفه ۱۷) در صورت وجود
  const faithComponent = evaluation.componentScores.find((c) => c.code === 17);

  return (
    <div className="space-y-6">
      {/* کارت‌های شاخص‌های کلیدی (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* میانگین کل */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">نمره کل ارزیابی</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {toPersianDigits(evaluation.overallScore)}
              </span>
              <span className="text-xs font-semibold text-slate-400">از ۱۰۰</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* میانگین سلامت رفتاری (مؤلفه‌های ۱ تا ۱۶) */}
        {evaluation.behaviorAvgScore !== undefined && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">میانگین سلامت رفتاری</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {toPersianDigits(evaluation.behaviorAvgScore)}
                </span>
                <span className="text-xs font-semibold text-slate-400">از ۱۰۰</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* جهت‌گیری قرآنی ـ ولایی (مؤلفه ۱۷) */}
        {faithComponent && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">جهت‌گیری قرآنی ـ ولایی</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {toPersianDigits(faithComponent.score)}
                </span>
                <span className="text-xs font-semibold text-slate-400">از ۱۰۰</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* وضعیت کلی */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">سطح ارزیابی کلی</span>
            <div className="mt-1">
              {evaluation.isThriving ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> وضعیت تثبیت‌شده و بالنده
                </span>
              ) : evaluation.isCritical ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
                  <AlertTriangle className="w-3.5 h-3.5" /> نیازمند توجه و مداخله
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-sky-100 text-sky-800">
                  <TrendingUp className="w-3.5 h-3.5" /> مسیر رشد و پویایی
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* بخش اصلی: مقایسه مؤلفه‌های ارزیابی (میله‌ای عمودی، نقطه و خط، رادار) و اولویت‌های رشد */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* نمودار مؤلفه‌های فردی با قابلیت انتخاب نوع نمودار */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
              <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                <span>نمودار مقایسه مؤلفه‌های ارزیابی</span>
              </span>

              {/* سوییچر نوع نمایش نمودار */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setComponentChartType('bar')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    componentChartType === 'bar'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>میله‌ای عمودی</span>
                </button>
                <button
                  onClick={() => setComponentChartType('line')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    componentChartType === 'line'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>نقطه و خط</span>
                </button>
                <button
                  onClick={() => setComponentChartType('radar')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    componentChartType === 'radar'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>رادار</span>
                </button>
              </div>
            </div>

            <div className="py-2">
              {componentChartType === 'bar' && (
                <VerticalBarChart
                  data={radarComponents.map((c) => {
                    const sc = getSemanticColorByPercentage(c.score);
                    return {
                      label: c.title,
                      value: c.score,
                      percentage: c.score,
                      color: sc.hex,
                      secondaryLabel: `مؤلفه ${toPersianDigits(c.code)}`,
                    };
                  })}
                  unit="٪"
                  maxScale={100}
                  height={240}
                  showValues={true}
                  scrollable={true}
                  badgeText="نمودار میله‌ای عمودی مؤلفه‌ها"
                />
              )}

              {componentChartType === 'line' && (
                <PointLineChart
                  data={radarComponents.map((c) => ({
                    label: `م${toPersianDigits(c.code)}`,
                    value: c.score,
                    secondaryLabel: c.title,
                    color: getSemanticColorByPercentage(c.score).hex,
                  }))}
                  unit="٪"
                  maxScale={100}
                  height={230}
                  lineColor="#173f6b"
                  showPoints={true}
                  showValues={true}
                  badgeText="نمودار نقطه و خط پروفایل بالینی"
                />
              )}

              {componentChartType === 'radar' && (
                <div className="flex items-center justify-center">
                  <SvgRadarChart items={radarComponents} />
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100 mt-2">
            مؤلفه‌های ارزیابی شده بر مبنای نمره استاندارد ۱۰۰ مقایسه شده‌اند.
          </div>
        </div>

        {/* ۳ اولویت نخست رشد (Growth Priorities) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>۳ اولویت نخست رشد مراجع</span>
              </span>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                بیشترین فاصله رشد
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              این مؤلفه‌ها بیشترین پتانسیل جهش را دارند و تمرکز جلسات مشاوره بر روی آن‌ها سریع‌ترین تحول را ایجاد خواهد کرد:
            </p>

            <div className="space-y-4">
              {/* نمودار میله‌ای عمودی مقایسه ۳ اولویت نخست رشد */}
              <VerticalBarChart
                data={evaluation.topPriorities.slice(0, 3).map((item, idx) => {
                  const itemColor = getSemanticColorByPercentage(item.score);
                  return {
                    label: item.title,
                    value: item.score,
                    percentage: item.score,
                    color: itemColor.hex,
                    secondaryLabel: `شکاف: %${toPersianDigits(item.gap)}`,
                    badge: `اولویت ${toPersianDigits(idx + 1)}`,
                  };
                })}
                unit="٪"
                maxScale={100}
                height={200}
                showValues={true}
                badgeText="نمودار میله‌ای عمودی اولویت‌ها"
              />

              <div className="space-y-3 pt-2 border-t border-slate-100">
                {evaluation.topPriorities.slice(0, 3).map((item, idx) => {
                  const itemColor = getSemanticColorByPercentage(item.score);
                  return (
                    <div
                      key={item.code}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-md ${itemColor.dotBg} text-white text-[11px] font-black flex items-center justify-center shrink-0`}>
                            {toPersianDigits(idx + 1)}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900">
                            مؤلفه {toPersianDigits(item.code)}: {item.title}
                          </span>
                        </div>

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${itemColor.badgeBg} ${itemColor.textColor} ${itemColor.badgeBorder}`}>
                          فاصله: {toPersianDigits(item.gap)}%
                        </span>
                      </div>

                      {item.counselingTip && (
                        <p
                          className="text-[11px] text-slate-600 leading-relaxed pr-2.5 border-r-2 mt-2"
                          style={{ borderColor: itemColor.hex }}
                        >
                          💡 <strong>راهکار پیشنهادی:</strong> {item.counselingTip}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* تحلیل هم‌راستایی معنوی و رفتاری */}
          {evaluation.alignmentAnalysis && (
            <div className="mt-5 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/60">
              <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5 mb-1.5">
                <HeartHandshake className="w-4 h-4 text-indigo-600" />
                <span>تحلیل هم‌راستایی: {evaluation.alignmentAnalysis.title}</span>
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {evaluation.alignmentAnalysis.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* جدول تفکیکی تمام ۱۷ مؤلفه */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900">
              جدول نمرات تفکیکی تمامی مؤلفه‌ها
            </span>
          </div>
          <span className="text-xs text-slate-400">
            مجموع {toPersianDigits(evaluation.componentScores.length)} مؤلفه ارزیابی‌شده
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-extrabold">
                <th className="py-2.5 px-3">کد</th>
                <th className="py-2.5 px-3">عنوان مؤلفه</th>
                <th className="py-2.5 px-3 text-center">نمره خام</th>
                <th className="py-2.5 px-3 text-center">نمره استاندارد (۰-۱۰۰)</th>
                <th className="py-2.5 px-3 text-center">فاصله رشد</th>
                <th className="py-2.5 px-3 text-center">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {evaluation.componentScores.map((c) => {
                const scColor = getSemanticColorByPercentage(c.score);
                return (
                  <tr key={c.code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{toPersianDigits(c.code)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.title}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{toPersianDigits(c.rawSum)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2 font-mono font-black text-slate-900 text-xs">
                        <div
                          className="w-2 h-7 rounded-full bg-slate-200 relative overflow-hidden flex flex-col justify-end shrink-0"
                          title={`نمره مؤلفه: ${toPersianDigits(c.score)}٪`}
                        >
                          <div
                            className={`w-full rounded-full ${scColor.bgBar} transition-all duration-500`}
                            style={{
                              height: `${Math.min(100, Math.max(Number(c.score) || 0, 0))}%`,
                              backgroundColor: scColor.hex,
                            }}
                          />
                        </div>
                        <span>{toPersianDigits(c.score)}٪</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-700">
                      {toPersianDigits(c.growthGap)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${scColor.badgeBg} ${scColor.textColor} ${scColor.badgeBorder}`}
                      >
                        {scColor.shortLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
