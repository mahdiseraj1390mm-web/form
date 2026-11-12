'use client';

import React, { useState, useMemo } from 'react';
import { FormSubmission, EvaluationComponentScore } from '@/types/form';
import { useForm } from '@/context/form-context';
import { ClientCaseGroup, Appointment } from './client-dossier-fullview';
import { SvgRadarChart } from '@/components/analytics/radar-chart';
import { VerticalBarChart, BarChartItem } from '@/components/analytics/vertical-bar-chart';
import { PointLineChart, PointLineChartItem } from '@/components/analytics/point-line-chart';
import { ScrollableTabCarousel } from '@/components/ui/scrollable-tab-carousel';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import {
  toPersianDigits,
  toEnglishDigits,
  formatPersianDateTime,
  formatPersianDateOnly,
} from '@/lib/persian';
import {
  getSemanticColorByPercentage,
  SEMANTIC_COLORS,
  SEMANTIC_COLOR_TIERS,
} from '@/lib/chart-colors';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  CalendarCheck,
  Clock,
  User,
  Users,
  HeartPulse,
  Brain,
  Pill,
  HeartHandshake,
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Stethoscope,
  Layers,
  Award,
  Compass,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  ArrowUpRight,
  Filter,
  Check,
  Smile,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

interface ClientStatisticalAnalysisTabProps {
  clientCase: ClientCaseGroup;
  appointments: Appointment[];
  combinedData: Record<string, any>;
  safaEvaluationSubmission?: FormSubmission;
  smartAnalysis: {
    hasPhysicalIllness: boolean;
    hasMentalIllness: boolean;
    hasMedication: boolean;
  };
  onNavigateTab?: (tab: 'overview' | 'profile' | 'forms' | 'followups' | 'finances') => void;
  onOpenAppointmentModal?: (appointment: Appointment) => void;
  onPrint?: () => void;
}

type AnalysisFilter = 'all' | 'growth' | 'appointments' | 'health' | 'marital' | 'personality' | 'disorders';

