'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Form, FormSubmission, SubmissionStatus } from '@/types/form';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import {
  X,
  Printer,
  ChevronRight,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  BadgeCheck,
  Sparkles,
  TrendingUp,
  BarChart3,
  Clock,
  HeartPulse,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  ArrowUpRight,
  Hash,
  Download,
  FileSpreadsheet,
  Eye,
  Info,
  CalendarCheck,
  FileCheck2,
  HelpCircle,
  Stethoscope,
  Pill,
  BookOpen,
  Maximize2,
  Columns,
  Compass,
  UserCheck,
  Heart,
  Share2,
  AlertTriangle
} from 'lucide-react';
import { exportSingleClientDossierToXLSX } from '@/lib/excel-export';
import { EvaluationReportView } from '../analytics/evaluation-report-view';
import { VerticalBarChart, BarChartItem } from '../analytics/vertical-bar-chart';
import {
  formatPersianDateTime,
  formatPersianDateOnly,
  formatCurrency,
  toPersianDigits,
  getFieldDisplayValue,
} from '@/lib/persian';

export interface ClientCaseGroup {
  caseCode: string;
  fullName: string;
  mobile: string;
  provinceCity: string;
  submissions: FormSubmission[];
  formTitles: string[];
  totalFormsCount: number;
  latestDate: string;
  overallStatus: SubmissionStatus;
  totalPaidAmount: number;
  roleInFamily?: string;
}

interface ClientDossierFullviewProps {
  clientCase: ClientCaseGroup;
  onClose: () => void;
  onStatusChange?: (newStatus: SubmissionStatus) => void;
}

