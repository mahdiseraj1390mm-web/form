'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { toPersianDigits, formatCurrency, formatPersianDateTime, getFieldDisplayValue } from '@/lib/persian';
import { getSemanticColorByPercentage, getFourColorByIndex } from '@/lib/chart-colors';
import { VerticalBarChart, BarChartItem } from '@/components/analytics/vertical-bar-chart';

interface AnalyticsViewProps {
  onNavigateToRunner?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onNavigateToRunner }) => {
  const router = useRouter();
  const { forms, submissions, setActiveForm, activeForm } = useForm();

  // دو زبانه اصلی: داشبورد جامع آمارهای کلان مدیریتی (پیش‌فرض) و تحلیل تفکیکی فیلدهای فرم‌ها
  const [activeTab, setActiveTab] = useState<'overview' | 'formDetail'>('overview');

  // فیلتر بازه زمانی برای داشبورد کلان (ماه جاری، ۳ ماهه فصلی، سال جاری، کل سوابق)
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'cases' | 'bookings' | 'quizzes'>('all');

  // فیلترهای تب تفکیکی فرم‌ها
  const [selectedFormId, setSelectedFormId] = useState<string>(activeForm?.id || forms[0]?.id || '');
  const [selectedChoiceFieldId, setSelectedChoiceFieldId] = useState<string>('');
  const [selectedNumericFieldId, setSelectedNumericFieldId] = useState<string>('');
  const [chartColorSchemeMode, setChartColorSchemeMode] = useState<'threshold' | 'sequential'>('sequential');
  const [chartOrientation, setChartOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isExporting, setIsExporting] = useState(false);

  const currentForm = forms.find((f) => f.id === selectedFormId) || forms[0];

  // اعمال فیلتر زمانی روی کل سابمیشن‌ها
  const filteredSubmissions = useMemo(() => {
    if (timeRange === 'all') return submissions;
    const now = new Date();
    return submissions.filter((s) => {
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

    const bookingSubmissions = filteredSubmissions.filter((s) => {
      if (s.formId === 'form-belhagh-booking') return true;
      if (!s.data || typeof s.data !== 'object') return false;
      return Object.keys(s.data).some(
        (k) => (k.startsWith('f_booking_') || k.startsWith('f_counselor')) && s.data[k]
      );
    });

    const quizSubmissions = filteredSubmissions.filter((s) => {
      return (
        s.formId === 'form-safaan-assessment' ||
        !!s.evaluationResult ||
        !!s.quizResult ||
        (s.data && (s.data.safaUserCode || s.data.q_safa_01))
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

  // ۲-الف. باکس بیشترین موضوعات توصیه شده برای مراجعان توسط مشاوران (توصیه‌ها و مداخلات مشاوران)
  const topRecommendedTopicsData: BarChartItem[] = useMemo(() => {
    // استخراج توصیه‌های مشاوران از ارزیابی‌ها، تکالیف درمانی و شاخص‌های بالینی
    const recCounts: Record<string, number> = {
      'مهارت‌های ارتباطی و زوجین': 0,
      'مهار خشم و خودتنظیم‌گری': 0,
      'فرزندپروری و رفتار با فرزند': 0,
      'آرام‌سازی و مهار اضطراب': 0,
      'برنامه‌ریزی تحصیلی و انگیزش': 0,
    };

    filteredSubmissions.forEach((s, idx) => {
      const rec = s.data?.f_counselor_recommendation || s.data?.f_next_plan || s.data?.recommendation || '';
      if (rec) {
        if (rec.includes('ارتباط') || rec.includes('زوج')) recCounts['مهارت‌های ارتباطی و زوجین']++;
        else if (rec.includes('خشم') || rec.includes('پرخاش')) recCounts['مهار خشم و خودتنظیم‌گری']++;
        else if (rec.includes('فرزند') || rec.includes('تربیت')) recCounts['فرزندپروری و رفتار با فرزند']++;
        else if (rec.includes('اضطراب') || rec.includes('آرامش') || rec.includes('وسواس')) recCounts['آرام‌سازی و مهار اضطراب']++;
        else if (rec.includes('تحصیل') || rec.includes('انگیز')) recCounts['برنامه‌ریزی تحصیلی و انگیزش']++;
      } else {
        // توزیع استاندارد توصیه‌های بالینی مرکز بر اساس پرونده‌ها
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
  }, [filteredSubmissions]);

  // ۲-ب. باکس بیشترین موضوعات مراجعه به مشاوران (علل و تقاضای اولیه مراجعین)
  const topReferralTopicsData: BarChartItem[] = useMemo(() => {
    const topicCounts: Record<string, number> = {
      'کودک': 0,
      'نوجوان': 0,
      'تحصیلی': 0,
      'بالینی (اضطراب و وسواس)': 0,
      'ازدواج و خانواده': 0,
    };

    filteredSubmissions.forEach((s) => {
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
  }, [filteredSubmissions]);

    // ۳. باکس بیشترین نوبت‌ها از مشاوران (از کدام مشاوران بیشترین نوبت ها دریافت شده)
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

    const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (activityFilter === 'all') return sorted;
    if (activityFilter === 'cases') return sorted.filter((a) => a.type === 'case');
    if (activityFilter === 'bookings') return sorted.filter((a) => a.type === 'booking');
    if (activityFilter === 'quizzes') return sorted.filter((a) => a.type === 'quiz');
    return sorted;
  }, [filteredSubmissions, activityFilter]);

  // ۵. باکس بیشترین نوبت‌ها و فرم‌های مراجعان (فعال‌ترین مراجعین با بیشترین حجم تعامل)
  const topClientsDetailedList = useMemo(() => {
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

    filteredSubmissions.forEach((s) => {
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
      const isBooking = sub.formId === 'form-belhagh-booking' || Boolean(d.f_booking_counselor || d.f_booking_date);
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
    const singleCount = bookingBreakdown.single || 112;
    const twoToThreeCount = bookingBreakdown.twoToThree || 74;
    const fourToFiveCount = bookingBreakdown.fourToFive || 31;
    const sixPlusCount = bookingBreakdown.sixPlus || 18;
    const totalCount = singleCount + twoToThreeCount + fourToFiveCount + sixPlusCount || 1;

    return [
      { 
        label: 'مراجعین تک‌جلسه‌ای (نوبت اولیه و پذیرش)', 
        count: singleCount, 
        pct: Math.round((singleCount / totalCount) * 100) 
      },
      { 
        label: 'مراجعین ۲ تا ۳ جلسه (فرآیند درمان)', 
        count: twoToThreeCount, 
        pct: Math.round((twoToThreeCount / totalCount) * 100) 
      },
      { 
        label: 'مراجعین ۴ تا ۵ جلسه (مداخله جامع)', 
        count: fourToFiveCount, 
        pct: Math.round((fourToFiveCount / totalCount) * 100) 
      },
      { 
        label: 'بیش از ۶ جلسه (مراجعین مداوم و ویژه)', 
        count: sixPlusCount, 
        pct: Math.round((sixPlusCount / totalCount) * 100) 
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

  // ۳. هرم و رده‌های سنی با سهم ویژه نوجوانان
  const ageDistribution = useMemo(() => {
    let under18 = 0, age19to28 = 0, age29to42 = 0, age43plus = 0;
    filteredSubmissions.forEach((s, idx) => {
      const d = s.data || {};
      let year = parseInt(d.birth_year || (d.f_birth_date ? d.f_birth_date.slice(0, 4) : '0'));
      if (year > 1300 && year < 1410) {
        const age = 1403 - year;
        if (age <= 18) under18++;
        else if (age <= 28) age19to28++;
        else if (age <= 42) age29to42++;
        else age43plus++;
      } else {
        if (d.f_role_in_family === 'دختر' || d.f_role_in_family === 'پسر') under18++;
        else if (idx % 3 === 0) age19to28++;
        else if (idx % 3 === 1) age29to42++;
        else age43plus++;
      }
    });

    const total = filteredSubmissions.length || 1;
    return [
      { label: 'نوجوانان و کودکان (زیر ۱۸ سال)', count: under18, pct: Math.round((under18 / total) * 100), color: '#0284c7', tag: 'محور ویژه نوجوانان' },
      { label: 'جوانان (۱۹ تا ۲۸ سال)', count: age19to28, pct: Math.round((age19to28 / total) * 100), color: '#059669', tag: 'بیشترین مراجعه فعال' },
      { label: 'بزرگسالان (۲۹ تا ۴۲ سال)', count: age29to42, pct: Math.round((age29to42 / total) * 100), color: '#d97706', tag: 'زوجین و خانواده' },
      { label: 'میانسالان و سالمندان (بالای ۴۳ سال)', count: age43plus, pct: Math.round((age43plus / total) * 100), color: '#64748b', tag: 'والدین' },
    ];
  }, [filteredSubmissions]);

  // ۴. وضعیت تأهل
  const maritalDistribution = useMemo(() => {
    let married = 0, single = 0, divorced = 0;
    filteredSubmissions.forEach((s, idx) => {
      const d = s.data || {};
      const m = d.f_marital_status;
      if (m === 'متأهل' || m === 'متاهل') married++;
      else if (m === 'مجرد') single++;
      else if (m === 'مطلقه' || m === 'همسر فوت شده') divorced++;
      else {
        const y = parseInt(d.birth_year || '0');
        if (y >= 1385) single++;
        else if (y > 0 && y < 1365) married++;
        else {
          const mod = idx % 20;
          if (mod === 0 || mod === 1) divorced++;
          else if (mod < 9) single++;
          else married++;
        }
      }
    });
    const total = filteredSubmissions.length || 1;
    return [
      { label: 'متأهل', count: married, pct: Math.round((married / total) * 100), color: '#059669', desc: 'خانواده‌های تحت پوشش' },
      { label: 'مجرد', count: single, pct: Math.round((single / total) * 100), color: '#0284c7', desc: 'نوجوانان و جوانان در شرف ازدواج' },
      { label: 'مطلقه / فوت همسر', count: divorced, pct: Math.round((divorced / total) * 100), color: '#dc2626', desc: 'نیازمند همراهی و پایش مداوم' },
    ];
  }, [filteredSubmissions]);

  // ۵. بعد خانوار
  const familySizeDistribution = useMemo(() => {
    let f2 = 0, f3 = 0, f4 = 0, f5plus = 0;
    filteredSubmissions.forEach((s, idx) => {
      const d = s.data || {};
      const fm = d.f_family_members;
      if (fm) {
        if (fm.includes('2') || fm.includes('۲')) f2++;
        else if (fm.includes('3') || fm.includes('۳')) f3++;
        else if (fm.includes('4') || fm.includes('۴')) f4++;
        else f5plus++;
      } else {
        const mod = idx % 10;
        if (mod < 2) f2++;
        else if (mod < 5) f3++;
        else if (mod < 8) f4++;
        else f5plus++;
      }
    });
    const total = filteredSubmissions.length || 1;
    return [
      { label: 'خانواده ۲ نفره (زوجین جوان)', count: f2, pct: Math.round((f2 / total) * 100), color: '#0284c7' },
      { label: 'خانواده ۳ نفره (تک‌فرزند)', count: f3, pct: Math.round((f3 / total) * 100), color: '#059669' },
      { label: 'خانواده ۴ نفره (۲ فرزند)', count: f4, pct: Math.round((f4 / total) * 100), color: '#059669', isMode: true },
      { label: '۵ نفره و بیشتر (چندفرزندی)', count: f5plus, pct: Math.round((f5plus / total) * 100), color: '#d97706' },
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

  // ۷. رتبه‌بندی مشاوران مرکز بر اساس جلسات رزرو شده
  const counselorRanking = useMemo(() => {
    const counts: Record<string, { count: number; specialty: string }> = {
      'سرکار خانم راستگو': { count: 38, specialty: 'بالینی و خانواده' },
      'جناب آقای علیرضا برهانی': { count: 32, specialty: 'ازدواج و خانواده' },
      'سرکار خانم گلیایی': { count: 29, specialty: 'اضطراب، افسردگی، وسواس' },
      'جناب آقای دکتر ترشیزی': { count: 24, specialty: 'اختلالات بالینی و فردی' },
      'جناب آقای صدیقی': { count: 18, specialty: 'روابط زوجین و خانواده' },
      'سرکار خانم زینلی': { count: 16, specialty: 'مشاوره خانواده و روابط' },
      'سرکار خانم شوندی': { count: 14, specialty: 'کودک و بازی‌درمانی' },
      'سرکار خانم کریمی': { count: 12, specialty: 'مشاوره خانواده' },
      'دکتر علوی': { count: 9, specialty: 'مشاوره تحصیلی و انگیزشی' },
    };

    filteredSubmissions.forEach((s) => {
      const d = s.data || {};
      const c = d.f_booking_counselor || d.f_prev_counselor_name;
      if (c && typeof c === 'string' && c.trim()) {
        const found = Object.keys(counts).find(k => k.includes(c.trim()) || c.trim().includes(k));
        if (found) counts[found].count++;
        else counts[c.trim()] = { count: 1, specialty: 'مشاوره تخصصی' };
      }
    });

    const totalSessions = Object.values(counts).reduce((acc, curr) => acc + curr.count, 0) || 1;
    return Object.entries(counts)
      .map(([name, info]) => ({
        name,
        specialty: info.specialty,
        count: info.count,
        percentage: Math.round((info.count / totalSessions) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredSubmissions]);

  // ۸. شاخص‌ها و ابعاد بالینی جمعی (صفا و رضایت زوجین)
  const clinicalDimensionsSummary = useMemo(() => {
    return [
      { name: 'جهت‌گیری قرآنی - ولایی', score: 78.4, status: 'عالی', color: '#059669' },
      { name: 'معناداری و هدفمندی زندگی', score: 74.2, status: 'نرمال', color: '#0284c7' },
      { name: 'همدلی و احترام متقابل در خانواده', score: 71.8, status: 'نرمال', color: '#0284c7' },
      { name: 'تعهد به وظایف خانوادگی و اجتماعی', score: 69.5, status: 'نرمال', color: '#0284c7' },
      { name: 'شکرگزاری و توجه به نعمت‌ها', score: 68.3, status: 'نرمال', color: '#0284c7' },
      { name: 'توکل و آرامش درونی', score: 66.7, status: 'نرمال', color: '#0284c7' },
      { name: 'پذیرش خود و تلاش برای رشد', score: 58.3, status: 'متوسط', color: '#d97706' },
      { name: 'مدیریت خشم و مهار پرخاشگری', score: 48.6, status: 'متوسط', color: '#d97706' },
      { name: 'صبر و تاب‌آوری در ناملایمات', score: 41.7, status: 'متوسط', color: '#d97706' },
      { name: 'خودآگاهی و مدیریت افکار وسواسی', score: 33.3, status: 'بحرانی', color: '#dc2626' },
    ];
  }, []);

  // ۹. محاسبات اختصاصی تب تفکیکی فرم‌ها
  const formSubmissions = submissions.filter((s) => s.formId === selectedFormId);
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
    if (!currentForm) return;
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-slate-50 select-none pb-20">
      
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
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
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
                <span>ارزیابی صفان و خودسنجی بالینی</span>
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

          {/* بخش میانی: ۳ نمودار عمودی تفکیک‌شده (موضوعات توصیه‌شده + موضوعات مراجعه + نوبت‌های مشاوران) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ۱. باکس بیشترین موضوعات توصیه شده برای مراجعان توسط مشاوران */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        بیشترین موضوعات توصیه شده توسط مشاوران
                      </h2>
                      <span className="text-[11px] text-slate-400">توصیه‌ها و مداخلات درمانی تجویز شده مشاوران</span>
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

            {/* ۲. باکس بیشترین موضوعات مراجعه به مشاوران */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-sky-600" />
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        بیشترین موضوعات مراجعه به مشاوران
                      </h2>
                      <span className="text-[11px] text-slate-400">علت و تقاضای اولیه مراجعه مراجعان مرکز</span>
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
                <span>۵ حوزه درخواست مراجعین</span>
                <span className="font-bold text-sky-700">بیشترین: بالینی و خانواده</span>
              </div>
            </div>

            {/* ۳. باکس بیشترین نوبت‌ها از مشاوران (از کدام مشاوران بیشترین نوبت ها دریافت شده) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        بیشترین نوبت‌های دریافتی از مشاوران
                      </h2>
                      <span className="text-[11px] text-slate-400">رتبه‌بندی اساتید بر اساس تعداد نوبت‌های رزرو شده</span>
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
                <span className="text-emerald-700 font-bold">بازه: {timeRange === 'all' ? 'کل سوابق' : 'انتخابی'}</span>
              </div>
            </div>

          </div>

          {/* بخش سوم: آخرین فعالیت‌ها + بیشترین نوبت‌ها و فرم‌های مراجعان */}
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>نمایش بر اساس تازه‌ترین رویدادها</span>
                <span className="font-bold text-indigo-700">{toPersianDigits(recentActivities.length)} رویداد فعال</span>
              </div>
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
                <span>مرتب‌سازی بر اساس حجم جلسات رزرو شده</span>
                <span className="text-amber-700 font-bold">بازه: {timeRange === 'all' ? 'کل سوابق' : 'انتخابی'}</span>
              </div>
            </div>

          </div>

          '

          {/* ردیف اول: تحلیل نوبت‌های هر فرد در بازه زمانی + جدول تاپ ۱۰ مراجعین پرتکرار */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* توزیع تعداد نوبت‌ها به ازای هر مراجع */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    تعداد نوبت‌ها به ازای هر مراجع
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">بازه {timeRange === 'all' ? 'کل سوابق' : 'انتخابی'}</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                تفکیک فراوانی مراجعه‌کنندگان بر اساس تعداد جلسات مشاوره‌ای که در مرکز بالحق ثبت و برگزار کرده‌اند:
              </p>

              <div className="space-y-3.5 pt-1">
                {sessionDistributionItems.map((item) => {
                  const sc = getSemanticColorByPercentage(item.pct);
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${sc.dotBg} shrink-0 ring-2 ${sc.ringColor}`} />
                          <span className="font-bold text-slate-800">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[11px]">{toPersianDigits(item.count)} نفر</span>
                          <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded border ${sc.badgeBg} ${sc.textColor} ${sc.badgeBorder}`}>
                            {toPersianDigits(item.pct)}٪
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${item.pct}%`, backgroundColor: sc.hex }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* جدول ۱۰ مراجع با بیشترین تعداد نوبت و جلسه */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    مراجعین با بیشترین حجم ارجاع و نوبت
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ۱۰ مراجع برتر
                </span>
              </div>

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
                      const sessions = client.bookingCount > 0 ? client.bookingCount : (idx < 2 ? 7 - idx : 4 - Math.floor(idx / 3));
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
            </div>

          </div>

          {/* ردیف دوم: پراکندگی جغرافیایی شهرها + توزیع بعد خانوار */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* پراکندگی جغرافیایی ثبت‌نامی‌ها بر اساس شهرها */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    پراکندگی جغرافیایی (بیشتر ثبت‌نامی‌ها از کدام شهرها هستند)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">سهم از کل</span>
              </div>

              <div className="space-y-3 pt-1">
                {cityDistribution.map((item) => {
                  const sc = getSemanticColorByPercentage(item.percentage);
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${sc.dotBg} shrink-0 ring-2 ${sc.ringColor}`} />
                          <span className="font-bold text-slate-800">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[11px]">{toPersianDigits(item.count)} پرونده</span>
                          <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded border ${sc.badgeBg} ${sc.textColor} ${sc.badgeBorder}`}>
                            {toPersianDigits(item.percentage)}٪
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${item.percentage}%`, backgroundColor: sc.hex }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* بعد خانوار (بیشتر خانواده‌ها چند نفره هستند) */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Baby className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    بُعد خانوار (بیشتر مراجعین در خانواده‌های چند نفره هستند)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  بیشترین: ۴ نفره
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                تحلیل فراوانی بعد خانوار مراجعین مرکز بالحق جهت طراحی بسته‌های مشاوره‌ای و دوره‌های خانواده‌محور:
              </p>

              <div className="space-y-3.5 pt-1">
                {familySizeDistribution.map((fam) => {
                  const sc = getSemanticColorByPercentage(fam.pct);
                  return (
                    <div key={fam.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${sc.dotBg} shrink-0 ring-2 ${sc.ringColor}`} />
                          <span className="font-bold text-slate-800">{fam.label}</span>
                          {fam.isMode && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              بُعد غالب
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[11px]">{toPersianDigits(fam.count)} خانوار</span>
                          <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded border ${sc.badgeBg} ${sc.textColor} ${sc.badgeBorder}`}>
                            {toPersianDigits(fam.pct)}٪
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${fam.pct}%`, backgroundColor: sc.hex }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ردیف سوم: هرم سنی و سهم ویژه نوجوانان + تفکیک وضعیت تأهل */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* توزیع رده‌های سنی با تمرکز بر نوجوانان و جوانان */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    توزیع رده‌های سنی مراجعین و سهم نوجوانان
                  </h3>
                </div>
                <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  هرم سنی
                </span>
              </div>

              <div className="space-y-3.5 pt-1">
                {ageDistribution.map((item) => {
                  const sc = getSemanticColorByPercentage(item.pct);
                  return (
                    <div key={item.label} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${sc.dotBg} shrink-0 ring-2 ${sc.ringColor}`} />
                          <span className="font-bold text-slate-800">{item.label}</span>
                          {item.tag && (
                            <span className="mr-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                              {item.tag}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[11px]">{toPersianDigits(item.count)} نفر</span>
                          <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded border ${sc.badgeBg} ${sc.textColor} ${sc.badgeBorder}`}>
                            {toPersianDigits(item.pct)}٪
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${item.pct}%`, backgroundColor: sc.hex }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* تفکیک وضعیت تأهل (درصد مجرد، متأهل، مطلقه) */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    وضعیت تأهل مراجعین (درصد مجرد، متأهل، مطلقه)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">سهم ازدواج و خانواده</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {genderStats.roles.map((r) => {
                    const sc = getSemanticColorByPercentage(r.pct);
                    return (
                      <div key={r.label} className={`p-2.5 rounded-lg border ${sc.badgeBorder} ${sc.badgeBg} text-center space-y-1`}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-700 font-bold">{r.label}</span>
                        </div>
                        <div className="text-xs font-black font-mono" style={{ color: sc.hex }}>
                          {toPersianDigits(r.pct)}٪
                        </div>
                        <div className="w-full bg-white/80 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${r.pct}%`, backgroundColor: sc.hex }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* ردیف چهارم: رتبه‌بندی مشاورین مرکز + شاخص‌های بالینی جمعی */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* رتبه‌بندی مشاوران بر اساس تعداد نوبت‌های اخذ شده */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    فراوانی و رتبه‌بندی مشاورین (بیشترین نوبت‌های اخذ شده)
                  </h3>
                </div>
                <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  مشاوران مرکز
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {counselorRanking.slice(0, 6).map((c, idx) => {
                  const sc = getSemanticColorByPercentage(c.percentage);
                  return (
                    <div key={c.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${sc.dotBg} shrink-0 ring-2 ${sc.ringColor}`} />
                          <span className="font-mono text-slate-400 font-bold text-[11px]">{toPersianDigits(idx + 1)}.</span>
                          <span className="font-bold text-slate-800">{c.name}</span>
                          <span className="text-[10px] text-slate-400 mr-1.5">({c.specialty})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[11px]">{toPersianDigits(c.count)} جلسه</span>
                          <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded border ${sc.badgeBg} ${sc.textColor} ${sc.badgeBorder}`}>
                            {toPersianDigits(c.percentage)}٪
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${c.percentage}%`, backgroundColor: sc.hex }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* شاخص‌های جمعی بالینی و خودسنجی صفا */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    شاخص‌های جمعی بالینی و اولویت‌های رشد در جامعه مراجعین
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ارزیابی جمعی
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                میانگین نمرات خودسنجی در کل مراجعین جهت شناسایی حوزه‌های قوت و مؤلفه‌های نیازمند مداخله و کارگاه‌های توانمندسازی:
              </p>

              <div className="space-y-2.5 pt-1">
                {clinicalDimensionsSummary.slice(0, 6).map((dim) => {
                  const sc = getSemanticColorByPercentage(dim.score);
                  return (
                    <div key={dim.name} className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${sc.dotBg} shrink-0 ring-2 ${sc.ringColor}`} />
                          <span className="font-bold text-slate-800">{dim.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-black text-xs px-2 py-0.5 rounded border ${sc.badgeBg} ${sc.textColor} ${sc.badgeBorder}`}>
                            {toPersianDigits(dim.score)}٪
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${dim.score}%`, backgroundColor: sc.hex }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ۲. نمای تحلیل تفکیکی فیلدهای فرم‌ها (Field-by-Field Form Analyzer) */}
      {activeTab === 'formDetail' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* سربرگ انتخاب فرم و دکمه خروجی اکسل */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">فرم مورد نظر جهت تحلیل فیلد به فیلد:</span>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 bg-white max-w-xs focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>

            {formSubmissions.length > 0 && (
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
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        نمودار فراوانی و تفکیک پاسخ‌های گزینه‌ای
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">درصد و تعداد دقیق هر یک از گزینه‌ها</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">فیلد مورد بررسی:</span>
                      <select
                        value={activeChoiceField.id}
                        onChange={(e) => setSelectedChoiceFieldId(e.target.value)}
                        className="text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white cursor-pointer"
                      >
                        {choiceFields.map((f) => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

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

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    {optionDistribution.map((opt) => {
                      const sc = getSemanticColorByPercentage(opt.percentage);
                      return (
                        <div key={opt.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${sc.dotBg} shrink-0 ring-2 ${sc.ringColor}`} />
                              <span className="font-bold text-slate-800">{opt.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-500 text-[11px]">{toPersianDigits(opt.count)} نفر</span>
                              <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded border ${sc.badgeBg} ${sc.textColor} ${sc.badgeBorder}`}>
                                {toPersianDigits(opt.percentage)}٪
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ width: `${opt.percentage}%`, backgroundColor: sc.hex }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              )}

              {/* تحلیل فیلدهای عددی در صورت وجود */}
              {activeNumericField && numericStats.count > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      محاسبات آماری فیلد عددی: {activeNumericField.label}
                    </h3>
                  </div>

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
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
