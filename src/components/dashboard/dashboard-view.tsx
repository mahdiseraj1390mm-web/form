'use client';

import React, { useMemo, useState } from 'react';
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
  CheckCircle2,
  CalendarCheck,
  UserCheck,
  FileCheck2,
  Users,
  Compass,
  Award,
  ChevronRight,
  Filter,
  BarChart3,
  Calendar,
  Phone,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toPersianDigits, formatCurrency, formatPersianDateTime } from '@/lib/persian';
import { VerticalBarChart, BarChartItem } from '../analytics/vertical-bar-chart';

interface DashboardViewProps {
  onOpenNewFormModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewFormModal,
  onNavigateTab,
}) => {
  const { forms, submissions, setActiveForm } = useForm();
  const [activityFilter, setActivityFilter] = useState<'all' | 'cases' | 'bookings' | 'quizzes'>('all');

  // ۱. محاسبات باکس آمار کلی سامانه
  const statsOverview = useMemo(() => {
    // استخراج کدهای یکتای پرونده (SP)
    const caseCodes = new Set<string>();
    submissions.forEach((s) => {
      const code = s.data?.caseCode || s.trackingCode;
      if (code && typeof code === 'string' && code.startsWith('SP')) {
        caseCodes.add(code);
      }
    });

    // تعداد نوبت‌های دریافتی (فرم نوبت‌دهی یا ارسالی‌های حاوی نوبت)
    const bookingSubmissions = submissions.filter((s) => {
      if (s.formId === 'form-belhagh-booking') return true;
      if (!s.data || typeof s.data !== 'object') return false;
      return Object.keys(s.data).some(
        (k) => (k.startsWith('f_booking_') || k.startsWith('f_counselor')) && s.data[k]
      );
    });

    // تعداد فرم‌های پرسشنامه و تست خودسنجی
    const quizSubmissions = submissions.filter((s) => {
      return (
        s.formId === 'form-safaan-assessment' ||
        !!s.evaluationResult ||
        !!s.quizResult ||
        (s.data && (s.data.safaUserCode || s.data.q_safa_01))
      );
    });

    // تعداد کل ثبت‌نام‌های پرونده اولیه
    const registrationSubmissions = submissions.filter(
      (s) => s.formId === 'form-belhagh-registration' || s.data?.f_ebadollah_member !== undefined
    );

    const paidSubmissions = submissions.filter((s) => s.paymentStatus === 'paid');
    const totalRevenue = paidSubmissions.reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0);

    return {
      totalCasesCount: Math.max(caseCodes.size, registrationSubmissions.length),
      totalBookingsCount: bookingSubmissions.length,
      totalQuizzesCount: quizSubmissions.length,
      totalPaidCount: paidSubmissions.length,
      totalRevenue,
      totalAllSubmissions: submissions.length,
    };
  }, [submissions]);

  // ۲. باکس آخرین فعالیت‌ها (فید بلادرنگ رویدادها)
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'case' | 'booking' | 'quiz';
      title: string;
      clientName: string;
      caseCode: string;
      detail: string;
      createdAt: string;
      badge: string;
      badgeColor: string;
    }> = [];

    submissions.forEach((s) => {
      const caseCode = s.data?.caseCode || s.trackingCode || 'SP000000';
      const fName = s.data?.f_name || s.data?.fullName || 'مراجع محترم';
      const lName = s.data?.f_family || '';
      const clientName = `${fName} ${lName}`.trim();

      // رویداد ثبت پرونده
      if (s.formId === 'form-belhagh-registration' || s.data?.f_ebadollah_member) {
        list.push({
          id: `act-case-${s.id}`,
          type: 'case',
          title: 'ثبت پرونده جدید مراجع',
          clientName,
          caseCode,
          detail: `شهر: ${s.data?.f_province_city || 'نامشخص'} | نقش: ${s.data?.f_role_in_family || 'مراجع'}`,
          createdAt: s.createdAt,
          badge: 'پرونده جدید',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        });
      }

      // رویداد نوبت مشاوره
      if (s.formId === 'form-belhagh-booking' || s.data?.f_topic) {
        let counselor = s.data?.f_counselor || 'استاد مشاور';
        for (const k of Object.keys(s.data || {})) {
          if (k.startsWith('f_counselor_') && s.data[k]) {
            counselor = s.data[k];
            break;
          }
        }
        let slotTime = '';
        for (const k of Object.keys(s.data || {})) {
          if (k.startsWith('f_booking_') && s.data[k]) {
            slotTime = s.data[k];
            break;
          }
        }

        list.push({
          id: `act-book-${s.id}`,
          type: 'booking',
          title: 'دریافت نوبت مشاوره',
          clientName,
          caseCode,
          detail: `مشاور: ${counselor} | زمان: ${slotTime || 'تعیین‌شده'}`,
          createdAt: s.createdAt,
          badge: 'نوبت مشاوره',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        });
      }

      // رویداد پرسشنامه و آزمون
      if (s.formId === 'form-safaan-assessment' || s.evaluationResult) {
        const score = s.evaluationResult?.overallScore || 75;
        list.push({
          id: `act-quiz-${s.id}`,
          type: 'quiz',
          title: 'تکمیل آزمون خودسنجی صفان',
          clientName,
          caseCode,
          detail: `نمره کل ارزیابی: ${toPersianDigits(score)} از ۱۰۰ | مؤلفه‌های رشد ثبت شد`,
          createdAt: s.createdAt,
          badge: 'پرسشنامه و تست',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        });
      }
    });

    // مرتب‌سازی بر اساس تازه‌ترین زمان
    const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (activityFilter === 'all') return sorted;
    if (activityFilter === 'cases') return sorted.filter((a) => a.type === 'case');
    if (activityFilter === 'bookings') return sorted.filter((a) => a.type === 'booking');
    if (activityFilter === 'quizzes') return sorted.filter((a) => a.type === 'quiz');
    return sorted;
  }, [submissions, activityFilter]);

  // ۳. باکس بیشترین موضوعات توصیه شده برای مراجعان توسط مشاوران
  const topTopicsData: BarChartItem[] = useMemo(() => {
    const topicCounts: Record<string, number> = {
      'کودک': 0,
      'نوجوان': 0,
      'تحصیلی': 0,
      'بالینی (اضطراب و وسواس)': 0,
      'ازدواج و خانواده': 0,
    };

    submissions.forEach((s) => {
      const topic = s.data?.f_topic || s.data?.f_counseling_subject;
      if (!topic) return;

      if (topic.includes('کودک')) topicCounts['کودک']++;
      else if (topic.includes('نوجوان')) topicCounts['نوجوان']++;
      else if (topic.includes('تحصیلی')) topicCounts['تحصیلی']++;
      else if (topic.includes('بالینی') || topic.includes('اضطراب') || topic.includes('وسواس')) {
        topicCounts['بالینی (اضطراب و وسواس)']++;
      } else if (topic.includes('ازدواج') || topic.includes('خانواده')) {
        topicCounts['ازدواج و خانواده']++;
      }
    });

    const totalTopics = Object.values(topicCounts).reduce((a, b) => a + b, 0) || 1;

    const colors = [
      'bg-sky-500',
      'bg-indigo-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-emerald-500',
    ];

    return Object.entries(topicCounts).map(([label, val], idx) => ({
      id: `topic-${idx}`,
      label,
      value: val,
      percentage: Math.round((val / totalTopics) * 100),
      color: colors[idx % colors.length],
      secondaryLabel: `${toPersianDigits(val)} مراجعه`,
    }));
  }, [submissions]);

  // ۴. باکس بیشترین نوبت‌ها از مشاوران (محبوب‌ترین مشاوران با نمودار میله‌ای عمودی)
  const topCounselorsData: BarChartItem[] = useMemo(() => {
    const counselorCounts: Record<string, number> = {};

    submissions.forEach((s) => {
      let counselor = s.data?.f_counselor;
      if (!counselor) {
        for (const k of Object.keys(s.data || {})) {
          if (k.startsWith('f_counselor_') && s.data[k]) {
            counselor = s.data[k];
            break;
          }
        }
      }

      if (counselor && typeof counselor === 'string' && counselor.trim()) {
        const cleanName = counselor.replace(/^(آقای|خانم|دکتر)\s+/, '').replace(/\s*\(.*?\)/, '').trim();
        const fullClean = `استاد ${cleanName}`;
        counselorCounts[fullClean] = (counselorCounts[fullClean] || 0) + 1;
      }
    });

    const sorted = Object.entries(counselorCounts).sort((a, b) => b[1] - a[1]);
    const top6 = sorted.slice(0, 6);
    const totalBookings = top6.reduce((acc, curr) => acc + curr[1], 0) || 1;

    const barColors = [
      'bg-teal-500',
      'bg-blue-600',
      'bg-violet-600',
      'bg-amber-500',
      'bg-cyan-500',
      'bg-emerald-600',
    ];

    return top6.map(([name, count], idx) => ({
      id: `counselor-${idx}`,
      label: name,
      value: count,
      percentage: Math.round((count / totalBookings) * 100),
      color: barColors[idx % barColors.length],
      secondaryLabel: `${toPersianDigits(count)} نوبت`,
    }));
  }, [submissions]);

  // ۵. باکس بیشترین نوبت‌ها و فرم‌های مراجعان (فعال‌ترین مراجعین)
  const topClientsList = useMemo(() => {
    const clientsMap = new Map<
      string,
      {
        caseCode: string;
        fullName: string;
        mobile: string;
        totalForms: number;
        totalBookings: number;
        totalQuizzes: number;
        latestDate: string;
      }
    >();

    submissions.forEach((s) => {
      const caseCode = s.data?.caseCode || s.trackingCode;
      if (!caseCode) return;

      const fName = s.data?.f_name || s.data?.fullName || '';
      const lName = s.data?.f_family || '';
      const name = `${fName} ${lName}`.trim() || 'مراجع مرکز بالحق';
      const mobile = s.data?.f_mobile || s.mobile || '۰۹۱۲۰۰۰۰۰۰۰';

      const isBooking =
        s.formId === 'form-belhagh-booking' ||
        Object.keys(s.data || {}).some((k) => k.startsWith('f_booking_') && s.data[k]);
      const isQuiz = s.formId === 'form-safaan-assessment' || !!s.evaluationResult;

      const existing = clientsMap.get(caseCode);
      if (existing) {
        existing.totalForms += 1;
        if (isBooking) existing.totalBookings += 1;
        if (isQuiz) existing.totalQuizzes += 1;
        if (new Date(s.createdAt) > new Date(existing.latestDate)) {
          existing.latestDate = s.createdAt;
        }
        if (name !== 'مراجع مرکز بالحق' && existing.fullName === 'مراجع مرکز بالحق') {
          existing.fullName = name;
        }
      } else {
        clientsMap.set(caseCode, {
          caseCode,
          fullName: name,
          mobile,
          totalForms: 1,
          totalBookings: isBooking ? 1 : 0,
          totalQuizzes: isQuiz ? 1 : 0,
          latestDate: s.createdAt,
        });
      }
    });

    return Array.from(clientsMap.values())
      .sort((a, b) => b.totalForms - a.totalForms || b.totalBookings - a.totalBookings)
      .slice(0, 8);
  }, [submissions]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7 pb-20 sm:pb-12 space-y-6 bg-slate-50 overscroll-contain">
      
      {/* سربرگ داشبورد مدیریت */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              سامانه آنلاین و برخط
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            پنل جامع مدیریت مرکز خدمات روانشناسی و مشاوره بالحق
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            پایش لحظه‌ای پرونده‌ها، نوبت‌دهی تلفنی، ارزیابی‌های خودسنجی و گزارش‌های آماری
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

      {/* ۳. باکس آمار کلی سامانه (تعداد ثبت پرونده، تعداد نوبت‌های دریافتی، تعداد فرم‌های پرسشنامه) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* کارت ۱: تعداد ثبت پرونده */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">تعداد پرونده‌های مراجعین</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {toPersianDigits(statsOverview.totalCasesCount)}
          </div>
          <div className="text-[11px] text-sky-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
            <span>کدهای یکتای صادرشده (پیشوند SP)</span>
          </div>
        </div>

        {/* کارت ۲: تعداد نوبت‌های دریافتی */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">تعداد نوبت‌های دریافتی</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono tracking-tight">
            {toPersianDigits(statsOverview.totalBookingsCount)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
            <span>جلسات رزرو شده با اساتید مشاور</span>
          </div>
        </div>

        {/* کارت ۳: تعداد فرم‌های پرسشنامه */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">تعداد فرم‌های پرسشنامه و تست</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-700 font-mono tracking-tight">
            {toPersianDigits(statsOverview.totalQuizzesCount)}
          </div>
          <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
            <span>ارزیابی صفان و خودسنجی تکمیل‌شده</span>
          </div>
        </div>

        {/* کارت ۴: کل ارسالی‌ها و تراکنش‌ها */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">مجموع تراکنش‌های شاپرک</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-900 font-mono tracking-tight truncate">
            {statsOverview.totalRevenue > 0 ? formatCurrency(statsOverview.totalRevenue, 'IRT') : 'بدون هزینه'}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
            <span>{toPersianDigits(statsOverview.totalPaidCount)} پرداخت موفق الکترونیک</span>
          </div>
        </div>

      </div>

      {/* بخش میانی: ۲ نمودار عمودی (موضوعات مشاوره + نوبت‌های مشاوران) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ۲. باکس بیشترین موضوعات توصیه شده برای مراجعان توسط مشاوران */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-600" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    بیشترین موضوعات توصیه و مراجعه به مشاوران
                  </h2>
                  <span className="text-[11px] text-slate-400">توزیع موضوعی درخواست‌های مشاوره مراجعان</span>
                </div>
              </div>
              <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-bold border border-sky-100">
                نمودار میله‌ای عمودی
              </span>
            </div>

            <VerticalBarChart
              data={topTopicsData}
              unit="مورد"
              height={230}
              barColor="bg-sky-500"
              showValues={true}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>۵ موضوع محوری مرکز مشاوره بالحق</span>
            <span className="font-bold text-slate-700">بیشترین تقاضا: موضوع بالینی و خانواده</span>
          </div>
        </div>

        {/* ۴. باکس بیشترین نوبت‌ها از مشاوران (از کدام مشاوران بیشترین نوبت ها دریافت شده) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    بیشترین نوبت‌های دریافتی از مشاوران
                  </h2>
                  <span className="text-[11px] text-slate-400">رتبه‌بندی اساتید بر اساس تعداد جلسات رزرو شده</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-100">
                نمودار میله‌ای عمودی
              </span>
            </div>

            <VerticalBarChart
              data={topCounselorsData}
              unit="نوبت"
              height={230}
              barColor="bg-emerald-600"
              showValues={true}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>اساتید مشاور برتر بالحق</span>
            <button
              onClick={() => onNavigateTab('submissions')}
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده نوبت‌ها در کارتابل</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>

      </div>

      {/* بخش پایینی: آخرین فعالیت‌ها + بیشترین نوبت‌ها و فرم‌های مراجعان */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ۱. باکس آخرین فعالیت‌ها (ثبت پرونده، نوبت‌ها، پرسش‌نامه‌ها) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  آخرین فعالیت‌ها و رویدادهای سامانه
                </h2>
              </div>

              {/* فیلتر تب رویدادها */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                {[
                  { id: 'all', label: 'همه' },
                  { id: 'cases', label: 'ثبت پرونده' },
                  { id: 'bookings', label: 'نوبت‌ها' },
                  { id: 'quizzes', label: 'پرسش‌نامه‌ها' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivityFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      activityFilter === tab.id
                        ? 'bg-white text-indigo-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* لیست رویدادها */}
            <div className="space-y-3 mt-4 max-h-[420px] overflow-y-auto pr-1">
              {recentActivities.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  هیچ فعالیتی در این دسته یافت نشد.
                </div>
              ) : (
                recentActivities.slice(0, 7).map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 transition-all flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900">{act.clientName}</span>
                        <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {act.caseCode}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${act.badgeColor}`}>
                          {act.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{act.detail}</p>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                      {formatPersianDateTime(act.createdAt).split(' ')[1] || formatPersianDateTime(act.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('submissions')}
            className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>مشاهده تاریخچه کامل در کارتابل</span>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>

        {/* ۵. باکس بیشترین نوبت‌ها و فرم‌های مراجعان (چه کسانی بیشترین نوبت ها و فرم ها را دریافت کرده اند) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    بیشترین نوبت‌ها و فرم‌های مراجعان
                  </h2>
                  <span className="text-[11px] text-slate-400">فعال‌ترین مراجعین با بیشترین ثبت و نوبت</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {toPersianDigits(topClientsList.length)} مراجع برتر
              </span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold">
                    <th className="py-2.5 px-2">نام و پرونده</th>
                    <th className="py-2.5 px-2 text-center">نوبت‌ها</th>
                    <th className="py-2.5 px-2 text-center">پرسش‌نامه‌ها</th>
                    <th className="py-2.5 px-2 text-center">کل فرم‌ها</th>
                    <th className="py-2.5 px-2 text-center">اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topClientsList.map((client, idx) => (
                    <tr key={client.caseCode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0">
                            {toPersianDigits(idx + 1)}
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs">
                              {client.fullName}
                            </span>
                            <span className="font-mono text-[10px] text-sky-700">
                              {client.caseCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                          {toPersianDigits(client.totalBookings)} نوبت
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                          {toPersianDigits(client.totalQuizzes)} آزمون
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono font-black text-slate-800 text-xs">
                        {toPersianDigits(client.totalForms)}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => onNavigateTab('submissions')}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          title="مشاهده پرونده مراجع در کارتابل"
                        >
                          <span>پرونده</span>
                          <ArrowRight className="w-3 h-3 rotate-180" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>مرتب‌سازی بر اساس تعامل پیوسته مراجع</span>
            <button
              onClick={() => onNavigateTab('submissions')}
              className="text-sky-700 hover:text-sky-900 font-bold cursor-pointer"
            >
              مشاهده جدول کامل کارتابل ←
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
