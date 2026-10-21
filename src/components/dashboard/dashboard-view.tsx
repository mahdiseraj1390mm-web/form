'use client';

import React from 'react';
import { useForm } from '@/context/form-context';
import { 
  FolderKanban, 
  Inbox, 
  CreditCard, 
  TrendingUp, 
  PlusCircle, 
  ArrowUpRight, 
  ExternalLink,
  PenTool,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { toPersianDigits, formatCurrency, formatPersianDateTime } from '@/lib/persian';

interface DashboardViewProps {
  onOpenNewFormModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewFormModal,
  onNavigateTab,
}) => {
  const { forms, submissions, setActiveForm } = useForm();

  const totalSubmissions = submissions.length;
  const paidSubmissions = submissions.filter((s) => s.paymentStatus === 'paid');
  const totalRevenue = paidSubmissions.reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0);
  const publishedForms = forms.filter((f) => f.status === 'published').length;

  const kpis = [
    {
      title: 'کل فرم‌های فعال',
      value: toPersianDigits(publishedForms),
      desc: 'سامانه‌های در دسترس کاربران',
      icon: FolderKanban,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'کل پاسخ‌های دریافتی',
      value: toPersianDigits(totalSubmissions),
      desc: totalSubmissions > 0 ? 'رکوردهای ثبت‌شده در دیتابیس' : 'بدون ثبت ورودی',
      icon: Inbox,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'مجموع دریافتی درگاه شاپرک',
      value: totalRevenue > 0 ? formatCurrency(totalRevenue, 'IRT') : '۰ تومان',
      desc: `${toPersianDigits(paidSubmissions.length)} تراکنش تاییدشده`,
      icon: CreditCard,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'پاسخ‌های در انتظار بررسی',
      value: toPersianDigits(submissions.filter((s) => s.status === 'new' || s.status === 'reviewing').length),
      desc: 'پرونده‌های فعال کارتابل',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-slate-50 select-none">
      
      {/* سربرگ داشبورد */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            داشبورد مدیریت فرم‌افزار سازمانی
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            وضعیت واقعی فرم‌ها، گردش کار و گزارش‌های بلادرنگ سامانه‌ها
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('templates')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>قالب‌های آماده</span>
          </button>
          
          <button
            onClick={onOpenNewFormModal}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ایجاد فرم جدید</span>
          </button>
        </div>
      </div>

      {/* کارت‌های شاخص کلیدی عملکرد (KPIs بر مبنای داده‌های واقعی) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{kpi.title}</span>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {kpi.value}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {kpi.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* ردیف دوتایی: فرم‌ها و ارسالی‌های اخیر */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* لیست فرم‌های پلتفرم */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">فرم‌ها و سامانه‌های تعریف‌شده</h2>
            <button
              onClick={() => onNavigateTab('forms')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              مشاهده همه فرم‌ها ←
            </button>
          </div>

          <div className="space-y-3">
            {forms.map((form) => {
              const formSubCount = submissions.filter((s) => s.formId === form.id).length;

              return (
                <div
                  key={form.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">{form.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {form.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-bold text-slate-700">{toPersianDigits(formSubCount)} ثبت واقعی</span>
                      <span>•</span>
                      <span>{toPersianDigits(form.fields.length)} فیلد</span>
                      <span>•</span>
                      <span>{form.mode === 'wizard' ? 'مرحله‌ای' : 'تک‌صفحه‌ای'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveForm(form);
                        onNavigateTab('builder');
                      }}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="ویرایش در استودیو"
                    >
                      <PenTool className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveForm(form);
                        onNavigateTab('runner');
                      }}
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="مشاهده فرم آنلاین"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* آخرین ثبت‌های ارسالی */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">آخرین ارسالی‌ها و رویدادها</h2>
            <button
              onClick={() => onNavigateTab('submissions')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              مشاهده کارتابل ←
            </button>
          </div>

          <div className="space-y-3">
            {submissions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                هنوز هیچ رکوردی ثبت نشده است. پس از تکمیل اولین فرم توسط کاربران، داده‌ها در این بخش نمایش می‌یابند.
              </div>
            ) : (
              submissions.slice(0, 5).map((sub) => {
                const relatedForm = forms.find((f) => f.id === sub.formId);

                return (
                  <div key={sub.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-700 text-[11px]">
                        {sub.trackingCode}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatPersianDateTime(sub.createdAt).split(' ')[0]}
                      </span>
                    </div>
                    <div className="text-slate-800 font-semibold truncate">
                      {relatedForm?.title || 'فرم ثبت‌شده'}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                      <span>وضعیت: {sub.status === 'approved' ? 'تأیید نهایی' : 'در حال بررسی'}</span>
                      {sub.paymentStatus === 'paid' && (
                        <span className="text-emerald-600 font-bold">پرداخت موفق شاپرک ✓</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
