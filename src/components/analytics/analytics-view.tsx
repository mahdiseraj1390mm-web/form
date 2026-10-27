'use client';

import React, { useState, useMemo } from 'react';
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
  Hash,
  FileText,
  Download,
  AlertTriangle,
  Users,
  List,
} from 'lucide-react';
import { toPersianDigits, formatCurrency, formatPersianDateTime, getFieldDisplayValue } from '@/lib/persian';
import { exportFormSubmissionsToCSV } from '@/lib/excel-export';

interface AnalyticsViewProps {
  onNavigateToRunner?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onNavigateToRunner }) => {
  const { forms, submissions, setActiveForm, activeForm } = useForm();
  const [selectedFormId, setSelectedFormId] = useState<string>(activeForm?.id || forms[0]?.id || '');
  
  // فیلترهای انتخابی جهت تحلیل فیلد به فیلد
  const [selectedChoiceFieldId, setSelectedChoiceFieldId] = useState<string>('');
  const [selectedNumericFieldId, setSelectedNumericFieldId] = useState<string>('');

  const currentForm = forms.find((f) => f.id === selectedFormId) || forms[0];

  const statusConfigs: Record<string, { label: string; color: string; bg: string; border: string }> = {
    new: { label: 'جدید', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    reviewing: { label: 'در حال بررسی', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    approved: { label: 'تأیید شده / فعال', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    rejected: { label: 'رد شده', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    archived: { label: 'بایگانی', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
  };
  
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

  // محاسبه سوالات با بیشترین اشتباه (برای فرم‌های آزمون)
  const quizWrongAnswers: { questionId: string; questionLabel: string; wrongCount: number; totalCount: number; wrongPercentage: number }[] = useMemo(() => {
    if (!currentForm?.quiz.enabled || quizSubmissions.length === 0) return [];
    
    const quizFields = currentForm.fields.filter((f) => f.type === 'quizQuestion');
    return quizFields.map((field) => {
      let wrongCount = 0;
      let totalCount = 0;
      
      quizSubmissions.forEach((sub) => {
        const userAnswer = sub.data[field.id];
        if (userAnswer === undefined || userAnswer === null) return;
        totalCount++;
        
        const correctOptionId = field.quizData?.correctOptionId;
        //userAnswer can be option id or value
        const isCorrect = userAnswer === correctOptionId || 
          (field.options?.find((o) => o.value === userAnswer)?.id === correctOptionId);
        if (!isCorrect) wrongCount++;
      });
      
      return {
        questionId: field.id,
        questionLabel: field.label,
        wrongCount,
        totalCount,
        wrongPercentage: totalCount > 0 ? Math.round((wrongCount / totalCount) * 100) : 0,
      };
    }).sort((a, b) => b.wrongCount - a.wrongCount);
  }, [currentForm, quizSubmissions]);

  // محاسبه بررسی ähnliness (پاسخ‌های مشابهی که بیشترین تکرار را دارند)
  const similarAnswers: { fieldId: string; fieldLabel: string; value: string; count: number; percentage: number }[] = useMemo(() => {
    if (formSubmissions.length === 0) return [];
    
    const textFields = currentForm?.fields.filter((f) => 
      ['text', 'select', 'radio', 'mobile', 'nationalCode', 'jalaliDate'].includes(f.type)
    ) || [];
    
    const allValues: { fieldId: string; fieldLabel: string; value: string; count: number }[] = [];
    
    textFields.forEach((field) => {
      const valueCounts: Record<string, number> = {};
      formSubmissions.forEach((sub) => {
        const val = sub.data[field.id];
        if (val === undefined || val === null || val === '') return;
        const strVal = Array.isArray(val) ? val.join('، ') : String(val);
        valueCounts[strVal] = (valueCounts[strVal] || 0) + 1;
      });
      
      Object.entries(valueCounts).forEach(([value, count]) => {
        if (count > 1) { // فقط مقادیر تکرار شده
          allValues.push({
            fieldId: field.id,
            fieldLabel: field.label,
            value,
            count,
          });
        }
      });
    });
    
    return allValues
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        percentage: Math.round((item.count / formSubmissions.length) * 100),
      }));
  }, [currentForm, formSubmissions]);

  // قیمت برای خروجی اکسل
  const handleExportExcel = () => {
    if (formSubmissions.length === 0) {
      alert('پاسخی برای خروجی اکسل وجود ندارد.');
      return;
    }
    exportFormSubmissionsToCSV(currentForm, formSubmissions);
  };

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

          {/* بخش ۴: سوالات با بیشترین اشتباه */}
          {currentForm.quiz.enabled && quizWrongAnswers.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-rose-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h2 className="text-sm font-bold text-rose-900">سوالات با بیشترین نرخ اشتباه</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-rose-50 border-b border-rose-200 text-rose-700 font-extrabold">
                      <th className="p-3 text-center w-12">#</th>
                      <th className="p-3">متن سوال</th>
                      <th className="p-3 text-center">پاسخ‌های اشتباه</th>
                      <th className="p-3 text-center">تعداد کل پاسخ‌ها</th>
                      <th className="p-3 text-center">نرخ اشتباه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quizWrongAnswers.map((qa, idx) => (
                      <tr key={qa.questionId} className="hover:bg-rose-50/50 transition-colors">
                        <td className="p-3 text-center text-slate-400 font-mono">
                          {toPersianDigits(idx + 1)}
                        </td>
                        <td className="p-3 font-medium text-slate-900 truncate max-w-xs" title={qa.questionLabel}>
                          {qa.questionLabel}
                        </td>
                        <td className="p-3 text-center font-bold text-rose-700">
                          {toPersianDigits(qa.wrongCount)}
                        </td>
                        <td className="p-3 text-center text-slate-600">
                          {toPersianDigits(qa.totalCount)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {toPersianDigits(qa.wrongPercentage)}٪
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* بخش ۵: تکرار بیشترین پاسخ‌ها */}
          {similarAnswers.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-100">
                <Users className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm font-bold text-amber-900">بیشترین پاسخ‌های مشابه (تکرار شده)</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarAnswers.map((sa, idx) => (
                  <div key={`${sa.fieldId}-${sa.value}`} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        #{toPersianDigits(idx + 1)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {toPersianDigits(sa.count)} بار
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-slate-500 block">فیلد:</span>
                        <span className="font-bold text-slate-900">{sa.fieldLabel}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">مقدار تکراری:</span>
                        <span className="font-bold text-slate-900 truncate max-w-xs" title={sa.value}>
                          {sa.value}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">نرخ تکرار:</span>
                        <span className="font-bold text-amber-800">
                          {toPersianDigits(sa.percentage)}٪ از ارسالی‌ها
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${Math.max(sa.percentage, 1)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* بخش ۶: لیست کامل پاسخ‌ها */}
          {formSubmissions.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">لیست کامل پاسخ‌های دریافتی</h2>
                </div>
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>خروجی اکسل</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                      <th className="p-3 text-center w-12">#</th>
                      <th className="p-3">کد پیگیری</th>
                      <th className="p-3">نام و نام خانوادگی</th>
                      <th className="p-3 text-center">تاریخ ثبت</th>
                      <th className="p-3 text-center">وضعیت</th>
                      <th className="p-3 text-center">پرداخت</th>
                      <th className="p-3 text-center w-20">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formSubmissions.slice(0, 10).map((sub, idx) => {
                      const st = statusConfigs[sub.status] || statusConfigs.new;
                      const fullName =
                        sub.data.fullName ||
                        sub.data.f_fullname ||
                        sub.data.q_fullname ||
                        'نامشخص';
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-mono">
                            {toPersianDigits(idx + 1)}
                          </td>
                          <td className="p-3 font-mono font-bold text-sky-800">
                            {sub.trackingCode}
                          </td>
                          <td className="p-3 font-medium text-slate-900 truncate max-w-xs" title={fullName}>
                            {fullName}
                          </td>
                          <td className="p-3 text-center text-slate-600">
                            {formatPersianDateTime(sub.createdAt)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${st.bg} ${st.color} ${st.border}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {sub.paymentStatus === 'paid' ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                {formatCurrency(sub.paymentAmount || 0, 'IRT')}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">بدون پرداخت</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                              title="مشاهده جزئیات"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {formSubmissions.length > 10 && (
                <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  نمایش {Math.min(10, formSubmissions.length)} از {toPersianDigits(formSubmissions.length)} پاسخ
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
