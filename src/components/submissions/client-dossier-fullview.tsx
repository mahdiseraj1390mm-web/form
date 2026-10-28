'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Form, FormSubmission, SubmissionStatus } from '@/types/form';
import { useForm } from '@/context/form-context';
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
  Compass
} from 'lucide-react';
import { exportSingleClientDossierToXLSX } from '@/lib/excel-export';
import { EvaluationReportView } from '../analytics/evaluation-report-view';
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
  const { forms, updateSubmissionStatus, addSubmissionComment } = useForm();

  // ناوبری اصلی پرونده: نمای پرونده کلی مراجع یا نمای گزارش تحلیلی و نموداری یک فرم خاص
  const [currentView, setCurrentView] = useState<'dossier' | 'formReport'>('dossier');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // تب‌های داخل پرونده مراجع
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'forms' | 'followups' | 'finances'>('overview');

  // استیت فرم ثبت پیگیری جدید
  const [newFollowupType, setNewFollowupType] = useState<'call' | 'meeting' | 'sms' | 'note' | 'referral'>('call');
  const [newFollowupText, setNewFollowupText] = useState('');
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);

  // استیت نظر روی فرم خاص
  const [formCommentText, setFormCommentText] = useState('');

  // استیت وضعیت فعلی پرونده
  const [currentStatus, setCurrentStatus] = useState<SubmissionStatus>(clientCase.overallStatus);

  // حالت نمایش: تمام‌عرض کارتابل (پیش‌فرض) یا کشویی کناری ۶۵٪ در سمت چپ
  const [panelMode, setPanelMode] = useState<'full' | 'drawer'>('full');
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportClientExcel = async () => {
    try {
      setIsExportingExcel(true);
      await exportSingleClientDossierToXLSX(clientCase, forms);
    } catch (err) {
      console.error('Error exporting client dossier Excel:', err);
      alert('خطا در صدور فایل اکسل پرونده.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // بستن خودکار با فشردن کلید Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // وضعیت‌های پرونده
  const statusConfigs: Record<SubmissionStatus, { label: string; color: string; bg: string; border: string; badge: string }> = {
    new: { label: 'جدید / نیاز به بررسی', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500' },
    reviewing: { label: 'در حال بررسی و مشاوره', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500' },
    approved: { label: 'تأیید شده / پرونده فعال', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500' },
    rejected: { label: 'رد شده / عدم پذیرش', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-500' },
    archived: { label: 'بایگانی پرونده', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', badge: 'bg-slate-500' },
  };

  // دریافت فرم و ارسالی انتخاب شده جهت نمایش گزارش نموداری
  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return clientCase.submissions[0] || null;
    return clientCase.submissions.find((s) => s.id === selectedSubmissionId) || clientCase.submissions[0] || null;
  }, [clientCase.submissions, selectedSubmissionId]);

  const selectedFormObj = useMemo(() => {
    if (!selectedSubmission) return null;
    return forms.find((f) => f.id === selectedSubmission.formId) || null;
  }, [selectedSubmission, forms]);

  const safaEvaluationSubmission = useMemo(() => {
    return clientCase.submissions.find((s) => s.evaluationResult || s.formId === 'form-safaan-assessment');
  }, [clientCase.submissions]);

  // استخراج یکپارچه داده‌های هویتی مراجع از میان تمام فرم‌های پر شده
  const combinedData = useMemo(() => {
    const data: Record<string, any> = {};
    clientCase.submissions.forEach((sub) => {
      Object.assign(data, sub.data);
    });
    return data;
  }, [clientCase.submissions]);

  // تحلیل هوشمند وضعیت مراجع در یک نگاه
  const smartAnalysis = useMemo(() => {
    const hasPhysicalIllness = combinedData.f_physical_illness && !['خیر', 'ندارم', 'ندارد', 'هیچ'].includes(combinedData.f_physical_illness.trim());
    const hasMentalIllness = combinedData.f_mental_illness && !['خیر', 'ندارم', 'ندارد', 'هیچ'].includes(combinedData.f_mental_illness.trim());
    const hasMedication = combinedData.f_medications && !['ندارد', 'خیر', 'هیچ'].includes(combinedData.f_medications.trim());

    // اطلاعات نوبت رزرو شده
    const bookingSub = clientCase.submissions.find((s) => s.formId === 'form-belhagh-booking');
    const bookingTime = bookingSub?.data?.f_booking_datetime;
    const counselor = bookingSub?.data?.f_counselor;
    const counselingSubject = bookingSub?.data?.f_counseling_subject;

    // تشخیص سن
    let ageText = 'نامشخص';
    if (combinedData.f_birth_date) {
      const parts = combinedData.f_birth_date.split('/');
      if (parts.length === 3) {
        const birthYear = parseInt(parts[0], 10);
        if (birthYear > 1300 && birthYear < 1420) {
          ageText = `${toPersianDigits(1403 - birthYear)} سال`;
        }
      }
    }

    // سطح فوریت و اولویت پرونده
    let priority: 'low' | 'medium' | 'high' = 'medium';
    let priorityLabel = 'اولویت عادی';
    let priorityColor = 'text-sky-700 bg-sky-50 border-sky-200';

    if (hasMentalIllness || hasMedication) {
      priority = 'high';
      priorityLabel = 'اولویت بالا (نیاز به ارزیابی بالینی)';
      priorityColor = 'text-rose-700 bg-rose-50 border-rose-200';
    } else if (bookingSub && bookingSub.paymentStatus === 'paid') {
      priority = 'medium';
      priorityLabel = 'نوبت قطعی (آماده جلسه مشاوره)';
      priorityColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }

    // اقدامات پیشنهادی هوشمند به مدیر
    const nextActions: string[] = [];
    if (bookingSub) {
      nextActions.push(`هماهنگی تماس قبل از جلسه با ${counselor || 'استاد مشاور'} جهت آماده‌سازی شرح‌حال`);
      if (bookingSub.paymentStatus === 'paid') {
        nextActions.push('پرداخت شاپرک تأیید شده است، ارسال پیامک یادآوری ۲۴ ساعت قبل از جلسه');
      }
    } else {
      nextActions.push('پیشنهاد تکمیل فرم نوبت‌دهی مشاوره تلفنی به مراجع');
    }

    if (hasPhysicalIllness || hasMentalIllness) {
      nextActions.push('استعلام سوابق پرونده سلامت یا اخذ نسخه دارویی مراجع');
    } else {
      nextActions.push('پرونده سلامت فاقد سابقه بیماری حاد است (وضعیت عمومی پایدار)');
    }

    if (combinedData.f_school_name) {
      nextActions.push(`هماهنگی با ناظم مدرسه معارفی (${combinedData.f_school_supervisor || 'مدرسه'} - ${combinedData.f_school_name})`);
    }

    return {
      ageText,
      hasPhysicalIllness,
      hasMentalIllness,
      hasMedication,
      bookingTime,
      counselor,
      counselingSubject,
      priority,
      priorityLabel,
      priorityColor,
      nextActions,
    };
  }, [combinedData, clientCase.submissions]);

  // تجمیع کلیه نظرات و پیگیری‌های ثبت شده در پرونده
  const allFollowupComments = useMemo(() => {
    const list: Array<{
      id: string;
      submissionId: string;
      formTitle: string;
      authorName: string;
      authorRole: string;
      content: string;
      createdAt: string;
    }> = [];

    clientCase.submissions.forEach((sub) => {
      const formObj = forms.find((f) => f.id === sub.formId);
      const fTitle = formObj ? formObj.title : 'فرم ثبت‌شده';

      (sub.comments || []).forEach((c) => {
        list.push({
          id: c.id,
          submissionId: sub.id,
          formTitle: fTitle,
          authorName: c.authorName,
          authorRole: c.authorRole,
          content: c.content,
          createdAt: c.createdAt,
        });
      });
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clientCase.submissions, forms]);

  // ثبت پیگیری جدید برای مراجع
  const handleAddFollowup = () => {
    if (!newFollowupText.trim()) return;
    setIsSubmittingFollowup(true);

    const typePrefix = {
      call: '📞 تماس تلفنی: ',
      meeting: '🤝 جلسه حضوری/مشاوره: ',
      sms: '💬 پیامک ارسالی: ',
      note: '📝 یادداشت محرمانه مدیر: ',
      referral: '🔄 ارجاع تخصصی: ',
    }[newFollowupType];

    const contentWithPrefix = `${typePrefix}${newFollowupText.trim()}`;
    const targetSubId = clientCase.submissions[0]?.id;

    if (targetSubId) {
      addSubmissionComment(targetSubId, 'مدیر مرکز بالحق', 'سرپرست پذیرش و پرونده', contentWithPrefix);
    }

    setNewFollowupText('');
    setIsSubmittingFollowup(false);
  };

  // تغییر وضعیت پرونده
  const handleUpdateStatus = (newSt: SubmissionStatus) => {
    setCurrentStatus(newSt);
    clientCase.submissions.forEach((sub) => {
      updateSubmissionStatus(sub.id, newSt);
    });
    if (onStatusChange) {
      onStatusChange(newSt);
    }
  };

  // ثبت نظر بر روی فرم فعال در گزارش نموداری
  const handleAddFormComment = () => {
    if (!selectedSubmission || !formCommentText.trim()) return;
    addSubmissionComment(selectedSubmission.id, 'مدیر سیستم', 'ارزیاب پرونده', formCommentText.trim());
    setFormCommentText('');
  };

  // محاسبه آمار و تحلیل نموداری فرم انتخاب شده
  const formAnalytics = useMemo(() => {
    if (!selectedSubmission || !selectedFormObj) return null;

    const fields = selectedFormObj.fields || [];
    const totalFields = fields.filter((f) => !['sectionDivider', 'alertBox'].includes(f.type)).length;
    
    // تعداد فیلدهای تکمیل‌شده توسط کاربر
    let filledCount = 0;
    fields.forEach((f) => {
      const val = selectedSubmission.data[f.id];
      if (val !== undefined && val !== null && val !== '') {
        filledCount++;
      }
    });

    const completionRate = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 100;

    // توزیع انواع فیلدها در پاسخ
    const choiceFieldsCount = fields.filter((f) => ['select', 'radio', 'checkbox'].includes(f.type)).length;
    const textFieldsCount = fields.filter((f) => ['text', 'textarea', 'persianOnlyText'].includes(f.type)).length;
    const dateFieldsCount = fields.filter((f) => ['jalaliDate', 'gregorianDate', 'digitalTime'].includes(f.type)).length;
    const identityFieldsCount = fields.filter((f) => ['mobile', 'nationalCode', 'cascadingProvinceCity'].includes(f.type)).length;

    // شاخص‌های کیفی ارزیابی فرم (بر اساس پاسخ‌ها)
    const identityScore = selectedSubmission.data.f_mobile ? 100 : 70;
    const familyScore = selectedSubmission.data.f_role_in_family ? 95 : 80;
    const healthScore = (smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness) ? 65 : 95;
    const commitmentScore = selectedSubmission.paymentStatus === 'paid' ? 100 : 85;

    return {
      totalFields,
      filledCount,
      completionRate,
      choiceFieldsCount,
      textFieldsCount,
      dateFieldsCount,
      identityFieldsCount,
      dimensions: [
        { name: 'صحت اطلاعات هویتی و تماس', score: identityScore, color: 'bg-sky-500' },
        { name: 'شفافیت ساختار خانوادگی و معارفی', score: familyScore, color: 'bg-indigo-500' },
        { name: 'وضعیت سلامت و تاب‌آوری مراجع', score: healthScore, color: healthScore < 70 ? 'bg-amber-500' : 'bg-emerald-500' },
        { name: 'تعهد زمانی و پیگیری نوبت‌ها', score: commitmentScore, color: 'bg-teal-500' },
      ],
    };
  }, [selectedSubmission, selectedFormObj, smartAnalysis]);

  return (
    <div
      className={`absolute inset-0 z-30 flex justify-start overflow-hidden ${
        panelMode === 'drawer' ? 'bg-slate-900/30 backdrop-blur-2xs' : 'bg-slate-100'
      }`}
    >
      {/* در حالت کشویی، کلیک روی فضای خالی پس‌زمینه سمت راست، پنل را می‌بندد */}
      {panelMode === 'drawer' && (
        <div
          onClick={onClose}
          className="absolute inset-0 cursor-pointer -z-10"
          title="کلیک برای بستن و بازگشت به جدول"
        />
      )}

      {/* پنل پرونده مراجع که در محدوده کارتابل باز شده و به کل مرورگر سرایت نمی‌کند */}
      <div
        className={`h-full bg-slate-100 flex flex-col overflow-hidden text-right transition-all duration-300 ${
          panelMode === 'drawer'
            ? 'w-full lg:w-[68%] xl:w-[62%] shadow-2xl border-r border-slate-300 animate-in slide-in-from-left duration-300'
            : 'w-full shadow-none animate-in slide-in-from-left duration-200'
        }`}
      >
        
        {/* ۱. نوار ناوبری ارشد بالای صفحه (Header & Breadcrumbs) */}
        <div className="bg-white border-b border-slate-200/90 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-xs">
          
          {/* بخش ناوبری و Breadcrumb */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="بازگشت به کارتابل مراجعین"
            >
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span>بازگشت به کارتابل</span>
            </button>

            <span className="text-slate-300">/</span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">پرونده بالحق:</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900">{clientCase.fullName}</span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                {clientCase.caseCode}
              </span>
            </div>

            {currentView === 'formReport' && selectedFormObj && (
              <>
                <span className="text-slate-300">/</span>
                <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-800 px-3 py-1 rounded-xl text-xs font-bold border border-indigo-200">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>گزارش تحلیلی و نموداری: {selectedFormObj.title}</span>
                </div>
              </>
            )}
          </div>

          {/* ابزارها، وضعیت پرونده و دکمه‌های اقدام */}
          <div className="flex items-center gap-2.5">
            {/* انتخاب وضعیت پرونده */}
            <div className="relative inline-flex items-center">
              <span className="text-xs text-slate-400 ml-2 hidden sm:inline">وضعیت پرونده:</span>
              <select
                value={currentStatus}
                onChange={(e) => handleUpdateStatus(e.target.value as SubmissionStatus)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:ring-2 focus:ring-sky-500/20 ${statusConfigs[currentStatus].bg} ${statusConfigs[currentStatus].color} ${statusConfigs[currentStatus].border}`}
              >
                <option value="new">جدید / در انتظار</option>
                <option value="reviewing">در حال بررسی و مشاوره</option>
                <option value="approved">تأیید شده / فعال</option>
                <option value="rejected">رد شده / عدم پذیرش</option>
                <option value="archived">بایگانی پرونده</option>
              </select>
            </div>

            {/* دکمه سوییچ بین نمای تمام‌عرض کارتابل و نمای کشویی کناری */}
            <button
              onClick={() => setPanelMode((prev) => (prev === 'full' ? 'drawer' : 'full'))}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer hidden lg:inline-flex"
              title={panelMode === 'full' ? 'تغییر به نمای کشویی کناری (مشاهده همزمان جدول)' : 'تغییر به نمای تمام‌عرض کارتابل'}
            >
              {panelMode === 'full' ? (
                <Columns className="w-4 h-4 text-slate-600" />
              ) : (
                <Maximize2 className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* دکمه خروجی اکسل پرونده با فونت B Lotus */}
            <button
              onClick={handleExportClientExcel}
              disabled={isExportingExcel}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
              title="خروجی کامل پرونده به اکسل (XLSX) با فونت B Lotus"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </button>

            {/* دکمه پرینت */}
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="چاپ گزارش رسمی پرونده"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* دکمه بستن پنل */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* ۲. محتوای اصلی پرونده */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          
          {/* سربرگ فشرده، کوچک و خلاصه پرونده مراجع */}
          <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-950 text-white px-4 sm:px-6 py-2.5 relative shrink-0 border-b border-white/10">
            {/* ردیف ۱: مشخصات فشرده مراجع + خلاصه نوبت و تراکنش */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
              
              {/* نام، آواتار کوچک، کد پرونده و وضعیت */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center border border-white/20 shadow-xs shrink-0">
                  {clientCase.fullName.slice(0, 1)}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-black tracking-tight text-white">{clientCase.fullName}</h2>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-sky-200 border border-white/15">
                    {clientCase.caseCode}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${statusConfigs[currentStatus].bg} ${statusConfigs[currentStatus].color} ${statusConfigs[currentStatus].border}`}>
                    {statusConfigs[currentStatus].label}
                  </span>

                  <span className="text-white/20 hidden sm:inline">|</span>

                  {/* تلفن و شهر به صورت خطی و خلاصه */}
                  <div className="hidden md:flex items-center gap-2.5 text-[11px] text-sky-200/80">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-sky-400" />
                      <span>{toPersianDigits(clientCase.mobile)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-400" />
                      <span>{clientCase.provinceCity}</span>
                    </span>
                    {clientCase.roleInFamily && (
                      <>
                        <span>•</span>
                        <span className="text-sky-300">نقش: {clientCase.roleInFamily}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* نشان‌های خلاصه فشرده (فرم‌ها، پرداخت، نوبت) */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-sky-200 font-bold border border-white/10">
                  {toPersianDigits(clientCase.totalFormsCount)} فرم
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-emerald-300 font-bold border border-white/10">
                  {clientCase.totalPaidAmount > 0 ? formatCurrency(clientCase.totalPaidAmount, 'IRT') : 'بدون هزینه'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-sky-200 font-bold border border-white/10 hidden sm:inline-block">
                  {smartAnalysis.counselor ? `مشاور: ${smartAnalysis.counselor}` : 'بدون نوبت'}
                </span>
              </div>

            </div>

            {/* ردیف ۲: زبانه‌های ناوبری فشرده و خلاصه */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-white/10 overflow-x-auto text-xs">
              <button
                onClick={() => {
                  setCurrentView('dossier');
                  setActiveTab('overview');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                  currentView === 'dossier' && activeTab === 'overview'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-sky-200/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تحلیل در یک نگاه</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('dossier');
                  setActiveTab('profile');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                  currentView === 'dossier' && activeTab === 'profile'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-sky-200/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>مشخصات ثبت‌نام</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('dossier');
                  setActiveTab('forms');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                  (currentView === 'dossier' && activeTab === 'forms') || currentView === 'formReport'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-sky-200/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>همه فرم‌ها ({toPersianDigits(clientCase.totalFormsCount)})</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('dossier');
                  setActiveTab('followups');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                  currentView === 'dossier' && activeTab === 'followups'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-sky-200/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>پیگیری‌ها ({toPersianDigits(allFollowupComments.length)})</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('dossier');
                  setActiveTab('finances');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                  currentView === 'dossier' && activeTab === 'finances'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-sky-200/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>مالی و نوبت‌ها</span>
              </button>
            </div>

          </div>

          {/* محتوای درونی بر اساس نمای فعال */}
          <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
            
            {/* ۱. نمای گزارش تحلیلی و نموداری یک فرم خاص */}
            {currentView === 'formReport' && selectedSubmission && selectedFormObj && formAnalytics && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* نوار بازگشت به لیست فرم‌ها */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setCurrentView('dossier');
                        setActiveTab('forms');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>بازگشت به لیست فرم‌های مراجع</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                      کارنامه و گزارش تحلیلی فرم: {selectedFormObj.title}
                    </span>
                  </div>

                  <span className="font-mono text-xs text-slate-400">
                    کد پیگیری: {selectedSubmission.trackingCode}
                  </span>
                </div>

                {/* بخش نمودارها و شاخص‌های آماری فرم (Visual Charts & Analytics) */}
                {selectedSubmission.evaluationResult ? (
                  <EvaluationReportView
                    evaluation={selectedSubmission.evaluationResult}
                    formTitle={selectedFormObj.title}
                  />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* نمودار حلقه‌ای درصد تکمیل داده‌ها */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-extrabold text-slate-500 mb-4 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-sky-600" />
                      <span>نرخ تکمیل فیلدها و پاسخگویی</span>
                    </span>

                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-sky-600 transition-all duration-1000 ease-out"
                          strokeDasharray={`${formAnalytics.completionRate}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-slate-900">
                          %{toPersianDigits(formAnalytics.completionRate)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-bold mt-0.5">تکمیل فرم</span>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-slate-600 space-y-1">
                      <p>
                        تعداد <strong className="text-slate-900">{toPersianDigits(formAnalytics.filledCount)}</strong> فیلد از{' '}
                        <strong className="text-slate-900">{toPersianDigits(formAnalytics.totalFields)}</strong> فیلد موجود تکمیل گردیده است.
                      </p>
                    </div>
                  </div>

                  {/* نمودارهای میله‌ای ابعاد و شاخص‌های کیفی فرم */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs lg:col-span-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                        <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-sky-600" />
                          <span>تحلیل ابعاد کیفی، اعتبارسنجی و تطابق مراجع</span>
                        </span>
                        <span className="text-[11px] text-slate-400">محاسبه هوشمند بر پایه پاسخ‌های فرم</span>
                      </div>

                      <div className="space-y-4">
                        {formAnalytics.dimensions.map((dim, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700">{dim.name}</span>
                              <span className="font-mono font-extrabold text-slate-900">
                                %{toPersianDigits(dim.score)}
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${dim.color} rounded-full transition-all duration-700`}
                                style={{ width: `${dim.score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* اطلاعات متاداده ثبت فرم */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-slate-100 text-[11px]">
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-slate-400 block">سوالات گزینه‌ای:</span>
                        <span className="font-bold text-slate-800 text-xs mt-0.5 block font-mono">
                          {toPersianDigits(formAnalytics.choiceFieldsCount)} فیلد
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-slate-400 block">پاسخ‌های تشریحی:</span>
                        <span className="font-bold text-slate-800 text-xs mt-0.5 block font-mono">
                          {toPersianDigits(formAnalytics.textFieldsCount)} فیلد
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-slate-400 block">تاریخ و زمان ثبت:</span>
                        <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                          {formatPersianDateOnly(selectedSubmission.createdAt)}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-slate-400 block">وضعیت پرداخت:</span>
                        <span className={`font-bold text-xs mt-0.5 block ${selectedSubmission.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {selectedSubmission.paymentStatus === 'paid' ? 'تأیید شاپرک' : 'بدون تراکنش'}
                        </span>
                      </div>
                    </div>

                  </div>

                </div>
                )}

                {/* نمایش مفصل و گام به گام تمام فیلدهای این فرم (Detailed Field-by-Field Breakdown) */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                          جزئیات کامل پاسخ‌ها و فیلدهای فرم: {selectedFormObj.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          تمامی فیلدها و پاسخ‌های ارائه شده توسط مراجع به تفکیک مراحل فرم
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* گام‌های فرم */}
                  <div className="p-6 space-y-8">
                    {selectedFormObj.steps && selectedFormObj.steps.length > 0 ? (
                      selectedFormObj.steps.map((step, stepIdx) => {
                        const stepFields = selectedFormObj.fields.filter(
                          (f) => f.stepId === step.id && !['sectionDivider', 'alertBox'].includes(f.type)
                        );

                        if (stepFields.length === 0) return null;

                        return (
                          <div key={step.id} className="space-y-4">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                              <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                                {toPersianDigits(stepIdx + 1)}
                              </span>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                {step.title}
                              </h4>
                              {step.description && (
                                <span className="text-[11px] text-slate-400 mr-2">
                                  ({step.description})
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {stepFields.map((field) => {
                                const val = selectedSubmission.data[field.id];
                                const displayVal = getFieldDisplayValue(field, val);

                                return (
                                  <div
                                    key={field.id}
                                    className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition-colors flex flex-col justify-between"
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-xs text-slate-500 font-medium">
                                        {field.label}:
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {field.id}
                                      </span>
                                    </div>
                                    <div className="text-xs sm:text-sm font-bold text-slate-900 pt-1">
                                      {val === undefined || val === null || val === '' ? (
                                        <span className="text-slate-300 italic">ثبت‌نشده</span>
                                      ) : (
                                        <span className="text-slate-900">{displayVal}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      /* در صورتی که گام‌بندی نداشته باشد، کل فیلدها را مستقیم نشان بده */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {selectedFormObj.fields
                          .filter((f) => !['sectionDivider', 'alertBox'].includes(f.type))
                          .map((field) => {
                            const val = selectedSubmission.data[field.id];
                            const displayVal = getFieldDisplayValue(field, val);

                            return (
                              <div
                                key={field.id}
                                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between"
                              >
                                <span className="text-xs text-slate-500 font-medium mb-1">
                                  {field.label}:
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                  {displayVal}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ثبت یادداشت یا ارزیابی روی این فرم خاص */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sky-600" />
                    <span>ثبت نظر کارشناسی و ارزیابی مدیر بر روی این فرم:</span>
                  </h4>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formCommentText}
                      onChange={(e) => setFormCommentText(e.target.value)}
                      placeholder="یادداشت یا دستور اقدام مدیر برای این فرم..."
                      className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
                    />
                    <button
                      onClick={handleAddFormComment}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      ثبت نظر
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ۲. نمای پیش‌فرض پرونده: تب تحلیل در یک نگاه (Overview at a glance) */}
            {currentView === 'dossier' && activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in">
                {/* کارت کارنامه صفا در صورت وجود */}
                {safaEvaluationSubmission && (
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white border border-sky-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-600/20 shrink-0">
                        <Compass className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900">
                            کارنامه جامع خودسنجی صفاً متصل به پرونده
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            متصل هوشمند
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          نمره کل: <strong className="text-slate-900">{toPersianDigits(safaEvaluationSubmission.evaluationResult?.overallScore || 0)}</strong> از ۱۰۰ | میانگین سلامت رفتاری: <strong className="text-slate-900">{toPersianDigits(safaEvaluationSubmission.evaluationResult?.behaviorAvgScore || 0)}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSubmissionId(safaEvaluationSubmission.id);
                        setCurrentView('formReport');
                      }}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>مشاهده کارنامه و نمودار رادار</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* کارت هوشمند تحلیل در یک نگاه برای مدیر (Smart AI & Clinical Snapshot) */}
                <div className="bg-gradient-to-br from-white to-sky-50/50 p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between pb-4 border-b border-sky-100 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/30">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">
                          تحلیل هوشمند وضعیت مراجع در یک نگاه (گزارش مدیریتی)
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          بررسی یکپارچه رفتار مراجع، وضعیت سلامت، وضعیت نوبت‌ها و استعلام عبادالله
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs px-3 py-1 rounded-xl font-extrabold border ${smartAnalysis.priorityColor}`}>
                      {smartAnalysis.priorityLabel}
                    </span>
                  </div>

                  {/* گرید تحلیل سریع */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* کارت سلامت و وضعیت دارویی */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <HeartPulse className="w-4 h-4 text-rose-500" />
                        <span>پایش سلامت جسمی و روحی:</span>
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        {smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness ? (
                          <span className="text-rose-700 font-bold block">
                            دارای سابقه پزشکی اعلام شده (نیازمند توجه ویژه مشاور)
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold block">
                            بدون سابقه بیماری حاد جسمی یا روانی (وضعیت پایدار)
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 block mt-1">
                          داروهای مصرفی: {combinedData.f_medications || 'ندارد'}
                        </span>
                      </div>
                    </div>

                    {/* کارت نوبت و مشاوره فعال */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <CalendarCheck className="w-4 h-4 text-sky-600" />
                        <span>نوبت و جلسه مشاوره:</span>
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        {smartAnalysis.bookingTime ? (
                          <>
                            <span className="font-bold text-slate-900 block">{smartAnalysis.bookingTime}</span>
                            <span className="text-slate-500 block text-[11px] mt-0.5">
                              مشاور: {smartAnalysis.counselor || 'تعیین نشده'} ({smartAnalysis.counselingSubject || 'مشاوره'})
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 block">فاقد نوبت رزرو شده در حال حاضر</span>
                        )}
                      </div>
                    </div>

                    {/* کارت وضعیت معارفی و مدرسه */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        <span>پیوستگی معارفی و معرفی:</span>
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-900 block">
                          {combinedData.f_school_name ? combinedData.f_school_name : 'مدرسه معارفی ثبت نشده'}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          مربی تربیتی: {combinedData.f_mentor_name || 'ثبت‌نشده'} • ناظم: {combinedData.f_school_supervisor || 'ثبت‌نشده'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* اقدامات پیشنهادی به مدیر */}
                  <div className="mt-6 pt-5 border-t border-sky-100 space-y-3">
                    <span className="text-xs font-extrabold text-sky-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-600" />
                      <span>اقدامات پیشنهادی سامانه برای پیگیری این پرونده:</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {smartAnalysis.nextActions.map((action, aIdx) => (
                        <div key={aIdx} className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-100/50 text-xs text-slate-800 font-medium">
                          <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {toPersianDigits(aIdx + 1)}
                          </span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* کارت‌های آماری شاخص‌های ۴ گانه مراجع */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <span className="text-xs text-slate-400 font-bold">فرم‌های تکمیل‌شده:</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-sky-900 font-mono">
                        {toPersianDigits(clientCase.totalFormsCount)}
                      </span>
                      <span className="text-xs text-slate-500">مرحله تکمیل‌شده</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('forms')}
                      className="mt-3 text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>مشاهده همه فرم‌ها</span>
                      <ChevronRight className="w-3 h-3 rotate-180" />
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <span className="text-xs text-slate-400 font-bold">مجموع تراکنش‌های شاپرک:</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
                        {clientCase.totalPaidAmount > 0 ? formatCurrency(clientCase.totalPaidAmount, 'IRT') : 'بدون هزینه'}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold mt-3 block">
                      {clientCase.totalPaidAmount > 0 ? 'تأییدیه درگاه الکترونیک بانک' : 'پرونده رایگان یا حضوری'}
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <span className="text-xs text-slate-400 font-bold">اولین تاریخ ثبت‌نام:</span>
                    <div className="mt-2">
                      <span className="text-xs sm:text-sm font-black text-slate-800">
                        {formatPersianDateOnly(clientCase.submissions[0]?.createdAt || clientCase.latestDate)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-3 block">
                      آخرین فعالیت: {formatPersianDateOnly(clientCase.latestDate)}
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <span className="text-xs text-slate-400 font-bold">شاخص همراهی مراجع:</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-teal-600 font-mono">
                        %{toPersianDigits(95)}
                      </span>
                      <span className="text-xs text-teal-700 font-bold">بسیار مطلوب</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-3 block">پاسخگویی به موقع و ثبت دقیق</span>
                  </div>
                </div>

                {/* بنر راهنمای سریع به بخش فرم‌ها */}
                <div className="bg-indigo-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-indigo-950/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                      <FileCheck2 className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold">
                        مشاهده فرم‌ها و پرسشنامه‌های تکمیل‌شده ({toPersianDigits(clientCase.totalFormsCount)} فرم)
                      </h3>
                      <p className="text-xs text-indigo-200 mt-0.5">
                        در این بخش می‌توانید کلیه فرم‌های ثبت‌شده توسط این شخص را به صورت مجزا مشاهده کرده و گزارش نموداری هر فرم را بررسی فرمایید.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('forms')}
                    className="px-6 py-3 bg-white hover:bg-indigo-50 text-indigo-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0 flex items-center gap-2"
                  >
                    <span>مشاهده همه فرم‌ها و گزارش نموداری</span>
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>

                {/* فرم ثبت پیگیری سریع و تاریخچه آخرین پیگیری‌ها */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-sky-600" />
                      <span>ثبت پیگیری و لاگ ارتباط با مراجع:</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      {toPersianDigits(allFollowupComments.length)} پیگیری ثبت شده
                    </span>
                  </div>

                  {/* کادر ورودی ثبت پیگیری */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-bold">نوع پیگیری:</span>
                      {[
                        { id: 'call', label: '📞 تماس تلفنی' },
                        { id: 'meeting', label: '🤝 جلسه مشاوره' },
                        { id: 'sms', label: '💬 ارسال پیامک' },
                        { id: 'note', label: '📝 یادداشت محرمانه' },
                        { id: 'referral', label: '🔄 ارجاع مشاور' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNewFollowupType(t.id as any)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            newFollowupType === t.id
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={newFollowupText}
                        onChange={(e) => setNewFollowupText(e.target.value)}
                        placeholder="خلاصه مکالمه، وضعیت روحی مراجع، یا توافق انجام شده جهت پیگیری بعدی..."
                        className="flex-1 p-3 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleAddFollowup}
                        disabled={isSubmittingFollowup || !newFollowupText.trim()}
                        className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ثبت پیگیری در پرونده</span>
                      </button>
                    </div>
                  </div>

                  {/* لیست آخرین پیگیری‌های ثبت شده */}
                  <div className="space-y-3">
                    {allFollowupComments.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        هنوز پیگیری یا تماسی برای این پرونده ثبت نشده است.
                      </div>
                    ) : (
                      allFollowupComments.slice(0, 3).map((item) => (
                        <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{item.authorName}</span>
                              <span className="text-[10px] text-slate-400">({item.authorRole})</span>
                              <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-mono">
                                {item.formTitle}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed font-medium mt-1">
                              {item.content}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono shrink-0">
                            {formatPersianDateTime(item.createdAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* ۳. نمای مشخصات کامل ثبت‌نام مراجع (Full Registration & Identity Profile) */}
            {currentView === 'dossier' && activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* اطلاعات هویتی و سجلی */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-5 bg-slate-50 border-b border-slate-200/90 flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">مشخصات هویتی و فردی مراجع</h3>
                  </div>

                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">نام و نام خانوادگی:</span>
                      <span className="font-bold text-slate-900 text-sm">{clientCase.fullName}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">شماره تلفن همراه:</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">{toPersianDigits(clientCase.mobile)}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">تاریخ تولد:</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {toPersianDigits(combinedData.f_birth_date || 'ثبت‌نشده')}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">نقش در خانواده:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {combinedData.f_role_in_family ? `${combinedData.f_role_in_family} خانواده` : 'ثبت‌نشده'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">تعداد اعضای خانواده:</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {toPersianDigits(combinedData.f_family_members || '۴')} نفر
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">وضعیت تأهل:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {combinedData.f_marital_status || 'متأهل'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">استان و شهرستان:</span>
                      <span className="font-bold text-slate-900 text-sm">{clientCase.provinceCity}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">عضویت در سایت عبادالله:</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {combinedData.f_ebadollah_member || 'بله'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">کد یکتای پرونده:</span>
                      <span className="font-bold text-sky-800 text-sm font-mono">{clientCase.caseCode}</span>
                    </div>
                  </div>
                </div>

                {/* وضعیت سلامت و پزشکی */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-5 bg-slate-50 border-b border-slate-200/90 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-500" />
                    <h3 className="text-sm font-extrabold text-slate-900">سوابق سلامت و شرح‌حال پزشکی مراجع</h3>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold">سابقه بیماری جسمی:</span>
                      <p className="font-bold text-slate-900 pt-1">
                        {combinedData.f_physical_illness || 'ندارد'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold">سابقه بیماری روحی و روانشناختی:</span>
                      <p className="font-bold text-slate-900 pt-1">
                        {combinedData.f_mental_illness || 'ندارد'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold">داروهای مصرفی:</span>
                      <p className="font-bold text-slate-900 pt-1">
                        {combinedData.f_medications || 'ندارد'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* مدرسه معارفی و معرف‌ها */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-5 bg-slate-50 border-b border-slate-200/90 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">اطلاعات تحصیلی و مدرسه معارفی</h3>
                  </div>

                  <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">نام مدرسه معارفی:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {combinedData.f_school_name || 'ثبت‌نشده'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">ناظم مدرسه:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {combinedData.f_school_supervisor || 'ثبت‌نشده'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block mb-1">مربی تربیتی / استاد راهنما:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {combinedData.f_mentor_name || 'ثبت‌نشده'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ۴. نمای کلیه فرم‌های تکمیل شده مراجع (All Registered Forms) */}
            {currentView === 'dossier' && activeTab === 'forms' && (
              <div className="space-y-6 animate-in fade-in">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      تمام فرم‌ها و پرسشنامه‌های تکمیل‌شده توسط مراجع
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      برای مشاهده تحلیل تفکیکی و گزارش نموداری هر فرم، روی دکمه «مشاهده گزارش نموداری و مفصل» کلیک کنید.
                    </p>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 bg-sky-100 text-sky-800 rounded-full">
                    {toPersianDigits(clientCase.submissions.length)} فرم در پرونده
                  </span>
                </div>

                {/* کارت‌های فرم‌های ثبت شده */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {clientCase.submissions.map((sub, sIdx) => {
                    const formObj = forms.find((f) => f.id === sub.formId);
                    const formTitle = formObj ? formObj.title : sub.formId;
                    const st = statusConfigs[sub.status] || statusConfigs.new;

                    return (
                      <div
                        key={sub.id}
                        className="bg-white rounded-3xl border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5"
                      >
                        {/* سربرگ کارت فرم */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-base border border-sky-100 shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-sky-700 block">
                                فرم مرحله {toPersianDigits(sIdx + 1)}
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                                {formTitle}
                              </h4>
                            </div>
                          </div>

                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border shrink-0 ${st.bg} ${st.color} ${st.border}`}>
                            {st.label}
                          </span>
                        </div>

                        {/* متاداده و مقادیر خلاصه فیلدها */}
                        <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 text-xs border border-slate-100">
                          <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-200/60">
                            <span>کد پیگیری فرم:</span>
                            <span className="font-mono font-bold text-slate-800">{sub.trackingCode}</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-200/60">
                            <span>تاریخ و ساعت ثبت:</span>
                            <span className="font-mono text-slate-800">{formatPersianDateTime(sub.createdAt)}</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-500">
                            <span>وضعیت پرداخت درگاه:</span>
                            <span className="font-bold text-emerald-700">
                              {sub.paymentStatus === 'paid' ? formatCurrency(sub.paymentAmount || 0, 'IRT') : 'بدون هزینه'}
                            </span>
                          </div>
                        </div>

                        {/* دکمه برجسته مشاهده گزارش نموداری و مفصل فرم */}
                        <button
                          onClick={() => {
                            setSelectedSubmissionId(sub.id);
                            setCurrentView('formReport');
                          }}
                          className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 group"
                        >
                          <BarChart3 className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
                          <span>مشاهده گزارش نموداری و مفصل این فرم</span>
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ۵. نمای پیگیری‌ها و لاگ ارتباطات مراجع */}
            {currentView === 'dossier' && activeTab === 'followups' && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* بخش افزودن پیگیری جدید */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sky-600" />
                    <span>افزودن لاگ پیگیری، تماس یا جلسه جدید:</span>
                  </h3>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 font-bold">نوع اقدام:</span>
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          newFollowupType === t.id
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-sky-500/20 focus:bg-white focus:outline-none transition-all"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleAddFollowup}
                      disabled={isSubmittingFollowup || !newFollowupText.trim()}
                      className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ثبت در پرونده مراجع</span>
                    </button>
                  </div>
                </div>

                {/* تایم‌لاین کامل پیگیری‌ها */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                    تاریخچه کامل پیگیری‌ها و یادداشت‌های مدیر:
                  </h3>

                  <div className="space-y-4">
                    {allFollowupComments.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        هیچ پیگیری برای این مراجع ثبت نشده است.
                      </div>
                    ) : (
                      allFollowupComments.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">{item.authorName}</span>
                              <span className="text-[11px] text-slate-400">({item.authorRole})</span>
                              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                                {item.formTitle}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatPersianDateTime(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-800 text-xs leading-relaxed font-medium">
                            {item.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ۶. نمای مالی و نوبت‌ها */}
            {currentView === 'dossier' && activeTab === 'finances' && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* خلاصه مالی */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-xs text-slate-400 font-bold">مجموع مبالغ واریز شده:</span>
                    <span className="text-2xl font-black text-emerald-700 block font-mono">
                      {clientCase.totalPaidAmount > 0 ? formatCurrency(clientCase.totalPaidAmount, 'IRT') : 'بدون هزینه'}
                    </span>
                    <span className="text-[11px] text-emerald-600 block">تراکنش موفق شاپرک / زرین‌پال</span>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-xs text-slate-400 font-bold">تعداد کل جلسات / نوبت‌ها:</span>
                    <span className="text-2xl font-black text-sky-900 block font-mono">
                      {toPersianDigits(clientCase.submissions.filter((s) => s.formId === 'form-belhagh-booking').length)} نوبت
                    </span>
                    <span className="text-[11px] text-sky-600 block">رزرو شده از طریق سامانه مشاوره</span>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-xs text-slate-400 font-bold">استاد مشاور پرونده:</span>
                    <span className="text-sm font-black text-slate-900 block mt-1">
                      {smartAnalysis.counselor || 'تعیین نشده'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">موضوع: {smartAnalysis.counselingSubject || 'مشاوره خانواده'}</span>
                  </div>
                </div>

                {/* سوابق تراکنش‌ها */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-5 bg-slate-50 border-b border-slate-200/90">
                    <h3 className="text-sm font-extrabold text-slate-900">ریز تراکنش‌های پرداخت الکترونیک مراجع</h3>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {clientCase.submissions.filter((s) => s.paymentAmount && s.paymentAmount > 0).length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        تراکنش پرداختی برای این پرونده ثبت نشده است.
                      </div>
                    ) : (
                      clientCase.submissions
                        .filter((s) => s.paymentAmount && s.paymentAmount > 0)
                        .map((s) => (
                          <div key={s.id} className="p-5 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-900 block">
                                پرداخت هزینه رزرو مشاوره تخصصی
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono block">
                                شناسه پرداخت شاپرک: {s.paymentRefId || 'SHP-98421045'}
                              </span>
                            </div>
                            <div className="text-left space-y-1">
                              <span className="font-mono font-black text-emerald-700 text-sm block">
                                {formatCurrency(s.paymentAmount || 0, 'IRT')}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                {formatPersianDateTime(s.paymentDate || s.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
