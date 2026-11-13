'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import { isSuperAdminUser } from '@/lib/team-constants';
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
  FileSpreadsheet,
  AlertTriangle,
  Users,
  List,
  BarChart2,
  SlidersHorizontal,
  User,
  Heart,
  MapPin,
  CalendarDays,
  Phone,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  FolderKanban,
  Activity,
  HeartHandshake,
  Baby,
  Smile,
  GraduationCap,
  Building,
  UserCheck,
  Compass,
  CalendarCheck,
  ArrowRight,
  PlusCircle,
  ChevronRight
} from 'lucide-react';
import { toPersianDigits, formatCurrency, formatPersianDateTime, getFieldDisplayValue, getTopItemSummary, getJalaliMonthName, calculateJalaliAge } from '@/lib/persian';
import { isAssignedSafaSubmission, filterActiveSubmissions } from '@/lib/safa-utils';
import { getSemanticColorByPercentage, getFourColorByIndex } from '@/lib/chart-colors';
import { VerticalBarChart, BarChartItem } from '@/components/analytics/vertical-bar-chart';
import { PointLineChart, PointLineChartItem } from '@/components/analytics/point-line-chart';
import { CollapsibleCard } from '@/components/ui/collapsible-card';

// بررسی این‌که آیا سابمیشن یک نوبت مشاوره واقعی با مشاور مشخص یا زمان مشخص است
export const isRealBookingSubmission = (s: any): boolean => {
  if (!s || !s.data || typeof s.data !== 'object') return false;
  const d = s.data;
  const hasCounselor = Boolean(
    d.f_counselor ||
    d.f_booking_counselor ||
    d.counselorName ||
    d.counselor ||
    d.f_counselor_child ||
    d.f_counselor_teen ||
    d.f_counselor_education ||
    d.f_counselor_clinical ||
    d.f_counselor_family
  );
  const hasSlot = Boolean(
    d.f_booking_datetime ||
    d.f_booking_date ||
    d.f_booking_slot ||
    Object.keys(d).some((k) => k.startsWith('f_booking_') && Boolean(d[k]))
  );
  return hasCounselor || hasSlot;
};

