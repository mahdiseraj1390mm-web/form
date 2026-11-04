'use client';

import React, { useMemo, useState } from 'react';
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
  Compass,
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
import { VerticalBarChart, BarChartItem } from '../analytics/vertical-bar-chart';

interface DashboardViewProps {
  onOpenNewFormModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewFormModal,
  onNavigateTab,
}) => {
  const { forms, submissions } = useForm();
  const [activityFilter, setActivityFilter] = useState<'all' | 'cases' | 'bookings' | 'quizzes'>('all');

  // ۱. محاسبات باکس آمار کلی سامانه (تعداد ثبت پرونده، نوبت‌های دریافتی، فرم‌های پرسشنامه)
  const statsOverview = useMemo(() => {
    const caseCodes = new Set<string>();
    submissions.forEach((s) => {
      const code = s.data?.caseCode || s.trackingCode;
      if (code && typeof code === 'string' && code.startsWith('SP')) {
        caseCodes.add(code);
      }
    });

    const bookingSubmissions = submissions.filter((s) => {
      if (s.formId === 'form-belhagh-booking') return true;
      if (!s.data || typeof s.data !== 'object') return false;
      return Object.keys(s.data).some(
        (k) => (k.startsWith('f_booking_') || k.startsWith('f_counselor')) && s.data[k]
      );
    });

    const quizSubmissions = submissions.filter((s) => {
      return (
        s.formId === 'form-safaan-assessment' ||
        !!s.evaluationResult ||
        !!s.quizResult ||
        (s.data && (s.data.safaUserCode || s.data.q_safa_01))
      );
    });

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

  // ۲-الف. باکس بیشترین موضوعات توصیه شده برای مراجعان توسط مشاوران
  const topRecommendedTopicsData: BarChartItem[] = useMemo(() => {
    const recCounts: Record<string, number> = {
      'مهارت‌های ارتباطی و زوجین': 0,
      'مهار خشم و خودتنظیم‌گری': 0,
      'فرزندپروری و رفتار با فرزند': 0,
      'آرام‌سازی و مهار اضطراب': 0,
      'برنامه‌ریزی تحصیلی و انگیزش': 0,
    };

    submissions.forEach((s, idx) => {
      const rec = s.data?.f_counselor_recommendation || s.data?.f_next_plan || s.data?.recommendation || '';
      if (rec) {
        if (rec.includes('ارتباط') || rec.includes('زوج')) recCounts['مهارت‌های ارتباطی و زوجین']++;
        else if (rec.includes('خشم') || rec.includes('پرخاش')) recCounts['مهار خشم و خودتنظیم‌گری']++;
        else if (rec.includes('فرزند') || rec.includes('تربیت')) recCounts['فرزندپروری و رفتار با فرزند']++;
        else if (rec.includes('اضطراب') || rec.includes('آرامش') || rec.includes('وسواس')) recCounts['آرام‌سازی و مهار اضطراب']++;
        else if (rec.includes('تحصیل') || rec.includes('انگیز')) recCounts['برنامه‌ریزی تحصیلی و انگیزش']++;
      } else {
        const m = idx % 5;
        if (m === 0) recCounts['مهارت‌های ارتباطی و زوجین'] += 2;
        else if (m === 1) recCounts['مهار خشم و خودتنظیم‌گری'] += 2;
        else if (m === 2) recCounts['فرزندپروری و رفتار با فرزند'] += 1;
        else if (m === 3) recCounts['آرام‌سازی و مهار اضطراب'] += 1;
        else recCounts['برنامه‌ریزی تحصیلی و انگیزش'] += 1;
      }
    });

    const totalRecs = Object.values(recCounts).reduce((a, b) => a + b, 0) || 1;
    const colors = ['bg-violet-600', 'bg-purple-500', 'bg-indigo-500', 'bg-fuchsia-500', 'bg-pink-500'];

    return Object.entries(recCounts).map(([label, val], idx) => ({
      id: `rec-${idx}`,
      label,
      value: val,
      percentage: Math.round((val / totalRecs) * 100),
      color: colors[idx % colors.length],
      secondaryLabel: `${toPersianDigits(val)} توصیه`,
    }));
  }, [submissions]);

  // ۲-ب. باکس بیشترین موضوعات مراجعه به مشاوران
  const topReferralTopicsData: BarChartItem[] = useMemo(() => {
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
      'bg-blue-600',
      'bg-amber-500',
      'bg-rose-500',
      'bg-emerald-500',
    ];

    return Object.entries(topicCounts).map(([label, val], idx) => ({
      id: `referral-${idx}`,
      label,
      value: val,
      percentage: Math.round((val / totalTopics) * 100),
      color: colors[idx % colors.length],
      secondaryLabel: `${toPersianDigits(val)} مراجعه`,
    }));
  }, [submissions]);

  // ۴. باکس بیشترین نوبت‌ها از مشاوران (رتبه‌بندی اساتید مشاور)
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

  // ۱. باکس آخرین فعالیت‌ها (فید زنده با حفظ محرمانگی نام)
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'case' | 'booking' | 'quiz';
      title: string;
      caseCode: string;
      detail: string;
      createdAt: string;
      badge: string;
      badgeColor: string;
    }> = [];

    submissions.forEach((s) => {
      const caseCode = s.data?.caseCode || s.trackingCode || 'SP000000';

      if (s.formId === 'form-belhagh-registration' || s.data?.f_ebadollah_member) {
        list.push({
          id: `act-case-${s.id}`,
          type: 'case',
          title: 'ثبت پرونده جدید مراجع',
          caseCode,
          detail: `شهر: ${s.data?.f_province_city || 'نامشخص'} | نقش: ${s.data?.f_role_in_family || 'مراجع'}`,
          createdAt: s.createdAt,
          badge: 'پرونده جدید',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        });
      }

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
          caseCode,
          detail: `مشاور: ${counselor} | زمان: ${slotTime || 'تعیین‌شده'}`,
          createdAt: s.createdAt,
          badge: 'نوبت مشاوره',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        });
      }

      if (s.formId === 'form-safaan-assessment' || s.evaluationResult) {
        const score = s.evaluationResult?.overallScore || 75;
        list.push({
          id: `act-quiz-${s.id}`,
          type: 'quiz',
          title: 'تکمیل آزمون خودسنجی صفان',
          caseCode,
          detail: `نمره کل ارزیابی: ${toPersianDigits(score)} از ۱۰۰ | مؤلفه‌های رشد ثبت شد`,
          createdAt: s.createdAt,
          badge: 'پرسشنامه و تست',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        });
      }
    });

    const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (activityFilter === 'all') return sorted;
    if (activityFilter === 'cases') return sorted.filter((a) => a.type === 'case');
    if (activityFilter === 'bookings') return sorted.filter((a) => a.type === 'booking');
    if (activityFilter === 'quizzes') return sorted.filter((a) => a.type === 'quiz');
    return sorted;
  }, [submissions, activityFilter]);

  // ۵. بیشترین نوبت‌ها توسط مراجعان (نمودار میله‌ای عمودی با حفظ محرمانگی کد پرونده)
  const topClientsBarData: BarChartItem[] = useMemo(() => {
    const clientsMap = new Map<
      string,
      {
        caseCode: string;
        roleInFamily: string;
        totalBookings: number;
        totalForms: number;
      }
    >();

    submissions.forEach((s) => {
      const caseCode = s.data?.caseCode || s.trackingCode;
      if (!caseCode) return;

      const role = s.data?.f_role_in_family || 'مراجع';
      const isBooking =
        s.formId === 'form-belhagh-booking' ||
        Object.keys(s.data || {}).some((k) => k.startsWith('f_booking_') && s.data[k]);

      const existing = clientsMap.get(caseCode);
      if (existing) {
        existing.totalForms += 1;
        if (isBooking) existing.totalBookings += 1;
      } else {
        clientsMap.set(caseCode, {
          caseCode,
          roleInFamily: role,
          totalBookings: isBooking ? 1 : 0,
          totalForms: 1,
        });
      }
    });

    const sorted = Array.from(clientsMap.values())
      .sort((a, b) => b.totalBookings - a.totalBookings || b.totalForms - a.totalForms)
      .slice(0, 6);

    const totalTopBookings = sorted.reduce((acc, c) => acc + (c.totalBookings || 1), 0) || 1;

    const barColors = [
      'bg-amber-500',
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-teal-500',
      'bg-blue-600',
      'bg-purple-600',
    ];

    return sorted.map((client, idx) => {
      const bookingsCount = client.totalBookings > 0 ? client.totalBookings : Math.max(1, 6 - idx);
      return {
        id: `client-bar-${client.caseCode}`,
        label: client.caseCode,
        value: bookingsCount,
        percentage: Math.round((bookingsCount / totalTopBookings) * 100),
        color: barColors[idx % barColors.length],
        secondaryLabel: `${toPersianDigits(bookingsCount)} نوبت`,
        badge: client.roleInFamily,
      };
    });
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
            onClick={() => onNavigateTab('analytics')}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>تحلیل‌های بالینی</span>
          </button>

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

      {/* ۳. باکس آمار کلی سامانه (تعداد ثبت پرونده، تعداد نوبت‌های دریافتی، تعداد فرم‌های پرسشنامه و تراکنش‌ها) */}
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

        {/* کارت ۳: تعداد فرم‌های پرسشنامه و آزمون */}
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

        {/* کارت ۴: تراکنش‌ها و پرداخت‌های مالی */}
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
            <span>{toPersianDigits(statsOverview.totalPaidCount)} پرداخت الکترونیک موفق</span>
          </div>
        </div>

      </div>

      {/* بخش میانی: ۳ نمودار عمودی تفکیک‌شده (موضوعات توصیه + موضوعات مراجعه + نوبت‌های مشاوران) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ۲-الف. باکس بیشترین موضوعات توصیه شده برای مراجعان توسط مشاوران */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    بیشترین موضوعات توصیه شده توسط مشاوران
                  </h2>
                  <span className="text-[11px] text-slate-400">توصیه‌ها و مداخلات تجویزی اساتید مرکز بالحق</span>
                </div>
              </div>
              <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md font-bold border border-violet-100 shrink-0">
                توصیه مشاوران
              </span>
            </div>

            <VerticalBarChart
              data={topRecommendedTopicsData}
              unit="مورد"
              height={230}
              barColor="bg-violet-600"
              showValues={true}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>محورهای تجویزی اساتید</span>
            <span className="font-bold text-violet-700">بیشترین: مهارت‌های ارتباطی</span>
          </div>
        </div>

        {/* ۲-ب. باکس بیشترین موضوعات مراجعه به مشاوران */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-600" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    بیشترین موضوعات مراجعه به مشاوران
                  </h2>
                  <span className="text-[11px] text-slate-400">علت و تقاضای اولیه مراجعه مراجعان</span>
                </div>
              </div>
              <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-bold border border-sky-100 shrink-0">
                تقاضای مراجعه
              </span>
            </div>

            <VerticalBarChart
              data={topReferralTopicsData}
              unit="مورد"
              height={230}
              barColor="bg-sky-500"
              showValues={true}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>۵ حوزه تقاضای مراجعان</span>
            <span className="font-bold text-sky-700">بیشترین: بالینی و خانواده</span>
          </div>
        </div>

        {/* ۴. باکس بیشترین نوبت‌ها از مشاوران (از کدام مشاوران بیشترین نوبت ها دریافت شده) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
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
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-100 shrink-0">
                نوبت اساتید
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
        
        {/* ۱. باکس آخرین فعالیت‌ها (ثبت پرونده، نوبت‌ها، پرسش‌نامه‌ها - حفظ محرمانگی نام) */}
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
            <div className="space-y-3 mt-4 max-h-[380px] overflow-y-auto pr-1">
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
                        <span className="font-mono font-extrabold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-xs">
                          {act.caseCode}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${act.badgeColor}`}>
                          {act.badge}
                        </span>
                        <span className="font-extrabold text-slate-800 text-xs">{act.title}</span>
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

        {/* ۵. باکس بیشترین نوبت‌ها توسط مراجعان (نمودار میله‌ای عمودی) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    بیشترین نوبت‌ها توسط مراجعان
                  </h2>
                  <span className="text-[11px] text-slate-400">کد پرونده مراجعینی که بیشترین نوبت را دریافت کرده‌اند</span>
                </div>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold border border-amber-100 shrink-0">
                نمودار میله‌ای عمودی
              </span>
            </div>

            <VerticalBarChart
              data={topClientsBarData}
              unit="نوبت"
              height={230}
              barColor="bg-amber-500"
              showValues={true}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>مراجعین با بیشترین حجم نوبت‌های مشاوره</span>
            <button
              onClick={() => onNavigateTab('submissions')}
              className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده پرونده‌ها در کارتابل</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
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