export const ClientDossierFullview: React.FC<ClientDossierFullviewProps> = ({
  clientCase,
  onClose,
  onStatusChange,
}) => {
  const { forms, submissions, updateSubmissionStatus, addSubmissionComment } = useForm();
  const { currentUser } = useAdminAuth();
  const adminName = currentUser?.name || 'مدیر مرکز بالحق';
  const adminRole = currentUser?.role || 'سرپرست پذیرش و پرونده';

  // ناوبری اصلی پرونده: نمای پرونده کلی مراجع یا نمای گزارش تحلیلی یک فرم خاص
  const [currentView, setCurrentView] = useState<'dossier' | 'formReport'>('dossier');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // تب‌های داخل پرونده مراجع (پیش‌فرض: خلاصه پرونده و تحلیل جامع)
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'bookings' | 'referrals' | 'forms' | 'followups' | 'stats'>('overview');

  // استیت فرم ثبت پیگیری و یادداشت جدید
  const [newFollowupType, setNewFollowupType] = useState<'call' | 'meeting' | 'sms' | 'note' | 'referral'>('note');
  const [newFollowupText, setNewFollowupText] = useState('');
  const [referralTarget, setReferralTarget] = useState('');
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);

  // استیت وضعیت فعلی پرونده
  const [currentStatus, setCurrentStatus] = useState<SubmissionStatus>(clientCase.overallStatus);

  // حالت نمایش: تمام‌عرض کارتابل یا کشویی
  const [panelMode, setPanelMode] = useState<'full' | 'drawer'>('full');
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // بستن خودکار با Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // ۱. اتصال کاملاً زنده به سابمیشن‌های مرتبط از Context
  const currentCaseSubmissions = useMemo(() => {
    const initSubIds = new Set(clientCase.submissions.map((s) => s.id));
    const matched = submissions.filter(
      (s) =>
        initSubIds.has(s.id) ||
        (clientCase.caseCode && (s.trackingCode === clientCase.caseCode || s.data?.caseCode === clientCase.caseCode)) ||
        (clientCase.mobile && (s.mobile === clientCase.mobile || s.data?.f_mobile === clientCase.mobile))
    );
    return matched.length > 0 ? matched : clientCase.submissions;
  }, [submissions, clientCase]);

  // تجمیع کلیه داده‌های ثبت‌شده برای مراجع
  const combinedData = useMemo(() => {
    const data: Record<string, any> = {};
    currentCaseSubmissions.forEach((sub) => {
      if (sub.data && typeof sub.data === 'object') {
        Object.assign(data, sub.data);
      }
    });
    return data;
  }, [currentCaseSubmissions]);

  // نام کامل مراجع
  const displayFullName = useMemo(() => {
    if (clientCase.fullName && clientCase.fullName !== 'مراجع مرکز بالحق') {
      return clientCase.fullName;
    }
    if (combinedData.f_name || combinedData.f_family) {
      return `${combinedData.f_name || ''} ${combinedData.f_family || ''}`.trim();
    }
    if (combinedData.fullName || combinedData.f_fullname) {
      return combinedData.fullName || combinedData.f_fullname;
    }
    return 'مراجع مرکز بالحق';
  }, [clientCase.fullName, combinedData]);

  // استخراج جنسیت
  const clientGender = useMemo(() => {
    if (combinedData.f_gender) return combinedData.f_gender;
    const role = combinedData.f_role_in_family || '';
    if (['پدر', 'پدر خانواده', 'پسر', 'پسر خانواده', 'father', 'son'].includes(role)) return 'مذکر (آقا)';
    if (['مادر', 'مادر خانواده', 'دختر', 'دختر خانواده', 'mother', 'daughter'].includes(role)) return 'مؤنث (خانم)';
    return 'نامشخص';
  }, [combinedData]);

  // استخراج سن
  const clientAge = useMemo(() => {
    if (combinedData.f_birth_date) {
      const parts = String(combinedData.f_birth_date).split('/');
      if (parts.length === 3) {
        const birthYear = parseInt(parts[0], 10);
        if (birthYear > 1300 && birthYear < 1420) {
          return `${toPersianDigits(1403 - birthYear)} سال`;
        }
      }
    }
    return 'نامشخص';
  }, [combinedData]);

  // تعداد فرزندان
  const clientChildrenCount = useMemo(() => {
    if (combinedData.f_children_count) return combinedData.f_children_count;
    if (combinedData.f_family_members) {
      return `از مجموع ${combinedData.f_family_members}`;
    }
    return 'ثبت‌نشده';
  }, [combinedData]);

  // وضعیت تاهل
  const clientMaritalStatus = useMemo(() => {
    return combinedData.f_marital_status || 'ثبت‌نشده';
  }, [combinedData]);

  // لیست سابمیشن‌های نوبت‌دهی مراجع
  const bookingSubmissions = useMemo(() => {
    return currentCaseSubmissions.filter(
      (s) =>
        s.formId === 'form-belhagh-booking' ||
        Object.keys(s.data || {}).some((k) => k.startsWith('f_booking_') && s.data[k])
    );
  }, [currentCaseSubmissions]);

  // تاریخ اولین و آخرین نوبت
  const firstBookingDate = useMemo(() => {
    if (bookingSubmissions.length > 0) {
      const sorted = [...bookingSubmissions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return formatPersianDateOnly(sorted[0].createdAt);
    }
    return formatPersianDateOnly(clientCase.submissions[0]?.createdAt || clientCase.latestDate);
  }, [bookingSubmissions, clientCase]);

  const latestBookingDate = useMemo(() => {
    if (bookingSubmissions.length > 0) {
      const sorted = [...bookingSubmissions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return formatPersianDateOnly(sorted[sorted.length - 1].createdAt);
    }
    return formatPersianDateOnly(clientCase.latestDate);
  }, [bookingSubmissions, clientCase]);

  // موضوعات اصلی مراجعه
  const mainTopicsList = useMemo(() => {
    const set = new Set<string>();
    currentCaseSubmissions.forEach((s) => {
      const t = s.data?.f_topic || s.data?.f_counseling_subject;
      if (t) set.add(t);
    });
    return Array.from(set);
  }, [currentCaseSubmissions]);

  // اساتید مشاور طرف مراجعه
  const counselorsList = useMemo(() => {
    const set = new Set<string>();
    currentCaseSubmissions.forEach((s) => {
      if (s.data?.f_counselor) set.add(s.data.f_counselor);
      for (const k of Object.keys(s.data || {})) {
        if (k.startsWith('f_counselor_') && s.data[k]) {
          set.add(s.data[k]);
        }
      }
    });
    return Array.from(set);
  }, [currentCaseSubmissions]);

  // تجمیع نظرات، لاگ‌ها، پیگیری‌ها و ارجاعات مراجع
  const allFollowupComments = useMemo(() => {
    const list: Array<{
      id: string;
      submissionId: string;
      formTitle: string;
      authorName: string;
      authorRole: string;
      content: string;
      createdAt: string;
      isReferral?: boolean;
    }> = [];

    currentCaseSubmissions.forEach((sub) => {
      const formObj = forms.find((f) => f.id === sub.formId);
      const fTitle = formObj ? formObj.title : 'فرم ثبت‌شده';

      (sub.comments || []).forEach((c) => {
        const isRef = c.content.includes('ارجاع تخصصی') || c.content.includes('🔄 ارجاع');
        list.push({
          id: c.id,
          submissionId: sub.id,
          formTitle: fTitle,
          authorName: c.authorName,
          authorRole: c.authorRole,
          content: c.content,
          createdAt: c.createdAt,
          isReferral: isRef,
        });
      });
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [currentCaseSubmissions, forms]);

  // لیست ارجاعات تخصصی
  const referralsList = useMemo(() => {
    return allFollowupComments.filter((c) => c.isReferral);
  }, [allFollowupComments]);

  // آخرین توصیه مشاور
  const latestCounselorRecommendation = useMemo(() => {
    if (allFollowupComments.length > 0) {
      return allFollowupComments[0].content;
    }
    return 'هنوز توصیه‌ای ثبت نشده است (در انتظار جلسه مشاوره اولیه)';
  }, [allFollowupComments]);

  // سابمیشن آزمون خودسنجی صفان در صورت وجود
  const safaEvaluationSubmission = useMemo(() => {
    return currentCaseSubmissions.find((s) => s.evaluationResult || s.formId === 'form-safaan-assessment');
  }, [currentCaseSubmissions]);

  // وضعیت سلامت جسمی و روانی
  const healthStatus = useMemo(() => {
    const phys = combinedData.f_physical_illness || 'ندارم';
    const ment = combinedData.f_mental_illness || 'ندارم';
    const meds = combinedData.f_medications || 'ندارم';

    const hasPhys = phys && !['خیر', 'ندارم', 'ندارد', 'هیچ'].includes(phys.trim());
    const hasMent = ment && !['خیر', 'ندارم', 'ندارد', 'هیچ'].includes(ment.trim());
    const hasMeds = meds && !['خیر', 'ندارم', 'ندارد', 'هیچ'].includes(meds.trim());

    return { phys, ment, meds, hasPhys, hasMent, hasMeds };
  }, [combinedData]);

  // داده‌های آماری جهت نمودار میله‌ای عمودی مراجع
  const clientDimensionsBarData: BarChartItem[] = useMemo(() => {
    const overallScore = safaEvaluationSubmission?.evaluationResult?.overallScore || 78;
    const healthScore = (healthStatus.hasMent || healthStatus.hasMeds) ? 65 : 92;
    const commitmentScore = bookingSubmissions.length > 0 ? 95 : 80;
    const familyScore = combinedData.f_role_in_family ? 90 : 75;
    const growthGap = 100 - overallScore;

    return [
      { id: 'dim-growth', label: 'شاخص رشد فردی', value: overallScore, percentage: overallScore, color: 'bg-sky-600', secondaryLabel: 'نمره ارزیابی' },
      { id: 'dim-health', label: 'سلامت و تاب‌آوری', value: healthScore, percentage: healthScore, color: healthScore < 70 ? 'bg-amber-500' : 'bg-emerald-600', secondaryLabel: 'پایش بالینی' },
      { id: 'dim-commit', label: 'تعهد حضور و پیگیری', value: commitmentScore, percentage: commitmentScore, color: 'bg-indigo-600', secondaryLabel: 'نظم مراجع' },
      { id: 'dim-family', label: 'همبستگی خانوادگی', value: familyScore, percentage: familyScore, color: 'bg-teal-600', secondaryLabel: 'پایداری ساختار' },
      { id: 'dim-gap', label: 'پتانسیل ارتقاء (Gap)', value: growthGap, percentage: growthGap, color: 'bg-rose-500', secondaryLabel: 'فاصله رشد' },
    ];
  }, [safaEvaluationSubmission, healthStatus, bookingSubmissions, combinedData]);

  // توزیع مراجعات بین مشاوران به صورت نمودار میله‌ای عمودی
  const counselorsBarData: BarChartItem[] = useMemo(() => {
    const counselorCount: Record<string, number> = {};
    bookingSubmissions.forEach((sub) => {
      let cName = sub.data?.f_counselor;
      if (!cName) {
        for (const k of Object.keys(sub.data || {})) {
          if (k.startsWith('f_counselor_') && sub.data[k]) {
            cName = sub.data[k];
            break;
          }
        }
      }
      if (cName) {
        const clean = cName.replace(/^(آقای|خانم|دکتر)\s+/, '').replace(/\s*\(.*?\)/, '').trim();
        counselorCount[clean] = (counselorCount[clean] || 0) + 1;
      }
    });

    const total = Object.values(counselorCount).reduce((a, b) => a + b, 0) || 1;
    const colors = ['bg-sky-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-500'];

    return Object.entries(counselorCount).map(([cName, count], idx) => ({
      id: `c-bar-${idx}`,
      label: `استاد ${cName}`,
      value: count,
      percentage: Math.round((count / total) * 100),
      color: colors[idx % colors.length],
      secondaryLabel: `${toPersianDigits(count)} جلسه`,
    }));
  }, [bookingSubmissions]);

  // ثبت پیگیری جدید برای مراجع
  const handleAddFollowup = () => {
    if (!newFollowupText.trim()) return;
    setIsSubmittingFollowup(true);

    let contentWithPrefix = '';
    if (newFollowupType === 'referral') {
      contentWithPrefix = `🔄 ارجاع تخصصی: [مقصد: ${referralTarget || 'مشاور همکار / روانپزشک'}] - ${newFollowupText.trim()}`;
    } else {
      const typePrefix = {
        call: '📞 تماس تلفنی: ',
        meeting: '🤝 جلسه مشاوره / حضوری: ',
        sms: '💬 پیامک ارسالی: ',
        note: '📝 یادداشت بالینی و توصیه مدیر: ',
        referral: '🔄 ارجاع تخصصی: ',
      }[newFollowupType];
      contentWithPrefix = `${typePrefix}${newFollowupText.trim()}`;
    }

    const targetSubId = currentCaseSubmissions[0]?.id;
    if (targetSubId) {
      addSubmissionComment(targetSubId, adminName, adminRole, contentWithPrefix);
    }

    setNewFollowupText('');
    setReferralTarget('');
    setIsSubmittingFollowup(false);
  };

  // تغییر وضعیت پرونده
  const handleUpdateStatus = (newSt: SubmissionStatus) => {
    setCurrentStatus(newSt);
    currentCaseSubmissions.forEach((sub) => {
      updateSubmissionStatus(sub.id, newSt);
    });
    if (onStatusChange) onStatusChange(newSt);
  };

  // خروجی فایل اکسل
  const handleExportClientExcel = async () => {
    try {
      setIsExportingExcel(true);
      await exportSingleClientDossierToXLSX(clientCase, forms);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('خطا در صدور فایل اکسل پرونده.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // انتخاب فرم و سابمیشن فعال برای نمای گزارش تحلیلی فرم
  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return currentCaseSubmissions[0] || null;
    return currentCaseSubmissions.find((s) => s.id === selectedSubmissionId) || currentCaseSubmissions[0] || null;
  }, [currentCaseSubmissions, selectedSubmissionId]);

  const selectedFormObj = useMemo(() => {
    if (!selectedSubmission) return null;
    return forms.find((f) => f.id === selectedSubmission.formId) || null;
  }, [selectedSubmission, forms]);

  const statusConfigs: Record<SubmissionStatus, { label: string; color: string; bg: string; border: string }> = {
    new: { label: 'جدید / نیاز به بررسی', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    reviewing: { label: 'در حال بررسی و مشاوره', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    approved: { label: 'تأیید شده / فعال', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    rejected: { label: 'رد شده / عدم پذیرش', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    archived: { label: 'بایگانی پرونده', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
  };

  return (
    <div
      className={`absolute inset-0 z-30 flex justify-start overflow-hidden ${
        panelMode === 'drawer' ? 'bg-slate-900/30 backdrop-blur-2xs' : 'bg-slate-100'
      }`}
    >
      {/* در حالت کشویی کلیک روی پس‌زمینه پنل را می‌بندد */}
      {panelMode === 'drawer' && (
        <div
          onClick={onClose}
          className="absolute inset-0 cursor-pointer -z-10 no-print"
          title="بستن پنجره"
        />
      )}

      {/* پنل اصلی پرونده مراجع */}
      <div
        className={`h-full bg-slate-100 flex flex-col overflow-hidden text-right transition-all duration-300 ${
          panelMode === 'drawer'
            ? 'w-full lg:w-[70%] xl:w-[65%] shadow-2xl border-r border-slate-300'
            : 'w-full shadow-none'
        }`}
      >
        
        {/* ۱. نوار ناوبری ارشد بالای صفحه (Header) */}
        <div className="bg-white border-b border-slate-200/90 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-2xs no-print">
          
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="بازگشت به جدول کارتابل"
            >
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span>بازگشت به کارتابل</span>
            </button>

            <span className="text-slate-300">/</span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">پرونده بالحق:</span>
              <span className="text-xs sm:text-sm font-black text-slate-900">{displayFullName}</span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-black">
                {clientCase.caseCode}
              </span>
            </div>

            {currentView === 'formReport' && selectedFormObj && (
              <>
                <span className="text-slate-300">/</span>
                <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-800 px-3 py-1 rounded-xl text-xs font-bold border border-indigo-200">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>گزارش تحلیلی: {selectedFormObj.title}</span>
                </div>
              </>
            )}
          </div>

          {/* ابزارها و دکمه‌های اقدام */}
          <div className="flex items-center gap-2">
            
            {/* انتخاب وضعیت پرونده */}
            <select
              value={currentStatus}
              onChange={(e) => handleUpdateStatus(e.target.value as SubmissionStatus)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:ring-2 focus:ring-sky-500/20 ${statusConfigs[currentStatus].bg} ${statusConfigs[currentStatus].color} ${statusConfigs[currentStatus].border}`}
            >
              <option value="new">جدید / نیاز به بررسی</option>
              <option value="reviewing">در حال بررسی و مشاوره</option>
              <option value="approved">تأیید شده / فعال</option>
              <option value="rejected">رد شده / عدم پذیرش</option>
              <option value="archived">بایگانی پرونده</option>
            </select>

            {/* سوییچ نمایش کشویی / تمام‌صفحه */}
            <button
              onClick={() => setPanelMode((p) => (p === 'full' ? 'drawer' : 'full'))}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer hidden lg:inline-flex"
              title={panelMode === 'full' ? 'تغییر به نمای کشویی' : 'تغییر به نمای تمام‌عرض'}
            >
              {panelMode === 'full' ? <Columns className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* خروجی اکسل */}
            <button
              onClick={handleExportClientExcel}
              disabled={isExportingExcel}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
              title="خروجی کامل اکسل پرونده"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </button>

            {/* چاپ رسمی پرونده */}
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="چاپ رسمی و کامل پرونده (شامل کلیه بخش‌ها به تفکیک)"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">چاپ پرونده</span>
            </button>

            {/* بستن */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* ۲. محتوای پرونده */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          
          {/* سربرگ خلاصه پرونده مراجع (تیره و مدرن) */}
          <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-950 text-white px-4 sm:px-8 py-3 shrink-0 border-b border-white/10 no-print">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center border border-white/20 shadow-xs shrink-0">
                  {displayFullName.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black tracking-tight text-white">{displayFullName}</h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/10 text-sky-200 border border-white/15">
                      {clientCase.caseCode}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${statusConfigs[currentStatus].bg} ${statusConfigs[currentStatus].color} ${statusConfigs[currentStatus].border}`}>
                      {statusConfigs[currentStatus].label}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/70 flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-sky-400" />
                      <span className="font-mono font-bold text-white/90">{clientCase.mobile || 'ثبت‌نشده'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-400" />
                      <span>{clientCase.provinceCity || 'استان نامشخص'}</span>
                    </span>
                    <span>•</span>
                    <span>سن: {clientAge}</span>
                    <span>•</span>
                    <span>نقش: {combinedData.f_role_in_family || 'مراجع'}</span>
                  </div>
                </div>
              </div>

              {/* خلاصه نوبت و تراکنش */}
              <div className="flex items-center gap-3 text-left">
                <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 text-right">
                  <span className="text-[10px] text-white/60 block">تعداد نوبت‌های دریافتی</span>
                  <span className="text-sm font-black text-emerald-300 font-mono">
                    {toPersianDigits(bookingSubmissions.length)} نوبت
                  </span>
                </div>
                <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 text-right">
                  <span className="text-[10px] text-white/60 block">کل فرم‌های تکمیل‌شده</span>
                  <span className="text-sm font-black text-sky-300 font-mono">
                    {toPersianDigits(currentCaseSubmissions.length)} فرم
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* تب‌های ناوبری پرونده مراجع */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 shadow-2xs no-print">
            {[
              { id: 'overview', label: 'خلاصه و تحلیل جامع پرونده', icon: Compass },
              { id: 'profile', label: 'مشخصات ثبت‌نام و سلامت', icon: UserCheck },
              { id: 'bookings', label: 'نوبت‌های دریافتی', icon: CalendarCheck, count: bookingSubmissions.length },
              { id: 'referrals', label: 'ارجاعات تخصصی', icon: Share2, count: referralsList.length },
              { id: 'forms', label: 'پرسشنامه‌ها و تست‌ها', icon: FileCheck2, count: currentCaseSubmissions.length },
              { id: 'followups', label: 'لیست توصیه‌ها و پیگیری‌ها', icon: MessageSquare, count: allFollowupComments.length },
              { id: 'stats', label: 'آمارهای مراجع', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === 'dossier' && activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentView('dossier');
                    setActiveTab(tab.id as any);
                  }}
                  className={`py-3 px-3.5 sm:px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? 'bg-sky-200 text-sky-900 font-black' : 'bg-slate-100 text-slate-600'}`}>
                      {toPersianDigits(tab.count)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ۳. محتوای درون تب‌ها برای نمایش در مانیتور (روی صفحه) */}
          <div className="p-4 sm:p-7 space-y-6 no-print">

            {/* الف) تب خلاصه و تحلیل جامع پرونده (شامل باکس‌های ضروری مراجع) */}
            {currentView === 'dossier' && activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* ۱. باکس خلاصه پرونده */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-600" />
                      <span>۱. باکس خلاصه پرونده مشاوره</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      کد پرونده: {clientCase.caseCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-medium">نام و نام خانوادگی:</span>
                      <strong className="text-sm text-slate-900">{displayFullName}</strong>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-medium">جنسیت و سن:</span>
                      <strong className="text-sm text-slate-900">{clientGender} - {clientAge}</strong>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-medium">وضعیت تاهل و فرزندان:</span>
                      <strong className="text-sm text-slate-900">{clientMaritalStatus} | {clientChildrenCount}</strong>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-medium">اولین و آخرین نوبت:</span>
                      <span className="text-xs font-bold text-slate-800 font-mono block">اولین: {firstBookingDate}</span>
                      <span className="text-xs font-bold text-emerald-700 font-mono block">آخرین: {latestBookingDate}</span>
                    </div>
                  </div>

                  {/* موضوعات اصلی و اساتید طرف مراجعه */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-1.5">
                      <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-sky-600" />
                        <span>موضوعات اصلی مراجعه:</span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {mainTopicsList.length === 0 ? (
                          <span className="text-slate-500 text-xs">ثبت‌نشده</span>
                        ) : (
                          mainTopicsList.map((t, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-white text-sky-800 border border-sky-200 text-xs font-bold">
                              {t}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-1.5">
                      <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>مشاوره با کدام اساتید داشته است:</span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {counselorsList.length === 0 ? (
                          <span className="text-slate-500 text-xs">نوبت فعالی ثبت نشده است</span>
                        ) : (
                          counselorsList.map((c, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-white text-indigo-900 border border-indigo-200 text-xs font-bold">
                              استاد {c.replace(/^(آقای|خانم|دکتر)\s+/, '')}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* آخرین توصیه مشاور */}
                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-1">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>آخرین توصیه و یادداشت مشاور:</span>
                    </span>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {latestCounselorRecommendation}
                    </p>
                  </div>
                </div>

                {/* ۲. باکس ارجاعات تخصصی */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-emerald-600" />
                      <span>۲. باکس ارجاعات تخصصی (مشاور به مشاوران یا روانپزشک)</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      {toPersianDigits(referralsList.length)} ارجاع ثبت‌شده
                    </span>
                  </div>

                  {referralsList.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      تاکنون ارجاع تخصصی برای این مراجع ثبت نشده است. می‌توانید از بخش ثبت پیگیری زیر ارجاع جدید صادر فرمایید.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referralsList.map((ref) => (
                        <div key={ref.id} className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900">{ref.authorName} ({ref.authorRole})</span>
                            <span className="text-[11px] text-slate-400 font-mono">{formatPersianDateTime(ref.createdAt)}</span>
                          </div>
                          <p className="text-slate-800 font-medium">{ref.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* فرم ثبت ارجاع فوری */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-xs font-bold text-slate-800 block">ثبت ارجاع تخصصی جدید برای مراجع:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="مقصد ارجاع (نام مشاور، روانپزشک، کلینیک)..."
                        value={referralTarget}
                        onChange={(e) => setReferralTarget(e.target.value)}
                        className="sm:col-span-1 p-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <input
                        type="text"
                        placeholder="علت و شرح ارجاع تخصصی..."
                        value={newFollowupText}
                        onChange={(e) => {
                          setNewFollowupText(e.target.value);
                          setNewFollowupType('referral');
                        }}
                        className="sm:col-span-2 p-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddFollowup}
                        disabled={isSubmittingFollowup || !newFollowupText.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ثبت قطعی ارجاع در پرونده</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ۳. باکس نوبت‌های دریافتی */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-sky-600" />
                      <span>۳. باکس نوبت‌های دریافتی مراجع</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      مجموع {toPersianDigits(bookingSubmissions.length)} جلسه ثبت‌شده
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold">
                          <th className="py-2 px-2">ردیف</th>
                          <th className="py-2 px-2">نام مشاور</th>
                          <th className="py-2 px-2">موضوع مشاوره</th>
                          <th className="py-2 px-2">زمان / سانس رزرو شده</th>
                          <th className="py-2 px-2 text-center">وضعیت پرداخت</th>
                          <th className="py-2 px-2 text-center">کد پیگیری</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookingSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400">
                              هیچ نوبتی برای این مراجع ثبت نشده است.
                            </td>
                          </tr>
                        ) : (
                          bookingSubmissions.map((sub, idx) => {
                            let counselor = sub.data?.f_counselor || 'استاد مشاور';
                            for (const k of Object.keys(sub.data || {})) {
                              if (k.startsWith('f_counselor_') && sub.data[k]) {
                                counselor = sub.data[k];
                                break;
                              }
                            }
                            let slot = 'تعیین‌شده';
                            for (const k of Object.keys(sub.data || {})) {
                              if (k.startsWith('f_booking_') && sub.data[k]) {
                                slot = sub.data[k];
                                break;
                              }
                            }

                            return (
                              <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-2 font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                                <td className="py-2.5 px-2 font-bold text-slate-900">{counselor}</td>
                                <td className="py-2.5 px-2 text-slate-700">{sub.data?.f_topic || 'مشاوره فردی'}</td>
                                <td className="py-2.5 px-2 font-semibold text-emerald-800">{slot}</td>
                                <td className="py-2.5 px-2 text-center">
                                  {sub.paymentStatus === 'paid' ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                      پرداخت تأییدشده
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]">
                                      بدون هزینه درگاه
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono text-slate-500">{sub.trackingCode}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ۴. باکس ثبت نام (اطلاعات کامل هویتی و سلامت) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span>۴. باکس مشخصات ثبت‌نام، هویت و سلامت مراجع</span>
                    </h3>
                    <span className="text-xs text-slate-400">اطلاعات اولیه فرم ثبت‌نام</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">شماره تماس همراه:</span>
                      <strong className="text-slate-900 font-mono text-xs">{clientCase.mobile || 'ثبت‌نشده'}</strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">موقعیت استانی و شهری:</span>
                      <strong className="text-slate-900 text-xs">{clientCase.provinceCity || 'ثبت‌نشده'}</strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">مدرسه معارفی:</span>
                      <strong className="text-slate-900 text-xs">
                        {combinedData.f_school_name || 'ثبت‌نشده'} (ناظم: {combinedData.f_school_supervisor || '—'})
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">سابقه بیماری جسمی:</span>
                      <strong className={`text-xs ${healthStatus.hasPhys ? 'text-amber-700' : 'text-slate-900'}`}>
                        {healthStatus.phys}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">سابقه بیماری روحی/روانی:</span>
                      <strong className={`text-xs ${healthStatus.hasMent ? 'text-rose-700 font-bold' : 'text-slate-900'}`}>
                        {healthStatus.ment}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">داروهای مصرفی:</span>
                      <strong className={`text-xs ${healthStatus.hasMeds ? 'text-purple-700' : 'text-slate-900'}`}>
                        {healthStatus.meds}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* ۵. باکس پرسشنامه‌ها و تست‌ها */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>۵. باکس پرسشنامه‌ها، تست‌ها و آزمون‌های مراجع</span>
                    </h3>
                    <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {safaEvaluationSubmission ? 'ارزیابی صفان تکمیل‌شده' : 'فاقد ارزیابی'}
                    </span>
                  </div>

                  {safaEvaluationSubmission ? (
                    <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-purple-950">
                            کارنامه ارزیابی خودسنجی صفان (تست ۱۷ مؤلفه‌ای رشد)
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            نمره کل: <strong className="text-purple-900 font-mono text-sm">{toPersianDigits(safaEvaluationSubmission.evaluationResult?.overallScore || 0)}</strong> از ۱۰۰ | میانگین سلامت رفتاری: <strong className="text-emerald-800 font-mono text-sm">{toPersianDigits(safaEvaluationSubmission.evaluationResult?.behaviorAvgScore || 0)}</strong>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSubmissionId(safaEvaluationSubmission.id);
                            setCurrentView('formReport');
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <span>مشاهده کارنامه و نمودار رادار</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* ۳ اولویت رشد */}
                      {safaEvaluationSubmission.evaluationResult?.topPriorities && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {safaEvaluationSubmission.evaluationResult.topPriorities.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="p-2.5 bg-white rounded-xl border border-purple-200 text-xs">
                              <span className="text-[10px] font-bold text-amber-700 block">اولویت رشد {toPersianDigits(idx + 1)}:</span>
                              <span className="font-extrabold text-slate-900 block truncate">{item.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">فاصله رشد: {toPersianDigits(item.gap)}٪</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      مراجع تاکنون پرسشنامه خودسنجی صفان را تکمیل نکرده است.
                    </div>
                  )}
                </div>

                {/* ۶. باکس لیست توصیه‌های مشاوران (همراه با تاریخ و نام مشاور) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-sky-600" />
                      <span>۶. باکس لیست توصیه‌ها، پیگیری‌ها و یادداشت‌های بالینی مشاوران</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      {toPersianDigits(allFollowupComments.length)} ثبت در سوابق
                    </span>
                  </div>

                  {/* فرم ثبت سریع یادداشت یا توصیه */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-slate-500 font-bold">نوع اقدام:</span>
                      {[
                        { id: 'note', label: '📝 یادداشت بالینی' },
                        { id: 'meeting', label: '🤝 جلسه مشاوره' },
                        { id: 'call', label: '📞 تماس تلفنی' },
                        { id: 'sms', label: '💬 پیامک ارسالی' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNewFollowupType(t.id as any)}
                          className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                            newFollowupType === t.id
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      value={newFollowupText}
                      onChange={(e) => setNewFollowupText(e.target.value)}
                      placeholder="متن توصیه مشاور، نکات بالینی یا شرح تصمیم جلسه..."
                      className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />

                    <div className="flex justify-end">
                      <button
                        onClick={handleAddFollowup}
                        disabled={isSubmittingFollowup || !newFollowupText.trim()}
                        className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ثبت در پرونده مراجع</span>
                      </button>
                    </div>
                  </div>

                  {/* تاریخچه کامل توصیه‌ها */}
                  <div className="space-y-3">
                    {allFollowupComments.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        هیچ توصیه یا پیگیری برای این مراجع ثبت نشده است.
                      </div>
                    ) : (
                      allFollowupComments.map((item) => (
                        <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs space-y-1.5">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">{item.authorName}</span>
                              <span className="text-[11px] text-slate-400 font-medium">({item.authorRole})</span>
                              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                                {item.formTitle}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatPersianDateTime(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {item.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ۷. آمارهای مختلف این فرد (با نمودارهای میله‌ای عمودی) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      <span>۷. آمارهای تحلیلی مراجع (نمودار میله‌ای عمودی)</span>
                    </h3>
                    <span className="text-xs text-slate-400">تحلیل شاخص‌های رشد، سلامت، نوبت‌ها و مؤلفه‌ها</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* نمودار میله‌ای عمودی مؤلفه‌ها و شاخص‌ها */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-900">شاخص‌های پنج‌گانه سلامت و تعهد</h4>
                      <VerticalBarChart
                        data={clientDimensionsBarData}
                        unit="نمره"
                        height={220}
                        showValues={true}
                      />
                    </div>

                    {/* نمودار میله‌ای مراجعات به مشاوران مختلف */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-900">توزیع جلسات مشاوره بین اساتید</h4>
                      {counselorsBarData.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 text-xs">
                          هنوز جلسه‌ای برای تفکیک اساتید ثبت نشده است.
                        </div>
                      ) : (
                        <VerticalBarChart
                          data={counselorsBarData}
                          unit="جلسه"
                          height={220}
                          showValues={true}
                        />
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ب) تب مشخصات ثبت‌نام */}
            {currentView === 'dossier' && activeTab === 'profile' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                  اطلاعات تفصیلی ثبت‌نام و ساختار خانوادگی مراجع
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {Object.entries(combinedData).map(([key, val]) => {
                    if (typeof val === 'object' || val === null || val === undefined) return null;
                    return (
                      <div key={key} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                        <span className="text-slate-400 text-[11px] block">{key}</span>
                        <strong className="text-slate-900 text-xs">{String(val)}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ج) تب نوبت‌ها */}
            {currentView === 'dossier' && activeTab === 'bookings' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                  کلیه نوبت‌ها و جلسات مشاوره رزرو شده
                </h3>
                <div className="space-y-3">
                  {bookingSubmissions.map((b, i) => (
                    <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">
                          جلسه {toPersianDigits(i + 1)}: {b.data?.f_topic || 'مشاوره'}
                        </span>
                        <span className="text-slate-500 text-xs mt-1 block">
                          تاریخ ثبت: {formatPersianDateTime(b.createdAt)} | کد: {b.trackingCode}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                        {b.paymentStatus === 'paid' ? 'پرداخت شده' : 'ثبت قطعی'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* د) تب ارجاعات */}
            {currentView === 'dossier' && activeTab === 'referrals' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                  ارجاعات تخصصی بین مشاوران یا روانپزشک
                </h3>
                <div className="space-y-3">
                  {referralsList.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      هیچ ارجاع تخصصی ثبت نشده است.
                    </div>
                  ) : (
                    referralsList.map((ref) => (
                      <div key={ref.id} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900">{ref.authorName}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{formatPersianDateTime(ref.createdAt)}</span>
                        </div>
                        <p className="text-slate-800">{ref.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ه) تب فرم‌ها و پرسشنامه‌ها */}
            {((currentView === 'dossier' && activeTab === 'forms') || currentView === 'formReport') && (
              <div className="space-y-6">
                {currentView === 'formReport' && safaEvaluationSubmission?.evaluationResult ? (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                      <h3 className="text-sm font-black text-slate-900">
                        کارنامه رسمی ارزیابی صفان: {displayFullName}
                      </h3>
                      <button
                        onClick={() => setCurrentView('dossier')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        بازگشت به نمای کلی پرونده
                      </button>
                    </div>
                    <EvaluationReportView evaluation={safaEvaluationSubmission.evaluationResult} />
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                      لیست کلیه فرم‌های تکمیل‌شده توسط این مراجع ({toPersianDigits(currentCaseSubmissions.length)} فرم)
                    </h3>
                    <div className="space-y-3">
                      {currentCaseSubmissions.map((sub) => {
                        const formObj = forms.find((f) => f.id === sub.formId);
                        return (
                          <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-900 text-sm block">{formObj?.title || 'فرم ثبت‌شده'}</span>
                              <span className="text-slate-400 text-xs mt-1 block">کد پیگیری: {sub.trackingCode} | تاریخ: {formatPersianDateTime(sub.createdAt)}</span>
                            </div>
                            {sub.evaluationResult && (
                              <button
                                onClick={() => {
                                  setSelectedSubmissionId(sub.id);
                                  setCurrentView('formReport');
                                }}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>مشاهده کارنامه</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* و) تب پیگیری‌ها و توصیه‌ها */}
            {currentView === 'dossier' && activeTab === 'followups' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                  ثبت و تاریخچه کامل لاگ‌ها، تماس‌ها و جلسات مشاوره
                </h3>

                {/* افزودن پیگیری */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {[
                      { id: 'call', label: '📞 تماس تلفنی' },
                      { id: 'meeting', label: '🤝 جلسه حضوری/مشاوره' },
                      { id: 'sms', label: '💬 پیامک ارسالی' },
                      { id: 'note', label: '📝 یادداشت محرمانه' },
                      { id: 'referral', label: '🔄 ارجاع تخصصی' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewFollowupType(t.id as any)}
                        className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                          newFollowupType === t.id ? 'bg-sky-600 text-white' : 'bg-white border text-slate-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={newFollowupText}
                    onChange={(e) => setNewFollowupText(e.target.value)}
                    placeholder="شرح کامل مکالمه، تصمیم اتخاذ شده، یادداشت محرمانه، یا توضیحات جهت پیگیری‌های بعدی..."
                    className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleAddFollowup}
                      disabled={isSubmittingFollowup || !newFollowupText.trim()}
                      className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ثبت در پرونده مراجع</span>
                    </button>
                  </div>
                </div>

                {/* تایم‌لاین کامل */}
                <div className="space-y-3">
                  {allFollowupComments.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      هیچ پیگیری یا تماسی برای این مراجع ثبت نشده است.
                    </div>
                  ) : (
                    allFollowupComments.map((item) => (
                      <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                          <span className="font-extrabold text-slate-900">{item.authorName} ({item.authorRole})</span>
                          <span className="text-slate-400 font-mono text-[11px]">{formatPersianDateTime(item.createdAt)}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-medium">{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ز) تب آمارها */}
            {currentView === 'dossier' && activeTab === 'stats' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                  نمودارهای میله‌ای و آمارهای تحلیلی مراجع
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <VerticalBarChart
                      data={clientDimensionsBarData}
                      unit="نمره"
                      height={240}
                      showValues={true}
                    />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <VerticalBarChart
                      data={counselorsBarData}
                      unit="جلسه"
                      height={240}
                      showValues={true}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ۴. قالب چاپ رسمی پرونده مشاوره (فقط در زمان Print اجرا می‌شود و تمامی بخش‌ها را به تفکیک و کامل زیر هم می‌آورد) */}
          <div id="belhagh-printable-dossier" className="hidden print:block text-black bg-white p-6 space-y-6">
            
            {/* سربرگ رسمی نامه چاپ */}
            <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600 pb-2">
                <span>جمهوری اسلامی ایران</span>
                <span className="font-mono">تاریخ چاپ: {formatPersianDateOnly(new Date().toISOString())}</span>
              </div>
              <h1 className="text-lg font-black text-slate-900">
                مرکز خدمات روانشناسی و مشاوره بالحق
              </h1>
              <h2 className="text-sm font-bold text-slate-700">
                پرونده جامع خدمات مشاوره، روانشناختی و ارزیابی مراجع
              </h2>
              <div className="flex items-center justify-center gap-4 text-xs font-mono pt-1 text-slate-800">
                <span>شماره پرونده: <strong>{clientCase.caseCode}</strong></span>
                <span>•</span>
                <span>نام مراجع: <strong>{displayFullName}</strong></span>
                <span>•</span>
                <span>تلفن تماس: <strong>{clientCase.mobile}</strong></span>
              </div>
            </div>

            {/* بخش ۱ پرینت: باکس خلاصه پرونده */}
            <div className="border border-slate-400 rounded-xl p-4 space-y-2 print-avoid-break">
              <h3 className="text-xs font-black bg-slate-100 p-1.5 rounded text-slate-900 border-b border-slate-300">
                ۱. خلاصه پرونده مشاوره
              </h3>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div><strong>نام و نام خانوادگی:</strong> {displayFullName}</div>
                <div><strong>کد پرونده:</strong> {clientCase.caseCode}</div>
                <div><strong>جنسیت:</strong> {clientGender}</div>
                <div><strong>سن:</strong> {clientAge}</div>
                <div><strong>وضعیت تاهل:</strong> {clientMaritalStatus}</div>
                <div><strong>تعداد فرزندان:</strong> {clientChildrenCount}</div>
                <div><strong>تاریخ اولین نوبت:</strong> {firstBookingDate}</div>
                <div><strong>تاریخ آخرین نوبت:</strong> {latestBookingDate}</div>
              </div>
              <div className="text-xs pt-1 border-t border-slate-200">
                <strong>موضوعات مراجعه:</strong> {mainTopicsList.join('، ') || 'مشاوره عمومی'} | <strong>مشاوران:</strong> {counselorsList.join('، ') || 'استاد مشاور'}
              </div>
              <div className="text-xs pt-1 border-t border-slate-200">
                <strong>آخرین توصیه مشاور:</strong> {latestCounselorRecommendation}
              </div>
            </div>

            {/* بخش ۲ پرینت: مشخصات هویتی و سلامت */}
            <div className="border border-slate-400 rounded-xl p-4 space-y-2 print-avoid-break">
              <h3 className="text-xs font-black bg-slate-100 p-1.5 rounded text-slate-900 border-b border-slate-300">
                ۲. مشخصات ثبت‌نام و سوابق سلامت
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><strong>شهر محل سکونت:</strong> {clientCase.provinceCity}</div>
                <div><strong>نقش در خانواده:</strong> {combinedData.f_role_in_family || 'مراجع'}</div>
                <div><strong>مدرسه معارفی:</strong> {combinedData.f_school_name || 'ثبت‌نشده'} (ناظم: {combinedData.f_school_supervisor || '—'})</div>
                <div><strong>سابقه بیماری جسمی:</strong> {healthStatus.phys}</div>
                <div><strong>سابقه بیماری روحی:</strong> {healthStatus.ment}</div>
                <div><strong>داروهای مصرفی:</strong> {healthStatus.meds}</div>
              </div>
            </div>

            {/* بخش ۳ پرینت: جدول نوبت‌های دریافتی */}
            <div className="border border-slate-400 rounded-xl p-4 space-y-2 print-avoid-break">
              <h3 className="text-xs font-black bg-slate-100 p-1.5 rounded text-slate-900 border-b border-slate-300">
                ۳. سوابق کلیه نوبت‌های دریافتی
              </h3>
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-700">
                    <th className="py-1">ردیف</th>
                    <th className="py-1">نام مشاور</th>
                    <th className="py-1">موضوع جلسه</th>
                    <th className="py-1">زمان و سانس</th>
                    <th className="py-1 text-center">وضعیت پرداخت</th>
                    <th className="py-1 text-center">کد رهگیری</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookingSubmissions.length === 0 ? (
                    <tr><td colSpan={6} className="py-2 text-center">بدون نوبت ثبت‌شده</td></tr>
                  ) : (
                    bookingSubmissions.map((sub, idx) => {
                      let counselor = sub.data?.f_counselor || 'استاد مشاور';
                      for (const k of Object.keys(sub.data || {})) {
                        if (k.startsWith('f_counselor_') && sub.data[k]) { counselor = sub.data[k]; break; }
                      }
                      let slot = 'تعیین‌شده';
                      for (const k of Object.keys(sub.data || {})) {
                        if (k.startsWith('f_booking_') && sub.data[k]) { slot = sub.data[k]; break; }
                      }
                      return (
                        <tr key={sub.id}>
                          <td className="py-1">{toPersianDigits(idx + 1)}</td>
                          <td className="py-1 font-bold">{counselor}</td>
                          <td className="py-1">{sub.data?.f_topic || 'مشاوره'}</td>
                          <td className="py-1">{slot}</td>
                          <td className="py-1 text-center">{sub.paymentStatus === 'paid' ? 'پرداخت شده' : 'حضوری/رایگان'}</td>
                          <td className="py-1 text-center font-mono">{sub.trackingCode}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* بخش ۴ پرینت: ارجاعات تخصصی */}
            <div className="border border-slate-400 rounded-xl p-4 space-y-2 print-avoid-break">
              <h3 className="text-xs font-black bg-slate-100 p-1.5 rounded text-slate-900 border-b border-slate-300">
                ۴. سوابق ارجاعات تخصصی
              </h3>
              {referralsList.length === 0 ? (
                <p className="text-xs text-slate-500">ارجاع تخصصی ثبت نشده است.</p>
              ) : (
                <div className="space-y-1 text-xs">
                  {referralsList.map((ref, idx) => (
                    <div key={idx} className="border-b border-slate-100 pb-1">
                      <strong>{toPersianDigits(idx + 1)}. {ref.authorName} ({formatPersianDateOnly(ref.createdAt)}):</strong> {ref.content}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* بخش ۵ پرینت: لیست توصیه‌ها و پیگیری‌ها */}
            <div className="border border-slate-400 rounded-xl p-4 space-y-2 print-avoid-break">
              <h3 className="text-xs font-black bg-slate-100 p-1.5 rounded text-slate-900 border-b border-slate-300">
                ۵. لیست توصیه‌ها، یادداشت‌ها و پیگیری‌های مشاوران
              </h3>
              {allFollowupComments.length === 0 ? (
                <p className="text-xs text-slate-500">یادداشتی ثبت نشده است.</p>
              ) : (
                <div className="space-y-1.5 text-xs">
                  {allFollowupComments.map((item, idx) => (
                    <div key={idx} className="border-b border-slate-200 pb-1">
                      <span className="font-bold text-slate-900">[{toPersianDigits(idx + 1)}] {item.authorName} - {formatPersianDateOnly(item.createdAt)}:</span>
                      <p className="text-slate-800 pr-2">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* بخش ۶ پرینت: پرسشنامه‌ها و تست‌ها */}
            <div className="border border-slate-400 rounded-xl p-4 space-y-2 print-avoid-break">
              <h3 className="text-xs font-black bg-slate-100 p-1.5 rounded text-slate-900 border-b border-slate-300">
                ۶. نتایج پرسشنامه‌ها و تست‌های مراجع
              </h3>
              {safaEvaluationSubmission ? (
                <div className="space-y-1 text-xs">
                  <div><strong>عنوان ارزیابی:</strong> آزمون خودسنجی صفان (۱۷ مؤلفه‌ای)</div>
                  <div>
                    <strong>نمره کل:</strong> {toPersianDigits(safaEvaluationSubmission.evaluationResult?.overallScore || 0)} از ۱۰۰ | <strong>سلامت رفتاری:</strong> {toPersianDigits(safaEvaluationSubmission.evaluationResult?.behaviorAvgScore || 0)}
                  </div>
                  {safaEvaluationSubmission.evaluationResult?.topPriorities && (
                    <div className="pt-1">
                      <strong>اولویت‌های نخست رشد: </strong>
                      {safaEvaluationSubmission.evaluationResult.topPriorities.slice(0, 3).map((p) => p.title).join('، ')}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">پرسشنامه خودسنجی ثبت نشده است.</p>
              )}
            </div>

            {/* بخش ۷ پرینت: آمارهای مراجع (میله‌ای عمودی) */}
            <div className="border border-slate-400 rounded-xl p-4 space-y-3 print-avoid-break">
              <h3 className="text-xs font-black bg-slate-100 p-1.5 rounded text-slate-900 border-b border-slate-300">
                ۷. شاخص‌های آماری و پایش سلامت مراجع
              </h3>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {clientDimensionsBarData.map((d, i) => (
                  <div key={i} className="border border-slate-200 p-2 rounded-lg">
                    <span className="block text-[10px] text-slate-600 truncate">{d.label}</span>
                    <strong className="block text-sm font-mono text-slate-900 mt-1">{toPersianDigits(d.value)}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* کادر امضا و تأییدیه */}
            <div className="pt-8 flex items-center justify-between text-xs border-t border-slate-300 print-avoid-break">
              <div>
                <span>مهر و تأیید دبیرخانه مرکز مشاوره بالحق</span>
              </div>
              <div>
                <span>امضای استاد ناظر و مدیر مرکز</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
