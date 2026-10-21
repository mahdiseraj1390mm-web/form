'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
import { 
  BarChart3, 
  TrendingUp, 
  Calculator, 
  PieChart, 
  Layers, 
  ExternalLink, 
  Filter, 
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Award,
  CreditCard,
  Hash
} from 'lucide-react';
import { toPersianDigits, formatCurrency } from '@/lib/persian';

interface AnalyticsViewProps {
  onNavigateToRunner?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onNavigateToRunner }) => {
  const { forms, submissions, setActiveForm } = useForm();
  const [selectedFormId, setSelectedFormId] = useState<string>(forms[0]?.id || '');
  
  // فیلترهای انتخابی جهت تحلیل فیلد به فیلد
  const [selectedChoiceFieldId, setSelectedChoiceFieldId] = useState<string>('');
  const [selectedNumericFieldId, setSelectedNumericFieldId] = useState<string>('');

  const currentForm = forms.find((f) => f.id === selectedFormId) || forms[0];
  
  // داده‌های ارسالی واقعی مرتبط با این فرم
  const formSubmissions = submissions.filter((s) => s.formId === selectedFormId);
  const total = formSubmissions.length;

  // فیلدهای گزینه‌ای این فرم
  const choiceFields = currentForm?.fields.filter((f) => 
    ['select', 'radio', 'checkbox', 'quizQuestion'].includes(f.type)
  ) || [];

  // فیلدهای عددی و پولی این فرم
  const numericFields = currentForm?.fields.filter((f) => 
    ['number', 'formula'].includes(f.type) || f.id.includes('salary') || f.id.includes('count') || f.id.includes('price')
  ) || [];

  // تنظیم پیش‌فرض فیلدهای انتخابی
  const activeChoiceField = choiceFields.find((f) => f.id === selectedChoiceFieldId) || choiceFields[0];
  const activeNumericField = numericFields.find((f) => f.id === selectedNumericFieldId) || numericFields[0];

  // محاسبه آمار وضعیت‌ها
  const approved = formSubmissions.filter((s) => s.status === 'approved').length;
  const reviewing = formSubmissions.filter((s) => s.status === 'reviewing').length;
  const newCount = formSubmissions.filter((s) => s.status === 'new').length;
  const rejected = formSubmissions.filter((s) => s.status === 'rejected').length;

  // محاسبه درآمد واقعی از درگاه
  const paidSubmissions = formSubmissions.filter((s) => s.paymentStatus === 'paid');
  const totalRevenue = paidSubmissions.reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0);

  // محاسبه آماری فیلد عددی انتخاب شده (Sum, Avg, Min, Max)
  let numericStats = { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
  if (activeNumericField && total > 0) {
    const rawValues = formSubmissions
      .map((s) => Number(s.data[activeNumericField.id]))
      .filter((n) => !isNaN(n) && n !== 0);

    if (rawValues.length > 0) {
      const sum = rawValues.reduce((a, b) => a + b, 0);
      numericStats = {
        sum,
        avg: Math.round(sum / rawValues.length),
        min: Math.min(...rawValues),
        max: Math.max(...rawValues),
        count: rawValues.length,
      };
    }
  }

  // محاسبه توزیع آماری گزینه‌های فیلد انتخابی
  let optionDistribution: { id: string; label: string; count: number; percentage: number }[] = [];
  if (activeChoiceField && activeChoiceField.options && total > 0) {
    optionDistribution = activeChoiceField.options.map((opt) => {
      const matchCount = formSubmissions.filter((s) => {
        const val = s.data[activeChoiceField.id];
        if (Array.isArray(val)) return val.includes(opt.value || opt.id);
        return val === opt.value || val === opt.id;
      }).length;

      return {
        id: opt.id,
        label: opt.label,
        count: matchCount,
        percentage: total > 0 ? Math.round((matchCount / total) * 100) : 0,
      };
    });
  }

  // آمار آزمون در صورت فعال بودن
  const quizSubmissions = formSubmissions.filter((s) => s.quizResult);
  let quizStats = { avgScore: 0, maxScore: 0, minScore: 0, passedCount: 0 };
  if (quizSubmissions.length > 0) {
    const scores = quizSubmissions.map((s) => s.quizResult!.score);
    const sumScore = scores.reduce((a, b) => a + b, 0);
    quizStats = {
      avgScore: Math.round(sumScore / scores.length),
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      passedCount: quizSubmissions.filter((s) => s.quizResult!.passed).length,
    };
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50 select-none">
      
      {/* سربرگ بخش گزارش‌گیری و انتخاب فرم */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              گزارش‌های تحلیلی و نمودارهای آماری
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تحلیل محاسباتی، نمودار فراوانی گزینه‌ها و پایش داده‌های ثبت‌شده
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">انتخاب فرم:</span>
          <select
            value={selectedFormId}
            onChange={(e) => setSelectedFormId(e.target.value)}
            className="text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white max-w-xs focus:ring-1 focus:ring-blue-600"
          >
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* اگر هیچ داده‌ای ثبت نشده است: حالت کاملاً تمیز و واقعی Empty State */}
      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-4 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
            <Inbox className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800">
              هنوز پاسخی برای «{currentForm?.title}» ثبت نشده است
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
              این بخش کاملاً بر مبنای داده‌های واقعی عمل می‌کند. به محض تکمیل و ارسال فرم توسط مراجعین، نمودارهای فراوانی، توزیع گزینه‌ها و محاسبات ریاضی به‌صورت لحظه‌ای و بدون نیاز به ریفرش فعال خواهند شد.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setActiveForm(currentForm);
                if (onNavigateToRunner) onNavigateToRunner();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <span>باز کردن فرم و ثبت پاسخ نمونه</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* در صورت وجود داده‌های ارسالی واقعی: نمودارها و آمار با دقت ریاضی کامل */
        <div className="space-y-6">
          
          {/* ردیف شاخص‌های عددی کلیدی عملکرد */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500">کل پاسخ‌های دریافتی</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {toPersianDigits(total)}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>تعداد کل رکوردهای معتبر</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500">تأیید نهایی شده</span>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                {toPersianDigits(approved)}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                {toPersianDigits(Math.round((approved / total) * 100))}٪ از کل پاسخ‌ها
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500">در حال بررسی</span>
              <div className="text-2xl font-extrabold text-amber-600 font-mono">
                {toPersianDigits(reviewing)}
              </div>
              <div className="text-[11px] text-amber-700 font-medium">
                {toPersianDigits(Math.round((reviewing / total) * 100))}٪ در کارتابل
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500">تراکنش‌های واریزی شاپرک</span>
              <div className="text-xl font-extrabold text-blue-900 font-mono truncate">
                {totalRevenue > 0 ? formatCurrency(totalRevenue, 'IRT') : 'بدون تراکنش مالی'}
              </div>
              <div className="text-[11px] text-slate-500">
                {toPersianDigits(paidSubmissions.length)} تراکنش موفق
              </div>
            </div>

          </div>

          {/* بخش ۱: توزیع آماری گزینه‌های فیلدهای انتخابی (Option Distribution) */}
          {choiceFields.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">نمودار فراوانی و تفکیک پاسخ‌های گزینه‌ای</h2>
                    <span className="text-[11px] text-slate-500">درصد و تعداد دقیق انتخاب هر یک از گزینه‌ها</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">فیلد مورد بررسی:</span>
                  <select
                    value={activeChoiceField?.id}
                    onChange={(e) => setSelectedChoiceFieldId(e.target.value)}
                    className="text-xs font-bold text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    {choiceFields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* نمودار میله‌ای افقی تفکیک گزینه‌ها */}
              <div className="space-y-4 text-xs">
                {optionDistribution.map((opt) => (
                  <div key={opt.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{opt.label}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500 text-[11px]">{toPersianDigits(opt.count)} نفر</span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {toPersianDigits(opt.percentage)}٪
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(opt.percentage, 1)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* بخش ۲: محاسبه‌گر آماری فیلدهای عددی و مقادیر (Mathematical Aggregate Engine) */}
          {numericFields.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">محاسبه‌گر آماری فیلدهای مقداری</h2>
                    <span className="text-[11px] text-slate-500">
                      محاسبه مجموع، میانگین، کمترین و بیشترین بر اساس داده‌های ستون
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">انتخاب فیلد:</span>
                  <select
                    value={activeNumericField?.id}
                    onChange={(e) => setSelectedNumericFieldId(e.target.value)}
                    className="text-xs font-bold text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    {numericFields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500">مجموع کل (Sum)</span>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {toPersianDigits(numericStats.sum.toLocaleString('en-US'))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500">میانگین حسابی (Average)</span>
                  <div className="text-base font-extrabold text-blue-700 font-mono">
                    {toPersianDigits(numericStats.avg.toLocaleString('en-US'))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500">حداقل مقدار (Minimum)</span>
                  <div className="text-base font-extrabold text-emerald-700 font-mono">
                    {toPersianDigits(numericStats.min.toLocaleString('en-US'))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500">حداکثر مقدار (Maximum)</span>
                  <div className="text-base font-extrabold text-purple-700 font-mono">
                    {toPersianDigits(numericStats.max.toLocaleString('en-US'))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* بخش ۳: آمار کارنامه آزمون (در صورت فعال بودن آزمون‌ساز) */}
          {currentForm.quiz.enabled && quizSubmissions.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-purple-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
                <Award className="w-5 h-5 text-purple-600" />
                <h2 className="text-sm font-bold text-purple-900">تحلیل نتایج آزمون‌های آنلاین</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-slate-500 text-[11px] block">تعداد شرکت‌کنندگان</span>
                  <span className="text-base font-extrabold text-purple-900 font-mono">
                    {toPersianDigits(quizSubmissions.length)} داوطلب
                  </span>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-slate-500 text-[11px] block">میانگین نمرات داوطلبان</span>
                  <span className="text-base font-extrabold text-purple-900 font-mono">
                    {toPersianDigits(quizStats.avgScore)}٪
                  </span>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-slate-500 text-[11px] block">بالاترین نمره کسب شده</span>
                  <span className="text-base font-extrabold text-emerald-600 font-mono">
                    {toPersianDigits(quizStats.maxScore)}٪
                  </span>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-slate-500 text-[11px] block">نرخ قبولی نهایی</span>
                  <span className="text-base font-extrabold text-blue-700 font-mono">
                    {toPersianDigits(Math.round((quizStats.passedCount / quizSubmissions.length) * 100))}٪
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
