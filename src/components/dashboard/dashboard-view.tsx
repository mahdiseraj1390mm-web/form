'use client';

import React, { useMemo } from 'react';
import { useForm } from '@/context/form-context';
import { 
  FolderKanban, 
  Inbox, 
  CreditCard, 
  PlusCircle, 
  ExternalLink,
  PenTool,
  Clock,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  UserCheck,
  FileCheck2,
  Users,
  Award,
  ChevronRight,
  BarChart3,
  Calendar,
  Phone,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio,
  FileText
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
  const { forms, submissions } = useForm();

  // خلاصه مراجعین اخیر جهت پیگیری عملیاتی روزمره
  const recentCases = useMemo(() => {
    const list = submissions.filter((s) => s.formId === 'form-belhagh-registration' || s.data?.caseCode);
    return list.slice(0, 6);
  }, [submissions]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7 pb-20 sm:pb-12 space-y-6 bg-slate-50 overscroll-contain">
      
      {/* سربرگ داشبورد مدیریت عملیاتی */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              میز کار فعال و برخط
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            میز کار مدیریت مرکز خدمات روانشناسی و مشاوره بالحق
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            مدیریت روزانه پذیرش‌ها، نوبت‌دهی جلسات، ابزارهای فرم‌ساز و دسترسی سریع به کارتابل
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigateTab('submissions')}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-sky-600" />
            <span>کارتابل مراجعان</span>
          </button>
          
          <button
            onClick={onOpenNewFormModal}
            className="px-4 py-2 text-xs font-black text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ایجاد فرم / سامانه جدید</span>
          </button>
        </div>
      </div>

      {/* بنر راهبردی و برجسته ارجاع به بخش «آمارها و تحلیل‌های بالینی» */}
      <div className="bg-gradient-to-r from-[#112d4e] via-[#173f6b] to-[#1e548f] text-white p-6 rounded-3xl shadow-sm border border-blue-900/40 relative overflow-hidden">
        <div className="absolute left-0 bottom-0 translate-y-1/4 -translate-x-1/6 opacity-10 pointer-events-none">
          <BarChart3 className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/20 text-sky-200 border border-blue-400/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>پایگاه داده آماری و تحلیلی بالحق</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              سامانه پایش هوشمند، گزارش‌های تفصیلی و شاخص‌های آماری
            </h2>
            <p className="text-xs text-sky-100/90 leading-relaxed">
              گزارش‌های تحلیلی، رتبه‌بندی مشاوران بر اساس نوبت‌ها، پراکندگی ۵ موضوع برتر مشاوره، فید آخرین رویدادهای سامانه و مشخصات مراجعین پرمراجعه به صورت کامل در تب <strong>«آمارها و تحلیل‌های بالینی»</strong> در دسترس است.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('analytics')}
              className="px-5 py-3 bg-white hover:bg-sky-50 text-[#112d4e] font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer group"
            >
              <BarChart3 className="w-4 h-4 text-blue-700" />
              <span>مشاهده آمارها و تحلیل‌های بالینی</span>
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* کارت‌های وضعیت عملیاتی میز کار (Operational Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* ۱. پرونده‌های کارتابل مراجعین */}
        <div 
          onClick={() => onNavigateTab('submissions')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">کارتابل مراجعین</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {toPersianDigits(submissions.length)}
          </div>
          <div className="text-[11px] text-sky-700 font-semibold flex items-center justify-between pt-1 border-t border-slate-100">
            <span>مدیریت سوابق و پرونده‌ها</span>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </div>
        </div>

        {/* ۲. فرم‌ها و سامانه‌های فعال */}
        <div 
          onClick={() => onNavigateTab('forms')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">سامانه‌ها و فرم‌ها</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
            {toPersianDigits(forms.length)} فرم فعال
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-between pt-1 border-t border-slate-100">
            <span>ثبت‌نام، نوبت‌دهی و پرسشنامه‌ها</span>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </div>
        </div>

        {/* ۳. گفتگوی آنلاین و پاسخگویی */}
        <div 
          onClick={() => onNavigateTab('chat')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">گفتگوی آنلاین با مراجعان</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono tracking-tight">
            فعال و آنلاین
          </div>
          <div className="text-[11px] text-purple-700 font-semibold flex items-center justify-between pt-1 border-t border-slate-100">
            <span>صندوق پیام‌های مراجعین</span>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </div>
        </div>

        {/* ۴. مرکز اسناد و فایل‌های پیوست */}
        <div 
          onClick={() => onNavigateTab('media')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">مرکز اسناد و مدارک</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono tracking-tight">
            فضای ابری متصل
          </div>
          <div className="text-[11px] text-amber-700 font-semibold flex items-center justify-between pt-1 border-t border-slate-100">
            <span>مدارک هویتی و تصاویر مراجعان</span>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </div>
        </div>

      </div>

      {/* دسترسی‌های سریع میز کار (Quick Actions Grid) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                جعبه‌ابزار دسترسی سریع مدیریت
              </h2>
              <span className="text-[11px] text-slate-400">میانبرهای پرکاربرد روزانه اپراتور و مدیران مرکز</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <button
            onClick={() => onNavigateTab('submissions')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-center space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white text-sky-600 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">پذیرش مراجعین</span>
            <span className="text-[10px] text-slate-400 block">بررسی و صدور پرونده</span>
          </button>

          <button
            onClick={() => onNavigateTab('runner')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-center space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">رزرو نوبت</span>
            <span className="text-[10px] text-slate-400 block">ثبت نوبت مشاوره</span>
          </button>

          <button
            onClick={() => onNavigateTab('builder')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-center space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-110 transition-transform">
              <PenTool className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">فرم‌ساز بالحق</span>
            <span className="text-[10px] text-slate-400 block">طراحی فرم و پرسشنامه</span>
          </button>

          <button
            onClick={() => onNavigateTab('chat')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-center space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white text-purple-600 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">پاسخگویی زنده</span>
            <span className="text-[10px] text-slate-400 block">چت مستقیم مراجعان</span>
          </button>

          <button
            onClick={() => onNavigateTab('analytics')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-center space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">آمارها و تحلیل‌ها</span>
            <span className="text-[10px] text-slate-400 block">گزارش‌های تفصیلی</span>
          </button>

          <button
            onClick={() => onNavigateTab('settings')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-center space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white text-slate-700 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">تنظیمات و پیامک</span>
            <span className="text-[10px] text-slate-400 block">سامانه کاوه‌نگار</span>
          </button>

        </div>
      </div>

      {/* بخش پرونده‌های اخیر پذیرش‌شده جهت دسترسی سریع */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                آخرین مراجعین ثبت‌شده در مرکز
              </h2>
              <span className="text-[11px] text-slate-400">دسترسی سریع به پرونده‌های اخیر جهت پیگیری اپراتور</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('submissions')}
            className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
          >
            <span>مشاهده همه پرونده‌ها در کارتابل</span>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold">
                <th className="py-2.5 px-3">کد پرونده مراجع</th>
                <th className="py-2.5 px-3">نقش در خانواده</th>
                <th className="py-2.5 px-3">شماره تماس</th>
                <th className="py-2.5 px-3">شهر / منطقه</th>
                <th className="py-2.5 px-3">زمان ثبت</th>
                <th className="py-2.5 px-3 text-center">اقدام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCases.map((s) => {
                const fName = s.data?.f_name || s.data?.fullName || 'مراجع محترم';
                const lName = s.data?.f_family || '';
                const name = `${fName} ${lName}`.trim();
                const code = s.data?.caseCode || s.trackingCode || 'SP000000';
                const mobile = s.data?.f_mobile || s.mobile || '---';
                const city = s.data?.f_province_city || 'تهران';

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-black text-sky-800 text-xs">
                      <span className="bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{code}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium text-xs">
                      {s.data?.f_role_in_family || 'مراجع محترم'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 text-xs dir-ltr text-right">
                      {toPersianDigits(mobile)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {city}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {formatPersianDateTime(s.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onNavigateTab('submissions')}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>پرونده</span>
                        <ChevronRight className="w-3 h-3 rotate-180" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* وضعیت سلامت زیرساخت و ارتباطات مرکز */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">سامانه پیامک کاوه‌نگار</span>
            <span className="text-[11px] text-emerald-600 font-medium">سرویس فعال و خط خدماتی ۳۰۰۰ متصل</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">پایگاه داده امن بالحق</span>
            <span className="text-[11px] text-blue-600 font-medium">همگام‌سازی بلادرنگ داده‌ها</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">درگاه پرداخت الکترونیک</span>
            <span className="text-[11px] text-purple-600 font-medium">شاپرک و سداد فعال</span>
          </div>
        </div>

      </div>

    </div>
  );
};