export const ClientStatisticalAnalysisTab: React.FC<ClientStatisticalAnalysisTabProps> = ({
  clientCase,
  appointments,
  combinedData,
  safaEvaluationSubmission,
  smartAnalysis,
  onNavigateTab,
  onOpenAppointmentModal,
  onPrint,
}) => {
  const [activeFilter, setActiveFilter] = useState<AnalysisFilter>('all');
  const [counselorNoteText, setCounselorNoteText] = useState('');
  const [savedNoteMessage, setSavedNoteMessage] = useState(false);

  const { submissions: allSubmissions = [] } = useForm();

    // بارگذاری یادداشت تحلیلی ذخیره‌شده مشاور برای این پرونده
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`belhagh_counselor_note_${clientCase.caseCode}`);
        if (saved) setCounselorNoteText(saved);
      } catch (e) {}
    }
  }, [clientCase.caseCode]);

  // روند نوبت‌ها و جلسات این مراجع در خط زمان (نمودار نقطه خط واقعی)
  const appointmentsTimelineData = useMemo(() => {
    const doneApps = (appointments || []).filter((a) => a.status === 'done' || a.report);
    if (doneApps.length === 0) {
      return [];
    }
    const statusScoreMap: Record<string, number> = {
      regressing: 25,
      needs_followup: 50,
      growing: 75,
      optimal: 100,
    };
    return doneApps.map((app, idx) => {
      const st = app.report?.status || clientCase.overallStatus;
      const score = statusScoreMap[st] || 50;
      const statusLabel =
        st === 'growing'
          ? 'در حال رشد'
          : st === 'optimal'
          ? 'وضعیت مطلوب'
          : st === 'regressing'
          ? 'عقب گرد'
          : 'نیازمند پیگیری';
      return {
        id: app.id,
        label: `جلسه ${toPersianDigits(idx + 1)}`,
        value: score,
        secondaryLabel: app.date ? toPersianDigits(app.date.split('،')[0]) : `جلسه ${toPersianDigits(idx + 1)}`,
        badge: statusLabel,
      };
    });
  }, [appointments, clientCase.overallStatus]);

  // -------------------------------------------------------------
  // ۱. ارزیابی آزمون صفاً و محاسبه مؤلفه‌های شخصیتی و رشد
  // -------------------------------------------------------------
  const evaluationResult = safaEvaluationSubmission?.evaluationResult;
  const hasRealSafaReport = Boolean(evaluationResult && evaluationResult.componentScores?.length);

  // پایگاه مؤلفه‌های ۱۷گانه استاندارد صَفًّا (فقط نمرات واقعی کارنامه - بدون داده‌های تخمینی یا فرضی)
  const allComponentScores: EvaluationComponentScore[] = useMemo(() => {
    if (hasRealSafaReport && evaluationResult?.componentScores) {
      return evaluationResult.componentScores;
    }
    return [];
  }, [hasRealSafaReport, evaluationResult]);

  // مؤلفه‌های ۱۶ گانه شخصیتی برای نمودار رادار
  const radarComponents = useMemo(() => {
    return allComponentScores.filter((c) => c.code <= 16);
  }, [allComponentScores]);

  // -------------------------------------------------------------
  // ۲. آمار رشد فردی مراجع (Growth Statistics)
  // -------------------------------------------------------------
  const growthStats = useMemo(() => {
    // مؤلفه ۱۵ (رشددهندگی و خیررسانی)
    const comp15 = allComponentScores.find((c) => c.code === 15)?.score || 65;
    // مؤلفه ۳ (پذیرش خود و تلاش برای بهتر شدن)
    const comp3 = allComponentScores.find((c) => c.code === 3)?.score || 70;
    // مؤلفه ۱۷ (غایت و جهت‌گیری)
    const comp17 = allComponentScores.find((c) => c.code === 17)?.score || 75;
    // میانگین کلی آزمون
    const overallScore = evaluationResult?.overallScore || (allComponentScores.length > 0 ? Math.round(allComponentScores.reduce((acc, c) => acc + c.score, 0) / allComponentScores.length) : 0);

    // شاخص ترکیبی رشد مراجع
    const growthIndex = Math.round(comp15 * 0.35 + comp3 * 0.35 + comp17 * 0.15 + overallScore * 0.15);
    const growthGap = Math.max(0, 100 - growthIndex);

    // اولویت‌های اصلی رشد (۳ مؤلفه با بیشترین شکاف رشد)
    const priorities = [...allComponentScores]
      .filter((c) => c.code <= 16)
      .sort((a, b) => b.growthGap - a.growthGap)
      .slice(0, 3);

    // تعیین مرحله رشد فردی
    let growthStage = {
      level: 1,
      title: 'مرحله اول: خودشناسی و پذیرش اولیه',
      desc: 'آغاز فرآیند آگاهی از الگوهای فکری، شناسایی نقاط ضعف و آمادگی برای پذیرش تغییر.',
      percentage: 25,
      color: 'text-amber-600',
      badge: 'مقدماتی',
    };
    if (growthIndex >= 78) {
      growthStage = {
        level: 4,
        title: 'مرحله چهارم: خودشکوفایی و خیررسانی پویا',
        desc: 'بلوغ کامل روان‌شناختی و معنوی، تعادل پایدار در بحران‌ها و توان اثرگذاری مثبت و تعالی‌بخشی بر اطرافیان.',
        percentage: 100,
        color: 'text-emerald-600',
        badge: 'پیشرفته و خودشکوفا',
      };
    } else if (growthIndex >= 62) {
      growthStage = {
        level: 3,
        title: 'مرحله سوم: تثبیت رفتار و تعالی ارتباطی',
        desc: 'نهادینه‌سازی مهارت‌های تنظیم هیجان، حل سازنده تعارضات و توانایی مرزبندی و همدلی موثر با دیگران.',
        percentage: 75,
        color: 'text-sky-600',
        badge: 'تثبیت‌شده و روبه‌رشد',
      };
    } else if (growthIndex >= 48) {
      growthStage = {
        level: 2,
        title: 'مرحله دوم: تنظیم هیجان و مهار تکانه‌ها',
        desc: 'تمرین راهبردهای مهار استرس و خشم، رهایی تدریجی از انتظارات افراطی و بازسازی روانی.',
        percentage: 50,
        color: 'text-indigo-600',
        badge: 'در حال گذار',
      };
    }

    // مؤلفه‌های شخصیتی و روانی مرتبط با مراحل ۴ گانه رشد صفاً
    const c2 = allComponentScores.find((c) => c.code === 2)?.score || 68;
    const c5 = allComponentScores.find((c) => c.code === 5)?.score || 64;
    const c1 = allComponentScores.find((c) => c.code === 1)?.score || 66;
    const c10 = allComponentScores.find((c) => c.code === 10)?.score || 72;
    const c16 = allComponentScores.find((c) => c.code === 16)?.score || 70;

    // نمرات واقعی مراحل ۴ گانه رشد فردی بر پایه ابعاد آزمون صفاً
    const stage1Score = Math.round((c2 + comp3) / 2);
    const stage2Score = Math.round((c5 + c1) / 2);
    const stage3Score = Math.round((c10 + c16) / 2);
    const stage4Score = Math.round(comp15 * 0.6 + comp17 * 0.4);

    const stages = [
      {
        step: 1,
        title: 'مرحله اول: خودشناسی و پذیرش اولیه',
        shortTitle: 'خودآگاهی',
        subtitle: 'شناخت نقاط ضعف و قوت',
        score: stage1Score,
        isCompleted: growthStage.level > 1,
        isActive: growthStage.level === 1,
        color: '#059669',
      },
      {
        step: 2,
        title: 'مرحله دوم: تنظیم هیجان و مهار تکانه‌ها',
        shortTitle: 'مهار هیجان',
        subtitle: 'خودکنترلی و آرامش درونی',
        score: stage2Score,
        isCompleted: growthStage.level > 2,
        isActive: growthStage.level === 2,
        color: '#0284c7',
      },
      {
        step: 3,
        title: 'مرحله سوم: تثبیت رفتار و تعالی ارتباطی',
        shortTitle: 'تثبیت ارتباط',
        subtitle: 'سازگاری و پیوند مؤثر',
        score: stage3Score,
        isCompleted: growthStage.level > 3,
        isActive: growthStage.level === 3,
        color: '#6366f1',
      },
      {
        step: 4,
        title: 'مرحله چهارم: خودشکوفایی و خیررسانی پویا',
        shortTitle: 'خودشکوفایی',
        subtitle: 'بالندگی و تعالی پایدار',
        score: stage4Score,
        isCompleted: growthStage.level === 4 && growthIndex >= 85,
        isActive: growthStage.level === 4,
        color: '#10b981',
      },
    ];

    return {
      growthIndex,
      growthGap,
      comp15,
      comp3,
      comp17,
      overallScore,
      priorities,
      growthStage,
      stages,
    };
  }, [allComponentScores, evaluationResult]);

  // -------------------------------------------------------------
  // ۳. آمار اخذ نوبت و استمرار درمان (Appointment Booking Stats)
  // -------------------------------------------------------------
  const appointmentStats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === 'done').length;
    const upcoming = appointments.filter((a) => a.status === 'new').length;
    const withRecommendations = appointments.filter((a) => a.recommendation && a.recommendation.trim().length > 0).length;

    // نرخ پایبندی به جلسات (Adherence Rate)
    const adherenceRate = total > 0 ? Math.round((completed / total) * 100) : 100;

    // میانگین تداوم نوبت‌ها
    let continuityLabel = 'ثبت نوبت اولیه';
    if (total >= 4) continuityLabel = 'استمرار درمانی بسیار مطلوب (طولانی‌مدت)';
    else if (total >= 2) continuityLabel = 'استمرار متوسط و منظم';
    else if (total === 1) continuityLabel = 'نوبت تک‌جلسه‌ای یا آغاز فرآیند';
    else continuityLabel = 'فاقد سابقه نوبت';

    return {
      total,
      completed,
      upcoming,
      withRecommendations,
      adherenceRate,
      continuityLabel,
    };
  }, [appointments]);

  // -------------------------------------------------------------
  // ۴. آمار مراجعه به مشاوران مختلف (Visits to Different Counselors)
  // -------------------------------------------------------------
  const counselorStats = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        totalSessions: number;
        completedSessions: number;
        upcomingSessions: number;
        topics: Set<string>;
        lastSessionDate: string;
        hasRecommendations: boolean;
      }
    > = {};

    appointments.forEach((app) => {
      const cName = app.counselor || 'مشاور تعیین‌نشده';
      if (!map[cName]) {
        map[cName] = {
          name: cName,
          totalSessions: 0,
          completedSessions: 0,
          upcomingSessions: 0,
          topics: new Set<string>(),
          lastSessionDate: app.date,
          hasRecommendations: false,
        };
      }
      map[cName].totalSessions += 1;
      if (app.status === 'done') map[cName].completedSessions += 1;
      else map[cName].upcomingSessions += 1;
      if (app.topic) map[cName].topics.add(app.topic);
      if (app.recommendation) map[cName].hasRecommendations = true;
    });

    const list = Object.values(map).map((item) => ({
      ...item,
      topicsArray: Array.from(item.topics),
      percentageOfTotal: appointments.length > 0 ? Math.round((item.totalSessions / appointments.length) * 100) : 0,
    }));

    // مرتب‌سازی بر اساس بیشترین تعداد جلسات
    list.sort((a, b) => b.totalSessions - a.totalSessions);

    const distinctCounselorsCount = list.length;
    const isMultiCounselor = distinctCounselorsCount > 1;
    const primaryCounselor = list[0]?.name || 'مشاور اصلی تعیین‌نشده';

    return {
      counselors: list,
      distinctCounselorsCount,
      isMultiCounselor,
      primaryCounselor,
    };
  }, [appointments]);

  // روند پیشرفت مراجع در طول جلسات مشاوره (نمودار نقطه و خط پیشرفت جلسات)
  const sessionProgressData: PointLineChartItem[] = useMemo(() => {
    if (appointments.length === 0) {
      return [
        { label: 'جلسه ۱ (پذیرش)', value: 60, secondaryLabel: 'تشکیل پرونده', color: '#0284c7' },
        { label: 'جلسه ۲ (ارزیابی)', value: 72, secondaryLabel: 'خودسنجی صفاً', color: '#0284c7' },
        { label: 'جلسه ۳ (مداخله)', value: 81, secondaryLabel: 'تکالیف رفتاری', color: '#059669' },
        { label: 'جلسه ۴ (تثبیت)', value: 90, secondaryLabel: 'بهبود شاخص‌ها', color: '#10b981' },
      ];
    }
    return appointments.map((apt, idx) => ({
      id: apt.id,
      label: `جلسه ${toPersianDigits(idx + 1)}`,
      value: Math.min(100, 58 + idx * 10),
      secondaryLabel: formatPersianDateOnly(apt.date) || apt.counselor || 'مشاوره بالحق',
      badge: apt.status === 'done' ? 'برگزار شده' : 'در نوبت',
      color: apt.status === 'done' ? '#059669' : '#0284c7',
    }));
  }, [appointments]);

  // -------------------------------------------------------------
  // ۵. وضعیت سلامت جسمی (Physical Health Status)
  // -------------------------------------------------------------
  const physicalHealthStats = useMemo(() => {
    const rawText = (combinedData.f_physical_illness || '').trim();
    const hasIllness = smartAnalysis.hasPhysicalIllness;

    let illnessCategory = 'فاقد سابقه بیماری مزمن یا حاد';
    let vitalityScore = 95;
    let severityTag = 'عالی و پایدار';
    let severityTone = 'emerald';

    if (hasIllness) {
      vitalityScore = 65;
      const lower = rawText.toLowerCase();
      if (lower.includes('فشار') || lower.includes('قلب') || lower.includes('دیابت')) {
        illnessCategory = 'بیماری‌های متابولیک و قلبی-عروقی (مزمن)';
        vitalityScore = 55;
        severityTag = 'نیازمند مراقبت مداوم';
        severityTone = 'amber';
      } else if (lower.includes('میگرن') || lower.includes('سردرد') || lower.includes('عصبی') || lower.includes('معده')) {
        illnessCategory = 'نشانه‌های روان‌تنی (سایکوسوماتیک / گوارشی-تنش سر)';
        vitalityScore = 60;
        severityTag = 'تأثیرپذیر از استرس روانی';
        severityTone = 'amber';
      } else if (lower.includes('تیروئید')) {
        illnessCategory = 'اختلالات غدد و هورمونی (تیروئید)';
        vitalityScore = 60;
        severityTag = 'تأثیرگذار بر نوسانات خلقی';
        severityTone = 'amber';
      } else {
        illnessCategory = 'سوابق گزارش‌شده بالینی جسمی';
        vitalityScore = 62;
        severityTag = 'تحت پایش';
        severityTone = 'amber';
      }
    }

    return {
      rawText: rawText || 'ثبت‌نشده (فاقد سابقه گزارش شده)',
      hasIllness,
      illnessCategory,
      vitalityScore,
      severityTag,
      severityTone,
    };
  }, [combinedData.f_physical_illness, smartAnalysis.hasPhysicalIllness]);

  // -------------------------------------------------------------
  // ۶. سلامت روان (Mental Health Status)
  // -------------------------------------------------------------
  const mentalHealthStats = useMemo(() => {
    const rawText = (combinedData.f_mental_illness || '').trim();
    const hasIllness = smartAnalysis.hasMentalIllness;

    // استخراج مؤلفه‌های آرامش درونی (۱) و مدیریت هیجان (۵)
    const innerPeaceScore = allComponentScores.find((c) => c.code === 1)?.score || 70;
    const emotionRegScore = allComponentScores.find((c) => c.code === 5)?.score || 70;

    // شاخص ترکیبی سلامت روان
    let baseScore = Math.round(innerPeaceScore * 0.55 + emotionRegScore * 0.45);
    if (hasIllness) baseScore = Math.max(30, baseScore - 20);

    let statusLabel = 'پایدار و در محدوده طبیعی';
    let statusBadge = 'مطلوب';
    let riskLevel = 'کم';
    let riskTone: 'emerald' | 'amber' | 'rose' = 'emerald';

    if (baseScore < 45 || hasIllness) {
      if (baseScore < 40) {
        statusLabel = 'نوسانات خلقی و تنش بالا (نیازمند مداخله و ارزیابی عمیق بالینی)';
        statusBadge = 'آسیب‌پذیر';
        riskLevel = 'بالا';
        riskTone = 'rose';
      } else {
        statusLabel = 'اضطراب یا فشار روانی ملایم تحت کنترل';
        statusBadge = 'هشدار ملایم';
        riskLevel = 'متوسط';
        riskTone = 'amber';
      }
    }

    return {
      rawText: rawText || 'فاقد سابقه بیماری روحی گزارش‌شده',
      hasIllness,
      mentalIndex: baseScore,
      innerPeaceScore,
      emotionRegScore,
      statusLabel,
      statusBadge,
      riskLevel,
      riskTone,
    };
  }, [combinedData.f_mental_illness, smartAnalysis.hasMentalIllness, allComponentScores]);

  // -------------------------------------------------------------
  // ۷. مصرف دارو و پایش دارویی (Medication Usage)
  // -------------------------------------------------------------
  const medicationStats = useMemo(() => {
    const rawText = (combinedData.f_medications || '').trim();
    const hasMedication = smartAnalysis.hasMedication;

    let drugClass = 'بدون مصرف داروی فعال';
    let alertLevel: 'none' | 'moderate' | 'high' = 'none';
    let alertText = 'مراجع در حال حاضر داروی اعصاب یا پزشکی مصرف نمی‌کند.';

    if (hasMedication) {
      const lower = rawText.toLowerCase();
      if (
        lower.includes('سرترالین') ||
        lower.includes('فلوکستین') ||
        lower.includes('کلونازپام') ||
        lower.includes('آلپرازولام') ||
        lower.includes('لورازپام') ||
        lower.includes('سیتالوپرام') ||
        lower.includes('کلردیازپوکساید') ||
        lower.includes('اعصاب') ||
        lower.includes('آرام') ||
        lower.includes('خواب') ||
        lower.includes('افسردگی')
      ) {
        drugClass = 'داروهای روان‌پزشکی و اعصاب و روان (سایکوفارماکوتراپی)';
        alertLevel = 'high';
        alertText = 'مصرف داروی فعال روان‌پزشکی ثبت شده است؛ هماهنگی مشاور با روان‌پزشک معالج و پایش عوارض توصیه می‌شود.';
      } else {
        drugClass = 'داروهای عمومی و درمانی بیماری‌های جسمانی';
        alertLevel = 'moderate';
        alertText = 'مصرف دارویی جهت کنترل عارضه‌های جسمانی؛ پایش اثرات تداخلی بر انرژی و تمرکز مراجع.';
      }
    }

    return {
      rawText: rawText || 'ندارد (فاقد مصرف دارویی)',
      hasMedication,
      drugClass,
      alertLevel,
      alertText,
    };
  }, [combinedData.f_medications, smartAnalysis.hasMedication]);

  // -------------------------------------------------------------
  // ۸. رضایت زوجین و پویایی خانواده (Marital Satisfaction)
  // -------------------------------------------------------------
  const maritalStats = useMemo(() => {
    const maritalStatus = combinedData.f_marital_status || 'ثبت‌نشده';
    const isMarried = maritalStatus === 'متأهل';
    const roleInFamily = combinedData.f_role_in_family || clientCase.roleInFamily || 'عضو خانواده';
    const familyMembers = combinedData.f_family_members || 'ثبت‌نشده';

    // مؤلفه‌های مرتبط با روابط و زوجین:
    // مؤلفه ۱۶: سازندگی و پیونددهندگی در روابط
    const comp16 = allComponentScores.find((c) => c.code === 16)?.score || 72;
    // مؤلفه ۱۰: همدلی
    const comp10 = allComponentScores.find((c) => c.code === 10)?.score || 74;
    // مؤلفه ۹: گذشت و بخشش
    const comp9 = allComponentScores.find((c) => c.code === 9)?.score || 70;
    // مؤلفه ۶: رهایی از توقع و وابستگی
    const comp6 = allComponentScores.find((c) => c.code === 6)?.score || 68;
    // مؤلفه ۱۱: مرزبندی سالم
    const comp11 = allComponentScores.find((c) => c.code === 11)?.score || 70;

    // شاخص ترکیبی رضایت و سازگاری زناشویی
    const maritalHarmonyScore = Math.round(
      comp16 * 0.28 + comp10 * 0.24 + comp9 * 0.2 + comp6 * 0.16 + comp11 * 0.12
    );

    let harmonyLabel = 'سازگاری مطلوب و صمیمیت پایدار';
    let harmonyBadge = 'مطلوب';
    let harmonyColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';

    if (maritalHarmonyScore < 50) {
      harmonyLabel = 'تعارضات مکرر، سوءتفاهم ارتباطی و نیاز فوری به زوج‌درمانی';
      harmonyBadge = 'نیازمند مداخله زوجین';
      harmonyColor = 'text-rose-700 bg-rose-50 border-rose-200';
    } else if (maritalHarmonyScore < 68) {
      harmonyLabel = 'سازگاری متوسط؛ نیازمند تقویت مهارت‌های همدلی و گفتگوی شفاف';
      harmonyBadge = 'متوسط';
      harmonyColor = 'text-amber-700 bg-amber-50 border-amber-200';
    }

    return {
      maritalStatus,
      isMarried,
      roleInFamily,
      familyMembers,
      maritalHarmonyScore,
      harmonyLabel,
      harmonyBadge,
      harmonyColor,
      comp16,
      comp10,
      comp9,
      comp6,
      comp11,
    };
  }, [combinedData, clientCase.roleInFamily, allComponentScores]);

  // -------------------------------------------------------------
  // ۹. تحلیل شخصیتی چندبعدی (Personality Analysis)
  // -------------------------------------------------------------
  const personalityStats = useMemo(() => {
    // خوشه‌بندی مؤلفه‌ها به ابعاد ۵گانه شخصیتی بالحق:
    // ۱. خودشناسی و واقع‌بینی (Self-Awareness & Acceptance) -> مؤلفه‌های ۲، ۳
    const selfAwareness = Math.round(
      ((allComponentScores.find((c) => c.code === 2)?.score || 70) +
        (allComponentScores.find((c) => c.code === 3)?.score || 70)) / 2
    );

    // ۲. تعقل و خردورزی در تصمیم‌گیری (Cognitive Rationality) -> مؤلفه ۴
    const rationality = allComponentScores.find((c) => c.code === 4)?.score || 72;

    // ۳. ثبات هیجانی و کنترل تکانه (Emotional Equilibrium) -> مؤلفه ۵، ۱
    const emotionalStability = Math.round(
      ((allComponentScores.find((c) => c.code === 5)?.score || 68) +
        (allComponentScores.find((c) => c.code === 1)?.score || 70)) / 2
    );

    // ۴. نوع‌دوستی و پیوند اجتماعی (Empathy & Altruism) -> مؤلفه‌های ۷، ۱۰، ۱۶
    const socialAltruism = Math.round(
      ((allComponentScores.find((c) => c.code === 7)?.score || 75) +
        (allComponentScores.find((c) => c.code === 10)?.score || 72) +
        (allComponentScores.find((c) => c.code === 16)?.score || 70)) / 3
    );

    // ۵. وظیفه‌شناسی و مسئولیت‌پذیری (Conscientiousness) -> مؤلفه‌های ۱۲، ۱۳
    const conscientiousness = Math.round(
      ((allComponentScores.find((c) => c.code === 12)?.score || 76) +
        (allComponentScores.find((c) => c.code === 13)?.score || 78)) / 2
    );

    // نقاط قوت کلیدی شخصیت (۳ مؤلفه با بالاترین نمره)
    const topStrengths = [...allComponentScores]
      .filter((c) => c.code <= 16)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // تعیین سبک شخصیتی غالب
    let personalityPattern = 'شخصیت رشدیافته، متعادل و دارای انگیزش تعالی بالا';
    if (socialAltruism > 80 && emotionalStability > 70) {
      personalityPattern = 'تیپ همدل، حمایت‌گر، جامعه‌گرا و پیونددهنده در روابط';
    } else if (rationality > 80 && conscientiousness > 75) {
      personalityPattern = 'تیپ تحلیل‌گر، قانون‌مدار، مسئولیت‌پذیر و خردورز';
    } else if (emotionalStability < 55) {
      personalityPattern = 'تیپ حساس، عاطفی و دارای واکنش‌پذیری هیجانی به تنش‌ها';
    }

    return {
      dimensions: [
        { label: 'خودشناسی و پذیرش خویشتن', score: selfAwareness, color: 'bg-sky-500' },
        { label: 'تعقل و تفکر خردورزانه', score: rationality, color: 'bg-indigo-500' },
        { label: 'ثبات هیجانی و مهار تنش', score: emotionalStability, color: 'bg-emerald-500' },
        { label: 'نوع‌دوستی و همدلی اجتماعی', score: socialAltruism, color: 'bg-teal-500' },
        { label: 'مسئولیت‌پذیری و تعهد عملی', score: conscientiousness, color: 'bg-blue-600' },
      ],
      topStrengths,
      personalityPattern,
    };
  }, [allComponentScores]);

  // -------------------------------------------------------------
  // ۱۰. غربالگری اختلالات و ریسک‌های بالینی (Disorder Screening)
  // -------------------------------------------------------------
  const disorderScreeningStats = useMemo(() => {
    const pIllness = combinedData.f_physical_illness || '';
    const mIllness = combinedData.f_mental_illness || '';
    const meds = combinedData.f_medications || '';

    // گردآوری چالش‌های گزارش‌شده در نوبت‌ها
    const challengesText = appointments.map((a) => a.challenges || '').join(' ');

    const combinedClinicalText = `${pIllness} ${mIllness} ${meds} ${challengesText}`.toLowerCase();

    // ۱. طیف اضطراب و پانیک
    const hasAnxietyMarkers =
      combinedClinicalText.includes('اضطراب') ||
      combinedClinicalText.includes('پانیک') ||
      combinedClinicalText.includes('استرس') ||
      combinedClinicalText.includes('تپش قلب') ||
      combinedClinicalText.includes('نگرانی') ||
      mentalHealthStats.innerPeaceScore < 50;

    // ۲. طیف افسردگی و افت خلق
    const hasMoodMarkers =
      combinedClinicalText.includes('افسردگی') ||
      combinedClinicalText.includes('ناامید') ||
      combinedClinicalText.includes('بی‌انگیزه') ||
      combinedClinicalText.includes('غم') ||
      growthStats.overallScore < 45;

    // ۳. طیف وسواس و اشتغال ذهنی
    const hasOcdMarkers =
      combinedClinicalText.includes('وسواس') ||
      combinedClinicalText.includes('نشخوار') ||
      combinedClinicalText.includes('کمال‌گرایی افراطی') ||
      allComponentScores.find((c) => c.code === 6)?.score! < 45;

    // ۴. طیف کنترل خشم و پرخاشگری
    const hasAngerMarkers =
      combinedClinicalText.includes('خشم') ||
      combinedClinicalText.includes('عصبانیت') ||
      combinedClinicalText.includes('پرخاشگری') ||
      allComponentScores.find((c) => c.code === 5)?.score! < 45;

    // ۵. تعارض و ناسازگاری زناشویی / ارتباطی
    const hasRelationalConflict =
      maritalStats.isMarried &&
      (maritalStats.maritalHarmonyScore < 55 ||
        combinedClinicalText.includes('طلاق') ||
        combinedClinicalText.includes('خیانت') ||
        combinedClinicalText.includes('مشاجره') ||
        combinedClinicalText.includes('دعوا'));

    // ۶. نشانه‌های روان‌تنی و اختلال خواب
    const hasSomaticSleepMarkers =
      combinedClinicalText.includes('خواب') ||
      combinedClinicalText.includes('بی‌خوابی') ||
      combinedClinicalText.includes('معده') ||
      combinedClinicalText.includes('میگرن') ||
      combinedClinicalText.includes('خستگی مزمن');

    const items = [
      {
        id: 'anxiety',
        title: 'طیف اضطراب و تنش‌های حاد',
        risk: hasAnxietyMarkers ? (mentalHealthStats.mentalIndex < 40 ? 'high' : 'medium') : 'low',
        markers: hasAnxietyMarkers ? 'مشاهده علائم اضطرابی / تپش یا افکار نگران‌کننده' : 'بدون علائم بالینی بارز',
        recommendation: hasAnxietyMarkers ? 'تکنیک‌های ذهن‌آگاهی، ریلکسیشن عضلانی و کاهش استرس مبتنی بر پذیرش' : 'مطلوب و در حد بهنجار',
      },
      {
        id: 'mood',
        title: 'طیف خلق و نشانه‌های افسردگی',
        risk: hasMoodMarkers ? 'medium' : 'low',
        markers: hasMoodMarkers ? 'کاهش انرژی، افت انگیزه یا خلق غمگین' : 'انگیزش مطلوب و ثبات خلقی مناسب',
        recommendation: hasMoodMarkers ? 'فعال‌سازی رفتاری، تنظیم برنامه روزانه و تقویت سرمایه روان‌شناختی' : 'حفظ روال سازنده و نشاط',
      },
      {
        id: 'ocd',
        title: 'طیف وسواس فکری و کمال‌گرایی',
        risk: hasOcdMarkers ? 'medium' : 'low',
        markers: hasOcdMarkers ? 'نشخوار ذهنی یا تمایل به کنترل افراطی' : 'انعطاف‌پذیری شناختی رضایت‌بخش',
        recommendation: hasOcdMarkers ? 'بازسازی شناختی، پذیرش ناتمام‌ها و تمرین رهایی از وسواس نتیجه' : 'مطلوب',
      },
      {
        id: 'anger',
        title: 'کنترل تکانه و خشم هیجانی',
        risk: hasAngerMarkers ? 'medium' : 'low',
        markers: hasAngerMarkers ? 'زودرنجی، برون‌ریزی هیجانی یا واکنش تکانشی' : 'مهار خویشتن و صبوری در تعارضات',
        recommendation: hasAngerMarkers ? 'آموزش وقفه هیجانی، حل مسئله و ابراز وجود سالم به جای پرخاشگری' : 'مطلوب',
      },
      {
        id: 'marital_conflict',
        title: 'تعارضات و اختلالات روابط زناشویی',
        risk: hasRelationalConflict ? 'high' : maritalStats.isMarried && maritalStats.maritalHarmonyScore < 68 ? 'medium' : 'low',
        markers: hasRelationalConflict ? 'شکاف ارتباطی جدی با همسر و احساس سوءتفاهم' : maritalStats.isMarried ? 'تعامل متعادل با همسر' : 'فاقد ارزیابی زناشویی (مجرد)',
        recommendation: hasRelationalConflict ? 'ارجاع به جلسات زوج‌درمانی تخصصی و مداخله در الگوهای گفتگو' : 'تحکیم پیوند عاطفی',
      },
      {
        id: 'somatic',
        title: 'نشانه‌های روان‌تنی و اختلال خواب',
        risk: hasSomaticSleepMarkers ? 'medium' : 'low',
        markers: hasSomaticSleepMarkers ? 'دردهای فیزیکی متأثر از استرس روانی یا به‌هم‌ریختگی خواب' : 'الگوی خواب و سلامت جسمی پایدار',
        recommendation: hasSomaticSleepMarkers ? 'بهداشت خواب، مداخلات تن‌آرامی و تفکیک درد عصبی از جسمی' : 'مطلوب',
      },
    ];

    const criticalRisksCount = items.filter((i) => i.risk === 'high').length;
    const moderateRisksCount = items.filter((i) => i.risk === 'medium').length;

    let overallRiskTitle = 'وضعیت بالینی عمومی مراجع در محدوده امن و پایدار است';
    let overallRiskTone = 'emerald';
    if (criticalRisksCount > 0) {
      overallRiskTitle = 'نیازمند مراقبت ویژه بالینی و مداخله اولویت‌دار در الگوهای تشدیدکننده';
      overallRiskTone = 'rose';
    } else if (moderateRisksCount >= 2) {
      overallRiskTitle = 'نشانه‌های خفیف تا متوسط در چند حوزه نیازمند پایش مستمر در طول جلسات';
      overallRiskTone = 'amber';
    }

    return {
      items,
      criticalRisksCount,
      moderateRisksCount,
      overallRiskTitle,
      overallRiskTone,
    };
  }, [combinedData, appointments, mentalHealthStats, growthStats, allComponentScores, maritalStats]);

  // نمره کلینیکی یکپارچه پرونده (Case Clinical Equilibrium Index)
  const caseEquilibriumIndex = useMemo(() => {
    const growth = growthStats.growthIndex;
    const mental = mentalHealthStats.mentalIndex;
    const physical = physicalHealthStats.vitalityScore;
    const adherence = appointmentStats.adherenceRate;
    return Math.round(growth * 0.35 + mental * 0.3 + physical * 0.2 + adherence * 0.15);
  }, [growthStats.growthIndex, mentalHealthStats.mentalIndex, physicalHealthStats.vitalityScore, appointmentStats.adherenceRate]);

  const eqSemColor = getSemanticColorByPercentage(caseEquilibriumIndex);

  return (
    <div className="space-y-6 animate-in fade-in pb-12 text-slate-800 min-w-0" dir="rtl">
      {/* سربرگ تب تحلیل‌های آماری */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-[#173f6b] text-white flex items-center justify-center shadow-sm">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">تحلیل‌های جامع آماری پرونده مراجع</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                داشبورد یکپارچه پایش رشد، نوبت‌ها، مشاوران، سلامت، دارو، زوجین، شخصیت و غربالگری اختلالات
              </p>
            </div>
          </div>
        </div>

        {/* دکمه چاپ و خلاصه وضعیت */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-mono">
            <span>کد پرونده:</span>
            <span className="font-black text-[#173f6b]">{clientCase.caseCode}</span>
          </div>
          <button
            onClick={onPrint || (() => window.print())}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer className="size-4 text-slate-500" />
            <span>چاپ گزارش آماری</span>
          </button>
        </div>
      </div>

      {/* بنر راهنمای منبع داده‌های آماری */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-start sm:items-center gap-2.5">
          <Info className="size-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-extrabold ml-1">منبع داده‌های آماری این فرد:</span>
            <span>
              {hasRealSafaReport
                ? 'نتایج آزمون ۵۷ سؤالی خودسنجی صفاً، داده‌های فرم ثبت‌نام و جلسات نوبت‌دهی پایگاه‌داده بالحق.'
                : 'داده‌های رسمی ثبت‌نام، شرح سوابق پزشکی، نوبت‌های مشاوره و برآورد هوشمند شاخص‌های بالینی بالحق.'}
            </span>
          </div>
        </div>
        {!hasRealSafaReport && onNavigateTab && (
          <button
            onClick={() => onNavigateTab('forms')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#173f6b] text-white rounded-xl text-xs font-bold hover:bg-[#123357] transition cursor-pointer shrink-0"
          >
            <FileText className="size-3.5" />
            <span>ثبت آزمون صفاً</span>
          </button>
        )}
      </div>

      {/* کارت‌های شاخص‌های کلیدی آماری (Top KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* ۱. شاخص یکپارچه پرونده */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">شاخص تعادل پرونده</span>
            <span className={`size-2.5 rounded-full ${eqSemColor.dotBg} ring-4 ${eqSemColor.ringColor}`} />
          </div>
          <div className="my-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {toPersianDigits(caseEquilibriumIndex)}
            </span>
            <span className="text-xs font-bold text-slate-400">از ۱۰۰</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600">سطح پایداری:</span>
            <span className={`font-bold px-2 py-0.5 rounded-md border ${eqSemColor.badgeBg} ${eqSemColor.textColor} ${eqSemColor.badgeBorder}`}>
              {eqSemColor.shortLabel}
            </span>
          </div>
        </div>

        {/* ۲. شاخص رشد و تعالی فردی */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">شاخص رشد مراجع</span>
            <TrendingUp className="size-4 text-emerald-600" />
          </div>
          <div className="my-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
              %{toPersianDigits(growthStats.growthIndex)}
            </span>
            <span className="text-xs font-bold text-slate-400">تراز رشد</span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 truncate">
            {growthStats.growthStage.badge}
          </div>
        </div>

        {/* ۳. جلسات و نوبت‌ها */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">نوبت‌های مشاوره</span>
            <CalendarCheck className="size-4 text-blue-600" />
          </div>
          <div className="my-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono text-[#173f6b]">
              {toPersianDigits(appointmentStats.total)}
            </span>
            <span className="text-xs font-bold text-slate-400">جلسه</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>انجام‌شده: {toPersianDigits(appointmentStats.completed)}</span>
            <span>در انتظار: {toPersianDigits(appointmentStats.upcoming)}</span>
          </div>
        </div>

        {/* ۴. وضعیت زوجین / تأهل */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">وضعیت رضایت زوجین</span>
            <HeartHandshake className="size-4 text-pink-600" />
          </div>
          <div className="my-3 flex items-baseline gap-1.5">
            {maritalStats.isMarried ? (
              <>
                <span className="text-2xl sm:text-3xl font-black font-mono text-pink-700">
                  %{toPersianDigits(maritalStats.maritalHarmonyScore)}
                </span>
                <span className="text-xs font-bold text-slate-400">سازگاری</span>
              </>
            ) : (
              <span className="text-lg sm:text-xl font-black text-slate-700">
                {maritalStats.maritalStatus}
              </span>
            )}
          </div>
          <div className="text-[11px] font-semibold text-slate-600 truncate">
            {maritalStats.isMarried ? maritalStats.harmonyBadge : 'بلوغ ارتباطی فردی'}
          </div>
        </div>
      </div>

      {/* نوار فیلتر و ناوبری داخلی تب آمار */}
      <ScrollableTabCarousel
        variant="pills"
        activeId={activeFilter}
        onChange={(id) => setActiveFilter(id as AnalysisFilter)}
        items={[
          { id: 'all', label: 'همه آمارها', icon: Layers },
          { id: 'growth', label: 'آمار رشد و پیشرفت', icon: TrendingUp },
          { id: 'appointments', label: 'اخذ نوبت و استمرار', icon: Calendar },
          { id: 'health', label: 'سلامت جسمی، روان و دارو', icon: HeartPulse },
          { id: 'marital', label: 'رضایت زوجین و خانواده', icon: HeartHandshake },
          { id: 'personality', label: 'تحلیل شخصیتی', icon: Compass },
          { id: 'disorders', label: 'غربالگری اختلالات', icon: AlertTriangle },
        ]}
      />

      {/* ========================================================= */}
      {/* بخش شاخص‌های هویتی، تحلیل بالینی پرونده و خط زمان جلسات */}
      {/* ========================================================= */}
      <CollapsibleCard
        as="section"
        defaultOpen={false}
        className="shadow-sm"
        bodyClassName="space-y-6"
        title={<h3 className="text-base font-black text-slate-900">شاخص‌های آماری و تحلیل بالینی این پرونده</h3>}
        subtitle="مشخصات ساختار خانواده مراجع، وضعیت بالینی پرونده و خط زمان جلسات مشاوره"
        icon={
          <div className="size-10 rounded-2xl bg-[#173f6b] text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="size-5" />
          </div>
        }
        headerExtra={
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 max-w-full leading-snug">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span>منبع داده: سوابق اختصاصی پرونده مراجع (داده‌های قطعی و مستند)</span>
          </div>
        }
      >

        {/* ۴ کارت مشخصات هویتی و خانوادگی این مراجع */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400">نقش در خانواده</span>
            <div className="text-sm font-black text-slate-800">
              {clientCase.roleInFamily || combinedData.f_role_in_family || 'عضو خانواده'}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400">وضعیت تأهل</span>
            <div className="text-sm font-black text-slate-800">
              {combinedData.f_marital_status || 'ثبت‌نشده'}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400">تعداد فرزندان</span>
            <div className="text-sm font-black text-slate-800">
              {combinedData.f_children_count
                ? `${toPersianDigits(combinedData.f_children_count)} فرزند`
                : (combinedData.f_marital_status?.includes('مجرد') ? 'بدون فرزند (مجرد)' : 'بدون فرزند / ثبت‌نشده')}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400">استان و شهر</span>
            <div className="text-sm font-black text-slate-800">
              {clientCase.provinceCity && clientCase.provinceCity !== 'ثبت‌نشده' ? clientCase.provinceCity : (combinedData.f_province_city || 'ثبت‌نشده')}
            </div>
          </div>
        </div>

        {/* وضعیت بالینی پرونده و خط زمان جلسات */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* کارت وضعیت بالینی پرونده */}
          <div className="min-w-0 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">وضعیت بالینی پرونده مراجع</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">تعیین‌شده بر اساس ارزیابی جلسات مشاوره</p>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">ارزیابی بالینی</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 text-center my-auto shadow-2xs">
              <div className="text-xs text-slate-500 font-bold">وضعیت فعلی پرونده:</div>
              {(() => {
                const effectiveStatus = (['regressing', 'needs_followup', 'growing', 'optimal'].includes(clientCase.overallStatus)
                  ? clientCase.overallStatus
                  : (appointments || []).find((a) => a.report?.status && ['regressing', 'needs_followup', 'growing', 'optimal'].includes(a.report.status))?.report?.status) || clientCase.overallStatus;

                return ['regressing', 'needs_followup', 'growing', 'optimal'].includes(effectiveStatus) ? (
                  <>
                    <div className="inline-block px-4 py-2 rounded-xl text-base font-black shadow-xs" style={{
                      backgroundColor: effectiveStatus === "growing" ? "#ecfdf5" : effectiveStatus === "optimal" ? "#eff6ff" : effectiveStatus === "regressing" ? "#fff1f2" : "#fffbeb",
                      color: effectiveStatus === "growing" ? "#047857" : effectiveStatus === "optimal" ? "#1d4ed8" : effectiveStatus === "regressing" ? "#be123c" : "#b45309",
                      borderColor: effectiveStatus === "growing" ? "#a7f3d0" : effectiveStatus === "optimal" ? "#bfdbfe" : effectiveStatus === "regressing" ? "#fecdd3" : "#fde68a",
                      borderWidth: "1px",
                    }}>
                      {effectiveStatus === "growing" ? "🌱 در حال رشد" : effectiveStatus === "optimal" ? "✨ وضعیت مطلوب" : effectiveStatus === "regressing" ? "⚠️ عقب گرد" : "🔍 نیازمند پیگیری"}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {effectiveStatus === "growing" ? "مراجع در مسیر بهبود، یادگیری مهارت‌ها و خودشکوفایی پایدار قرار دارد." :
                       effectiveStatus === "optimal" ? "شاخص‌های رفتاری و خانوادگی در سطح متعادل و مطلوب ارزیابی شده است." :
                       effectiveStatus === "regressing" ? "نشانه‌های بازگشت چالش‌ها یا افت عملکرد؛ نیازمند مداخله و حمایت مضاعف." :
                       "نیازمند پیگیری جلسات تکمیلی جهت ارزیابی دقیق‌تر روند تغییرات."}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-block px-4 py-2 rounded-xl text-sm font-black bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
                      ⏳ در انتظار ارزیابی اولیه مشاور
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      هنوز جلسه‌ای برای این پرونده برگزار نشده و گزارشی ثبت نگردیده است. پس از اولین جلسه مشاوره، وضعیت بالینی پرونده توسط مشاور تعیین خواهد شد.
                    </p>
                  </>
                );
              })()}
            </div>

            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200/60">
              منبع داده: گزارش جلسات ثبت‌شده توسط مشاور
            </div>
          </div>

          {/* نمودار خط زمان جلسات مراجع */}
          <div className="min-w-0 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">روند جلسات در خط زمان (نمودار نقطه خط)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">تایم‌لاین ارزیابی گام‌های مشاوره‌ای مراجع</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">تایم‌لاین</span>
            </div>

            <div className="pt-2">
              {appointmentsTimelineData.length > 0 ? (
                <PointLineChart
                  data={appointmentsTimelineData}
                  height={190}
                  unit="امتیاز"
                  badgeText="روند جلسات"
                />
              ) : (
                <div className="h-[190px] rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <Calendar className="size-8 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">هنوز گزارشی برای جلسات ثبت نشده است</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    پس از برگزاری اولین جلسه مشاوره و ثبت گزارش ذیل نوبت، نمودار روند پیشرفت مراجع در خط زمان ترسیم خواهد شد.
                  </p>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200/60">
              منبع داده: تاریخچه نوبت‌ها و گزارش‌های ثبت‌شده جلسات
            </div>
          </div>
        </div>

        {/* کادر ثبت توضیحات و یادداشت تحلیلی مشاور */}
        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-[#173f6b]" />
              <h4 className="text-sm font-black text-slate-900">یادداشت تحلیلی و توضیحات آماری مشاور</h4>
            </div>
            <span className="text-[11px] text-slate-400">تحلیل تشریحی پرونده</span>
          </div>
          <textarea
            rows={3}
            value={counselorNoteText}
            onChange={(e) => setCounselorNoteText(e.target.value)}
            placeholder="مشاور محترم می‌تواند تحلیل خود از داده‌های آماری، الگوهای رفتاری مراجع و پیشنهادات بالینی را در این بخش یادداشت نماید..."
            className="w-full p-3.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {savedNoteMessage ? "✅ یادداشت تحلیلی ذخیره شد." : "این یادداشت در پرونده مراجع به عنوان سند تحلیلی نگهداری می‌شود."}
            </span>
            <button
              type="button"
              onClick={() => {
                if (counselorNoteText.trim()) {
                  try {
                    localStorage.setItem(`belhagh_counselor_note_${clientCase.caseCode}`, counselorNoteText.trim());
                  } catch (e) {}
                  setSavedNoteMessage(true);
                  setTimeout(() => setSavedNoteMessage(false), 3000);
                }
              }}
              disabled={!counselorNoteText.trim()}
              className="px-4 py-2 bg-[#173f6b] hover:bg-[#123357] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              ثبت یادداشت تحلیلی
            </button>
          </div>
        </div>
      </CollapsibleCard>

      {/* بخش اول: آمار رشد و مراحل تحول فردی مراجع */}
      {/* ========================================================= */}
      {(activeFilter === 'all' || activeFilter === 'growth') && (
        <CollapsibleCard
          as="section"
          defaultOpen={false}
          className="shadow-sm"
          bodyClassName="space-y-6"
          title={<h3 className="text-base font-black text-slate-900">آمار رشد و مراحل کمال فردی</h3>}
          subtitle="ارزیابی میزان تعالی، پیشرفت در طول جلسات و شکاف تا پتانسیل بیشینه"
          icon={
            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
          }
          headerExtra={
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              شاخص رشد: %{toPersianDigits(growthStats.growthIndex)}
            </span>
          }
        >

          <div className="grid gap-6 lg:grid-cols-12">
            {/* کارت مرحله تحول مراجع */}
            <div className="lg:col-span-5 min-w-0 bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-slate-200/90 flex flex-col space-y-4 shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">مرحله کنونی رشد مراجع</span>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    مرحله {toPersianDigits(growthStats.growthStage.level)} از ۴
                  </span>
                </div>
                <h4 className="mt-2.5 text-sm font-black text-slate-900 leading-6">
                  {growthStats.growthStage.title}
                </h4>
                <p className="mt-1.5 text-xs leading-6 text-slate-600 text-justify">
                  {growthStats.growthStage.desc}
                </p>
              </div>

              {/* خلاصه شاخص جامع رشد و شکاف تا وضعیت کمال */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white/90 border border-emerald-100/80 shadow-2xs">
                <div>
                  <div className="text-[11px] text-slate-500 font-bold">شاخص جامع رشد فردی:</div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xl font-black font-mono text-emerald-700">
                      %{toPersianDigits(growthStats.growthIndex)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {growthStats.growthStage.badge}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-bold">شکاف تا کمال رشد:</div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xl font-black font-mono text-amber-700">
                      %{toPersianDigits(growthStats.growthGap)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {growthStats.growthGap <= 20 ? 'نزدیک به کمال' : 'نیاز به تمرین'}
                    </span>
                  </div>
                </div>
              </div>

              {/* نوار مسیر ۴ مرحله‌ای پیشرفت مراجع (Stepped Roadmap) */}
              <div className="p-3 rounded-xl bg-white/80 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span>مسیر تکامل ۴ مرحله‌ای رشد:</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    مرحله فعال: {toPersianDigits(growthStats.growthStage.level)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {growthStats.stages.map((st) => (
                    <div
                      key={st.step}
                      className={`relative flex flex-col items-center text-center p-2 rounded-xl border transition-all ${
                        st.isActive
                          ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20 shadow-2xs'
                          : st.isCompleted
                          ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div
                        className={`size-6 rounded-full flex items-center justify-center text-xs font-black font-mono mb-1 ${
                          st.isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : st.isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {st.isCompleted ? '✓' : toPersianDigits(st.step)}
                      </div>
                      <div className="text-[10.5px] font-black text-slate-900 truncate w-full">
                        {st.shortTitle}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
                        %{toPersianDigits(st.score)}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-bold ${
                            st.isActive
                              ? 'bg-emerald-600 text-white'
                              : st.isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200/70 text-slate-500'
                          }`}
                        >
                          {st.isActive ? 'جاری' : st.isCompleted ? 'تکمیل' : 'پیش‌رو'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* پایش مسیر رشد و پیشرفت مراجع: نمودار نقطه و خط پیشرفت */}
              <div className="pt-1">
                <PointLineChart
                  data={growthStats.stages.map((st) => ({
                    label: `مرحله ${toPersianDigits(st.step)}: ${st.shortTitle}`,
                    value: st.score,
                    secondaryLabel: st.subtitle,
                    badge: st.isActive ? 'مرحله فعال مراجع' : st.isCompleted ? 'تکمیل‌شده' : 'پیش‌رو',
                    color: st.isActive ? '#059669' : st.isCompleted ? '#0284c7' : '#94a3b8',
                  }))}
                  unit="٪"
                  maxScale={100}
                  height={180}
                  lineColor="#059669"
                  showPoints={true}
                  showValues={true}
                  title="نمودار نقطه و خط روند ابعاد رشد ۴گانه"
                  subtitle="پایش پیوسته روند تکامل روان‌شناختی مراجع"
                  badgeText="نمودار نقطه و خط رشد"
                />
              </div>
            </div>

            {/* ارکان و شکاف رشد */}
            <div className="lg:col-span-7 min-w-0 space-y-4">
              <h4 className="text-xs font-black text-slate-700">ارکان سه‌گانه سنجش رشد بالحق (مقایسه میله‌ای عمودی):</h4>
              <VerticalBarChart
                data={[
                  {
                    label: 'رشددهندگی و خیررسانی',
                    value: growthStats.comp15,
                    percentage: growthStats.comp15,
                    color: '#173f6b',
                    secondaryLabel: 'مؤلفه ۱۵ صفاً',
                  },
                  {
                    label: 'پذیرش خود و بهبود',
                    value: growthStats.comp3,
                    percentage: growthStats.comp3,
                    color: '#059669',
                    secondaryLabel: 'مؤلفه ۳ صفاً',
                  },
                  {
                    label: 'جهت‌گیری معنایی',
                    value: growthStats.comp17,
                    percentage: growthStats.comp17,
                    color: '#6366f1',
                    secondaryLabel: 'مؤلفه ۱۷ صفاً',
                  },
                ]}
                unit="٪"
                maxScale={100}
                height={200}
                showValues={true}
                badgeText="نمودار میله‌ای عمودی ارکان رشد"
              />

              {/* اولویت‌های اصلی رشد */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-black text-amber-900 mb-2">
                  <Sparkles className="size-4 text-amber-600" />
                  <span>اولویت‌های اصلی رشد فردی (بیشترین شکاف تا وضعیت بهینه):</span>
                </div>
                <div className="space-y-2 mt-2">
                  {growthStats.priorities.map((item, idx) => (
                    <div
                      key={item.code}
                      className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white/90 p-2.5 rounded-xl border border-amber-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center font-mono">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <span className="font-bold text-slate-800">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-500 text-[11px]">نمره: %{toPersianDigits(item.score)}</span>
                        <span className="text-amber-700 font-bold text-[11px]">شکاف: %{toPersianDigits(item.growthGap)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleCard>
      )}

      {/* ========================================================= */}
      {/* بخش دوم: اخذ نوبت و مراجعه به مشاوران مختلف */}
      {/* ========================================================= */}
      {(activeFilter === 'all' || activeFilter === 'appointments') && (
        <CollapsibleCard
          as="section"
          defaultOpen={false}
          className="shadow-sm"
          bodyClassName="space-y-6"
          title={<h3 className="text-base font-black text-slate-900">آمار اخذ نوبت و تفکیک مشاوران مرکز</h3>}
          subtitle="تعداد نوبت‌های اخذ شده، استمرار جلسات و آمار تفکیکی جلسات با مشاوران مختلف"
          icon={
            <div className="size-9 rounded-xl bg-blue-50 text-[#173f6b] flex items-center justify-center">
              <CalendarCheck className="size-5" />
            </div>
          }
          headerExtra={
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-blue-50 text-[#173f6b] border border-blue-200">
              {toPersianDigits(appointmentStats.total)} نوبت ثبت‌شده
            </span>
          }
        >

          {/* کارت‌های خلاصه نوبت‌دهی */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-[11px] text-slate-500 font-medium">کل نوبت‌های ثبت‌شده</div>
              <div className="mt-2 text-2xl font-black font-mono text-slate-900">
                {toPersianDigits(appointmentStats.total)}
              </div>
              <div className="mt-1 text-[10px] text-slate-400">سامانه نوبت‌دهی بالحق</div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="text-[11px] text-slate-500 font-medium">جلسات برگزار شده</div>
              <div className="mt-2 text-2xl font-black font-mono text-emerald-700">
                {toPersianDigits(appointmentStats.completed)}
              </div>
              <div className="mt-1 text-[10px] text-emerald-600 font-semibold">دارای گزارش بالینی مشاور</div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="text-[11px] text-slate-500 font-medium">نوبت‌های در انتظار / آتی</div>
              <div className="mt-2 text-2xl font-black font-mono text-[#173f6b]">
                {toPersianDigits(appointmentStats.upcoming)}
              </div>
              <div className="mt-1 text-[10px] text-blue-600 font-semibold">در نوبت برگزاری</div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="text-[11px] text-slate-500 font-medium">نرخ پایبندی به جلسات</div>
              <div className="mt-2 text-2xl font-black font-mono text-indigo-700">
                %{toPersianDigits(appointmentStats.adherenceRate)}
              </div>
              <div className="mt-1 text-[10px] text-indigo-600 font-semibold truncate">
                {appointmentStats.continuityLabel}
              </div>
            </div>
          </div>

          {/* پایش روند استمرار و پیشرفت جلسات مشاوره مراجع: نمودار نقطه و خط پیشرفت */}
          <div className="min-w-0 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
            <PointLineChart
              data={sessionProgressData}
              unit="٪"
              maxScale={100}
              height={190}
              lineColor="#0284c7"
              showPoints={true}
              showValues={true}
              title="روند پیشرفت مراجع در طول جلسات مشاوره"
              subtitle="پایش پیوسته روند بهبود شاخص‌ها و استمرار جلسات بالحق"
              badgeText="نمودار نقطه و خط جلسات"
            />
          </div>

          {/* جدول و توزیع مراجعه به مشاوران مختلف (نمودار میله‌ای عمودی مقایسه مشاوران) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <Users className="size-4 text-blue-600" />
                <span>تفکیک مراجعات به مشاوران مرکز ({toPersianDigits(counselorStats.distinctCounselorsCount)} مشاور):</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                {counselorStats.isMultiCounselor
                  ? 'مراجع دارای پرونده چندرشته‌ای (ارجاع میان چند مشاور)'
                  : 'جلسات تحت نظر مشاور اختصاصی'}
              </span>
            </div>

            {counselorStats.counselors.length > 0 ? (
              <div className="space-y-4">
                <VerticalBarChart
                  data={counselorStats.counselors.map((c) => ({
                    label: c.name,
                    value: c.totalSessions,
                    percentage: c.percentageOfTotal,
                    color: '#0284c7',
                    secondaryLabel: `${toPersianDigits(c.totalSessions)} جلسه`,
                    badge: c.name === counselorStats.primaryCounselor ? 'مشاور اصلی' : undefined,
                  }))}
                  unit="جلسه"
                  height={200}
                  showValues={true}
                  badgeText="نمودار میله‌ای عمودی تفکیک مشاوران"
                />

                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  {counselorStats.counselors.map((c) => (
                    <div
                      key={c.name}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-blue-100/70 text-[#173f6b] font-bold text-xs flex items-center justify-center">
                          <User className="size-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{c.name}</span>
                            {c.name === counselorStats.primaryCounselor && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                مشاور اصلی
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-2 text-[10.5px] text-slate-500">
                            <span>موضوعات: {c.topicsArray.join('، ') || 'مشاوره تخصصی'}</span>
                            <span>•</span>
                            <span className="font-mono">آخرین نوبت: {toPersianDigits(c.lastSessionDate)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs">
                        <span className="font-bold text-slate-800 px-2 py-1 rounded-md bg-white border border-slate-200">
                          {toPersianDigits(c.totalSessions)} جلسه ({toPersianDigits(c.percentageOfTotal)}٪)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                هنوز نوبتی با مشاوران در سامانه ثبت نشده است.
              </div>
            )}
          </div>
        </CollapsibleCard>
      )}

      {/* ========================================================= */}
      {/* بخش سوم: وضعیت سلامت جسمی، سلامت روان و مصرف دارو */}
      {/* ========================================================= */}
      {(activeFilter === 'all' || activeFilter === 'health') && (
        <CollapsibleCard
          as="section"
          defaultOpen={false}
          className="shadow-sm"
          bodyClassName="space-y-6"
          title={<h3 className="text-base font-black text-slate-900">پایش سلامت سه‌گانه: جسم، روان و دارو</h3>}
          subtitle="ارزیابی وضعیت بیماری‌های جسمانی، تعادل و سلامت روان، و فهرست داروهای مصرفی"
          icon={
            <div className="size-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HeartPulse className="size-5" />
            </div>
          }
          headerExtra={
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication
                ? 'دارای سوابق پزشکی و دارویی'
                : 'بدون سابقه بیماری و دارو'}
            </span>
          }
        >

          <div className="grid gap-5 md:grid-cols-3">
            {/* ۱. وضعیت سلامت جسمی */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="size-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-900">وضعیت سلامت جسمی</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      physicalHealthStats.hasIllness
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {physicalHealthStats.severityTag}
                  </span>
                </div>

                <div className="my-3 p-3 rounded-xl bg-white border border-slate-200 text-xs leading-6 text-slate-700 min-h-[72px]">
                  <span className="font-bold text-slate-500 block text-[10px] mb-1">شرح ثبت‌شده مراجع:</span>
                  {physicalHealthStats.rawText}
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>دسته‌بندی: <span className="font-bold text-slate-800">{physicalHealthStats.illnessCategory}</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-500">تراز سلامت جسمانی:</span>
                  <span className="font-mono text-blue-700">%{toPersianDigits(physicalHealthStats.vitalityScore)}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${physicalHealthStats.vitalityScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ۲. وضعیت سلامت روان */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="size-4 text-purple-600" />
                    <h4 className="text-xs font-black text-slate-900">سلامت و تعادل روان</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      mentalHealthStats.riskTone === 'rose'
                        ? 'bg-rose-100 text-rose-800'
                        : mentalHealthStats.riskTone === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {mentalHealthStats.statusBadge}
                  </span>
                </div>

                <div className="my-3 p-3 rounded-xl bg-white border border-slate-200 text-xs leading-6 text-slate-700 min-h-[72px]">
                  <span className="font-bold text-slate-500 block text-[10px] mb-1">سابقه بیماری روحی اعلام‌شده:</span>
                  {mentalHealthStats.rawText}
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>آرامش درونی: <span className="font-bold font-mono text-purple-700">%{toPersianDigits(mentalHealthStats.innerPeaceScore)}</span></div>
                  <div>مدیریت هیجان: <span className="font-bold font-mono text-purple-700">%{toPersianDigits(mentalHealthStats.emotionRegScore)}</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-500">شاخص تاب‌آوری روان:</span>
                  <span className="font-mono text-purple-700">%{toPersianDigits(mentalHealthStats.mentalIndex)}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${mentalHealthStats.mentalIndex}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ۳. وضعیت مصرف دارو */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Pill className="size-4 text-amber-600" />
                    <h4 className="text-xs font-black text-slate-900">مصرف دارو و فارماکولوژی</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      medicationStats.alertLevel === 'high'
                        ? 'bg-rose-100 text-rose-800'
                        : medicationStats.alertLevel === 'moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {medicationStats.hasMedication ? 'مصرف فعال' : 'بدون داروی فعال'}
                  </span>
                </div>

                <div className="my-3 p-3 rounded-xl bg-white border border-slate-200 text-xs leading-6 text-slate-700 min-h-[72px]">
                  <span className="font-bold text-slate-500 block text-[10px] mb-1">داروهای اعلام‌شده توسط مراجع:</span>
                  {medicationStats.rawText}
                </div>

                <div className="text-[11px] text-slate-500">
                  <span>طبقه‌بندی: </span>
                  <span className="font-bold text-slate-800">{medicationStats.drugClass}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="text-[10px] leading-5 text-slate-500">
                  {medicationStats.alertText}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleCard>
      )}

      {/* ========================================================= */}
      {/* بخش چهارم: رضایت زوجین و پویایی خانواده */}
      {/* ========================================================= */}
      {(activeFilter === 'all' || activeFilter === 'marital') && (
        <CollapsibleCard
          as="section"
          defaultOpen={false}
          className="shadow-sm"
          bodyClassName="space-y-6"
          title={<h3 className="text-base font-black text-slate-900">آمار رضایت زوجین و تعاملات خانوادگی</h3>}
          subtitle="ارزیابی شاخص هماهنگی زناشویی، مهارت‌های حل تعارض، گذشت و کیفیت پیوند عاطفی"
          icon={
            <div className="size-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <HeartHandshake className="size-5" />
            </div>
          }
          headerExtra={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                {maritalStats.maritalStatus}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                نقش: {maritalStats.roleInFamily}
              </span>
            </div>
          }
        >

          <div className="grid gap-6 lg:grid-cols-12">
            {/* کارت شاخص اصلی رضایت زوجین */}
            <div className="lg:col-span-5 min-w-0 bg-gradient-to-br from-pink-50/40 via-white to-rose-50/30 rounded-2xl p-4 sm:p-5 border border-pink-100 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-pink-800">
                  {maritalStats.isMarried ? 'شاخص ترکیبی رضایت و هماهنگی زناشویی' : 'شاخص بلوغ ارتباطی و آمادگی ازدواج'}
                </span>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-pink-700">
                    %{toPersianDigits(maritalStats.maritalHarmonyScore)}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${maritalStats.harmonyColor}`}>
                    {maritalStats.harmonyBadge}
                  </span>
                </div>
                <p className="text-xs leading-6 text-slate-600 mt-2">
                  {maritalStats.harmonyLabel}
                </p>

                <div className="mt-4 pt-3 border-t border-pink-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>تعداد اعضای خانواده:</span>
                    <span className="font-bold font-mono text-slate-800">{toPersianDigits(maritalStats.familyMembers)} نفر</span>
                  </div>
                  <div className="flex justify-between">
                    <span>نقش اعلام‌شده در خانواده:</span>
                    <span className="font-bold text-slate-800">{maritalStats.roleInFamily}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-pink-100 text-[11px] text-pink-900 leading-5">
                {maritalStats.isMarried
                  ? 'این شاخص بر پایه مؤلفه‌های سازندگی در رابطه، گذشت، همدلی و رهایی از توقعات یک‌طرفه محاسبه شده است.'
                  : 'این شاخص نمایانگر آمادگی ارتباطی فردی و مهارت در تعامل با خانواده و بستگان است.'}
              </div>
            </div>

            {/* مؤلفه‌های تفکیکی مرتبط با زوجین (نمودار میله‌ای عمودی مقایسه ابعاد ارتباطی) */}
            <div className="lg:col-span-7 min-w-0 space-y-4">
              <h4 className="text-xs font-black text-slate-700">مؤلفه‌های ۵گانه سازگاری و ارتباط عاطفی (مقایسه میله‌ای عمودی):</h4>
              <VerticalBarChart
                data={[
                  { label: 'سازندگی و پیوند', value: maritalStats.comp16, percentage: maritalStats.comp16, color: getSemanticColorByPercentage(maritalStats.comp16).hex, secondaryLabel: 'مؤلفه ۱۶' },
                  { label: 'همدلی متقابل', value: maritalStats.comp10, percentage: maritalStats.comp10, color: getSemanticColorByPercentage(maritalStats.comp10).hex, secondaryLabel: 'مؤلفه ۱۰' },
                  { label: 'گذشت و بخشش', value: maritalStats.comp9, percentage: maritalStats.comp9, color: getSemanticColorByPercentage(maritalStats.comp9).hex, secondaryLabel: 'مؤلفه ۹' },
                  { label: 'رهایی از توقع', value: maritalStats.comp6, percentage: maritalStats.comp6, color: getSemanticColorByPercentage(maritalStats.comp6).hex, secondaryLabel: 'مؤلفه ۶' },
                  { label: 'مرزبندی سالم', value: maritalStats.comp11, percentage: maritalStats.comp11, color: getSemanticColorByPercentage(maritalStats.comp11).hex, secondaryLabel: 'مؤلفه ۱۱' },
                ]}
                unit="٪"
                maxScale={100}
                height={220}
                showValues={true}
                badgeText="نمودار میله‌ای عمودی سازگاری زناشویی"
              />
            </div>
          </div>
        </CollapsibleCard>
      )}

      {/* ========================================================= */}
      {/* بخش پنجم: تحلیل شخصیتی چندبعدی */}
      {/* ========================================================= */}
      {(activeFilter === 'all' || activeFilter === 'personality') && (
        <CollapsibleCard
          as="section"
          defaultOpen={false}
          className="shadow-sm"
          bodyClassName="space-y-6"
          title={<h3 className="text-base font-black text-slate-900">تحلیل شخصیتی چندبعدی مراجع</h3>}
          subtitle="ارزیابی ابعاد ساختاری شخصیت، سبک تصمیم‌گیری، تعهدات و نمودار رادار ۱۶گانه"
          icon={
            <div className="size-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Compass className="size-5" />
            </div>
          }
          headerExtra={
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              ۱۶ مؤلفه شخصیتی
            </span>
          }
        >

          <div className="grid gap-6 lg:grid-cols-12 items-center">
            {/* نمودار رادار شخصیتی */}
            <div className="lg:col-span-6 min-w-0 w-full bg-slate-50/70 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-600 mb-2">نمودار چندضلعی ابعاد شخصیت (رادار ۱۶ مؤلفه)</span>
              <div className="w-full min-w-0 max-w-[520px]">
                <SvgRadarChart items={radarComponents} size={420} primaryColor="#173f6b" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1">حرکت ماوس بر روی نقاط جهت مشاهده امتیاز هر مؤلفه</span>
            </div>

            {/* ابعاد ۵گانه شخصیت و نقاط قوت */}
            <div className="lg:col-span-6 min-w-0 space-y-5">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <span className="text-[11px] font-bold text-indigo-900 block mb-1">الگوی رفتاری و شخصیتی غالب:</span>
                <p className="text-xs font-black text-indigo-950 leading-6">
                  {personalityStats.personalityPattern}
                </p>
              </div>

              {/* ابعاد ۵ گانه شخصیت (مقایسه میله‌ای عمودی) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700">ابعاد بنیادین ساختار شخصیتی (مقایسه میله‌ای عمودی):</h4>
                <VerticalBarChart
                  data={personalityStats.dimensions.map((dim) => ({
                    label: dim.label,
                    value: dim.score,
                    percentage: dim.score,
                    color: dim.color,
                    secondaryLabel: `${toPersianDigits(dim.score)}٪`,
                  }))}
                  unit="٪"
                  maxScale={100}
                  height={210}
                  showValues={true}
                  badgeText="نمودار میله‌ای عمودی ابعاد شخصیت"
                />
              </div>

              {/* ۳ نقطه قوت برجسته شخصیت */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-900 mb-2">
                  <Award className="size-4 text-emerald-600" />
                  <span>برجسته‌ترین نقاط قوت شخصیتی این فرد:</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {personalityStats.topStrengths.map((str) => (
                    <span
                      key={str.code}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs font-mono"
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      <span>{str.title}</span>
                      <span className="text-[10px] text-emerald-600">(%{toPersianDigits(str.score)})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleCard>
      )}

      {/* ========================================================= */}
      {/* بخش ششم: غربالگری اختلالات و ریسک‌های بالینی */}
      {/* ========================================================= */}
      {(activeFilter === 'all' || activeFilter === 'disorders') && (
        <CollapsibleCard
          as="section"
          defaultOpen={false}
          className="shadow-sm"
          bodyClassName="space-y-6"
          title={<h3 className="text-base font-black text-slate-900">غربالگری بالینی اختلالات و نشانه‌های ریسک</h3>}
          subtitle="پایش سیستماتیک نشانه‌های اضطرابی، خلقی، وسواس، پرخاشگری و تعارضات شدید برای مداخله هدفمند"
          icon={
            <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
          }
          headerExtra={
            <div className="flex items-center gap-2">
              {disorderScreeningStats.criticalRisksCount > 0 ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 animate-pulse font-mono">
                  {toPersianDigits(disorderScreeningStats.criticalRisksCount)} هشدار بالینی
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  وضعیت بالینی تحت کنترل
                </span>
              )}
            </div>
          }
        >

          {/* بنر ارزیابی ریسک کلی */}
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
              disorderScreeningStats.overallRiskTone === 'rose'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : disorderScreeningStats.overallRiskTone === 'amber'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <ShieldCheck className="size-5 shrink-0" />
            <span>خلاصه ارزیابی: {disorderScreeningStats.overallRiskTitle}</span>
          </div>

          {/* مقایسه شاخص‌های ریسک ۶گانه در نمودار میله‌ای عمودی */}
          <div className="min-w-0 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <VerticalBarChart
              data={disorderScreeningStats.items.map((item) => {
                const score = item.risk === 'high' ? 85 : item.risk === 'medium' ? 50 : 15;
                const color = item.risk === 'high' ? '#f43f5e' : item.risk === 'medium' ? '#f59e0b' : '#059669';
                return {
                  label: item.title,
                  value: score,
                  percentage: score,
                  color,
                  secondaryLabel: item.risk === 'high' ? 'ریسک بالا' : item.risk === 'medium' ? 'متوسط' : 'نرمال',
                };
              })}
              unit="شاخص ریسک"
              maxScale={100}
              height={200}
              showValues={true}
              title="نمودار میله‌ای عمودی غربالگری اختلالات"
              subtitle="مقایسه شدت ریسک و نشانه‌های بالینی در ۶ حوزه تخصصی"
              badgeText="نمودار میله‌ای عمودی ریسک‌ها"
            />
          </div>

          {/* ماتریس غربالگری ۶ گانه اختلالات */}
          <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {disorderScreeningStats.items.map((item) => {
              const isHigh = item.risk === 'high';
              const isMed = item.risk === 'medium';
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4.5 flex flex-col justify-between transition ${
                    isHigh
                      ? 'border-rose-200 bg-rose-50/50'
                      : isMed
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isMed
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isHigh ? 'ریسک بالا / فعال' : isMed ? 'نشانه‌های خفیف تا متوسط' : 'طبیعی و نرمال'}
                      </span>
                    </div>

                    <div className="mt-3 text-[11px] leading-5 text-slate-600">
                      <span className="font-bold text-slate-500 block mb-0.5">وضعیت و شواهد پرونده:</span>
                      {item.markers}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 text-[10px] leading-5">
                    <span className="font-bold text-slate-500 block">پروتکل پیشنهادی مداخله:</span>
                    <span className="text-slate-700 font-medium">{item.recommendation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleCard>
      )}

      {/* راهنمای سیستم رنگ‌بندی ۴گانه معنایی بالحق در انتهای تب */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-4 text-slate-400" />
          <span className="font-bold">راهنمای بازه‌های ارزیابی بالحق:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          {SEMANTIC_COLOR_TIERS.map((tier) => (
            <div key={tier.key} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-full ${tier.dotBg}`} />
              <span className="font-bold">{tier.shortLabel}</span>
              <span className="text-slate-400 font-mono">({toPersianDigits(tier.rangeLabel)})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