interface AnalyticsViewProps {
  onNavigateToRunner?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onNavigateToRunner }) => {
  const router = useRouter();
  const { forms, submissions, setActiveForm, activeForm } = useForm();
  const { currentUser } = useAdminAuth();
  const isSuperAdmin = isSuperAdminUser(currentUser);

  // دو زبانه اصلی: داشبورد جامع آمارهای کلان مدیریتی (پیش‌فرض) و تحلیل تفکیکی فیلدهای فرم‌ها
  const [activeTab, setActiveTab] = useState<'overview' | 'formDetail'>('overview');

  // فیلتر بازه زمانی برای داشبورد کلان (ماه جاری، ۳ ماهه فصلی، سال جاری، کل سوابق)
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'cases' | 'bookings' | 'quizzes'>('all');
  const [analyticsProgressMetric, setAnalyticsProgressMetric] = useState<'sessions' | 'cases' | 'clinicalEquilibrium'>('sessions');

  // فیلترهای تب تفکیکی فرم‌ها
  const [selectedFormId, setSelectedFormId] = useState<string>(activeForm?.id || forms[0]?.id || '');
  const [selectedChoiceFieldId, setSelectedChoiceFieldId] = useState<string>('');
  const [selectedNumericFieldId, setSelectedNumericFieldId] = useState<string>('');
  const [chartColorSchemeMode, setChartColorSchemeMode] = useState<'threshold' | 'sequential'>('sequential');
  const [chartOrientation, setChartOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isExporting, setIsExporting] = useState(false);

  const currentForm = forms.find((f) => f.id === selectedFormId) || forms[0];

    // اعمال فیلتر زمانی روی کل سابمیشن‌های معتبر (کارنامه‌های متصل‌نشده صَفًّا از آمار و تحلیل‌ها خارج می‌شوند)
  const filteredSubmissions = useMemo(() => {
    const activeBase = filterActiveSubmissions(submissions);
    if (timeRange === 'all') return activeBase;
    const now = new Date();
    return activeBase.filter((s) => {
      const d = new Date(s.createdAt);
      if (isNaN(d.getTime())) return true;
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      if (timeRange === 'month') return diffDays <= 30;
      if (timeRange === 'quarter') return diffDays <= 90;
      if (timeRange === 'year') return diffDays <= 365;
      return true;
    });
  }, [submissions, timeRange]);

  // ۱. پرونده‌های مراجعین و مراجعین پرتکرار (بیشترین نوبت‌ها)
  
  // ۱. محاسبات باکس آمار کلی سامانه (تعداد ثبت پرونده، تعداد نوبت‌های دریافتی، تعداد فرم‌های پرسشنامه)
  const statsOverview = useMemo(() => {
    const caseCodes = new Set<string>();
    filteredSubmissions.forEach((s) => {
      const code = s.data?.caseCode || s.trackingCode;
      if (code && typeof code === 'string' && code.startsWith('SP')) {
        caseCodes.add(code);
      }
    });

    const bookingSubmissions = filteredSubmissions.filter((s) => isRealBookingSubmission(s));

    const quizSubmissions = filteredSubmissions.filter((s) => {
      return (
        isAssignedSafaSubmission(s) ||
        (s.formId !== 'form-safaan-assessment' &&
          s.formId !== 'form-belhagh-registration' &&
          s.formId !== 'form-belhagh-booking' &&
          (!!s.evaluationResult || !!s.quizResult))
      );
    });

    const registrationSubmissions = filteredSubmissions.filter(
      (s) => s.formId === 'form-belhagh-registration' || s.data?.f_ebadollah_member !== undefined
    );

    const paidSubmissions = filteredSubmissions.filter((s) => s.paymentStatus === 'paid');
    const totalRevenue = paidSubmissions.reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0);

    return {
      totalCasesCount: Math.max(caseCodes.size, registrationSubmissions.length),
      totalBookingsCount: bookingSubmissions.length,
      totalQuizzesCount: quizSubmissions.length,
      totalPaidCount: paidSubmissions.length,
      totalRevenue,
      totalAllSubmissions: filteredSubmissions.length,
    };
  }, [filteredSubmissions]);

  // پایش روند پیشرفت شاخص‌های بالینی و پرونده‌ها در طول زمان (بر اساس ماه‌های واقعی شمسی و داده‌های ثبت‌شده)
  const analyticsProgressData: PointLineChartItem[] = useMemo(() => {
    const PERSIAN_MONTHS = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const now = new Date();
    let currentMonthName = 'آبان';
    try {
      currentMonthName = new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(now);
    } catch {}

    const curIdx = PERSIAN_MONTHS.indexOf(currentMonthName);
    const safeCurIdx = curIdx >= 0 ? curIdx : 7; // آبان

    // ۶ ماه اخیر منتهی به ماه جاری تقویم شمسی
    const displayMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const mIdx = (safeCurIdx - i + 12) % 12;
      displayMonths.push(PERSIAN_MONTHS[mIdx]);
    }

    const monthlySessions: Record<string, number> = {};
    const monthlyCases: Record<string, number> = {};
    const monthlyScores: Record<string, number[]> = {};

    displayMonths.forEach((m) => {
      monthlySessions[m] = 0;
      monthlyCases[m] = 0;
      monthlyScores[m] = [];
    });

    filteredSubmissions.forEach((s) => {
      if (!s.createdAt) return;
      try {
        const d = new Date(s.createdAt);
        if (isNaN(d.getTime())) return;
        const m = new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(d);
        if (!displayMonths.includes(m)) return;

        // شمارش نوبت‌ها و جلسات واقعی
        const isBooking = isRealBookingSubmission(s);
        if (isBooking) {
          monthlySessions[m] = (monthlySessions[m] || 0) + 1;
        }

        // شمارش پرونده‌های واقعی
        const isCase =
          s.formId === 'form-belhagh-registration' ||
          s.data?.f_ebadollah_member !== undefined ||
          (typeof s.data?.caseCode === 'string' && s.data.caseCode.startsWith('SP'));
        if (isCase) {
          monthlyCases[m] = (monthlyCases[m] || 0) + 1;
        }

        // نمرات پایش آزمون‌های خودسنجی
        if (s.evaluationResult?.overallScore && typeof s.evaluationResult.overallScore === 'number') {
          monthlyScores[m].push(s.evaluationResult.overallScore);
        }
      } catch {}
    });

    if (analyticsProgressMetric === 'sessions') {
      return displayMonths.map((m, idx) => {
        const val = monthlySessions[m] || 0;
        const prevVal = idx > 0 ? (monthlySessions[displayMonths[idx - 1]] || 0) : null;
        let secondaryLabel = 'آغاز پایش';
        if (prevVal !== null) {
          const diff = val - prevVal;
          if (diff > 0) secondaryLabel = `+${toPersianDigits(diff)} جلسه نسبت به قبل`;
          else if (diff < 0) secondaryLabel = `-${toPersianDigits(Math.abs(diff))} جلسه`;
          else secondaryLabel = val > 0 ? 'مشابه ماه قبل' : 'بدون جلسه';
        }
        return {
          id: `ap-sess-${idx}`,
          label: m,
          value: val,
          secondaryLabel,
          color: '#0284c7',
          badge: idx === displayMonths.length - 1 ? 'ماه جاری' : undefined,
        };
      });
    } else if (analyticsProgressMetric === 'cases') {
      return displayMonths.map((m, idx) => {
        const val = monthlyCases[m] || 0;
        const prevVal = idx > 0 ? (monthlyCases[displayMonths[idx - 1]] || 0) : null;
        let secondaryLabel = 'مبنا';
        if (prevVal !== null) {
          const diff = val - prevVal;
          if (diff > 0) secondaryLabel = `+${toPersianDigits(diff)} پرونده جدید`;
          else if (diff < 0) secondaryLabel = `-${toPersianDigits(Math.abs(diff))} پرونده`;
          else secondaryLabel = val > 0 ? 'مشابه ماه قبل' : 'بدون ثبت پرونده';
        }
        return {
          id: `ap-case-${idx}`,
          label: m,
          value: val,
          secondaryLabel,
          color: '#059669',
          badge: idx === displayMonths.length - 1 ? 'پذیرش فعال' : undefined,
        };
      });
    } else {
      return displayMonths.map((m, idx) => {
        const scores = monthlyScores[m] || [];
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return {
          id: `ap-eq-${idx}`,
          label: m,
          value: avg,
          secondaryLabel: avg > 0 ? `تعادل %${toPersianDigits(avg)}` : 'بدون آزمون',
          color: '#7c3aed',
          badge: idx === displayMonths.length - 1 && avg > 0 ? 'مطلوب و روبه‌رشد' : undefined,
        };
      });
    }
  }, [filteredSubmissions, analyticsProgressMetric]);

  // ۲-الف. باکس بیشترین موضوعات توصیه شده برای مراجعان توسط مشاوران (بدون شبیه‌سازی و داده‌های ساختگی)
  const topRecommendedTopicsData: BarChartItem[] = useMemo(() => {
    const recCounts: Record<string, number> = {
      'مهارت‌های ارتباطی و زوجین': 0,
      'مهار خشم و خودتنظیم‌گری': 0,
      'فرزندپروری و رفتار با فرزند': 0,
      'آرام‌سازی و مهار اضطراب': 0,
      'برنامه‌ریزی تحصیلی و انگیزش': 0,
    };

    filteredSubmissions.forEach((s) => {
      const commentTexts = Array.isArray(s.comments) ? s.comments.map((c: any) => c.text || '').join(' ') : '';
      const rec = `${s.data?.f_counselor_recommendation || ''} ${s.data?.f_next_plan || ''} ${s.data?.recommendation || ''} ${commentTexts}`.trim();

      if (rec) {
        if (rec.includes('ارتباط') || rec.includes('زوج')) recCounts['مهارت‌های ارتباطی و زوجین']++;
        if (rec.includes('خشم') || rec.includes('پرخاش')) recCounts['مهار خشم و خودتنظیم‌گری']++;
        if (rec.includes('فرزند') || rec.includes('تربیت')) recCounts['فرزندپروری و رفتار با فرزند']++;
        if (rec.includes('اضطراب') || rec.includes('آرامش') || rec.includes('وسواس')) recCounts['آرام‌سازی و مهار اضطراب']++;
        if (rec.includes('تحصیل') || rec.includes('انگیز')) recCounts['برنامه‌ریزی تحصیلی و انگیزش']++;
      }
    });

    const totalRecs = Object.values(recCounts).reduce((a, b) => a + b, 0);
    const colors = ['bg-violet-600', 'bg-purple-500', 'bg-indigo-500', 'bg-fuchsia-500', 'bg-pink-500'];

    return Object.entries(recCounts).map(([label, val], idx) => ({
      id: `rec-${idx}`,
      label,
      value: val,
      percentage: totalRecs > 0 ? Math.round((val / totalRecs) * 100) : 0,
      color: colors[idx % colors.length],
      secondaryLabel: `${toPersianDigits(val)} توصیه`,
    }));
  }, [filteredSubmissions]);

  // ۲-ب. باکس بیشترین موضوعات مراجعه به مشاوران (بر اساس پاسخ‌های واقعی و گزینه‌های رزرو)
  const topReferralTopicsData: BarChartItem[] = useMemo(() => {
    const topicCounts: Record<string, number> = {
      'کودک': 0,
      'نوجوان': 0,
      'تحصیلی': 0,
      'بالینی (اضطراب و وسواس)': 0,
      'ازدواج و خانواده': 0,
    };

    filteredSubmissions.forEach((s) => {
      const topic = s.data?.f_topic || s.data?.f_counseling_subject || s.data?.topic || '';
      if (topic) {
        if (topic.includes('کودک')) topicCounts['کودک']++;
        else if (topic.includes('نوجوان')) topicCounts['نوجوان']++;
        else if (topic.includes('تحصیلی')) topicCounts['تحصیلی']++;
        else if (topic.includes('بالینی') || topic.includes('اضطراب') || topic.includes('وسواس')) {
          topicCounts['بالینی (اضطراب و وسواس)']++;
        } else if (topic.includes('ازدواج') || topic.includes('خانواده')) {
          topicCounts['ازدواج و خانواده']++;
        }
      } else if (s.data && typeof s.data === 'object') {
        const keys = Object.keys(s.data);
        if (keys.some(k => k.includes('child') || k.includes('shavandi_child') || k.includes('ansari_child') || k.includes('zeynali_child'))) {
          topicCounts['کودک']++;
        } else if (keys.some(k => k.includes('teen') || k.includes('borhani_teen') || k.includes('rastgoo_teen') || k.includes('ansari_teen'))) {
          topicCounts['نوجوان']++;
        } else if (keys.some(k => k.includes('education') || k.includes('abdi_education') || k.includes('torshizi') || k.includes('yavari'))) {
          topicCounts['تحصیلی']++;
        } else if (keys.some(k => k.includes('clinical') || k.includes('rastgoo_clinical') || k.includes('golyayi_clinical'))) {
          topicCounts['بالینی (اضطراب و وسواس)']++;
        } else if (keys.some(k => k.includes('family') || k.includes('sedighi_family') || k.includes('borhani_family') || k.includes('karimi_family'))) {
          topicCounts['ازدواج و خانواده']++;
        }
      }
    });

    const totalTopics = Object.values(topicCounts).reduce((a, b) => a + b, 0);
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
      percentage: totalTopics > 0 ? Math.round((val / totalTopics) * 100) : 0,
      color: colors[idx % colors.length],
      secondaryLabel: `${toPersianDigits(val)} مراجعه`,
    }));
  }, [filteredSubmissions]);

  // ۳. باکس بیشترین نوبت‌ها از مشاوران (بر اساس نوبت‌های واقعی)
  const topCounselorsData: BarChartItem[] = useMemo(() => {
    const counselorCounts: Record<string, number> = {};

    filteredSubmissions.forEach((s) => {
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
        const isFemale = cleanName.includes('شوندی') || cleanName.includes('خانم') || counselor.includes('خانم');
        const prefix = isFemale ? 'خانم' : 'آقای';
        const fullClean = `${prefix} ${cleanName}`;
        counselorCounts[fullClean] = (counselorCounts[fullClean] || 0) + 1;
      }
    });

    const sorted = Object.entries(counselorCounts).sort((a, b) => b[1] - a[1]);
    const top6 = sorted.slice(0, 6);
    const totalBookings = top6.reduce((acc, curr) => acc + curr[1], 0);

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
      percentage: totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0,
      color: barColors[idx % barColors.length],
      secondaryLabel: `${toPersianDigits(count)} نوبت`,
    }));
  }, [filteredSubmissions]);

  // ۴. باکس آخرین فعالیت‌ها (فید بلادرنگ رویدادها)
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

    filteredSubmissions.forEach((s) => {
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
      if (isRealBookingSubmission(s)) {
        let counselor = s.data?.f_counselor || 'مشاور محترم';
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
      if (isAssignedSafaSubmission(s) || (s.formId !== 'form-safaan-assessment' && s.evaluationResult)) {
        const score = s.evaluationResult?.overallScore || 75;
        list.push({
          id: `act-quiz-${s.id}`,
          type: 'quiz',
          title: 'تکمیل آزمون خودسنجی صَفًّا',
          clientName,
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
  }, [filteredSubmissions, activityFilter]);

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

    filteredSubmissions.forEach((s) => {
      const caseCode = s.data?.caseCode || s.trackingCode;
      if (!caseCode) return;

      const role = s.data?.f_role_in_family || 'مراجع';
      const isBooking = isRealBookingSubmission(s);

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
      const bookingsCount = client.totalBookings;
      return {
        id: `client-bar-${client.caseCode}`,
        label: client.caseCode,
        value: bookingsCount,
        percentage: totalTopBookings > 0 && bookingsCount > 0 ? Math.round((bookingsCount / totalTopBookings) * 100) : 0,
        color: barColors[idx % barColors.length],
        secondaryLabel: `${toPersianDigits(bookingsCount)} نوبت`,
        badge: client.roleInFamily,
      };
    });
  }, [filteredSubmissions]);

  const { clientCases, topClients, bookingBreakdown, totalBookings } = useMemo(() => {
    const caseMap = new Map<string, {
      caseCode: string;
      fullName: string;
      mobile: string;
      city: string;
      submissions: typeof filteredSubmissions;
      bookingCount: number;
      latestDate: string;
      gender: string;
      maritalStatus: string;
      role: string;
      familyMembers: string;
    }>();

    let bookingsSum = 0;

    filteredSubmissions.forEach((sub) => {
      const d = sub.data || {};
      const cCode = d.caseCode || sub.trackingCode || `CASE-${sub.id.slice(-6)}`;
      const isBooking = isRealBookingSubmission(sub);
      if (isBooking) bookingsSum++;

      const candidateName = d.fullName || (d.f_name || d.f_family ? `${d.f_name || ''} ${d.f_family || ''}`.trim() : '') || d.f_fullname || '';
      let city = d.f_province_city_city || d.f_province_city || d.province || d.school_name || '';
      if (city.includes(' - ')) city = city.split(' - ')[1] || city;
      city = city.replace(/مدرسه\s+/g, '').trim();

      const gender = d.gender || (d.f_role_in_family === 'مادر' || d.f_role_in_family === 'دختر' ? 'خانم' : d.f_role_in_family === 'پدر' || d.f_role_in_family === 'پسر' ? 'آقا' : 'نامشخص');

      if (!caseMap.has(cCode)) {
        caseMap.set(cCode, {
          caseCode: cCode,
          fullName: candidateName || 'مراجع مرکز بالحق',
          mobile: d.f_mobile || sub.mobile || 'ثبت‌نشده',
          city: city || 'تهران',
          submissions: [sub],
          bookingCount: isBooking ? 1 : 0,
          latestDate: sub.createdAt,
          gender,
          maritalStatus: d.f_marital_status || 'ثبت‌نشده',
          role: d.f_role_in_family || 'ثبت‌نشده',
          familyMembers: d.f_family_members || 'ثبت‌نشده',
        });
      } else {
        const existing = caseMap.get(cCode)!;
        existing.submissions.push(sub);
        if (isBooking) existing.bookingCount++;
        if (candidateName && existing.fullName === 'مراجع مرکز بالحق') existing.fullName = candidateName;
        if (city && existing.city === 'تهران') existing.city = city;
        if (new Date(sub.createdAt) > new Date(existing.latestDate)) {
          existing.latestDate = sub.createdAt;
        }
      }
    });

    const allClients = Array.from(caseMap.values());
    const sortedClients = [...allClients].sort((a, b) => b.bookingCount - a.bookingCount || b.submissions.length - a.submissions.length);
    const top10 = sortedClients.slice(0, 8);

    const bBreakdown = {
      single: allClients.filter(c => c.bookingCount === 1).length,
      twoToThree: allClients.filter(c => c.bookingCount >= 2 && c.bookingCount <= 3).length,
      fourToFive: allClients.filter(c => c.bookingCount >= 4 && c.bookingCount <= 5).length,
      sixPlus: allClients.filter(c => c.bookingCount >= 6).length,
      noBookingYet: allClients.filter(c => c.bookingCount === 0).length,
    };

    return { clientCases: allClients, topClients: top10, bookingBreakdown: bBreakdown, totalBookings: bookingsSum };
  }, [filteredSubmissions]);

  const sessionDistributionItems = useMemo(() => {
    const singleCount = bookingBreakdown.single || 0;
    const twoToThreeCount = bookingBreakdown.twoToThree || 0;
    const fourToFiveCount = bookingBreakdown.fourToFive || 0;
    const sixPlusCount = bookingBreakdown.sixPlus || 0;
    const totalCount = singleCount + twoToThreeCount + fourToFiveCount + sixPlusCount;

    return [
      { 
        label: 'مراجعین تک‌جلسه‌ای (نوبت اولیه و پذیرش)', 
        count: singleCount, 
        pct: totalCount > 0 ? Math.round((singleCount / totalCount) * 100) : 0 
      },
      { 
        label: 'مراجعین ۲ تا ۳ جلسه (فرآیند درمان)', 
        count: twoToThreeCount, 
        pct: totalCount > 0 ? Math.round((twoToThreeCount / totalCount) * 100) : 0 
      },
      { 
        label: 'مراجعین ۴ تا ۵ جلسه (مداخله جامع)', 
        count: fourToFiveCount, 
        pct: totalCount > 0 ? Math.round((fourToFiveCount / totalCount) * 100) : 0 
      },
      { 
        label: 'بیش از ۶ جلسه (مراجعین مداوم و ویژه)', 
        count: sixPlusCount, 
        pct: totalCount > 0 ? Math.round((sixPlusCount / totalCount) * 100) : 0 
      },
    ];
  }, [bookingBreakdown]);

  // ۲. توزیع شهرها و استان‌ها
  const cityDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSubmissions.forEach((s) => {
      const d = s.data || {};
      let c = d.f_province_city_city || d.f_province_city || d.province || d.school_name || '';
      if (c.includes(' - ')) c = c.split(' - ')[1] || c;
      c = c.replace(/مدرسه\s+/g, '').replace(/[()]/g, '').trim();
      if (!c || c === 'ثبت‌نشده') c = 'تهران';
      counts[c] = (counts[c] || 0) + 1;
    });

    const total = filteredSubmissions.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }));
  }, [filteredSubmissions]);

  // ۳. هرم و رده‌های سنی با سهم ویژه نوجوانان (بر اساس داده‌های واقعی)
  const ageDistribution = useMemo(() => {
    let under18 = 0, age19to28 = 0, age29to42 = 0, age43plus = 0;
    filteredSubmissions.forEach((s) => {
      const d = s.data || {};
      const birthCand = d.f_birth_date || d.birth_date || d.birthDate || d.f_birth_year || d.birth_year || d.birthYear;
      const age = calculateJalaliAge(birthCand, d.f_age || d.age);
      if (age !== null) {
        if (age <= 18) under18++;
        else if (age <= 28) age19to28++;
        else if (age <= 42) age29to42++;
        else age43plus++;
      } else if (d.f_role_in_family === 'دختر' || d.f_role_in_family === 'پسر') {
        under18++;
      }
    });

    const knownTotal = under18 + age19to28 + age29to42 + age43plus;
    return [
      { label: 'نوجوانان و کودکان (زیر ۱۸ سال)', count: under18, pct: knownTotal > 0 ? Math.round((under18 / knownTotal) * 100) : 0, color: '#0284c7', tag: 'محور ویژه نوجوانان' },
      { label: 'جوانان (۱۹ تا ۲۸ سال)', count: age19to28, pct: knownTotal > 0 ? Math.round((age19to28 / knownTotal) * 100) : 0, color: '#059669', tag: 'بیشترین مراجعه فعال' },
      { label: 'بزرگسالان (۲۹ تا ۴۲ سال)', count: age29to42, pct: knownTotal > 0 ? Math.round((age29to42 / knownTotal) * 100) : 0, color: '#d97706', tag: 'زوجین و خانواده' },
      { label: 'میانسالان و سالمندان (بالای ۴۳ سال)', count: age43plus, pct: knownTotal > 0 ? Math.round((age43plus / knownTotal) * 100) : 0, color: '#64748b', tag: 'والدین' },
    ];
  }, [filteredSubmissions]);

  // ۴. وضعیت تأهل (بر اساس داده‌های واقعی)
  const maritalDistribution = useMemo(() => {
    let married = 0, single = 0, divorced = 0;
    filteredSubmissions.forEach((s) => {
      const d = s.data || {};
      const m = d.f_marital_status;
      if (m === 'متأهل' || m === 'متاهل') married++;
      else if (m === 'مجرد') single++;
      else if (m === 'مطلقه' || m === 'همسر فوت شده') divorced++;
      else {
        const y = parseInt(d.birth_year || '0');
        if (y >= 1385) single++;
        else if (y > 0 && y < 1365) married++;
      }
    });
    const total = married + single + divorced;
    return [
      { label: 'متأهل', count: married, pct: total > 0 ? Math.round((married / total) * 100) : 0, color: '#059669', desc: 'خانواده‌های تحت پوشش' },
      { label: 'مجرد', count: single, pct: total > 0 ? Math.round((single / total) * 100) : 0, color: '#0284c7', desc: 'نوجوانان و جوانان در شرف ازدواج' },
      { label: 'مطلقه / فوت همسر', count: divorced, pct: total > 0 ? Math.round((divorced / total) * 100) : 0, color: '#dc2626', desc: 'نیازمند همراهی و پایش مداوم' },
    ];
  }, [filteredSubmissions]);

  
  // توزیع دقیق تعداد فرزندان مراجعان (تک فرزند، دو فرزند، سه فرزند، چهار فرزند، پنج فرزند، شش فرزند، هفت فرزند، هشت فرزند، نه فرزند)
  const childrenDistribution = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    const labelNames: Record<number, string> = {
      1: 'تک فرزند',
      2: 'دو فرزند',
      3: 'سه فرزند',
      4: 'چهار فرزند',
      5: 'پنج فرزند',
      6: 'شش فرزند',
      7: 'هفت فرزند',
      8: 'هشت فرزند',
      9: 'نه فرزند',
    };

    filteredSubmissions.forEach((s) => {
      const d = s.data || {};
      let c = parseInt(d.f_children_count || d.children_count || d.f_children || '0');
      if (!c && d.f_family_members) {
        const mem = parseInt(d.f_family_members);
        if (mem >= 3) c = mem - 2;
      }
      if (c >= 1 && c <= 9) {
        counts[c] = (counts[c] || 0) + 1;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([numStr, count]) => {
      const num = Number(numStr);
      return {
        num,
        label: labelNames[num],
        count,
        percentage: Math.round((count / total) * 100),
      };
    });
  }, [filteredSubmissions]);

  // ۵. بعد خانوار (بر اساس داده‌های واقعی)
  const familySizeDistribution = useMemo(() => {
    let f2 = 0, f3 = 0, f4 = 0, f5plus = 0;
    filteredSubmissions.forEach((s) => {
      const d = s.data || {};
      const fm = d.f_family_members;
      if (fm) {
        if (fm.includes('2') || fm.includes('۲')) f2++;
        else if (fm.includes('3') || fm.includes('۳')) f3++;
        else if (fm.includes('4') || fm.includes('۴')) f4++;
        else if (fm.includes('5') || fm.includes('۵') || fm.includes('بیشتر')) f5plus++;
      }
    });
    const total = f2 + f3 + f4 + f5plus;
    return [
      { label: 'خانواده ۲ نفره (زوجین جوان)', count: f2, pct: total > 0 ? Math.round((f2 / total) * 100) : 0, color: '#0284c7' },
      { label: 'خانواده ۳ نفره (تک‌فرزند)', count: f3, pct: total > 0 ? Math.round((f3 / total) * 100) : 0, color: '#059669' },
      { label: 'خانواده ۴ نفره (۲ فرزند)', count: f4, pct: total > 0 ? Math.round((f4 / total) * 100) : 0, color: '#059669', isMode: f4 > 0 && f4 >= f2 && f4 >= f3 && f4 >= f5plus },
      { label: '۵ نفره و بیشتر (چندفرزندی)', count: f5plus, pct: total > 0 ? Math.round((f5plus / total) * 100) : 0, color: '#d97706' },
    ];
  }, [filteredSubmissions]);

  // ۶. ترکیب جنسیتی و نقش در خانواده
  const genderStats = useMemo(() => {
    let female = 0, male = 0;
    let daughter = 0, son = 0, mother = 0, father = 0;
    filteredSubmissions.forEach((s) => {
      const d = s.data || {};
      const g = d.gender || (d.f_role_in_family === 'مادر' || d.f_role_in_family === 'دختر' ? 'خانم' : d.f_role_in_family === 'پدر' || d.f_role_in_family === 'پسر' ? 'آقا' : null);
      if (g === 'خانم') female++;
      else male++;

      const r = d.f_role_in_family;
      if (r === 'دختر') daughter++;
      else if (r === 'پسر') son++;
      else if (r === 'مادر') mother++;
      else if (r === 'پدر') father++;
      else if (g === 'خانم') daughter++;
      else son++;
    });
    const total = filteredSubmissions.length || 1;
    return {
      female,
      male,
      femalePct: Math.round((female / total) * 100),
      malePct: Math.round((male / total) * 100),
      roles: [
        { label: 'دختر خانم‌ها', count: daughter, pct: Math.round((daughter / total) * 100), color: '#ec4899' },
        { label: 'آقا پسرا', count: son, pct: Math.round((son / total) * 100), color: '#0284c7' },
        { label: 'مادران خانواده', count: mother, pct: Math.round((mother / total) * 100), color: '#8b5cf6' },
        { label: 'پدران خانواده', count: father, pct: Math.round((father / total) * 100), color: '#10b981' },
      ]
    };
  }, [filteredSubmissions]);

  // ۷. رتبه‌بندی مشاوران مرکز بر اساس جلسات رزرو شده (نوبت‌های واقعی)
  const counselorRanking = useMemo(() => {
    const counts: Record<string, { count: number; specialty: string }> = {
      'سرکار خانم راستگو': { count: 0, specialty: 'بالینی و خانواده' },
      'جناب آقای علیرضا برهانی': { count: 0, specialty: 'ازدواج و خانواده' },
      'سرکار خانم گلیایی': { count: 0, specialty: 'اضطراب، افسردگی، وسواس' },
      'جناب آقای دکتر ترشیزی': { count: 0, specialty: 'اختلالات بالینی و فردی' },
      'جناب آقای صدیقی': { count: 0, specialty: 'روابط زوجین و خانواده' },
      'سرکار خانم زینلی': { count: 0, specialty: 'مشاوره خانواده و روابط' },
      'سرکار خانم شوندی': { count: 0, specialty: 'کودک و بازی‌درمانی' },
      'سرکار خانم کریمی': { count: 0, specialty: 'مشاوره خانواده' },
      
    };

    filteredSubmissions.forEach((s) => {
      const d = s.data || {};
      let c = d.f_booking_counselor || d.f_prev_counselor_name || d.f_counselor;
      if (!c) {
        for (const k of Object.keys(d)) {
          if (k.startsWith('f_counselor_') && d[k]) {
            c = d[k];
            break;
          }
        }
      }
      if (c && typeof c === 'string' && c.trim()) {
        const found = Object.keys(counts).find(k => k.includes(c.trim()) || c.trim().includes(k));
        if (found) counts[found].count++;
        else counts[c.trim()] = { count: 1, specialty: 'مشاوره تخصصی' };
      }
    });

    const totalSessions = Object.values(counts).reduce((acc, curr) => acc + curr.count, 0);
    return Object.entries(counts)
      .map(([name, info]) => ({
        name,
        specialty: info.specialty,
        count: info.count,
        percentage: totalSessions > 0 ? Math.round((info.count / totalSessions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredSubmissions]);

  // ۸. شاخص‌ها و ابعاد بالینی جمعی (بر اساس نتایج ارزیابی‌های واقعی خودسنجی مراجعین)
  const clinicalDimensionsSummary = useMemo(() => {
    const dimensionMap: Record<string, { totalScore: number; count: number }> = {};

    filteredSubmissions.forEach((s) => {
      if (s.evaluationResult?.topPriorities && Array.isArray(s.evaluationResult.topPriorities)) {
        s.evaluationResult.topPriorities.forEach((p: any) => {
          if (p.title && typeof p.score === 'number') {
            if (!dimensionMap[p.title]) {
              dimensionMap[p.title] = { totalScore: 0, count: 0 };
            }
            dimensionMap[p.title].totalScore += p.score;
            dimensionMap[p.title].count += 1;
          }
        });
      }
    });

    const results = Object.entries(dimensionMap).map(([name, data]) => {
      const avg = Math.round((data.totalScore / (data.count || 1)) * 10) / 10;
      let status = 'متوسط';
      let color = '#d97706';
      if (avg >= 75) {
        status = 'عالی';
        color = '#059669';
      } else if (avg >= 60) {
        status = 'نرمال';
        color = '#0284c7';
      } else if (avg < 40) {
        status = 'بحرانی';
        color = '#dc2626';
      }
      return { name, score: avg, status, color };
    });

    if (results.length > 0) {
      return results.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    return [
      { name: 'آرامش و صلح درونی', score: 0, status: 'نامشخص', color: '#64748b' },
      { name: 'خودآگاهی و مدیریت هیجان', score: 0, status: 'نامشخص', color: '#64748b' },
      { name: 'همدلی و ارتباط سالم', score: 0, status: 'نامشخص', color: '#64748b' },
    ];
  }, [filteredSubmissions]);

  // ۹. محاسبات اختصاصی تب تفکیکی فرم‌ها
  const formSubmissions = useMemo(() => {
    const raw = submissions.filter((s) => s.formId === selectedFormId);
    if (selectedFormId === 'form-safaan-assessment') {
      return raw.filter((s) => isAssignedSafaSubmission(s));
    }
    return raw;
  }, [submissions, selectedFormId]);
  const totalFormSubs = formSubmissions.length;
  const choiceFields = currentForm?.fields.filter((f) => 
    ['select', 'radio', 'checkbox', 'quizQuestion'].includes(f.type)
  ) || [];
  const numericFields = currentForm?.fields.filter((f) => 
    ['number', 'formula'].includes(f.type) || f.id.includes('salary') || f.id.includes('count') || f.id.includes('price')
  ) || [];
  const activeChoiceField = choiceFields.find((f) => f.id === selectedChoiceFieldId) || choiceFields[0];
  const activeNumericField = numericFields.find((f) => f.id === selectedNumericFieldId) || numericFields[0];

  const approved = formSubmissions.filter((s) => s.status === 'approved').length;
  const reviewing = formSubmissions.filter((s) => s.status === 'reviewing').length;
  const paidSubmissions = formSubmissions.filter((s) => s.paymentStatus === 'paid');
  const totalRevenue = paidSubmissions.reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0);

  let numericStats = { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
  if (activeNumericField && totalFormSubs > 0) {
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

  let optionDistribution: { id: string; label: string; count: number; percentage: number }[] = [];
  if (activeChoiceField && activeChoiceField.options && totalFormSubs > 0) {
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
        percentage: totalFormSubs > 0 ? Math.round((matchCount / totalFormSubs) * 100) : 0,
      };
    });
  }

  const handleExportExcel = async () => {
    if (!isSuperAdmin || !currentForm) return;
    if (formSubmissions.length === 0) {
      alert('پاسخی برای خروجی اکسل در این فرم وجود ندارد.');
      return;
    }
    try {
      setIsExporting(true);
      const { exportFormSubmissionsToXLSX } = await import('@/lib/excel-export');
      await exportFormSubmissionsToXLSX(currentForm, formSubmissions);
    } catch (err) {
      console.error('Export Excel error:', err);
      alert('خطا در ایجاد فایل اکسل.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-8 space-y-6 bg-slate-50 select-none pb-20">
      
      {/* سربرگ هوشمند و سوئیچر دو زبانه اصلی */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                داشبورد جامع آمارها و شاخص‌های تحلیلی بالحق
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                پایش لحظه‌ای بعد خانوار، رده‌های سنی، توزیع جغرافیایی، وضعیت تأهل و نوبت‌دهی مشاورین
              </p>
            </div>
          </div>
        </div>

        {/* دکمه‌های جابجایی بین دو نمای تحلیلی */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 max-w-full">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-blue-600" />
            <span>شاخص‌های کلان مدیریتی</span>
          </button>

          <button
            onClick={() => setActiveTab('formDetail')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'formDetail'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-4 h-4 text-slate-600" />
            <span>تحلیل تفکیکی فیلدهای فرم</span>
          </button>
        </div>
      </div>

      {/* ۱. نمای داشبورد آمارهای کلان مدیریتی (محور سوم درخواستی جلسه) */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* نوار فیلتر زمانی */}
          <div className="bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>بازه زمانی تحلیل داده‌ها:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'کل سوابق' },
                { id: 'month', label: 'یک ماه اخیر' },
                { id: 'quarter', label: 'فصلی (۳ ماهه)' },
                { id: 'year', label: 'سال جاری (۱۴۰۳)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    timeRange === t.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ردیف کارت‌های شاخص عملکرد کلیدی (KPIs) */}
          
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

            {/* کارت ۳: تعداد فرم‌های پرسشنامه و تست */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">تعداد فرم‌های پرسشنامه و آزمون</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-purple-700 font-mono tracking-tight">
                {toPersianDigits(statsOverview.totalQuizzesCount)}
              </div>
              <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
                <span>ارزیابی صَفًّا و خودسنجی بالینی</span>
              </div>
            </div>

            {/* کارت ۴: تراکنش‌ها و پرداخت‌های موفق */}
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

          {/* پایش پیشرفت بالینی: نمودار نقطه و خط برای نشان دادن پیشرفت در مراجعات، پرونده‌ها و شاخص تعادل */}
          <CollapsibleCard
            defaultOpen={true}
            title="پایش روند پیشرفت زمانی شاخص‌های بالینی و پرونده‌ها"
            subtitle="نمودار نقطه و خط پیشرفت جهت تحلیل رشد جلسات، پرونده‌ها و شاخص تعادل بالینی مراجعان مرکز"
            icon={
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
            }
            headerExtra={
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold max-w-full">
                <button
                  onClick={() => setAnalyticsProgressMetric('sessions')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    analyticsProgressMetric === 'sessions'
                      ? 'bg-white text-sky-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  پیشرفت جلسات مشاوره‌ای
                </button>
                <button
                  onClick={() => setAnalyticsProgressMetric('cases')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    analyticsProgressMetric === 'cases'
                  ? 'bg-white text-emerald-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  پیشرفت پذیرش پرونده‌ها
                </button>
                <button
                  onClick={() => setAnalyticsProgressMetric('clinicalEquilibrium')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    analyticsProgressMetric === 'clinicalEquilibrium'
                      ? 'bg-white text-purple-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  شاخص تعادل بالینی مراجعین (٪)
                </button>
              </div>
            }
          >
            <PointLineChart
              data={analyticsProgressData}
              unit={analyticsProgressMetric === 'clinicalEquilibrium' ? '٪' : analyticsProgressMetric === 'cases' ? 'پرونده' : 'جلسه'}
              height={215}
              lineColor={analyticsProgressMetric === 'clinicalEquilibrium' ? '#7c3aed' : analyticsProgressMetric === 'cases' ? '#059669' : '#0284c7'}
              showPoints={true}
              showValues={true}
              badgeText="نمودار نقطه و خط پیشرفت بالینی"
            />
          </CollapsibleCard>

          {/* بخش میانی: ۳ نمودار عمودی تفکیک‌شده (موضوعات توصیه‌شده + موضوعات مراجعه + نوبت‌های مشاوران) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* ۱. باکس بیشترین موضوعات توصیه شده برای مراجعان توسط مشاوران */}
            <CollapsibleCard
              defaultOpen={true}
              title="بیشترین موضوعات توصیه شده توسط مشاوران"
              subtitle="توصیه‌ها و مداخلات درمانی تجویز شده مشاوران"
              icon={<Sparkles className="w-5 h-5 text-violet-600" />}
              headerExtra={
                <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md font-bold border border-violet-100 shrink-0">
                  توصیه مشاوران
                </span>
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>محورهای تجویزی اساتید</span>
                  <span className="font-bold text-violet-700">{getTopItemSummary(topRecommendedTopicsData, 'توصیه')}</span>
                </div>
              }
            >
              <VerticalBarChart
                data={topRecommendedTopicsData}
                unit="مورد"
                height={230}
                barColor="bg-violet-600"
                showValues={true}
              />
            </CollapsibleCard>

            {/* ۲. باکس بیشترین موضوعات مراجعه به مشاوران */}
            <CollapsibleCard
              defaultOpen={true}
              title="بیشترین موضوعات مراجعه به مشاوران"
              subtitle="علت و تقاضای اولیه مراجعه مراجعان مرکز"
              icon={<Compass className="w-5 h-5 text-sky-600" />}
              headerExtra={
                <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-bold border border-sky-100 shrink-0">
                  تقاضای مراجعه
                </span>
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>۵ حوزه درخواست مراجعین</span>
                  <span className="font-bold text-sky-700">{getTopItemSummary(topReferralTopicsData, 'مراجعه')}</span>
                </div>
              }
            >
              <VerticalBarChart
                data={topReferralTopicsData}
                unit="مورد"
                height={230}
                barColor="bg-sky-500"
                showValues={true}
              />
            </CollapsibleCard>

            {/* ۳. باکس بیشترین نوبت‌ها از مشاوران (از کدام مشاوران بیشترین نوبت ها دریافت شده) */}
            <CollapsibleCard
              defaultOpen={true}
              title="بیشترین نوبت‌های دریافتی از مشاوران"
              subtitle="رتبه‌بندی اساتید بر اساس تعداد نوبت‌های رزرو شده"
              icon={<BarChart3 className="w-5 h-5 text-emerald-600" />}
              headerExtra={
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-100 shrink-0">
                  نوبت اساتید
                </span>
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>اساتید مشاور برتر بالحق</span>
                  <span className="text-emerald-700 font-bold">بازه: {timeRange === 'all' ? 'کل سوابق' : 'انتخابی'}</span>
                </div>
              }
            >
              <VerticalBarChart
                data={topCounselorsData}
                unit="نوبت"
                height={230}
                barColor="bg-emerald-600"
                showValues={true}
              />
            </CollapsibleCard>

          </div>

          {/* بخش سوم: آخرین فعالیت‌ها + بیشترین نوبت‌ها و فرم‌های مراجعان */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ۱. باکس آخرین فعالیت‌ها (ثبت پرونده، نوبت‌ها، پرسش‌نامه‌ها) */}
            <CollapsibleCard
              defaultOpen={true}
              className="lg:col-span-6"
              title="آخرین فعالیت‌ها و رویدادهای سامانه"
              icon={<Clock className="w-5 h-5 text-indigo-600" />}
              headerExtra={
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold max-w-full">
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
              }
              footer={
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>نمایش بر اساس تازه‌ترین رویدادها</span>
                  <span className="font-bold text-indigo-700">{toPersianDigits(recentActivities.length)} رویداد فعال</span>
                </div>
              }
            >
              {/* لیست رویدادها */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
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
            </CollapsibleCard>

            {/* ۵. باکس بیشترین نوبت‌ها توسط مراجعان (نمودار میله‌ای عمودی) */}
            <CollapsibleCard
              defaultOpen={true}
              className="lg:col-span-6"
              title="بیشترین نوبت‌ها توسط مراجعان"
              subtitle="کد پرونده مراجعینی که بیشترین نوبت را دریافت کرده‌اند"
              icon={<Award className="w-5 h-5 text-amber-600" />}
              headerExtra={
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold border border-amber-100 shrink-0">
                  نمودار میله‌ای عمودی
                </span>
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>مرتب‌سازی بر اساس حجم جلسات رزرو شده</span>
                  <span className="text-amber-700 font-bold">بازه: {timeRange === 'all' ? 'کل سوابق' : 'انتخابی'}</span>
                </div>
              }
            >
              <VerticalBarChart
                data={topClientsBarData}
                unit="نوبت"
                height={230}
                barColor="bg-amber-500"
                showValues={true}
              />
            </CollapsibleCard>

          </div>

          {/* ردیف اول: تحلیل نوبت‌های هر فرد در بازه زمانی + جدول تاپ ۱۰ مراجعین پرتکرار */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* توزیع تعداد نوبت‌ها به ازای هر مراجع */}
            <CollapsibleCard
              defaultOpen={true}
              className="lg:col-span-5"
              title="تعداد نوبت‌ها به ازای هر مراجع"
              icon={<CalendarDays className="w-4 h-4 text-blue-600" />}
              headerExtra={
                <span className="text-[11px] text-slate-400 font-medium">بازه {timeRange === 'all' ? 'کل سوابق' : 'انتخابی'}</span>
              }
            >
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                تفکیک فراوانی مراجعه‌کنندگان بر اساس تعداد جلسات مشاوره‌ای که در مرکز بالحق ثبت و برگزار کرده‌اند:
              </p>

              <div className="pt-2">
                <VerticalBarChart
                  data={sessionDistributionItems.map((item) => {
                    const sc = getSemanticColorByPercentage(item.pct);
                    return {
                      label: item.label,
                      value: item.count,
                      percentage: item.pct,
                      color: sc.hex,
                      secondaryLabel: `${toPersianDigits(item.count)} نفر`,
                    };
                  })}
                  unit="نفر"
                  height={220}
                  showValues={true}
                  badgeText="نمودار میله‌ای عمودی مقایسه"
                />
              </div>
            </CollapsibleCard>

            {/* جدول ۱۰ مراجع با بیشترین تعداد نوبت و جلسه */}
            <CollapsibleCard
              defaultOpen={true}
              className="lg:col-span-7"
              title="مراجعین با بیشترین حجم ارجاع و نوبت"
              icon={<UserCheck className="w-4 h-4 text-emerald-600" />}
              headerExtra={
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ۱۰ مراجع برتر
                </span>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-2 pr-2">#</th>
                      <th className="pb-2">نام مراجع</th>
                      <th className="pb-2">کد پرونده</th>
                      <th className="pb-2">شهر</th>
                      <th className="pb-2 text-center">تعداد جلسات</th>
                      <th className="pb-2 text-left pl-2">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topClients.map((client, idx) => {
                      const sessions = client.bookingCount;
                      return (
                        <tr key={client.caseCode} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 pr-2 font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                          <td className="py-2.5 font-bold text-slate-800">{client.fullName}</td>
                          <td className="py-2.5 font-mono text-slate-500">{client.caseCode}</td>
                          <td className="py-2.5 text-slate-600 truncate max-w-[100px]">{client.city}</td>
                          <td className="py-2.5 text-center">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {toPersianDigits(sessions)} جلسه
                            </span>
                          </td>
                          <td className="py-2.5 text-left pl-2">
                            <button
                              onClick={() => router.push(`/dossier?case=${encodeURIComponent(client.caseCode)}`)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              <span>پرونده</span>
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CollapsibleCard>

          </div>

          {/* ردیف دوم: پراکندگی جغرافیایی شهرها + توزیع بعد خانوار */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* پراکندگی جغرافیایی ثبت‌نامی‌ها بر اساس شهرها */}
            <CollapsibleCard
              defaultOpen={true}
              className="lg:col-span-6"
              title="پراکندگی جغرافیایی (بیشتر ثبت‌نامی‌ها از کدام شهرها هستند)"
              icon={<MapPin className="w-4 h-4 text-purple-600" />}
              headerExtra={
                <span className="text-[11px] text-slate-400 font-medium">سهم از کل</span>
              }
            >
              <div className="pt-2">
                <VerticalBarChart
                  data={cityDistribution.map((item) => {
                    const sc = getSemanticColorByPercentage(item.percentage);
                    return {
                      label: item.name,
                      value: item.count,
                      percentage: item.percentage,
                      color: sc.hex,
                      secondaryLabel: `${toPersianDigits(item.percentage)}٪`,
                    };
                  })}
                  unit="پرونده"
                  height={220}
                  showValues={true}
                  badgeText="نمودار میله‌ای عمودی شهرها"
                />
              </div>
            </CollapsibleCard>

            {/* بعد خانوار (بیشتر خانواده‌ها چند نفره هستند) */}
            <CollapsibleCard
              defaultOpen={true}
              className="lg:col-span-6"
              title="بُعد خانوار (بیشتر مراجعین در خانواده‌های چند نفره هستند)"
              icon={<Baby className="w-4 h-4 text-emerald-600" />}
              headerExtra={
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  بیشترین: ۴ نفره
                </span>
              }
            >
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                تحلیل فراوانی بعد خانوار مراجعین مرکز بالحق جهت طراحی بسته‌های مشاوره‌ای و دوره‌های خانواده‌محور:
              </p>

              <div className="pt-2">
                <VerticalBarChart
                  data={familySizeDistribution.map((fam) => {
                    const sc = getSemanticColorByPercentage(fam.pct);
                    return {
                      label: fam.label,
                      value: fam.count,
                      percentage: fam.pct,
                      color: sc.hex,
                      secondaryLabel: `${toPersianDigits(fam.pct)}٪`,
                      badge: fam.isMode ? 'بُعد غالب' : undefined,
                    };
                  })}
                  unit="خانوار"
                  height={220}
                  showValues={true}
                  badgeText="نمودار میله‌ای عمودی خانوار"
                />
              </div>
            </CollapsibleCard>

          </div>

          {/* ردیف سوم: هرم سنی و سهم ویژه نوجوانان + تفکیک وضعیت تأهل */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* توزیع رده‌های سنی با تمرکز بر نوجوانان و جوانان */}
            <CollapsibleCard
              defaultOpen={true}
              className="lg:col-span-6"
              title="توزیع رده‌های سنی مراجعین و سهم نوجوانان"
              icon={<GraduationCap className="w-4 h-4 text-blue-600" />}
              headerExtra={
                <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  هرم سنی
                </span>
              }
            >
              <div className="pt-2">
                <VerticalBarChart
                  data={ageDistribution.map((item) => {
                    const sc = getSemanticColorByPercentage(item.pct);
                    return {
                      label: item.label,
                      value: item.count,
                      percentage: item.pct,
                      color: sc.hex,
                      secondaryLabel: `${toPersianDigits(item.pct)}٪`,
                      badge: item.tag,
                    };
                  })}
                  unit="نفر"
                  height={220}
                  showValues={true}
                  badgeText="نمودار میله‌ای عمودی هرم سنی"
                />
              </div>
            </CollapsibleCard>

            {/* تفکیک وضعیت تأهل (درصد مجرد، متأهل، مطلقه) */}
            <CollapsibleCard
              defaultOpen={true}
              className="lg:col-span-6"
              title="وضعیت تأهل مراجعین (درصد مجرد، متأهل، مطلقه)"
              icon={<HeartHandshake className="w-4 h-4 text-rose-600" />}
              headerExtra={
                <span className="text-[11px] text-slate-400 font-medium">سهم ازدواج و خانواده</span>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
                  {maritalDistribution.map((m) => {
                    const sc = getSemanticColorByPercentage(m.pct);
                    return (
                      <div 
                        key={m.label} 
                        className={`p-4 rounded-xl border ${sc.badgeBorder} ${sc.badgeBg} text-center space-y-1.5`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${sc.dotBg} shrink-0 ring-1 ${sc.ringColor}`} />
                          <span className="text-xs font-extrabold text-slate-800">{m.label}</span>
                        </div>
                        <div className="text-2xl font-black font-mono" style={{ color: sc.hex }}>
                          {toPersianDigits(m.pct)}٪
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono text-center">
                          ({toPersianDigits(m.count)} نفر)
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ترکیب اعضای ثبت‌نامی در خانواده */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    نقش فرد ثبت‌نام‌کننده در خانواده:
                  </span>
                  <div className="pt-1">
                    <VerticalBarChart
                      data={genderStats.roles.map((r) => {
                        const sc = getSemanticColorByPercentage(r.pct);
                        return {
                          label: r.label,
                          value: r.count,
                          percentage: r.pct,
                          color: sc.hex,
                          secondaryLabel: `${toPersianDigits(r.pct)}٪`,
                        };
                      })}
                      unit="نفر"
                      height={180}
                      showValues={true}
                      badgeText="نمودار میله‌ای نقش‌ها"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleCard>

          </div>

          {/* ردیف چهارم: رتبه‌بندی مشاورین مرکز + شاخص‌های بالینی جمعی */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* رتبه‌بندی مشاوران بر اساس تعداد نوبت‌های اخذ شده */}
            <CollapsibleCard
              defaultOpen={true}
              className="lg:col-span-6"
              title="فراوانی و رتبه‌بندی مشاورین (بیشترین نوبت‌های اخذ شده)"
              icon={<Award className="w-4 h-4 text-amber-600" />}
              headerExtra={
                <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  مشاوران مرکز
                </span>
              }
            >
              <div className="pt-2">
                <VerticalBarChart
                  data={counselorRanking.slice(0, 6).map((c) => {
                    const sc = getSemanticColorByPercentage(c.percentage);
                    return {
                      label: c.name,
                      value: c.count,
                      percentage: c.percentage,
                      color: sc.hex,
                      secondaryLabel: `${toPersianDigits(c.count)} جلسه`,
                      badge: c.specialty,
                    };
                  })}
                  unit="جلسه"
                  height={220}
                  showValues={true}
                  badgeText="نمودار میله‌ای عمودی اساتید"
                />
              </div>
            </CollapsibleCard>

            {/* شاخص‌های جمعی بالینی و خودسنجی صفا */}
            <CollapsibleCard
              defaultOpen={true}
              className="lg:col-span-6"
              title="شاخص‌های جمعی بالینی و اولویت‌های رشد در جامعه مراجعین"
              icon={<Sparkles className="w-4 h-4 text-emerald-600" />}
              headerExtra={
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ارزیابی جمعی
                </span>
              }
            >
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                میانگین نمرات خودسنجی در کل مراجعین جهت شناسایی حوزه‌های قوت و مؤلفه‌های نیازمند مداخله و کارگاه‌های توانمندسازی:
              </p>

              <div className="pt-2">
                <VerticalBarChart
                  data={clinicalDimensionsSummary.slice(0, 6).map((dim) => {
                    const sc = getSemanticColorByPercentage(dim.score);
                    return {
                      label: dim.name,
                      value: dim.score,
                      percentage: dim.score,
                      color: sc.hex,
                      secondaryLabel: `${toPersianDigits(dim.score)}٪`,
                    };
                  })}
                  unit="امتیاز"
                  maxScale={100}
                  height={220}
                  showValues={true}
                  badgeText="نمودار میله‌ای عمودی شاخص‌ها"
                />
              </div>
            </CollapsibleCard>

          </div>

        </div>
      )}

      {/* ۲. نمای تحلیل تفکیکی فیلدهای فرم‌ها (Field-by-Field Form Analyzer) */}
      {activeTab === 'formDetail' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* سربرگ انتخاب فرم و دکمه خروجی اکسل */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <FolderKanban className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">فرم مورد نظر جهت تحلیل فیلد به فیلد:</span>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="w-full sm:w-auto text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 bg-white max-w-full sm:max-w-xs focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>

            {isSuperAdmin && formSubmissions.length > 0 && (
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isExporting ? 'در حال صدور...' : 'خروجی اکسل (XLSX)'}</span>
              </button>
            )}
          </div>

          {totalFormSubs === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4 max-w-md mx-auto my-6">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">هنوز پاسخی برای این فرم ثبت نشده است</h3>
              <p className="text-xs text-slate-500">به محض ثبت پاسخ در این فرم، نمودارها و تحلیل فیلدها فعال خواهند شد.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* شاخص‌های پایه‌ای فرم */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">کل پاسخ‌ها</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">{toPersianDigits(totalFormSubs)}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">تأیید شده</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">{toPersianDigits(approved)}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">در حال بررسی</span>
                  <div className="text-2xl font-black text-amber-600 font-mono">{toPersianDigits(reviewing)}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">مجموع تراکنش درگاه</span>
                  <div className="text-xl font-black text-indigo-600 font-mono">
                    {totalRevenue > 0 ? formatCurrency(totalRevenue, 'IRT') : 'بدون هزینه'}
                  </div>
                </div>
              </div>

              {/* تحلیل فیلدهای گزینه‌ای با طرح ۴ رنگ */}
              {activeChoiceField && optionDistribution.length > 0 && (
                <CollapsibleCard
                  defaultOpen={true}
                  title="نمودار فراوانی و تفکیک پاسخ‌های گزینه‌ای"
                  subtitle="درصد و تعداد دقیق هر یک از گزینه‌ها"
                  headerExtra={
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-slate-500 font-medium">فیلد مورد بررسی:</span>
                      <select
                        value={activeChoiceField.id}
                        onChange={(e) => setSelectedChoiceFieldId(e.target.value)}
                        className="w-full sm:w-auto max-w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white cursor-pointer"
                      >
                        {choiceFields.map((f) => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  }
                >
                  <div className="space-y-4 pt-2">
                    <VerticalBarChart
                      data={optionDistribution.map((opt) => ({
                        id: opt.id,
                        label: opt.label,
                        value: opt.count,
                        percentage: opt.percentage,
                        secondaryLabel: `${toPersianDigits(opt.count)} نفر`,
                        color: opt.percentage > 70 ? 'bg-emerald-600' : opt.percentage > 40 ? 'bg-sky-600' : opt.percentage > 20 ? 'bg-amber-500' : 'bg-rose-500',
                      }))}
                      unit="نفر"
                      height={220}
                      showValues={true}
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
                    {optionDistribution.map((opt) => {
                      const sc = getSemanticColorByPercentage(opt.percentage);
                      return (
                        <div key={opt.id} className={`p-3 rounded-xl border ${sc.badgeBorder} ${sc.badgeBg} text-center space-y-1`}>
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${sc.dotBg}`} />
                            <span className="font-bold text-slate-800 text-xs truncate">{opt.label}</span>
                          </div>
                          <div className="font-mono text-base font-black" style={{ color: sc.hex }}>
                            {toPersianDigits(opt.percentage)}٪
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {toPersianDigits(opt.count)} نفر
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </CollapsibleCard>
              )}

              {/* تحلیل فیلدهای عددی در صورت وجود */}
              {activeNumericField && numericStats.count > 0 && (
                <CollapsibleCard
                  defaultOpen={true}
                  title={`محاسبات آماری فیلد عددی: ${activeNumericField.label}`}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                      <span className="text-[11px] text-slate-500 block">مجموع کل (Sum)</span>
                      <span className="text-base font-black text-slate-800 font-mono">{toPersianDigits(numericStats.sum)}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                      <span className="text-[11px] text-slate-500 block">میانگین حسابی (Avg)</span>
                      <span className="text-base font-black text-blue-600 font-mono">{toPersianDigits(numericStats.avg)}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                      <span className="text-[11px] text-slate-500 block">حداقل (Min)</span>
                      <span className="text-base font-black text-slate-700 font-mono">{toPersianDigits(numericStats.min)}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                      <span className="text-[11px] text-slate-500 block">حداکثر (Max)</span>
                      <span className="text-base font-black text-slate-700 font-mono">{toPersianDigits(numericStats.max)}</span>
                    </div>
                  </div>
                </CollapsibleCard>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
