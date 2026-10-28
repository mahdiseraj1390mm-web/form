'use client';

import React from 'react';
import { EvaluationResult, Form } from '@/types/form';
import { SvgRadarChart } from './radar-chart';
import { toPersianDigits } from '@/lib/persian';
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
} from 'lucide-react';

interface EvaluationReportViewProps {
  evaluation: EvaluationResult;
  formTitle?: string;
}

export const EvaluationReportView: React.FC<EvaluationReportViewProps> = ({
  evaluation,
  formTitle = 'ارزیابی خودسنجی',
}) => {
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

      {/* بخش اصلی: نمودار رادار تارعنکبوتی و ۳ اولویت نخست رشد */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* نمودار رادار */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-600" />
              <span>نمودار توازن مؤلفه‌های فردی (Radar Chart)</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {toPersianDigits(radarComponents.length)} مؤلفه اصلی
            </span>
          </div>

          <div className="py-2 flex items-center justify-center">
            <SvgRadarChart items={radarComponents} />
          </div>

          <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100 mt-2">
            محیط بیرونی نشانگر نمره ۱۰۰ و مرکز نشانگر نمره صفر است؛ توازن بیشتر چندضلعی نشانه یکپارچگی ابعاد رشد فردی است.
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

            <div className="space-y-3.5">
              {evaluation.topPriorities.slice(0, 3).map((item, idx) => (
                <div
                  key={item.code}
                  className="p-4 rounded-2xl bg-gradient-to-l from-slate-50 to-amber-50/30 border border-amber-200/60 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0">
                        {toPersianDigits(idx + 1)}
                      </span>
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                        مؤلفه {toPersianDigits(item.code)}: {item.title}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      فاصله: {toPersianDigits(item.gap)}%
                    </span>
                  </div>

                  {item.counselingTip ? (
                    <p className="text-[11px] text-slate-600 leading-relaxed pr-8 border-r-2 border-amber-300 mt-1.5">
                      💡 <strong>راهکار پیشنهادی:</strong> {item.counselingTip}
                    </p>
                  ) : (
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, item.score)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <span className="text-sm font-extrabold text-slate-900">
            جدول نمرات تفکیکی تمامی مؤلفه‌ها
          </span>
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
              {evaluation.componentScores.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-400">{toPersianDigits(c.code)}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{c.title}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{toPersianDigits(c.rawSum)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {toPersianDigits(c.score)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-amber-700">
                    {toPersianDigits(c.growthGap)}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold"
                      style={{
                        backgroundColor: `${c.statusColor}18`,
                        color: c.statusColor,
                        border: `1px solid ${c.statusColor}40`,
                      }}
                    >
                      {c.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
