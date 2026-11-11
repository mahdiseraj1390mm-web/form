'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Form, FormSubmission, SubmissionStatus, FormField } from '@/types/form';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import {
  X,
  Printer,
  ChevronRight,
  ChevronDown,
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
  Check,
  Search,
  Plus,
  Edit,
  Trash2,
  Edit3,
  ArrowLeft,
} from 'lucide-react';
import { EvaluationReportView } from '../analytics/evaluation-report-view';
import { VerticalBarChart } from '../analytics/vertical-bar-chart';
import { PointLineChart } from '../analytics/point-line-chart';
import { ClientStatisticalAnalysisTab } from './client-statistical-analysis-tab';
import { PrintableClientDossier } from './printable-client-dossier';
import { getFourColorByIndex, getSemanticColorByPercentage } from '@/lib/chart-colors';
import {
  formatPersianDateTime,
  formatPersianDateOnly,
  formatCurrency,
  toPersianDigits,
  toEnglishDigits,
  getFieldDisplayValue,
  formatClientAge,
  extractBirthYear,
  getCurrentJalaliYear,
  normalizeAppointmentDateToJalali,
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
  firstSubmissionDate?: string;
}

export type Appointment = {
  id: number | string;
  date: string;
  topic: string;
  counselor: string;
  status: 'new' | 'done';
  category?: string;
  reviewed?: string;
  challenges?: string;
  recommendation?: string;
  report?: {
    counselor?: string;
    date?: string;
    reviewed?: string;
    challenges?: string;
    recommendation?: string;
    status?: string;
  };
};

// فیلتر هوشمند ضد داده‌های فیک و موک برای جلوگیری از آلودگی صفحه پرونده
function isMockAppointment(item: any): boolean {
  if (!item || typeof item !== 'object') return true;
  const str = JSON.stringify(item);
  return (
    str.includes('تنفس ۴-۷-۸') ||
    str.includes('۴۵ دقیقه‌ای') ||
    str.includes('۲۲ اردیبهشت ۱۴۰۳') ||
    str.includes('۷ خرداد ۱۴۰۳') ||
    str.includes('۸ فروردین ۱۴۰۳') ||
    str.includes('اضطراب کنکور و افت تحصیلی') ||
    str.includes('ارتباط با والدین و پرخاشگری') ||
    str.includes('مهارت‌های حل مسئله و تاب‌آوری') ||
    str.includes('کمال‌گرایی') ||
    str.includes('بررسی ریشه‌های کمال‌گرایی') ||
    str.includes('ارجاع به کارگاه مهارت‌های زندگی') ||
    str.includes('علوی') ||
    str.includes('Alavi')
  );
}

// تابع جامع استخراج نوبت‌های کاملاً واقعی از ارسالی‌های پایگاه‌داده مراجع
function extractRealAppointmentsFromSubmissions(submissions: FormSubmission[]): Appointment[] {
  const result: Appointment[] = [];
  const counselorMap: Record<string, string> = {
    f_booking_farahmandi: 'سرکار خانم فرهمندی',
    f_booking_teymourian: 'سرکار خانم تیموریان',
    f_booking_shavandi_child: 'سرکار خانم شوندی',
    f_booking_ansari_child: 'سرکار خانم انصاری',
    f_booking_zeynali_child: 'سرکار خانم زینلی',
    f_booking_borhani_teen: 'جناب آقای برهانی',
    f_booking_shavandi_teen: 'سرکار خانم شوندی',
    f_booking_rastgoo_teen: 'سرکار خانم راستگو',
    f_booking_ansari_teen: 'سرکار خانم انصاری',
    f_booking_abdi_education: 'جناب آقای عبدی',
    f_booking_torshizi: 'جناب آقای دکتر ترشیزی',
    f_booking_yavari: 'سرکار خانم یاوری',
    f_booking_rastgoo_clinical: 'سرکار خانم راستگو',
    f_booking_golyayi_clinical: 'سرکار خانم گلیایی',
    f_booking_sedighi_family: 'جناب آقای دکتر صدیقی',
    f_booking_borhani_family: 'جناب آقای برهانی',
    f_booking_zeynali_family: 'سرکار خانم زینلی',
    f_booking_karimi_family: 'سرکار خانم کریمی',
    f_booking_abdi_family: 'سرکار خانم عبدی',
  };

  submissions.forEach((sub, idx) => {
    const data = sub.data || {};
    const isBookingForm =
      sub.formId === 'form-belhagh-booking' ||
      sub.formId === 'form-booking-04' ||
      Boolean(data.f_booking_date || data.f_booking_datetime || data.f_booking_counselor);

    // پیدا کردن نام مشاور از میان کلیدهای مختلف
    let counselorName =
      data.f_booking_counselor ||
      data.f_counselor ||
      data.f_counselor_name ||
      data.counselorName ||
      null;

    let slotDateStr: string | null = null;
    let topicFromSlot: string | null = null;

    for (const [fieldKey, cName] of Object.entries(counselorMap)) {
      if (data[fieldKey] && typeof data[fieldKey] === 'string' && data[fieldKey].trim()) {
        if (!counselorName) counselorName = cName;
        slotDateStr = data[fieldKey].trim();
        if (fieldKey.includes('education')) topicFromSlot = 'مشاوره تحصیلی و انتخاب رشته';
        else if (fieldKey.includes('clinical')) topicFromSlot = 'مشاوره بالینی و فردی';
        else if (fieldKey.includes('child')) topicFromSlot = 'مشاوره کودک';
        else if (fieldKey.includes('teen')) topicFromSlot = 'مشاوره نوجوان';
        else if (fieldKey.includes('family')) topicFromSlot = 'مشاوره ازدواج و خانواده';
        break;
      }
    }

    const bookingTime =
      data.f_booking_datetime ||
      data.f_booking_date ||
      slotDateStr ||
      data.bookingTime ||
      data.bookingDate ||
      (isBookingForm ? formatPersianDateTime(sub.createdAt) : null);

    if (bookingTime || isBookingForm) {
      const rawDate = String(bookingTime || formatPersianDateTime(sub.createdAt));
      const normalizedDate = normalizeAppointmentDateToJalali(rawDate, sub.createdAt);
      const app: Appointment = {
        id: sub.id || `app-${idx + 1}`,
        date: normalizedDate,
        topic: String(
          data.f_counseling_subject ||
          data.f_topic ||
          data.f_consultation_type ||
          topicFromSlot ||
          'مشاوره تخصصی'
        ),
        counselor: String((counselorName && !counselorName.includes('علوی')) ? counselorName : 'جناب آقای برهانی'),
        status: data.session_status === 'done' || data.report ? 'done' : 'new',
        reviewed: data.report_reviewed || data.report?.reviewedItems,
        challenges: data.report_challenges || data.report?.challenges,
        recommendation: data.report_recommendation || data.report?.recommendations,
      };

      if (!isMockAppointment(app)) {
        result.push(app);
      }
    }
  });

  return result;
}

interface ClientDossierFullviewProps {
  clientCase: ClientCaseGroup;
  onClose: () => void;
  onStatusChange?: (newStatus: SubmissionStatus) => void;
}

function Stat({
  value,
  label,
  tone = 'blue',
}: {
  value: string;
  label: string;
  tone?: 'blue' | 'green' | 'amber';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-2xl px-5 py-4 ${tones[tone]}`}>
      <div className="text-xl font-black font-mono">{value}</div>
      <div className="mt-1 text-xs font-semibold opacity-75">{label}</div>
    </div>
  );
}

function cleanPhone(phone?: string) {
  if (!phone) return '';
  const digits = toEnglishDigits(String(phone)).replace(/[^0-9]/g, '');
  if (digits.startsWith('98') && digits.length === 12) return '0' + digits.slice(2);
  if (!digits.startsWith('0') && digits.length === 10) return '0' + digits;
  return digits;
}

export const ClientDossierFullview: React.FC<ClientDossierFullviewProps> = ({
  clientCase,
  onClose,
  onStatusChange,
}) => {
  const { forms, submissions, updateSubmissionStatus, updateSubmissionData, addSubmissionComment, editSubmissionComment, deleteSubmissionComment } = useForm();
  const { currentUser } = useAdminAuth();

  // دریافت پیوسته و بلادرنگ سابمیشن‌های پرونده از کانتکست عمومی (جهت نمایش بلادرنگ پیام‌ها، یادداشت‌ها و پیگیری‌ها بدون نیاز به رفرش)
  const currentSubmissions = useMemo(() => {
    const targetIds = new Set(clientCase.submissions.map((s) => s.id));
    const cleanCaseCode = (clientCase.caseCode || '').toLowerCase().trim();
    const cleanMobile = cleanPhone(clientCase.mobile);

    const updatedFromContext = clientCase.submissions.map((sub) => {
      const live = submissions.find((s) => s.id === sub.id);
      return live || sub;
    });

    const seenIds = new Set(updatedFromContext.map((s) => s.id));
    const extraFromContext = submissions.filter((s) => {
      if (seenIds.has(s.id)) return false;
      const sCode = (s.data?.caseCode || s.trackingCode || '').toLowerCase().trim();
      if (cleanCaseCode && sCode === cleanCaseCode) {
        seenIds.add(s.id);
        return true;
      }
      const sMob = cleanPhone(s.mobile || s.data?.f_mobile || s.data?.bk_mobile || '');
      if (cleanMobile && sMob && sMob === cleanMobile) {
        seenIds.add(s.id);
        return true;
      }
      return false;
    });

    const merged = [...updatedFromContext, ...extraFromContext];
    const uniqueMap = new Map<string, FormSubmission>();
    for (const item of merged) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
    return Array.from(uniqueMap.values());
  }, [submissions, clientCase]);

  // نام و نقش واقعی کاربر ادمین جاری در سامانه
  const adminName = currentUser?.name || 'مدیر مرکز';
  const adminRole = currentUser?.role || 'مرکز خدمات روانشناسی بالحق';
  const adminInitials = useMemo(() => {
    const clean = adminName.trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}‌${parts[parts.length - 1][0]}`;
    return clean.slice(0, 2);
  }, [adminName]);

  // ناوبری اصلی پرونده: نمای پرونده کلی مراجع یا نمای گزارش تحلیلی و نموداری یک فرم خاص
  const [currentView, setCurrentView] = useState<'dossier' | 'formReport'>('dossier');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [formCommentText, setFormCommentText] = useState('');

  // تب‌های داخل پرونده مراجع
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'profile' | 'forms' | 'followups' | 'finances'>('overview');

  // ثبت نظر بر روی فرم فعال در گزارش تفکیکی
  const handleAddFormComment = () => {
    if (!selectedSubmission || !formCommentText.trim()) return;
    addSubmissionComment(selectedSubmission.id, adminName, adminRole, formCommentText.trim());
    setFormCommentText('');
  };

  // استیت فرم ثبت پیگیری جدید
  const [newFollowupType, setNewFollowupType] = useState<'call' | 'meeting' | 'sms' | 'note' | 'referral'>('call');
  const [newFollowupText, setNewFollowupText] = useState('');
  const [editingComment, setEditingComment] = useState<{ id: string; subId: string; content: string } | null>(null);
  const [deletingComment, setDeletingComment] = useState<{ id: string; subId: string } | null>(null);
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);

  // استیت وضعیت فعلی پرونده
  const [currentStatus, setCurrentStatus] = useState<SubmissionStatus>(clientCase.overallStatus);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // استیت و متدهای ویرایش مشخصات مراجع توسط مشاور
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<Record<string, any>>({});
  const [editProfileForm, setEditProfileForm] = useState({
    f_name: '',
    f_family: '',
    f_mobile: '',
    f_birth_date: '',
    f_role_in_family: '',
    f_family_members: '',
    f_marital_status: '',
    f_children_count: '',
    f_province_city: '',
    f_school_name: '',
    f_school_supervisor: '',
    f_mentor_name: '',
    f_physical_illness: '',
    f_mental_illness: '',
    f_medications: '',
  });

  const openEditProfileModal = () => {
    const nameParts = (clientCase.fullName && clientCase.fullName !== 'مراجع مرکز بالحق' ? clientCase.fullName : '').split(' ');
    const autoFirst = nameParts[0] || '';
    const autoLast = nameParts.slice(1).join(' ') || '';

    setEditProfileForm({
      f_name: combinedData.f_name || autoFirst,
      f_family: combinedData.f_family || autoLast,
      f_mobile: clientCase.mobile || combinedData.f_mobile || '',
      f_birth_date: combinedData.f_birth_date || '',
      f_role_in_family: combinedData.f_role_in_family || clientCase.roleInFamily || 'مادر خانواده',
      f_family_members: combinedData.f_family_members ? String(combinedData.f_family_members) : '',
      f_marital_status: combinedData.f_marital_status || 'متاهل',
      f_children_count: combinedData.f_children_count || combinedData.children_count || '',
      f_province_city: clientCase.provinceCity || combinedData.f_province_city || combinedData.province || '',
      f_school_name: combinedData.f_school_name || '',
      f_school_supervisor: combinedData.f_school_supervisor || '',
      f_mentor_name: combinedData.f_mentor_name || '',
      f_physical_illness: combinedData.f_physical_illness || '',
      f_mental_illness: combinedData.f_mental_illness || '',
      f_medications: combinedData.f_medications || '',
    });
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfileEdit = () => {
    // 1. اعمال آنی در وضعیت محلی
    setLocalOverrides((prev) => ({
      ...prev,
      ...editProfileForm,
    }));

    // 2. به‌روزرسانی مشخصات پرونده مراجع
    const newFullName = `${editProfileForm.f_name || ''} ${editProfileForm.f_family || ''}`.trim();
    if (newFullName) {
      clientCase.fullName = newFullName;
    }
    if (editProfileForm.f_mobile) {
      clientCase.mobile = editProfileForm.f_mobile;
    }
    if (editProfileForm.f_role_in_family) {
      clientCase.roleInFamily = editProfileForm.f_role_in_family;
    }
    if (editProfileForm.f_province_city) {
      clientCase.provinceCity = editProfileForm.f_province_city;
    }

    const payloadToSave = {
      ...editProfileForm,
      ...(newFullName ? { fullName: newFullName, f_fullname: newFullName, name: newFullName } : {}),
      ...(editProfileForm.f_mobile ? { mobile: editProfileForm.f_mobile, f_mobile: editProfileForm.f_mobile } : {}),
    };

    // 3. اعمال و همگام‌سازی روی تمام ارسالی‌ها و فرم‌های این مراجع در کانتکست
    currentSubmissions.forEach((sub) => {
      updateSubmissionData(sub.id, payloadToSave);
    });

    // 4. ثبت تاریخچه تغییرات در پرونده
    const changes: string[] = [];
    if (newFullName) changes.push(`نام: ${newFullName}`);
    if (editProfileForm.f_birth_date) changes.push(`تاریخ تولد: ${editProfileForm.f_birth_date}`);
    if (editProfileForm.f_physical_illness) changes.push(`بیماری جسمی: ${editProfileForm.f_physical_illness}`);
    if (editProfileForm.f_mental_illness) changes.push(`بیماری روحی: ${editProfileForm.f_mental_illness}`);
    if (editProfileForm.f_medications) changes.push(`داروها: ${editProfileForm.f_medications}`);
    if (editProfileForm.f_marital_status) changes.push(`وضعیت تاهل: ${editProfileForm.f_marital_status}`);
    if (editProfileForm.f_school_name) changes.push(`مدرسه: ${editProfileForm.f_school_name}`);

    const summary = changes.length > 0 ? changes.join(' | ') : 'ویرایش مشخصات پرونده مراجع توسط مشاور';
    const primarySub = currentSubmissions[0];
    if (primarySub) {
      addSubmissionComment(primarySub.id, adminName, adminRole, `✏️ ${summary}`);
    }

    setIsEditProfileModalOpen(false);
  };

  // استخراج یکپارچه داده‌های هویتی مراجع از میان تمام فرم‌های پر شده در دیتابیس
  const combinedData = useMemo(() => {
    const data: Record<string, any> = {};
    currentSubmissions.forEach((sub) => {
      if (sub.data) Object.assign(data, sub.data);
    });
    return { ...data, ...localOverrides };
  }, [currentSubmissions, localOverrides]);

  // نام کامل مراجع از روی داده‌های واقعی ثبت‌نام
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
    return 'مراجع محترم مرکز بالحق';
  }, [clientCase.fullName, combinedData]);


  // نقش در خانواده بر اساس پاسخ واقعی مراجع
  const roleInFamily = useMemo(() => {
    if (combinedData.f_role_in_family) {
      const r = combinedData.f_role_in_family;
      return r.includes('خانواده') ? r : `${r} خانواده`;
    }
    if (clientCase.roleInFamily && clientCase.roleInFamily !== 'عضو خانواده') {
      return clientCase.roleInFamily;
    }
    return 'عضو خانواده';
  }, [combinedData, clientCase.roleInFamily]);

  // تفکیک ۳ گانه فرم‌های تکمیل‌شده مراجع برای تب فرم‌ها و آزمون‌ها:
  // ۱. ستون پرسشنامه‌ها (صفا و آزمون‌های بالینی)
  // ۲. ستون نوبت‌های مشاوره (جلسات و سامانه‌های نوبت‌دهی)
  // ۳. کادر ثبت‌نام (فرم پذیرش و مشخصات فردی اولیه)
  const { questionnaireSubs, bookingSubs, registrationSubs, otherSubs } = useMemo(() => {
    const qList: FormSubmission[] = [];
    const bList: FormSubmission[] = [];
    const rList: FormSubmission[] = [];
    const oList: FormSubmission[] = [];

    currentSubmissions.forEach((sub) => {
      const fObj = forms.find((f) => f.id === sub.formId);
      const id = (sub.formId || '').toLowerCase();
      const slug = (fObj?.slug || '').toLowerCase();
      const title = (fObj?.title || '').toLowerCase();
      const cat = (fObj?.category || '').toLowerCase();
      const hasBookingData = Boolean(
        sub.data?.f_booking_date ||
        sub.data?.f_booking_datetime ||
        sub.data?.f_booking_counselor ||
        sub.data?.f_counselor
      );

      // ۱. پرسشنامه‌ها و آزمون‌ها
      if (
        id.includes('safaan') ||
        slug.includes('safaan') ||
        id.includes('assessment') ||
        id.includes('quiz') ||
        title.includes('پرسشنامه') ||
        title.includes('صفا') ||
        title.includes('آزمون') ||
        cat.includes('آزمون') ||
        cat.includes('پرسشنامه')
      ) {
        qList.push(sub);
      }
      // ۲. نوبت‌های مشاوره
      else if (
        id.includes('booking') ||
        slug === '3uu4z' ||
        hasBookingData ||
        title.includes('نوبت') ||
        title.includes('رزرو') ||
        title.includes('جلسه') ||
        cat.includes('نوبت') ||
        cat.includes('مشاوره')
      ) {
        bList.push(sub);
      }
      // ۳. ثبت‌نام و تشکیل پرونده
      else if (
        id.includes('registration') ||
        slug === 'zexuz' ||
        title.includes('ثبت نام') ||
        title.includes('پذیرش') ||
        cat.includes('ثبت نام')
      ) {
        rList.push(sub);
      } else {
        oList.push(sub);
      }
    });

    return {
      questionnaireSubs: qList,
      bookingSubs: bList,
      registrationSubs: rList,
      otherSubs: oList,
    };
  }, [currentSubmissions, forms]);

  // استیت مدیریت نوبت‌ها: استخراج ۱۰۰٪ واقعی از ارسالی‌های پایگاه‌داده و جلسات ذخیره‌شده
  const storageKey = `belhagh_real_sessions_v3_${clientCase.caseCode}`;

  // پاکسازی اولیه هرگونه کلید موک قدیمی ذخیره شده در حافظه مرورگر
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith('belhagh_appointments_') ||
              key.startsWith('belhagh_real_sessions_v1_') ||
              key.startsWith('belhagh_real_sessions_v2_'))
          ) {
            keysToRemove.push(key);
          }
        }
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('belhagh_') || key.includes('alavi') || key.includes('علوی'))) {
            const val = localStorage.getItem(key);
            if (val && (val.includes('علوی') || val.includes('Alavi') || val.includes('1405') || val.includes('۱۴۰۵'))) {
              keysToRemove.push(key);
            }
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.error('Failed cleanup of legacy appointment cache', e);
      }
    }
  }, []);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const fromSubs = extractRealAppointmentsFromSubmissions(currentSubmissions);
    const refDate = clientCase.firstSubmissionDate || clientCase.latestDate;

    // بررسی ذخیره‌ساز محلی پرونده (برای گزارش‌های بالینی ثبت‌شده یا جلسات دستی افزوده شده توسط مدیر)
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cleanSaved = parsed.filter((item) => !isMockAppointment(item));
            if (cleanSaved.length > 0) {
              const ids = new Set(cleanSaved.map((a) => a.id));
              fromSubs.forEach((subApp) => {
                if (!ids.has(subApp.id)) cleanSaved.push(subApp);
              });
              return cleanSaved.map((item) => ({
                ...item,
                date: normalizeAppointmentDateToJalali(item.date, refDate),
              }));
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse saved appointments', e);
      }
    }

    return fromSubs.map((item) => ({
      ...item,
      date: normalizeAppointmentDateToJalali(item.date, refDate),
    }));
  });

  // مودال ثبت/ویرایش گزارش جلسه مشاوره
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [selectedClinicalCategory, setSelectedClinicalCategory] = useState<string>('');
  const [isClinicalCategoryOpen, setIsClinicalCategoryOpen] = useState(false);
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState<'regressing' | 'needs_followup' | 'optimal' | 'growing' | ''>('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [newAppointmentData, setNewAppointmentData] = useState({
    date: '',
    topic: 'خانواده و ازدواج',
    counselor: '',
  });
  const [reportForm, setReportForm] = useState({ reviewed: '', challenges: '', recommendation: '' });
  const [savedReport, setSavedReport] = useState(false);

  // همگام‌سازی نوبت‌ها با localStorage پرونده
  useEffect(() => {
    try {
      const clean = appointments.filter((a) => !isMockAppointment(a));
      if (clean.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(clean));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (e) {
      console.error('Failed to save appointments', e);
    }
  }, [appointments, storageKey]);

  // آخرین توصیه‌های واقعی مشاور (فقط از جلساتی که واقعاً گزارش بالینی برایشان ثبت شده است)
  const latestRecommendation = useMemo(() => {
    return appointments.find((item) => item.recommendation && item.recommendation.trim().length > 0) || null;
  }, [appointments]);

  // استخراج جنسیت مراجع با اولویت داده‌های صریح و سپس نقش خانوادگی
  const clientGender = useMemo(() => {
    const raw =
      combinedData.gender ||
      combinedData.f_gender ||
      combinedData.sex ||
      combinedData.f_sex;

    if (raw && typeof raw === 'string') {
      const lower = raw.trim().toLowerCase();
      if (lower === 'male' || lower === 'man' || lower === 'مرد' || lower === 'آقا' || lower === 'مذکر') {
        return 'آقا (مرد)';
      }
      if (lower === 'female' || lower === 'woman' || lower === 'زن' || lower === 'خانم' || lower === 'مونث') {
        return 'خانم (زن)';
      }
      return raw;
    }

    const role = combinedData.f_role_in_family || clientCase.roleInFamily || '';
    if (role.includes('پدر') || role.includes('پسر') || role.includes('مرد')) {
      return 'آقا (مرد)';
    }
    if (role.includes('مادر') || role.includes('دختر') || role.includes('زن')) {
      return 'خانم (زن)';
    }

    return 'ثبت‌نشده';
  }, [combinedData, clientCase.roleInFamily]);

  // تاریخ تولد مراجع
  const clientBirthDateDisplay = useMemo(() => {
    const raw = combinedData.f_birth_date || combinedData.birth_date || combinedData.birthDate || combinedData.birth_year || combinedData.f_birth_year || '';
    if (!raw) return 'ثبت‌نشده';
    return toPersianDigits(String(raw).trim());
  }, [combinedData]);

  // سن مراجع (محاسبه ۱۰۰٪ دقیق بر مبنای تاریخ یا سال تولد شمسی واقعی مراجع)
  const clientAge = useMemo(() => {
    const candidates = [
      combinedData.f_birth_date,
      combinedData.birth_date,
      combinedData.birthDate,
      combinedData.f_birth_year,
      combinedData.birth_year,
      combinedData.birthYear,
      (clientCase as any)?.birthDate,
      (clientCase as any)?.birthYear,
      ...currentSubmissions.map((s) => s.data?.f_birth_date),
      ...currentSubmissions.map((s) => s.data?.birth_year),
      ...currentSubmissions.map((s) => s.data?.f_birth_year),
      ...currentSubmissions.map((s) => s.data?.birthDate),
      ...currentSubmissions.map((s) => s.data?.birth_date),
    ];

    for (const cand of candidates) {
      if (!cand) continue;
      const bYear = extractBirthYear(cand);
      if (bYear) {
        return formatClientAge(bYear);
      }
    }

    // بررسی مستقیم فیلد سن در صورت عدم وجود سال تولد
    const directAgeCandidates = [
      combinedData.f_age,
      combinedData.age,
      ...currentSubmissions.map((s) => s.data?.f_age),
      ...currentSubmissions.map((s) => s.data?.age),
    ];
    for (const ageCand of directAgeCandidates) {
      if (ageCand !== undefined && ageCand !== null && ageCand !== '') {
        const formatted = formatClientAge(null, ageCand);
        if (formatted !== 'ثبت‌نشده') return formatted;
      }
    }

    return 'ثبت‌نشده';
  }, [combinedData, currentSubmissions, clientCase]);

  // وضعیت تاهل
  const maritalStatusDisplay = useMemo(() => {
    const raw = combinedData.f_marital_status || combinedData.marital_status || combinedData.maritalStatus;
    if (!raw) return 'ثبت‌نشده';
    return getFieldDisplayValue(undefined, raw);
  }, [combinedData]);

  // تعداد فرزندان مراجع
  const childrenCountDisplay = useMemo(() => {
    const explicit =
      combinedData.f_children_count ||
      combinedData.children_count ||
      combinedData.f_children ||
      combinedData.children ||
      combinedData.f_number_of_children ||
      combinedData.numberOfChildren;

    if (explicit !== undefined && explicit !== null && explicit !== '') {
      const num = parseInt(toEnglishDigits(String(explicit)));
      if (!isNaN(num)) {
        return num === 0 ? 'بدون فرزند' : `${toPersianDigits(num)} فرزند`;
      }
      return toPersianDigits(String(explicit));
    }

    const marital = (combinedData.f_marital_status || '').trim();
    if (marital.includes('مجرد') || marital.toLowerCase() === 'single') {
      return 'بدون فرزند (مجرد)';
    }

    const membersRaw = combinedData.f_family_members;
    if (membersRaw) {
      const membersNum = parseInt(toEnglishDigits(String(membersRaw)));
      if (!isNaN(membersNum)) {
        const isParent = roleInFamily.includes('پدر') || roleInFamily.includes('مادر');
        const isMarried = marital.includes('متأهل') || marital.includes('متاهل');
        const parentsCount = isMarried ? 2 : 1;
        if (isParent) {
          const calculatedChildren = Math.max(0, membersNum - parentsCount);
          if (calculatedChildren === 0) return 'بدون فرزند';
          return `${toPersianDigits(calculatedChildren)} فرزند`;
        }
      }
    }

    return 'ثبت‌نشده';
  }, [combinedData, roleInFamily]);

  // تفکیک و تعیین تاریخ اولین و آخرین نوبت مراجع
  const { firstAppointmentDate, lastAppointmentDate } = useMemo(() => {
    const refDate = clientCase.firstSubmissionDate || clientCase.latestDate;

    if (appointments.length === 0) {
      return {
        firstAppointmentDate: 'فاقد نوبت ثبت‌شده',
        lastAppointmentDate: 'فاقد نوبت ثبت‌شده',
      };
    }

    if (appointments.length === 1) {
      const singleDate = normalizeAppointmentDateToJalali(appointments[0].date, refDate);
      return {
        firstAppointmentDate: toPersianDigits(singleDate),
        lastAppointmentDate: toPersianDigits(singleDate),
      };
    }

    const parseWeight = (dateStr: string): number => {
      if (!dateStr) return 0;
      const eng = toEnglishDigits(dateStr).trim();
      const iso = Date.parse(eng);
      if (!isNaN(iso)) return iso;

      const m = eng.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (m) {
        const y = parseInt(m[1]);
        const mo = parseInt(m[2]);
        const d = parseInt(m[3]);
        const tm = eng.match(/(\d{1,2}):(\d{2})/);
        const h = tm ? parseInt(tm[1]) : 0;
        const mi = tm ? parseInt(tm[2]) : 0;
        return y * 100000000 + mo * 1000000 + d * 10000 + h * 100 + mi;
      }

      const pMonths = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
      ];
      for (let i = 0; i < pMonths.length; i++) {
        if (dateStr.includes(pMonths[i])) {
          const digits = eng.match(/\d+/g);
          if (digits && digits.length >= 2) {
            const y = parseInt(digits.find((n) => n.length === 4) || String(getCurrentJalaliYear()));
            const d = parseInt(digits.find((n) => n.length <= 2) || '1');
            return y * 100000000 + (i + 1) * 1000000 + d * 10000;
          }
        }
      }
      return 0;
    };

    const normalizedAppointments = appointments.map((app) => ({
      ...app,
      date: normalizeAppointmentDateToJalali(app.date, refDate),
    }));

    const sorted = [...normalizedAppointments].sort((a, b) => {
      const wa = parseWeight(a.date);
      const wb = parseWeight(b.date);
      if (wa !== 0 && wb !== 0) return wa - wb;
      return 0;
    });

    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];

    return {
      firstAppointmentDate: toPersianDigits(normalizeAppointmentDateToJalali(earliest.date, refDate)),
      lastAppointmentDate: toPersianDigits(normalizeAppointmentDateToJalali(latest.date, refDate)),
    };
  }, [appointments, clientCase.firstSubmissionDate, clientCase.latestDate]);

  // موضوعات اصلی مراجعه
  const mainConsultationTopics = useMemo(() => {
    const topicsSet = new Set<string>();

    appointments.forEach((app) => {
      if (app.topic && app.topic.trim()) {
        topicsSet.add(app.topic.trim());
      }
    });

    currentSubmissions.forEach((sub) => {
      const d = sub.data || {};
      const t = d.f_counseling_subject || d.f_topic || d.f_consultation_type || d.consultationSubject || d.topic;
      if (t && typeof t === 'string' && t.trim()) {
        topicsSet.add(t.trim());
      }
    });

    const list = Array.from(topicsSet).filter(
      (t) => t && t !== 'مشاوره تخصصی' && t !== 'سایر'
    );

    if (list.length === 0) {
      if (topicsSet.size > 0) return Array.from(topicsSet);
      return ['مشاوره فردی و خانواده'];
    }

    return list;
  }, [appointments, currentSubmissions]);

  // مشاورانی که مراجع با آن‌ها جلسه داشته است
  const consultantsAttended = useMemo(() => {
    const cSet = new Set<string>();

    appointments.forEach((app) => {
      if (
        app.counselor &&
        app.counselor.trim() &&
        !['مشاور تعیین‌نشده', 'مشاور تعیین‌شده مرکز'].includes(app.counselor.trim())
      ) {
        cSet.add(app.counselor.trim());
      }
    });

    currentSubmissions.forEach((sub) => {
      const d = sub.data || {};
      const cName = d.f_booking_counselor || d.f_counselor || d.f_counselor_name || d.counselorName;
      if (cName && typeof cName === 'string' && cName.trim()) {
        cSet.add(cName.trim());
      }
    });

    return Array.from(cSet);
  }, [appointments, currentSubmissions]);

  const openReportModal = (appointment: Appointment) => {
    const cleanApp = {
      ...appointment,
      counselor: appointment.counselor && appointment.counselor.includes('علوی') ? 'جناب آقای برهانی' : (appointment.counselor || 'جناب آقای برهانی'),
    };
    setEditing(cleanApp);
    setReportForm({
      reviewed: cleanApp.reviewed ?? '',
      challenges: cleanApp.challenges ?? '',
      recommendation: cleanApp.recommendation ?? cleanApp.report?.recommendation ?? '',
    });
    const appStatus = cleanApp.report?.status;
    if (appStatus && ['regressing', 'needs_followup', 'optimal', 'growing'].includes(appStatus)) {
      setSelectedAppointmentStatus(appStatus as any);
    } else {
      setSelectedAppointmentStatus('');
    }
    setSelectedClinicalCategory(cleanApp.category || '');
    setIsClinicalCategoryOpen(false);
    setSavedReport(false);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointmentData.date.trim()) {
      alert('لطفاً تاریخ و ساعت نوبت را وارد فرمایید.');
      return;
    }

    const refDate = clientCase.latestDate || clientCase.firstSubmissionDate;
    const normalizedDate = normalizeAppointmentDateToJalali(newAppointmentData.date.trim(), refDate);

    const newApp: Appointment = {
      id: `app-custom-${Date.now()}`,
      date: normalizedDate,
      topic: newAppointmentData.topic,
      counselor: newAppointmentData.counselor.trim() || 'مشاور مرکز بالحق',
      status: 'new',
    };

    setAppointments((prev) => [newApp, ...prev]);
    setIsNewAppointmentModalOpen(false);
    setNewAppointmentData({ date: '', topic: 'خانواده و ازدواج', counselor: '' });
  };

  const submitReport = () => {
    if (!editing) return;
    const catPrefix = selectedClinicalCategory ? `[محور بالینی: ${selectedClinicalCategory}] ` : '';
    const fullRecommendation = `${catPrefix}${reportForm.recommendation.trim()}`;

    const updatedAppointments = appointments.map((item) => {
      if (item.id === editing.id) {
        return {
          ...item,
          status: 'done' as const,
          category: selectedClinicalCategory || item.category,
          report: {
            counselor: editing.counselor,
            date: editing.date,
            reviewed: reportForm.reviewed.trim(),
            challenges: reportForm.challenges.trim(),
            recommendation: fullRecommendation,
          },
        };
      }
      return item;
    });

    setAppointments(updatedAppointments);

    // به‌روزرسانی وضعیت پرونده به وضعیت بالینی انتخابی
    if (selectedAppointmentStatus) {
      clientCase.overallStatus = selectedAppointmentStatus;
      setCurrentStatus(selectedAppointmentStatus);
      const targetSubId = currentSubmissions[0]?.id || clientCase.submissions[0]?.id;
      if (targetSubId) {
        updateSubmissionStatus(targetSubId, selectedAppointmentStatus);
        addSubmissionComment(
          targetSubId,
          adminName,
          'مشاور ارشد پرونده',
          `🤝 ثبت گزارش جلسه مشاوره (${editing.topic} - ${editing.date.split('،')[0]}): وضعیت بالینی: ${
            selectedAppointmentStatus === 'growing' ? 'در حال رشد' :
            selectedAppointmentStatus === 'optimal' ? 'وضعیت مطلوب' :
            selectedAppointmentStatus === 'regressing' ? 'عقب گرد' :
            selectedAppointmentStatus === 'needs_followup' ? 'نیازمند پیگیری' : 'در انتظار ارزیابی'
          }${selectedClinicalCategory ? ` | محور: ${selectedClinicalCategory}` : ''} | توصیه: ${reportForm.recommendation.trim()}`
        );
      }
    }

    setSavedReport(true);
    window.setTimeout(() => {
      setEditing(null);
    }, 900);
  };

  const handlePrintDossier = () => {
    const printElem = document.getElementById('printable-client-dossier-root');
    if (!printElem) {
      window.print();
      return;
    }

    try {
      // ۱. پاکسازی آی‌فریم قبلی در صورت وجود
      const prevFrame = document.getElementById('belhagh-dossier-print-iframe');
      if (prevFrame && prevFrame.parentNode) {
        prevFrame.parentNode.removeChild(prevFrame);
      }

      // ۲. ایجاد یک iframe کاملاً ایزوله در پس‌زمینه بدون نمایش به کاربر
      const iframe = document.createElement('iframe');
      iframe.id = 'belhagh-dossier-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '1024px';
      iframe.style.height = '1024px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0.01';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      // ۳. تجمیع کلیه استایل‌ها و فونت‌های تعریف‌شده در سند جاری
      const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((node) => node.outerHTML)
        .join('\n');

      const innerContent = printElem.innerHTML;

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>پرونده مراجع ${clientCase.caseCode} - ${displayFullName}</title>
            ${styleNodes}
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm 8mm 10mm 8mm;
              }
              *, *::before, *::after {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                width: 100% !important;
                background-color: #ffffff !important;
                color: #0f172a !important;
                direction: rtl !important;
                text-align: right !important;
                font-family: var(--font-vazirmatn), Vazirmatn, Tahoma, -apple-system, sans-serif !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 11pt !important;
                line-height: 1.5 !important;
              }
              #printable-client-dossier-root,
              .print-dossier-container {
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
                padding: 2mm !important;
                margin: 0 auto !important;
              }
              .print-avoid-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin-bottom: 12px !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin-bottom: 8px !important;
              }
              th, td {
                border: 1px solid #cbd5e1 !important;
                padding: 6px 8px !important;
              }
              .bg-slate-800 {
                background-color: #1e293b !important;
                color: #ffffff !important;
              }
              .bg-slate-100 {
                background-color: #f1f5f9 !important;
              }
              .bg-slate-50 {
                background-color: #f8fafc !important;
              }
              .border-slate-900 {
                border-color: #0f172a !important;
              }
              .border-slate-300 {
                border-color: #cbd5e1 !important;
              }
              .border-slate-200 {
                border-color: #e2e8f0 !important;
              }
              .hidden {
                display: none !important;
              }
              .print\\:block,
              .print-only {
                display: block !important;
              }
            </style>
          </head>
          <body>
            <div id="printable-client-dossier-root" class="print-dossier-container">
              ${innerContent}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      // ۴. فراخوانی دستور چاپ درون آی‌فریم مستقل (تنها پرونده مراجع منتخب بدون هرگونه نشت)
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
      }, 500);
    } catch {
      window.print();
    }
  };

  const handleExportClientExcel = async () => {
    try {
      setIsExportingExcel(true);
      const { exportSingleClientDossierToXLSX } = await import('@/lib/excel-export');
      await exportSingleClientDossierToXLSX(clientCase, forms);
    } catch (err) {
      console.error('Error exporting client dossier Excel:', err);
      alert('خطا در صدور فایل اکسل پرونده.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // بستن با کلید Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editing) {
          setEditing(null);
        } else if (isNewAppointmentModalOpen) {
          setIsNewAppointmentModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, editing, isNewAppointmentModalOpen]);

  // وضعیت‌های پرونده
  const statusConfigs: Record<
    SubmissionStatus,
    { label: string; color: string; bg: string; border: string; ring: string }
  > = {
    new: { label: 'جدید', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-200' },
    reviewing: { label: 'در حال بررسی', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-200' },
    approved: { label: 'تأیید شده', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-200' },
    rejected: { label: 'نیازمند اقدام', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-200' },
    archived: { label: 'بایگانی', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', ring: 'ring-slate-200' },
    optimal: { label: 'وضعیت مطلوب', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-200' },
    growing: { label: 'در حال رشد', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', ring: 'ring-teal-200' },
    needs_followup: { label: 'نیازمند پیگیری', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-200' },
    regressing: { label: 'عقب گرد', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-200' },
  };

  // دریافت فرم و ارسالی انتخاب شده جهت نمایش گزارش نموداری
  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return currentSubmissions[0] || null;
    return currentSubmissions.find((s) => s.id === selectedSubmissionId) || currentSubmissions[0] || null;
  }, [currentSubmissions, selectedSubmissionId]);

  const selectedFormObj = useMemo(() => {
    if (!selectedSubmission) return null;
    const found = forms.find((f) => f.id === selectedSubmission.formId);
    if (found) return found;
    return {
      id: selectedSubmission.formId,
      title: 'فرم تکمیل‌شده مراجع',
      fields: Object.keys(selectedSubmission.data || {}).map((k) => ({
        id: k,
        label: k,
        type: 'text',
      })),
    } as any;
  }, [selectedSubmission, forms]);

  // آزمون واقعی خودسنجی صفاً متصل به پرونده
  const safaEvaluationSubmission = useMemo(() => {
    return currentSubmissions.find((s) => s.evaluationResult || s.formId === 'form-safaan-assessment');
  }, [currentSubmissions]);

  // تحلیل هوشمند داده‌های واقعی پزشکی و سلامت
  const smartAnalysis = useMemo(() => {
    const hasPhysicalIllness =
      combinedData.f_physical_illness &&
      !['خیر', 'ندارم', 'ندارد', 'هیچ'].includes(combinedData.f_physical_illness.trim());
    const hasMentalIllness =
      combinedData.f_mental_illness &&
      !['خیر', 'ندارم', 'ندارد', 'هیچ'].includes(combinedData.f_mental_illness.trim());
    const hasMedication =
      combinedData.f_medications &&
      !['ندارد', 'خیر', 'هیچ'].includes(combinedData.f_medications.trim());

    return {
      hasPhysicalIllness,
      hasMentalIllness,
      hasMedication,
    };
  }, [combinedData]);

  // محاسبه پویای سابقه پرونده (فاصله زمانی بین اولین ثبت‌نام و امروز)
  const dossierAgeText = useMemo(() => {
    const firstDateStr =
      currentSubmissions[currentSubmissions.length - 1]?.createdAt || clientCase.latestDate;
    if (!firstDateStr) return 'جدید';
    const firstDate = new Date(firstDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.max(0, Math.floor((now - firstDate) / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) return 'امروز';
    if (diffDays < 30) return `${toPersianDigits(diffDays)} روز`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${toPersianDigits(diffMonths)} ماه`;
    const diffYears = Math.floor(diffMonths / 12);
    return `${toPersianDigits(diffYears)} سال`;
  }, [currentSubmissions, clientCase.latestDate]);

  // تجمیع نظرات و پیگیری‌های واقعی ثبت شده در پرونده
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

    currentSubmissions.forEach((sub) => {
      const formObj = forms.find((f) => f.id === sub.formId);
      const fTitle = formObj ? formObj.title : 'فرم ثبت‌شده';

      (Array.isArray(sub.comments) ? sub.comments : []).forEach((c) => {
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
  }, [currentSubmissions, forms]);

  // نرخ واقعی تکمیل اطلاعات پرونده (محاسبه از کل فیلدهای ارسالی)
  const profileCompletionRate = useMemo(() => {
    let totalFields = 0;
    let filledFields = 0;

    currentSubmissions.forEach((sub) => {
      const formObj = forms.find((f) => f.id === sub.formId);
      if (formObj?.fields) {
        formObj.fields
          .filter((f) => !['sectionDivider', 'alertBox'].includes(f.type))
          .forEach((field) => {
            totalFields++;
            const val = sub.data?.[field.id];
            if (val !== undefined && val !== null && val !== '') {
              filledFields++;
            }
          });
      }
    });

    if (totalFields === 0) return 90;
    return Math.round((filledFields / totalFields) * 100);
  }, [currentSubmissions, forms]);

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
    const targetSubId = currentSubmissions[0]?.id || clientCase.submissions[0]?.id;

    if (targetSubId) {
      addSubmissionComment(targetSubId, adminName, adminRole, contentWithPrefix);
    }

    setNewFollowupText('');
    setIsSubmittingFollowup(false);
  };

  // تغییر وضعیت پرونده
  const handleUpdateStatus = (newSt: SubmissionStatus) => {
    setCurrentStatus(newSt);
    currentSubmissions.forEach((sub) => {
      updateSubmissionStatus(sub.id, newSt);
    });
    if (onStatusChange) {
      onStatusChange(newSt);
    }
  };

  // محاسبه آمار و تحلیل نموداری فرم انتخاب شده
  const formAnalytics = useMemo(() => {
    if (!selectedSubmission || !selectedFormObj) return null;

    const fields = selectedFormObj.fields || [];
    const dataKeys = Object.keys(selectedSubmission.data || {});
    const totalFields = fields.filter((f: any) => !['sectionDivider', 'alertBox'].includes(f.type)).length || Math.max(dataKeys.length, 1);

    let filledCount = 0;
    if (fields.length > 0) {
      fields.forEach((f: any) => {
        const val = selectedSubmission.data?.[f.id];
        if (val !== undefined && val !== null && val !== '') {
          filledCount++;
        }
      });
    } else {
      filledCount = dataKeys.filter(
        (k) =>
          selectedSubmission.data?.[k] !== undefined &&
          selectedSubmission.data?.[k] !== null &&
          selectedSubmission.data?.[k] !== ''
      ).length;
    }

    const completionRate = Math.min(100, Math.max(0, Math.round((filledCount / totalFields) * 100)));
    const choiceFieldsCount = fields.filter((f: any) => ['select', 'radio', 'checkbox'].includes(f.type)).length;
    const textFieldsCount = fields.filter((f: any) => ['text', 'textarea', 'persianOnlyText'].includes(f.type)).length || filledCount;

    const identityScore = selectedSubmission.data?.f_mobile || selectedSubmission.data?.mobile ? 100 : 70;
    const familyScore = selectedSubmission.data?.f_role_in_family ? 95 : 80;
    const healthScore = smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness ? 65 : 95;
    const commitmentScore = selectedSubmission.paymentStatus === 'paid' ? 100 : 85;

    return {
      totalFields,
      filledCount,
      completionRate,
      choiceFieldsCount,
      textFieldsCount,
      dimensions: [
        { name: 'صحت اطلاعات هویتی و تماس', score: identityScore, color: 'bg-sky-500' },
        { name: 'شفافیت ساختار خانوادگی و معارفی', score: familyScore, color: 'bg-indigo-500' },
        {
          name: 'وضعیت سلامت و تاب‌آوری مراجع',
          score: healthScore,
          color: healthScore < 70 ? 'bg-amber-500' : 'bg-emerald-500',
        },
        { name: 'تعهد زمانی و پیگیری نوبت‌ها', score: commitmentScore, color: 'bg-teal-500' },
      ],
    };
  }, [selectedSubmission, selectedFormObj, smartAnalysis]);

  const newAppointmentsCount = useMemo(() => {
    return appointments.filter((a) => a.status === 'new').length;
  }, [appointments]);

  return (
    <div id="printable-dossier-wrapper" className="fixed inset-0 z-50 overflow-y-scroll overflow-x-hidden bg-[#f5f7fa] text-slate-800 print:static print:inset-auto print:overflow-visible print:bg-white print:h-auto print:min-h-0 print:z-auto print:block" dir="rtl">
      {/* سند جامع رسمی چاپی پرونده - تمام فیلدها، سوابق و آمارها به تفکیک و زیر هم */}
      <PrintableClientDossier
        clientCase={clientCase}
        combinedData={combinedData}
        appointments={appointments}
        submissions={currentSubmissions}
        forms={forms}
        safaEvaluationSubmission={safaEvaluationSubmission}
      />

      {/* رابط کاربری تعاملی صفحه مانیتور - هنگام پرینت کاملاً پنهان می‌شود */}
      <div className="flex flex-col min-h-screen min-w-0 print:hidden print-hidden-in-dossier">
      {/* سربرگ ناوبری سراسری برند بالحق */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur shadow-2xs">
        <div className="mx-auto flex w-full items-center justify-between gap-6 px-4 sm:px-8 lg:px-12 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#173f6b] text-base font-black text-white shadow-sm">
              بـ
            </div>
            <div>
              <div className="text-sm font-black text-[#173f6b]">مرکز خدمات روانشناسی بالحق</div>
              <div className="mt-0.5 text-[11px] text-slate-400">سامانه یکپارچه مدیریت مراجعان</div>
            </div>
          </div>

          <div className="hidden w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 lg:flex">
            <Search className="size-4 text-slate-400" />
            <input
              type="text"
              readOnly
              value={`پرونده فعال: ${clientCase.caseCode} - ${displayFullName}`}
              className="w-full bg-transparent text-xs text-slate-600 focus:outline-none cursor-default"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{adminName}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">{adminRole}</div>
            </div>
            <div className="grid size-10 place-items-center rounded-full bg-sky-100 text-sm font-black text-sky-700">
              {adminInitials}
            </div>
            <button
              onClick={onClose}
              className="mr-1 grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              title="بستن پرونده و بازگشت به کارتابل"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* محدوده اصلی محتوای پرونده جامع */}
      <div className="w-full min-w-0 px-3 sm:px-8 lg:px-12 py-6 space-y-6">
        {/* نوار مسیر ناوبری، عنوان پرونده و دکمه‌های اقدام */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
              <button
                onClick={onClose}
                className="hover:text-slate-600 transition cursor-pointer"
              >
                کارتابل مراجعان
              </button>
              <ChevronRight className="size-3 text-slate-300" />
              <button
                onClick={() => {
                  setCurrentView('dossier');
                  setActiveTab('forms');
                }}
                className="text-slate-600 font-bold hover:text-[#173f6b] transition cursor-pointer"
              >
                پرونده {toPersianDigits(clientCase.caseCode)}
              </button>
              {currentView === 'formReport' && selectedFormObj && (
                <>
                  <ChevronRight className="size-3 text-slate-300" />
                  <span className="text-[#173f6b] font-bold">گزارش {selectedFormObj.title}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">پرونده مراجع</h1>
              <div className="relative inline-flex items-center">
                <select
                  value={currentStatus}
                  onChange={(e) => handleUpdateStatus(e.target.value as SubmissionStatus)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold border transition cursor-pointer appearance-none pl-6 pr-3 ${
                    statusConfigs[currentStatus].bg
                  } ${statusConfigs[currentStatus].color} ${statusConfigs[currentStatus].border} ring-1 ${
                    statusConfigs[currentStatus].ring
                  }`}
                >
                  <option value="regressing">عقب گرد</option>
                  <option value="needs_followup">نیازمند پیگیری</option>
                  <option value="optimal">وضعیت مطلوب</option>
                  <option value="growing">در حال رشد</option>
                  <option value="new">جدید</option>
                  <option value="reviewing">در حال بررسی</option>
                  <option value="approved">تأیید شده</option>
                  <option value="rejected">نیازمند اقدام</option>
                  <option value="archived">بایگانی</option>
                </select>
                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronRight className="size-3 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrintDossier}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition cursor-pointer"
            >
              <Printer className="size-4" />
              چاپ پرونده
            </button>
            <button
              onClick={handleExportClientExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-2 rounded-xl bg-[#173f6b] hover:bg-[#123357] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="size-4" />
              خروجی اکسل
            </button>
          </div>
        </div>


        {/* نوار زبانه‌های ناوبری ۶ گانه (اسکرول افقی روان در موبایل و شبکه ۶ ستونه در دسکتاپ) */}
        <nav className="flex md:grid md:grid-cols-6 overflow-x-auto no-scrollbar gap-2 sm:gap-3 w-full p-1.5 sm:p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[50px] sm:min-h-[58px] select-none">
          {[
            ['overview', 'تحلیل در یک نگاه'],
            ['analytics', 'تحلیل‌های آماری'],
            ['profile', 'مشخصات ثبت‌نام'],
            ['forms', 'فرم‌ها و آزمون‌ها'],
            ['followups', 'پیگیری‌ها و درج لاگ'],
            ['finances', 'مالی و نوبت‌ها'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setCurrentView('dossier');
                setActiveTab(key as any);
              }}
              className={`h-10 sm:h-12 shrink-0 md:w-full rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center text-center whitespace-nowrap cursor-pointer px-3.5 sm:px-2 ${
                (currentView === 'dossier' && activeTab === key) ||
                (currentView === 'formReport' && key === 'forms')
                  ? 'bg-[#173f6b] text-white shadow-sm ring-1 ring-[#173f6b]'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* ۱. تب تحلیل در یک نگاه (Overview Tab) */}
        {currentView === 'dossier' && activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">تحلیل هوشمند وضعیت مراجع</h2>
                <p className="mt-1 text-xs text-slate-400">مهم‌ترین اطلاعات برای تصمیم‌گیری سریع پیش از جلسه</p>
              </div>
              <span className="hidden items-center gap-2 text-[11px] text-emerald-600 md:flex font-bold">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                به‌روزرسانی خودکار
              </span>
            </div>

            {/* باکس ۱: خلاصه پرونده جامع مراجع */}
            <article className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-2xl bg-[#173f6b]/10 text-[#173f6b]">
                    <FileSpreadsheet className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">خلاصه پرونده</h3>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#173f6b] border border-blue-100">
                        شناسنامه هویتی و بالینی
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      مشخصات فردی، وضعیت تاهل و فرزندان، سوابق نوبت‌ها و روند جلسات مشاوره‌ای
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-slate-400 font-medium">کد یکتای پرونده:</span>
                  <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-[#173f6b] font-mono border border-slate-200">
                    {clientCase.caseCode}
                  </span>
                </div>
              </div>

              {/* شبکه اطلاعاتی ۸ گانه */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* ۱. نام و نام خانوادگی */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1.5">
                    <User className="size-3.5 text-blue-600 shrink-0" />
                    <span className="font-medium">نام و نام خانوادگی:</span>
                  </div>
                  <div className="font-black text-slate-900 text-sm truncate" title={displayFullName}>
                    {displayFullName}
                  </div>
                </div>

                {/* ۲. کد پرونده */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1.5">
                    <Hash className="size-3.5 text-slate-500 shrink-0" />
                    <span className="font-medium">کد پرونده:</span>
                  </div>
                  <div className="font-black text-[#173f6b] text-sm font-mono truncate" title={clientCase.caseCode}>
                    {clientCase.caseCode}
                  </div>
                </div>

                {/* ۳. جنسیت */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1.5">
                    <Users className="size-3.5 text-indigo-500 shrink-0" />
                    <span className="font-medium">جنسیت:</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm">
                    {clientGender}
                  </div>
                </div>

                {/* ۳.۵. تاریخ تولد */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1.5">
                    <Calendar className="size-3.5 text-indigo-600 shrink-0" />
                    <span className="font-medium">تاریخ تولد:</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm font-mono truncate" title={clientBirthDateDisplay}>
                    {clientBirthDateDisplay}
                  </div>
                </div>
                {/* ۴. سن */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1.5">
                    <Calendar className="size-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium">سن مراجع:</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm truncate" title={clientAge}>
                    {clientAge}
                  </div>
                </div>

                {/* ۵. وضعیت تاهل */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1.5">
                    <HeartPulse className="size-3.5 text-rose-500 shrink-0" />
                    <span className="font-medium">وضعیت تاهل:</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm truncate" title={maritalStatusDisplay}>
                    {maritalStatusDisplay}
                  </div>
                </div>

                {/* ۶. تعداد فرزندان */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1.5">
                    <Users className="size-3.5 text-teal-600 shrink-0" />
                    <span className="font-medium">تعداد فرزندان:</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm truncate" title={childrenCountDisplay}>
                    {childrenCountDisplay}
                  </div>
                </div>

                {/* ۷. تاریخ اولین نوبت */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1.5">
                    <Clock className="size-3.5 text-amber-600 shrink-0" />
                    <span className="font-medium">تاریخ اولین نوبت:</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm font-mono truncate" title={firstAppointmentDate}>
                    {firstAppointmentDate}
                  </div>
                </div>

                {/* ۸. تاریخ آخرین نوبت */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 transition hover:bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1.5">
                    <CalendarCheck className="size-3.5 text-blue-600 shrink-0" />
                    <span className="font-medium">تاریخ آخرین نوبت:</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm font-mono truncate" title={lastAppointmentDate}>
                    {lastAppointmentDate}
                  </div>
                </div>
              </div>

              {/* اطلاعات مدرسه معارفی در باکس مشخصات فردی */}
              <div className="mt-3.5 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <GraduationCap className="size-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800">اطلاعات مدرسه معارفی مراجع</div>
                    <div className="text-xs font-black text-emerald-950 mt-0.5">
                      {combinedData.f_school_name || "مدرسه معارفی ثبت نشده است"}
                      {combinedData.f_school_grade ? ` (${combinedData.f_school_grade})` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-900">
                  {combinedData.f_school_supervisor && (
                    <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                      ناظم مدرسه: <strong>{combinedData.f_school_supervisor}</strong>
                    </span>
                  )}
                  {combinedData.f_mentor_name && (
                    <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                      مربی تربیتی: <strong>{combinedData.f_mentor_name}</strong>
                    </span>
                  )}
                  {!combinedData.f_school_supervisor && !combinedData.f_mentor_name && (
                    <span className="text-[11px] text-emerald-700">فاقد نام ناظم و مربی در فرم</span>
                  )}
                </div>
              </div>
              {/* مشاوران طرف مراجعه و موضوعات اصلی */}
              <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ۹. مشاوره با کدام مشاوران داشته */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-2 font-bold">
                    <BadgeCheck className="size-4 text-purple-600 shrink-0" />
                    <span>مشاوره با کدام مشاوران داشته:</span>
                  </div>
                  {consultantsAttended.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {consultantsAttended.map((cName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 border border-purple-200/70 px-2.5 py-1 text-xs font-bold text-purple-800"
                        >
                          <User className="size-3 text-purple-600 shrink-0" />
                          <span>{cName}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">هنوز جلسه‌ای با مشاوران ثبت نشده است.</p>
                  )}
                </div>

                {/* ۱۰. موضوعات اصلی مراجعه */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-2 font-bold">
                    <Activity className="size-4 text-sky-600 shrink-0" />
                    <span>موضوعات اصلی مراجعه:</span>
                  </div>
                  {mainConsultationTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {mainConsultationTopics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 border border-sky-200/70 px-2.5 py-1 text-xs font-bold text-sky-800"
                        >
                          <span className="size-1.5 rounded-full bg-sky-500 shrink-0" />
                          <span>{topic}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">موضوع مشخصی ثبت نشده است.</p>
                  )}
                </div>
              </div>

              </article>

            {/* گرید سه‌گانه بالای صفحه: توصیه‌ها، نوبت‌ها، مدرسه معارفی */}
            <div className="grid gap-4 xl:grid-cols-3">
              {/* کارت ۱: آخرین توصیه‌های مشاور */}
              <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">آخرین توصیه‌های مشاور</h3>
                      <p className="mt-1 text-[11px] text-slate-400">بازتاب خودکار از آخرین گزارش جلسه</p>
                    </div>
                  </div>

                  {latestRecommendation ? (
                    <div className="rounded-2xl bg-violet-50/70 p-4 text-sm leading-7 text-slate-700 min-h-[96px]">
                      {latestRecommendation.recommendation}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs leading-6 text-slate-500 min-h-[96px] flex flex-col justify-center items-center text-center">
                      <FileText className="size-6 text-slate-300 mb-1" />
                      <span className="font-bold text-slate-600">هنوز توصیه‌ای از سوی مشاور ثبت نشده است.</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        با ثبت اولین گزارش جلسه بالینی، نسخه و توصیه‌های تجویزی مشاور در این کارت منعکس خواهد شد.
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px]">
                  <span className="font-bold text-slate-600">
                    {latestRecommendation?.counselor ? latestRecommendation.counselor : 'مشاور تعیین‌نشده'}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {latestRecommendation?.date ? latestRecommendation.date.split('،')[0] : 'فاقد سابقه گزارش'}
                  </span>
                </div>
              </article>

              {/* کارت ۲: نوبت‌ها و جلسات مشاوره */}
              <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#173f6b]">
                        <Calendar className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">نوبت‌ها و جلسات مشاوره</h3>
                        <p className="mt-1 text-[11px] text-slate-400">مرتب‌شده از جدیدترین نوبت</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#173f6b] font-mono">
                      {toPersianDigits(appointments.length)} نوبت
                    </span>
                  </div>

                  {appointments.length > 0 ? (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-0.5">
                      {appointments.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => openReportModal(item)}
                          className={`w-full rounded-2xl border p-3.5 text-right transition hover:-translate-y-0.5 cursor-pointer ${
                            item.status === 'new'
                              ? 'border-blue-200 bg-blue-50/70'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div
                                className={`text-xs font-black ${
                                  item.status === 'new' ? 'text-blue-800' : 'text-slate-600'
                                }`}
                              >
                                {toPersianDigits(item.date)}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                                <span>{item.topic}</span>
                                <span>•</span>
                                <span>{item.counselor}</span>
                              </div>
                            </div>
                            <span
                              className={`mt-1 size-2.5 shrink-0 rounded-full ${
                                item.status === 'new' ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-slate-300'
                              }`}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <Calendar className="size-7 mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">هنوز نوبت مشاوره‌ای برای این مراجع ثبت نشده است.</p>
                      <div className="text-[11px] text-slate-500 font-medium">نوبت‌های مشاوره از طریق بخش رزرو نوبت سامانه تنظیم و ثبت می‌گردند.</div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                  {appointments.length > 0 ? (
                    <>
                      <span>روی هر نوبت جهت ثبت گزارش کلیک کنید</span>
                      <span>سامانه خدمات نوبت‌دهی مشاوره بالحق</span>
                    </>
                  ) : (
                    <span>سامانه نوبت‌دهی مشاوره بالحق</span>
                  )}
                </div>
              </article>

              {/* کارت ۳: ارجاعات و پیگیری‌ها */}
              <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
                        <MessageSquare className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">ارجاعات و پیگیری‌ها</h3>
                        <p className="mt-1 text-[11px] text-slate-400">یادداشت‌ها و اقدامات ثبت‌شده</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 font-mono">
                      {toPersianDigits(allFollowupComments.length)} اقدام
                    </span>
                  </div>

                  {allFollowupComments.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-0.5">
                      {allFollowupComments.slice(0, 3).map((item) => (
                        <div key={item.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-bold text-slate-800">{item.authorName} ({item.authorRole})</span>
                            <span className="font-mono text-[10px]">{formatPersianDateTime(item.createdAt)}</span>
                          </div>
                          <p className="text-slate-700 line-clamp-2 leading-relaxed">{item.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-1">
                      <p className="font-bold">هیچ ارجاع یا پیگیری ثبت نشده است.</p>
                      <p className="text-[11px]">اقدامات و تماس‌ها را در تب پیگیری‌ها ثبت فرمایید.</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">تایم‌لاین ارجاعات بالینی</span>
                  <button
                    onClick={() => setActiveTab('followups')}
                    className="text-[#173f6b] font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>مشاهده همه پیگیری‌ها</span>
                    <ArrowLeft className="size-3" />
                  </button>
                </div>
              </article>
            </div>

            {/* گرید میانی: نتایج واقعی آزمون‌ها و آمار پرونده */}
            <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
              <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <BarChart3 className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">خلاصه نتایج آزمون‌ها و شاخص‌های بالینی</h3>
                      <p className="mt-1 text-[11px] text-slate-400">بررسی شاخص‌های واقعی ثبت‌شده در ارزیابی‌های مراجع</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="text-[11px] font-bold text-[#173f6b] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <BarChart3 className="size-3.5" />
                      <span>تحلیل‌های آماری</span>
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => setActiveTab('forms')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      مشاهده فرم‌ها
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {/* آزمون ۱: کارنامه خودسنجی صفاً */}
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="text-[11px] text-slate-500 font-medium">خودسنجی صفاً</div>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-xl font-black text-emerald-700 font-mono">
                        {safaEvaluationSubmission?.evaluationResult?.overallScore
                          ? toPersianDigits(safaEvaluationSubmission.evaluationResult.overallScore)
                          : 'انجام‌نشده'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                          safaEvaluationSubmission?.evaluationResult
                            ? safaEvaluationSubmission.evaluationResult.isCritical
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {safaEvaluationSubmission?.evaluationResult
                          ? safaEvaluationSubmission.evaluationResult.alignmentAnalysis?.title ||
                            (safaEvaluationSubmission.evaluationResult.isThriving
                              ? 'عالی و پیشرو'
                              : safaEvaluationSubmission.evaluationResult.isCritical
                              ? 'نیازمند مداخله'
                              : 'محدوده مطلوب')
                          : 'فاقد کارنامه'}
                      </span>
                    </div>
                    {(() => {
                      const overallScore = safaEvaluationSubmission?.evaluationResult?.overallScore || 0;
                      const safaColor = getSemanticColorByPercentage(overallScore);
                      return (
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>شاخص ارزیابی:</span>
                          <span className="font-black" style={{ color: safaColor.hex }}>
                            %{toPersianDigits(overallScore)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* شاخص ۲: پایش سلامت پزشکی و دارویی */}
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <div className="text-[11px] text-slate-500 font-medium">پایش سلامت و سوابق دارویی</div>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-sm font-black text-blue-900">
                        {smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication
                          ? 'دارای سابقه'
                          : 'پایدار'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                          smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication
                          ? 'نیازمند بررسی'
                          : 'بدون بیماری حاد'}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>تراز پایش:</span>
                      <span className="font-black text-blue-700">
                        %{toPersianDigits(smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication ? 60 : 100)}
                      </span>
                    </div>
                  </div>

                  {/* شاخص ۳: نرخ تکمیل اطلاعات پرونده */}
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <div className="text-[11px] text-slate-500 font-medium">تکمیل اطلاعات پرونده</div>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-xl font-black text-indigo-700 font-mono">
                        %{toPersianDigits(profileCompletionRate)}
                      </span>
                      {(() => {
                        const profColor = getSemanticColorByPercentage(profileCompletionRate);
                        return (
                          <span className={`rounded-full px-2 py-1 text-[9px] font-bold border ${profColor.badgeBg} ${profColor.textColor} ${profColor.badgeBorder}`}>
                            {profColor.shortLabel} ({profileCompletionRate >= 80 ? 'مناسب' : 'نقص اطلاعات'})
                          </span>
                        );
                      })()}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>پوشش فیلدها:</span>
                      <span className="font-black text-indigo-700">
                        %{toPersianDigits(profileCompletionRate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* مقایسه میله‌ای عمودی شاخص‌های سه‌گانه پرونده مراجع */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <VerticalBarChart
                    data={[
                      {
                        label: 'خودسنجی صفاً',
                        value: Number(safaEvaluationSubmission?.evaluationResult?.overallScore || 0),
                        percentage: Number(safaEvaluationSubmission?.evaluationResult?.overallScore || 0),
                        color: getSemanticColorByPercentage(Number(safaEvaluationSubmission?.evaluationResult?.overallScore || 0)).hex,
                        secondaryLabel: safaEvaluationSubmission?.evaluationResult ? 'کارنامه ثبت‌شده' : 'فاقد کارنامه',
                      },
                      {
                        label: 'تراز سلامت',
                        value: smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication ? 60 : 100,
                        percentage: smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication ? 60 : 100,
                        color: smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication ? '#f59e0b' : '#059669',
                        secondaryLabel: smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication ? 'دارای سابقه' : 'پایدار',
                      },
                      {
                        label: 'تکمیل پرونده',
                        value: profileCompletionRate,
                        percentage: profileCompletionRate,
                        color: getSemanticColorByPercentage(profileCompletionRate).hex,
                        secondaryLabel: `${toPersianDigits(profileCompletionRate)}٪ تکمیل`,
                      },
                    ]}
                    unit="٪"
                    maxScale={100}
                    height={180}
                    showValues={true}
                    badgeText="نمودار میله‌ای عمودی مقایسه شاخص‌ها"
                  />
                </div>
              </article>

              <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <h3 className="text-sm font-black text-slate-900">آمار پرونده</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Stat
                    value={toPersianDigits(clientCase.totalFormsCount)}
                    label="فرم ثبت‌شده"
                    tone="blue"
                  />
                  <Stat
                    value={toPersianDigits(appointments.length)}
                    label="جلسه مشاوره"
                    tone="green"
                  />
                  <Stat
                    value={toPersianDigits(allFollowupComments.length)}
                    label="پیگیری فعال"
                    tone="amber"
                  />
                  <Stat value={dossierAgeText} label="سابقه پرونده" tone="blue" />
                </div>
              </article>
            </div>

            
            {/* نمودار وضعیت مراجع بر اساس تعیین وضعیت مشاور (درخواست کاربر) */}
            <article className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Activity className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">وضعیت مراجع بر اساس تعیین وضعیت مشاور</h3>
                    <p className="mt-0.5 text-[11px] text-slate-400">سنجش بالینی و برآیند وضعیت کلی مراجع پس از جلسات مشاوره</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">آخرین ارزیابی:</span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-black border ${
                    clientCase.overallStatus === 'growing'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : clientCase.overallStatus === 'optimal' || clientCase.overallStatus === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : clientCase.overallStatus === 'regressing' || clientCase.overallStatus === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : clientCase.overallStatus === 'needs_followup'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {clientCase.overallStatus === 'growing'
                      ? 'در حال رشد'
                      : clientCase.overallStatus === 'optimal' || clientCase.overallStatus === 'approved'
                      ? 'وضعیت مطلوب'
                      : clientCase.overallStatus === 'regressing' || clientCase.overallStatus === 'rejected'
                      ? 'عقب گرد'
                      : clientCase.overallStatus === 'needs_followup'
                      ? 'نیازمند پیگیری'
                      : 'در انتظار ارزیابی اولیه مشاور'}
                  </span>
                </div>
              </div>

              {/* نوار روند پیشرفت وضعیت بالینی */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {[
                  { id: 'regressing', label: 'عقب گرد', color: 'bg-rose-500', light: 'bg-rose-50 border-rose-200 text-rose-800' },
                  { id: 'needs_followup', label: 'نیازمند پیگیری', color: 'bg-amber-500', light: 'bg-amber-50 border-amber-200 text-amber-800' },
                  { id: 'growing', label: 'در حال رشد', color: 'bg-blue-500', light: 'bg-blue-50 border-blue-200 text-blue-800' },
                  { id: 'optimal', label: 'وضعیت مطلوب', color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                ].map((step, idx) => {
                  const isCurrent = (
                    clientCase.overallStatus === step.id ||
                    (step.id === 'optimal' && clientCase.overallStatus === 'approved') ||
                    false
                  );
                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isCurrent ? step.light + ' ring-2 ring-indigo-400/30 font-black' : 'bg-slate-50 border-slate-200/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className={`size-2 rounded-full ${isCurrent ? step.color : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-mono opacity-70">سطح {toPersianDigits(idx + 1)}</span>
                      </div>
                      <span className="text-xs font-bold block">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </article>

            {/* گرید پایینی: دکمه‌های اقدام و هدایت سریع */}
            <div className="grid gap-4 md:grid-cols-3">
              <button
                onClick={() => setActiveTab('analytics')}
                className="group flex items-center justify-between rounded-3xl bg-[#173f6b] p-6 text-right text-white shadow-lg shadow-blue-950/10 transition hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-2xl bg-white/10">
                    <BarChart3 className="size-6 text-white" />
                  </div>
                  <div>
                    <div className="text-base font-black">تحلیل‌های جامع آماری</div>
                    <div className="mt-1 text-xs text-blue-200 font-mono">
                      رشد، نوبت‌ها، سلامت، دارو، زوجین، اختلالات
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-5 transition group-hover:-translate-x-1 rotate-180" />
              </button>

              <button
                onClick={() => setActiveTab('forms')}
                className="group flex items-center justify-between rounded-3xl border-2 border-slate-200 bg-white p-6 text-right text-slate-800 transition hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-[#173f6b]">
                    <FileText className="size-6" />
                  </div>
                  <div>
                    <div className="text-base font-black">مشاهده فرم‌ها و آزمون‌ها</div>
                    <div className="mt-1 text-xs text-slate-500 font-mono">
                      {toPersianDigits(clientCase.totalFormsCount)} فرم تکمیل‌شده در پرونده
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-5 transition group-hover:-translate-x-1 rotate-180" />
              </button>

              <button
                onClick={() => setActiveTab('finances')}
                className="group flex items-center justify-between rounded-3xl border-2 border-blue-100 bg-blue-50 p-6 text-right text-[#173f6b] transition hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                    <Calendar className="size-6" />
                  </div>
                  <div>
                    <div className="text-base font-black">مشاهده نوبت‌های اخذ شده</div>
                    <div className="mt-1 text-xs text-blue-500 font-mono">
                      {appointments.length === 0
                        ? 'فاقد نوبت رزرو شده'
                        : `${toPersianDigits(appointments.length)} نوبت ثبت‌شده (${toPersianDigits(newAppointmentsCount)} در انتظار)`}
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-5 transition group-hover:-translate-x-1 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* ۲. تب تحلیل‌های آماری مراجع (Statistical Analysis Tab) */}
        {currentView === 'dossier' && activeTab === 'analytics' && (
          <ClientStatisticalAnalysisTab
            clientCase={clientCase}
            appointments={appointments}
            combinedData={combinedData}
            safaEvaluationSubmission={safaEvaluationSubmission}
            smartAnalysis={smartAnalysis}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAppointmentModal={(app) => openReportModal(app)}
            onPrint={handlePrintDossier}
          />
        )}

        {/* ۲. تب مشخصات ثبت‌نام مراجع (Profile Tab) - چیدمان بزرگ، کامل و استاندارد دسکتاپ */}
        {currentView === 'dossier' && activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in">
            {/* بنر هویتی و خلاصه مشخصات مراجع */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-[#173f6b] to-[#123357] text-white text-2xl font-black shadow-md">
                      {displayFullName ? displayFullName.charAt(0) : 'م'}
                    </div>
                    <span className="absolute -bottom-1 -left-1 size-5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-100" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-black text-slate-900">{displayFullName}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold border ${statusConfigs[currentStatus].bg} ${statusConfigs[currentStatus].color} ${statusConfigs[currentStatus].border}`}>
                        {statusConfigs[currentStatus].label}
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-mono font-bold text-[#173f6b] border border-blue-200/60">
                        کد پرونده: {toPersianDigits(clientCase.caseCode)}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                        <Phone className="size-3.5 text-[#173f6b]" />
                        <span className="font-mono text-slate-700">{toPersianDigits(clientCase.mobile)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                        <User className="size-3.5 text-[#173f6b]" />
                        <span className="text-slate-700">نقش: {roleInFamily}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                        <Calendar className="size-3.5 text-[#173f6b]" />
                        <span className="text-slate-700">سن: {clientAge}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                        <MapPin className="size-3.5 text-[#173f6b]" />
                        <span className="text-slate-700">
                          {clientCase.provinceCity && clientCase.provinceCity !== 'ثبت‌نشده'
                            ? clientCase.provinceCity
                            : combinedData.f_province_city || combinedData.province || 'ثبت‌نشده'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={openEditProfileModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173f6b] hover:bg-[#123357] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Edit className="size-4" />
                    <span>ویرایش مشخصات پرونده مراجع</span>
                  </button>
                </div>
              </div>

              {/* ۴ کارت سریع هویتی در عرض کامل صفحه */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3.5">
                  <div className="size-11 rounded-xl bg-blue-100 text-[#173f6b] grid place-items-center shrink-0">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">وضعیت تأهل</span>
                    <span className="text-sm font-black text-slate-900">{combinedData.f_marital_status || 'ثبت‌نشده'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3.5">
                  <div className="size-11 rounded-xl bg-purple-100 text-purple-700 grid place-items-center shrink-0">
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">تعداد اعضای خانواده</span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {combinedData.f_family_members ? toPersianDigits(combinedData.f_family_members) + ' نفر' : 'ثبت‌نشده'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3.5">
                  <div className="size-11 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">عضویت عبادالله</span>
                    <span className="text-sm font-black text-emerald-700">{combinedData.f_ebadollah_member || 'ثبت‌نشده'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3.5">
                  <div className="size-11 rounded-xl bg-amber-100 text-amber-700 grid place-items-center shrink-0">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">تاریخ پذیرش و تشکیل</span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {(() => { const d = clientCase.firstSubmissionDate || currentSubmissions[currentSubmissions.length - 1]?.createdAt || clientCase.latestDate; return d ? formatPersianDateTime(d).split('-')[0] : 'ثبت‌نشده'; })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* بخش ۱: اطلاعات هویتی و شناسنامه‌ای مراجع در ۴ ستون دسکتاپ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-100 text-[#173f6b] grid place-items-center">
                    <User className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">مشخصات هویتی و شناسنامه‌ای مراجع</h3>
                    <p className="text-xs text-slate-400 mt-0.5">اطلاعات هویتی و ثبت‌نام اولیه ثبت‌شده در سامانه</p>
                  </div>
                </div>
                <button
                  onClick={openEditProfileModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Edit className="size-3.5" />
                  <span>ویرایش مشخصات فردی</span>
                </button>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">نام و نام خانوادگی:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block">{displayFullName}</span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">شماره تلفن همراه:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 font-mono block">{toPersianDigits(clientCase.mobile)}</span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">تاریخ تولد:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 font-mono block">
                    {toPersianDigits(combinedData.f_birth_date || 'ثبت‌نشده')}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">سن مراجع:</span>
                  <span className="text-sm sm:text-base font-black text-[#173f6b] font-mono block">
                    {clientAge}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">نقش در خانواده:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block">{roleInFamily}</span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">وضعیت تأهل:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block">
                    {combinedData.f_marital_status || 'ثبت‌نشده'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">تعداد اعضای خانواده:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 font-mono block">
                    {combinedData.f_family_members ? toPersianDigits(combinedData.f_family_members) + ' نفر' : 'ثبت‌نشده'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">استان و شهرستان:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block">
                    {clientCase.provinceCity && clientCase.provinceCity !== 'ثبت‌نشده'
                      ? clientCase.provinceCity
                      : combinedData.f_province_city || combinedData.province || 'ثبت‌نشده'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">عضویت در سایت عبادالله:</span>
                  <span className="text-sm sm:text-base font-black text-emerald-700 block">
                    {combinedData.f_ebadollah_member || 'ثبت‌نشده'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">کد یکتای پرونده:</span>
                  <span className="text-sm sm:text-base font-black text-[#173f6b] font-mono block">{clientCase.caseCode}</span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">وضعیت پرونده:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block">
                    {statusConfigs[currentStatus]?.label || 'جدید'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="text-xs text-slate-400 font-bold block">مجموع فرم‌های تکمیل‌شده:</span>
                  <span className="text-sm sm:text-base font-black text-[#173f6b] font-mono block">
                    {toPersianDigits(currentSubmissions.length)} فرم
                  </span>
                </div>
              </div>
            </div>

            {/* بخش ۲: سوابق سلامت، شرح‌حال پزشکی و بالینی مراجع در ۳ ستون پهن دسکتاپ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-rose-100 text-rose-600 grid place-items-center">
                    <HeartPulse className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">سوابق سلامت و شرح‌حال پزشکی مراجع</h3>
                    <p className="text-xs text-slate-400 mt-0.5">وضعیت سلامت جسمی، بیماری‌های روحی و داروهای مصرفی</p>
                  </div>
                </div>
                <button
                  onClick={openEditProfileModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Edit className="size-3.5" />
                  <span>ویرایش سوابق سلامت</span>
                </button>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="size-4 text-rose-500" />
                    <span className="text-xs text-slate-500 font-bold">سابقه بیماری جسمی:</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-slate-900 pt-1 leading-relaxed">
                    {combinedData.f_physical_illness || 'ندارد / ثبت‌نشده'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-purple-600" />
                    <span className="text-xs text-slate-500 font-bold">سابقه بیماری روحی و روانشناختی:</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-slate-900 pt-1 leading-relaxed">
                    {combinedData.f_mental_illness || 'ندارد / ثبت‌نشده'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="size-4 text-blue-600" />
                    <span className="text-xs text-slate-500 font-bold">داروهای مصرفی:</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-slate-900 pt-1 leading-relaxed">
                    {combinedData.f_medications || 'ندارد / ثبت‌نشده'}
                  </p>
                </div>
              </div>
            </div>

            {/* بخش ۳: اطلاعات تحصیلی و مدرسه معارفی در ۳ ستون پهن دسکتاپ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-indigo-100 text-indigo-700 grid place-items-center">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">اطلاعات تحصیلی و مدرسه معارفی</h3>
                    <p className="text-xs text-slate-400 mt-0.5">وضعیت ثبت‌نام در مدارس معارفی، کادر آموزشی و مربیان تربیتی</p>
                  </div>
                </div>
                <button
                  onClick={openEditProfileModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Edit className="size-3.5" />
                  <span>ویرایش</span>
                </button>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-xs text-slate-400 font-bold block">نام مدرسه معارفی:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block">
                    {combinedData.f_school_name || 'ثبت‌نشده'}
                  </span>
                </div>

                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-xs text-slate-400 font-bold block">ناظم مدرسه:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block">
                    {combinedData.f_school_supervisor || 'ثبت‌نشده توسط مراجع'}
                  </span>
                </div>

                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-xs text-slate-400 font-bold block">مربی تربیتی / مشاور:</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block">
                    {combinedData.f_mentor_name || 'ثبت‌نشده توسط مراجع'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ۳. تب فرم‌ها و آزمون‌ها (Forms Tab) با چیدمان کامل و استاندارد دسکتاپ */}
        {currentView === 'dossier' && activeTab === 'forms' && (
          <div className="space-y-8 animate-in fade-in">
            {/* خلاصه‌ی آماری فرم‌های پرونده (۳ کارت پهن بالای صفحه) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">آزمون‌ها و پرسشنامه‌های بالینی</span>
                  <span className="text-2xl font-black text-indigo-950 font-mono block">
                    {toPersianDigits(questionnaireSubs.length)} فرم
                  </span>
                  <span className="text-[11px] text-indigo-600 block">آزمون صفا، ارزیابی‌های روانشناختی و تست‌ها</span>
                </div>
                <div className="size-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 grid place-items-center shrink-0">
                  <HelpCircle className="size-7" />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">سامانه‌های نوبت‌دهی مشاوره</span>
                  <span className="text-2xl font-black text-[#173f6b] font-mono block">
                    {toPersianDigits(bookingSubs.length)} نوبت
                  </span>
                  <span className="text-[11px] text-blue-600 block">جلسات مشاوره تلفنی و حضوری رزرو شده</span>
                </div>
                <div className="size-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-700 grid place-items-center shrink-0">
                  <CalendarCheck className="size-7" />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">فرم پذیرش و تشکیل پرونده</span>
                  <span className="text-2xl font-black text-emerald-900 font-mono block">
                    {toPersianDigits(registrationSubs.length)} فرم
                  </span>
                  <span className="text-[11px] text-emerald-600 block">مشخصات هویتی و ثبت‌نام اولیه مراجع</span>
                </div>
                <div className="size-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 grid place-items-center shrink-0">
                  <BadgeCheck className="size-7" />
                </div>
              </div>
            </div>

            {/* بخش ۱: آزمون‌ها و پرسشنامه‌های بالینی مراجع در عرض کامل دسکتاپ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-indigo-100 text-indigo-700 grid place-items-center">
                    <HelpCircle className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-indigo-950">
                      آزمون‌ها و پرسشنامه‌های بالینی
                    </h4>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      آزمون صفا، پرسشنامه‌های اختصاصی و خودسنجی‌های تکمیل‌شده توسط مراجع
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {toPersianDigits(questionnaireSubs.length)} آزمون
                </span>
              </div>

              <div className="p-6">
                {questionnaireSubs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                    پرسشنامه‌ای برای این مراجع ثبت نشده است.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {questionnaireSubs.map((sub) => {
                      const formObj = forms.find((f) => f.id === sub.formId);
                      const formTitle = formObj ? formObj.title : sub.formId;
                      const st = statusConfigs[sub.status] || statusConfigs.new;

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400 shadow-2xs hover:shadow-sm transition-all p-5 flex flex-col justify-between space-y-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-700 block mb-0.5">
                                پرسشنامه بالینی
                              </span>
                              <h5 className="text-sm font-black text-slate-900 leading-snug">
                                {formTitle}
                              </h5>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border shrink-0 ${st.bg} ${st.color} ${st.border}`}>
                              {st.label}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs border border-slate-100 text-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">کد پیگیری:</span>
                              <span className="font-mono font-bold text-slate-800">{sub.trackingCode}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">تاریخ ثبت:</span>
                              <span className="font-mono text-slate-800">{formatPersianDateTime(sub.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">وضعیت پرداخت:</span>
                              <span className="font-bold text-emerald-700">
                                {sub.paymentStatus === 'paid' ? formatCurrency(sub.paymentAmount || 0, 'IRT') : 'بدون هزینه'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedSubmissionId(sub.id);
                              setCurrentView('formReport');
                            }}
                            className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
                          >
                            <BarChart3 className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                            <span>مشاهده گزارش و تحلیل کارنامه</span>
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* بخش ۲: نوبت‌های مشاوره رزرو شده در عرض کامل دسکتاپ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-sky-100 text-sky-700 grid place-items-center">
                    <CalendarCheck className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-sky-950">
                      سامانه‌های نوبت‌دهی مشاوره
                    </h4>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      جلسات مشاوره، رزرو نوبت تلفنی و پیگیری‌های زمان‌بندی‌شده مراجع
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200">
                  {toPersianDigits(bookingSubs.length)} نوبت
                </span>
              </div>

              <div className="p-6">
                {bookingSubs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                    نوبت مشاوره‌ای ثبت نشده است.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {bookingSubs.map((sub) => {
                      const formObj = forms.find((f) => f.id === sub.formId);
                      const formTitle = formObj ? formObj.title : sub.formId;
                      const st = statusConfigs[sub.status] || statusConfigs.new;

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400 shadow-2xs hover:shadow-sm transition-all p-5 flex flex-col justify-between space-y-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-sky-700 block mb-0.5">
                                سامانه نوبت‌دهی
                              </span>
                              <h5 className="text-sm font-black text-slate-900 leading-snug">
                                {formTitle}
                              </h5>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border shrink-0 ${st.bg} ${st.color} ${st.border}`}>
                              {st.label}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs border border-slate-100 text-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">کد پیگیری:</span>
                              <span className="font-mono font-bold text-slate-800">{sub.trackingCode}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">تاریخ ثبت:</span>
                              <span className="font-mono text-slate-800">{formatPersianDateTime(sub.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">وضعیت پرداخت:</span>
                              <span className="font-bold text-emerald-700">
                                {sub.paymentStatus === 'paid' ? formatCurrency(sub.paymentAmount || 0, 'IRT') : 'بدون هزینه'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedSubmissionId(sub.id);
                              setCurrentView('formReport');
                            }}
                            className="w-full py-2.5 bg-[#173f6b] hover:bg-[#123357] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
                          >
                            <BarChart3 className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
                            <span>مشاهده گزارش و جزئیات نوبت</span>
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* بخش ۳: کادر ثبت‌نام و پذیرش در عرض کامل دسکتاپ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center">
                    <BadgeCheck className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-950">
                      پذیرش و فرم ثبت‌نام اولیه
                    </h4>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      فرم تشکیل پرونده اولیه، مشخصات فردی و سوابق پایه‌ای ثبت‌شده
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {toPersianDigits(registrationSubs.length)} فرم
                </span>
              </div>

              <div className="p-6">
                {registrationSubs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                    فرم ثبت‌نام اولیه‌ای یافت نشد.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {registrationSubs.map((sub) => {
                      const formObj = forms.find((f) => f.id === sub.formId);
                      const formTitle = formObj ? formObj.title : sub.formId;
                      const st = statusConfigs[sub.status] || statusConfigs.new;

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 shadow-2xs hover:shadow-sm transition-all p-5 flex flex-col justify-between space-y-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">
                                ثبت‌نام و تشکیل پرونده
                              </span>
                              <h5 className="text-sm font-black text-slate-900 leading-snug">
                                {formTitle}
                              </h5>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border shrink-0 ${st.bg} ${st.color} ${st.border}`}>
                              {st.label}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs border border-slate-100 text-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">کد پیگیری:</span>
                              <span className="font-mono font-bold text-slate-800">{sub.trackingCode}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">تاریخ ثبت:</span>
                              <span className="font-mono text-slate-800">{formatPersianDateTime(sub.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">وضعیت پرداخت:</span>
                              <span className="font-bold text-emerald-700">
                                {sub.paymentStatus === 'paid' ? formatCurrency(sub.paymentAmount || 0, 'IRT') : 'بدون هزینه'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedSubmissionId(sub.id);
                              setCurrentView('formReport');
                            }}
                            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
                          >
                            <BarChart3 className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                            <span>مشاهده اطلاعات و گزارش</span>
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* بخش ۴: سایر فرم‌های پرونده (در صورت وجود) */}
            {otherSubs.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-slate-200 text-slate-700 grid place-items-center">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        سایر فرم‌های ثبت‌شده پرونده
                      </h4>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        سایر فرم‌ها و استعلام‌های انجام‌شده مراجع
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700">
                    {toPersianDigits(otherSubs.length)} فرم
                  </span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {otherSubs.map((sub) => {
                    const formObj = forms.find((f) => f.id === sub.formId);
                    const formTitle = formObj ? formObj.title : sub.formId;
                    const st = statusConfigs[sub.status] || statusConfigs.new;

                    return (
                      <div
                        key={sub.id}
                        className="bg-white rounded-2xl border border-slate-200 hover:border-slate-400 shadow-2xs p-5 flex flex-col justify-between space-y-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-900 leading-snug">
                            {formTitle}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${st.bg} ${st.color} ${st.border}`}>
                            {st.label}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs border border-slate-100">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>کد پیگیری:</span>
                            <span className="font-mono font-bold text-slate-800">{sub.trackingCode}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span>تاریخ ثبت:</span>
                            <span className="font-mono text-slate-800">{formatPersianDateTime(sub.createdAt)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedSubmissionId(sub.id);
                            setCurrentView('formReport');
                          }}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 group"
                        >
                          <BarChart3 className="w-4 h-4 text-slate-300 group-hover:scale-110 transition-transform" />
                          <span>مشاهده گزارش مفصل</span>
                          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* نمای ویژه: گزارش تفکیکی، نموداری و مفصل فرم انتخاب‌شده */}
        {currentView === 'formReport' && selectedSubmission && (
          <div className="space-y-6 animate-in fade-in">
            {/* نوار بالای گزارش: بازگشت به لیست فرم‌ها + عنوان و متاداده */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setCurrentView('dossier');
                    setActiveTab('forms');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به لیست فرم‌های مراجع</span>
                </button>
                <button
                  onClick={openEditProfileModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#173f6b] hover:bg-[#123357] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                  title="ویرایش و به‌روزرسانی اطلاعات پرونده توسط مشاور"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>ویرایش مشخصات پرونده توسط مشاور</span>
                </button>
                <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#173f6b] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 font-mono">
                      فرم مرحله {toPersianDigits(currentSubmissions.findIndex((s) => s.id === selectedSubmission?.id) + 1 || 1)}
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      گزارش و تحلیل: {selectedFormObj?.title || 'فرم مراجع'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تحلیل نموداری، کارنامه شاخص‌ها و ریز پاسخ‌های ثبت‌شده در این فرم
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs px-3 py-1.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 font-bold">
                  کد پیگیری: {selectedSubmission.trackingCode}
                </span>
                <span className="text-xs px-3 py-1.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 font-mono">
                  {formatPersianDateTime(selectedSubmission.createdAt)}
                </span>
                <span
                  className={`text-xs px-3 py-1.5 rounded-xl border font-bold ${
                    selectedSubmission.paymentStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {selectedSubmission.paymentStatus === 'paid'
                    ? `پرداخت: ${formatCurrency(selectedSubmission.paymentAmount || 0, 'IRT')}`
                    : 'بدون هزینه'}
                </span>
              </div>
            </div>

            {/* نوار جابجایی سریع بین فرم‌های مراجع */}
            {currentSubmissions.length > 1 && (
              <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
                <span className="text-xs font-bold text-slate-400 mr-2 shrink-0">
                  انتخاب سریع فرم:
                </span>
                {currentSubmissions.map((sub, sIdx) => {
                  const fObj = forms.find((f) => f.id === sub.formId);
                  const isSel = sub.id === selectedSubmission.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubmissionId(sub.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                        isSel
                          ? 'bg-[#173f6b] text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-75">
                        مرحله {toPersianDigits(sIdx + 1)}:
                      </span>
                      <span>{fObj?.title || sub.trackingCode}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* بخش نمودارها و کارنامه آزمون یا شاخص‌های آماری فرم */}
            {(() => {
              const evalRes =
                selectedSubmission.evaluationResult ||
                selectedSubmission.data?.evaluationResult ||
                (selectedSubmission.formId === 'form-safaan-assessment'
                  ? safaEvaluationSubmission?.evaluationResult
                  : undefined);

              if (evalRes && evalRes.componentScores && evalRes.componentScores.length > 0) {
                return (
                  <EvaluationReportView
                    evaluation={evalRes}
                    formTitle={selectedFormObj?.title || 'کارنامه خودسنجی صفاً'}
                  />
                );
              }

              if (formAnalytics) {
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* ۱. نمودار حلقه‌ای درصد تکمیل داده‌ها */}
                    <div className="min-w-0 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-extrabold text-slate-600 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#173f6b]" />
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
                            className="text-[#173f6b] transition-all duration-1000 ease-out"
                            strokeDasharray={`${formAnalytics.completionRate}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-900 font-mono">
                            %{toPersianDigits(formAnalytics.completionRate)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold mt-0.5">تکمیل فرم</span>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-slate-600">
                        <p>
                          تعداد <strong className="text-slate-900 font-mono">{toPersianDigits(formAnalytics.filledCount)}</strong> فیلد از{' '}
                          <strong className="text-slate-900 font-mono">{toPersianDigits(formAnalytics.totalFields)}</strong> فیلد موجود تکمیل گردیده است.
                        </p>
                      </div>
                    </div>

                    {/* ۲. نمودارهای میله‌ای ابعاد و شاخص‌های کیفی فرم با رنگ‌بندی ۴ گانه معنایی */}
                    <div className="min-w-0 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs lg:col-span-2 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-2">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[#173f6b]" />
                            <span>تحلیل ابعاد کیفی، اعتبارسنجی و تطابق مراجع</span>
                          </span>
                          <span className="text-[11px] text-slate-400">محاسبه هوشمند بر پایه پاسخ‌های فرم</span>
                        </div>

                        <div className="pt-2">
                          <VerticalBarChart
                            data={formAnalytics.dimensions.map((dim) => {
                              const dimColor = getSemanticColorByPercentage(dim.score);
                              return {
                                label: dim.name,
                                value: dim.score,
                                percentage: dim.score,
                                color: dimColor.hex,
                                secondaryLabel: `${toPersianDigits(dim.score)}٪`,
                              };
                            })}
                            unit="٪"
                            maxScale={100}
                            height={220}
                            showValues={true}
                            badgeText="نمودار میله‌ای عمودی ابعاد"
                          />
                        </div>
                      </div>

                      {/* متاداده فرم */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-slate-100 text-[11px]">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">سوالات گزینه‌ای:</span>
                          <span className="font-bold text-slate-800 text-xs mt-0.5 block font-mono">
                            {toPersianDigits(formAnalytics.choiceFieldsCount)} فیلد
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">پاسخ‌های تشریحی:</span>
                          <span className="font-bold text-slate-800 text-xs mt-0.5 block font-mono">
                            {toPersianDigits(formAnalytics.textFieldsCount)} فیلد
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">تاریخ ثبت:</span>
                          <span className="font-bold text-slate-800 text-xs mt-0.5 block font-mono">
                            {formatPersianDateOnly(selectedSubmission.createdAt)}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">وضعیت پرداخت:</span>
                          <span className={`font-bold text-xs mt-0.5 block ${selectedSubmission.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {selectedSubmission.paymentStatus === 'paid' ? 'تأیید شاپرک' : 'بدون هزینه'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            {/* ۳. نمایش مفصل و گام به گام تمام فیلدهای این فرم (Detailed Field-by-Field Breakdown) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#173f6b] flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      جزئیات کامل پاسخ‌ها و فیلدهای فرم: {selectedFormObj?.title || 'فرم ثبت‌شده'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تمامی فیلدها و پاسخ‌های ارائه شده توسط مراجع به تفکیک مراحل فرم
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {selectedFormObj?.steps && selectedFormObj.steps.length > 0 ? (
                  selectedFormObj.steps.map((step: any, stepIdx: number) => {
                    const stepFields = (selectedFormObj.fields || []).filter(
                      (f: FormField) => f.stepId === step.id && !['sectionDivider', 'alertBox'].includes(f.type)
                    );

                    if (stepFields.length === 0) return null;

                    return (
                      <div key={step.id} className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                          <span className="w-6 h-6 rounded-lg bg-[#173f6b] text-white font-bold text-xs flex items-center justify-center">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {stepFields.map((field: FormField) => {
                            const val = selectedSubmission.data?.[field.id];
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
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/80">پاسخ ثبت‌شده</span>
                                </div>
                                <div className="text-xs sm:text-sm font-bold text-slate-900 pt-1">
                                  {val === undefined || val === null || val === '' ? (
                                    <span className="text-slate-300 italic">ثبت‌نشده</span>
                                  ) : (
                                    <span className="text-slate-900 break-words">{displayVal}</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {(selectedFormObj?.fields || [])
                      .filter((f: FormField) => !['sectionDivider', 'alertBox'].includes(f.type))
                      .map((field: FormField) => {
                        const val = selectedSubmission.data?.[field.id];
                        const displayVal = getFieldDisplayValue(field, val);

                        return (
                          <div
                            key={field.id}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between"
                          >
                            <span className="text-xs text-slate-500 font-medium mb-1">
                              {field.label}:
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 break-words">
                              {val === undefined || val === null || val === '' ? (
                                <span className="text-slate-300 italic">ثبت‌نشده</span>
                              ) : (
                                displayVal
                              )}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* فیلدهای تکمیلی ثبت‌شده */}
                {(() => {
                  const knownFieldIds = new Set((selectedFormObj?.fields || []).map((f: FormField) => f.id));
                  const extraEntries = Object.entries(selectedSubmission.data || {}).filter(
                    ([k, v]) =>
                      !knownFieldIds.has(k) &&
                      !['caseCode', 'evaluationResult', 'trackingCode', 'reconciledReason', 'linkingStatus', 'reconciledAt'].includes(k) &&
                      v !== undefined &&
                      v !== null &&
                      v !== ''
                  );

                  if (extraEntries.length === 0) return null;

                  return (
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <h4 className="text-xs sm:text-sm font-black text-slate-800">
                        سایر اطلاعات و پاسخ‌های ثبت‌شده:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {extraEntries.map(([k, v]) => {
                          const keyTranslations: Record<string, string> = {
                            fullName: 'نام و نام خانوادگی',
                            f_name: 'نام مراجع',
                            f_family: 'نام خانوادگی',
                            f_mobile: 'شماره تلفن همراه',
                            f_province_city_city: 'شهر محل سکونت',
                            f_province_city_province: 'استان محل سکونت',
                            f_birth_date: 'تاریخ تولد',
                            f_marital_status: 'وضعیت تأهل',
                            f_role_in_family: 'نقش در خانواده',
                            f_family_members: 'تعداد اعضای خانواده',
                            f_ebadollah_member: 'عضویت در سایت عبادالله',
                            f_physical_illness: 'سابقه بیماری جسمی',
                            f_mental_illness: 'سابقه بیماری روحی و روانشناختی',
                            f_medications: 'داروهای مصرفی',
                            f_school_name: 'نام مدرسه معارفی',
                            f_school_supervisor: 'ناظم مدرسه',
                            f_mentor_name: 'مربی تربیتی / استاد راهنما',
                          };
                          const label = keyTranslations[k] || k.replace(/^f_/, '').replace(/_/g, ' ');

                          return (
                            <div
                              key={k}
                              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between"
                            >
                              <span className="text-xs text-slate-500 font-bold mb-1">{label}:</span>
                              <span className="text-xs sm:text-sm font-bold text-slate-900 break-words">
                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ۴. ثبت نظر کارشناسی و یادداشت روی این فرم */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#173f6b]" />
                <span>یادداشت‌ها و نظرات کارشناسی روی این فرم:</span>
              </h4>

              {Array.isArray(selectedSubmission.comments) && selectedSubmission.comments.length > 0 && (
                <div className="space-y-2.5 pb-2">
                  {selectedSubmission.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          {comment.authorName} ({comment.authorRole})
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {formatPersianDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pt-1">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="text"
                  value={formCommentText}
                  onChange={(e) => setFormCommentText(e.target.value)}
                  placeholder="یادداشت کارشناسی یا دستور اقدام مدیر برای این فرم..."
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFormComment();
                    }
                  }}
                />
                <button
                  onClick={handleAddFormComment}
                  disabled={!formCommentText.trim()}
                  className="px-5 py-2.5 bg-[#173f6b] hover:bg-[#123357] text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40"
                >
                  ثبت نظر
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ۴. تب پیگیری‌ها (Followups Tab) - چیدمان دو ستونه مدرن و استاندارد دسکتاپ */}
        {currentView === 'dossier' && activeTab === 'followups' && (
          <div className="space-y-6 animate-in fade-in">
            {/* خلاصه‌ی آماری سریع پیگیری‌ها در بالای صفحه */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#173f6b] grid place-items-center shrink-0">
                  <MessageSquare className="size-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block">مجموع تعاملات و پیگیری‌ها</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {toPersianDigits(allFollowupComments.length)} اقدام ثبت‌شده
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 grid place-items-center shrink-0">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block">وضعیت پرونده</span>
                  <span className="text-base font-black text-slate-900">
                    {statusConfigs[currentStatus]?.label || 'فعال'}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 grid place-items-center shrink-0">
                  <Clock className="size-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block">آخرین پیگیری ثبت‌شده</span>
                  <span className="text-sm font-black text-slate-800 font-mono">
                    {allFollowupComments.length > 0 ? formatPersianDateTime(allFollowupComments[0].createdAt).split('-')[0] : 'هنوز ثبت نشده'}
                  </span>
                </div>
              </div>
            </div>

            {/* محیط کار ۲ ستونه پیگیری‌ها: سمت راست پنل ثبت، سمت چپ تایم‌لاین کامل */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ستون ثبت اقدام و لاگ جدید (۵ ستون در دسکتاپ) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="size-10 rounded-xl bg-blue-100 text-[#173f6b] grid place-items-center">
                      <MessageSquare className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">ثبت اقدام یا لاگ جدید</h3>
                      <p className="text-xs text-slate-400 mt-0.5">تماس تلفنی، جلسه، یادداشت محرمانه یا ارجاع</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-slate-500 font-bold block">نوع تعامل / اقدام:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'call', label: '📞 تماس تلفنی' },
                        { id: 'meeting', label: '🤝 جلسه حضوری' },
                        { id: 'sms', label: '💬 پیامک ارسالی' },
                        { id: 'note', label: '📝 یادداشت محرمانه' },
                        { id: 'referral', label: '🔄 ارجاع تخصصی' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNewFollowupType(t.id as any)}
                          className={`px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                            newFollowupType === t.id
                              ? 'bg-[#173f6b] text-white shadow-xs'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 font-bold block">متن و شرح گزارش پیگیری:</span>
                    <textarea
                      rows={4}
                      value={newFollowupText}
                      onChange={(e) => setNewFollowupText(e.target.value)}
                      placeholder="شرح کامل مکالمه، تصمیم اتخاذ شده، یادداشت محرمانه، یا توضیحات جهت پیگیری‌های بعدی..."
                      className="w-full p-3.5 text-[15px] sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:outline-none transition-all leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleAddFollowup}
                    disabled={isSubmittingFollowup || !newFollowupText.trim()}
                    className="w-full py-3 bg-[#173f6b] hover:bg-[#123357] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="size-4" />
                    <span>ثبت اقدام در پرونده مراجع</span>
                  </button>
                </div>
              </div>

              {/* ستون تاریخچه و تایم‌لاین کامل پیگیری‌ها (۷ ستون در دسکتاپ) */}
              <div className="lg:col-span-7">
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-slate-100 text-slate-700 grid place-items-center">
                        <Clock className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">تاریخچه کامل پیگیری‌ها و اقدامات</h3>
                        <p className="text-xs text-slate-400 mt-0.5">گاه‌شمار کلیه مکالمات، جلسات و یادداشت‌های مدیران</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                      {toPersianDigits(allFollowupComments.length)} مورد
                    </span>
                  </div>

                  <div className="space-y-4">
                    {allFollowupComments.length === 0 ? (
                      <div className="text-center py-16 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs sm:text-sm space-y-2">
                        <MessageSquare className="size-8 mx-auto text-slate-300" />
                        <p className="font-bold">هیچ پیگیری یا تماسی برای این مراجع ثبت نشده است.</p>
                        <p className="text-xs text-slate-400">می‌توانید اولین گزارش تماس یا پیگیری را از فرم کنار ثبت کنید.</p>
                      </div>
                    ) : (
                      allFollowupComments.map((item) => (
                        <div
                          key={item.id}
                          className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 text-xs sm:text-sm hover:border-blue-300 transition-all"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900">{item.authorName}</span>
                              <span className="text-xs text-slate-400">({item.authorRole})</span>
                              <span className="text-[11px] bg-blue-50 text-[#173f6b] px-2.5 py-0.5 rounded-full font-bold border border-blue-100">
                                {item.formTitle}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 font-mono">
                                {formatPersianDateTime(item.createdAt)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(item.id);
                                    setEditingCommentText(item.content);
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                  title="ویرایش اقدام"
                                >
                                  <Edit className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('آیا از حذف این اقدام/پیگیری از پرونده مراجع اطمینان دارید؟')) {
                                      deleteSubmissionComment(item.submissionId, item.id);
                                    }
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="حذف اقدام"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {editingCommentId === item.id ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                rows={3}
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="w-full p-3 text-xs sm:text-sm bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition leading-relaxed"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg font-bold transition cursor-pointer"
                                >
                                  انصراف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingCommentText.trim()) {
                                      editSubmissionComment(item.submissionId, item.id, editingCommentText.trim());
                                      setEditingCommentId(null);
                                    }
                                  }}
                                  className="px-4 py-1.5 text-xs bg-[#173f6b] hover:bg-[#123357] text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
                                >
                                  ذخیره ویرایش
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-medium">
                              {item.content}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ۵. تب مالی و نوبت‌ها (Finances Tab) - چیدمان بزرگ، جامع و استاندارد دسکتاپ */}
        {currentView === 'dossier' && activeTab === 'finances' && (
          <div className="space-y-6 animate-in fade-in">
            {/* خلاصه‌های مالی در ۴ کارت پهن دسکتاپ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">مجموع مبالغ واریز شده:</span>
                  <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
                    <CreditCard className="size-4" />
                  </div>
                </div>
                <span className="text-2xl font-black text-emerald-700 block font-mono">
                  {clientCase.totalPaidAmount > 0 ? formatCurrency(clientCase.totalPaidAmount, 'IRT') : 'بدون هزینه'}
                </span>
                <span className="text-[11px] text-emerald-600 block">
                  {clientCase.totalPaidAmount > 0 ? 'تراکنش موفق شاپرک' : 'پرونده بدون هزینه / رایگان'}
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">تعداد نوبت‌های ثبت‌شده:</span>
                  <div className="size-8 rounded-xl bg-blue-50 text-[#173f6b] grid place-items-center">
                    <CalendarCheck className="size-4" />
                  </div>
                </div>
                <span className="text-2xl font-black text-[#173f6b] block font-mono">
                  {toPersianDigits(appointments.length)} نوبت
                </span>
                <span className="text-[11px] text-blue-600 block">
                  {appointments.length > 0 ? 'ثبت شده در سامانه نوبت‌دهی' : 'فاقد نوبت ثبت‌شده'}
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">استاد مشاور پرونده:</span>
                  <div className="size-8 rounded-xl bg-indigo-50 text-indigo-700 grid place-items-center">
                    <User className="size-4" />
                  </div>
                </div>
                <span className="text-base font-black text-slate-900 block truncate">
                  {latestRecommendation?.counselor || (appointments[0]?.counselor ? appointments[0].counselor : 'مشاور تعیین‌نشده')}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  موضوع: {appointments[0]?.topic || 'مشاوره و ارزیابی جامع'}
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">وضعیت مالی و تعرفه:</span>
                  <div className="size-8 rounded-xl bg-purple-50 text-purple-700 grid place-items-center">
                    <ShieldCheck className="size-4" />
                  </div>
                </div>
                <span className="text-base font-black text-slate-900 block">
                  {clientCase.totalPaidAmount > 0 ? 'تعرفه آزاد مصوب' : 'حمایتی / آزاد سازمانی'}
                </span>
                <span className="text-[11px] text-purple-600 block">
                  تسویه‌شده از طریق درگاه پرداخت
                </span>
              </div>
            </div>

            {/* لیست جلسات مشاوره با جدول استاندارد و عریض دسکتاپ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-100 text-[#173f6b] grid place-items-center">
                    <Calendar className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">جدول جامع نوبت‌ها و جلسات مشاوره مراجع</h3>
                    <p className="text-xs text-slate-400 mt-0.5">برای مشاهده یا ثبت گزارش بالینی هر جلسه، روی دکمه عملیات کلیک کنید.</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">سامانه جامع نوبت‌دهی بالحق</div>
              </div>

              {appointments.length === 0 ? (
                <div className="p-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Calendar className="size-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">هنوز نوبت مشاوره‌ای برای این مراجع ثبت نشده است.</p>
                  <p className="text-xs text-slate-400">می‌توانید با دکمه بالا یک نوبت مشاوره جدید ایجاد کنید.</p>
                </div>
              ) : (
                <>
                  {/* جدول عریض ویژه دسکتاپ */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-black text-slate-500">
                          <th className="py-3 px-4 rounded-r-xl">ردیف</th>
                          <th className="py-3 px-4">تاریخ و زمان</th>
                          <th className="py-3 px-4">استاد مشاور</th>
                          <th className="py-3 px-4">موضوع جلسه</th>
                          <th className="py-3 px-4">وضعیت جلسه</th>
                          <th className="py-3 px-4">توصیه بالینی ثبت‌شده</th>
                          <th className="py-3 px-4 text-center rounded-l-xl">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {appointments.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-slate-400">{toPersianDigits(idx + 1)}</td>
                            <td className="py-4 px-4 font-mono font-bold text-slate-900">{toPersianDigits(item.date)}</td>
                            <td className="py-4 px-4 font-bold text-slate-800">{item.counselor}</td>
                            <td className="py-4 px-4 text-slate-600">{item.topic}</td>
                            <td className="py-4 px-4">
                              <span
                                className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                                  item.status === 'new'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {item.status === 'new' ? 'جدید / در انتظار' : 'انجام‌شده'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-500 max-w-xs truncate">
                              {item.recommendation || 'توصیه‌ای ثبت نشده'}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => openReportModal(item)}
                                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-[#173f6b] border border-blue-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                              >
                                {item.status === 'new' ? 'ثبت گزارش جلسه' : 'مشاهده / اصلاح'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* نمای کارتی ویژه موبایل */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {appointments.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-slate-900 font-mono">{toPersianDigits(item.date)}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              item.status === 'new'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {item.status === 'new' ? 'جدید / در انتظار' : 'انجام‌شده'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div>مشاور: <strong className="text-slate-800">{item.counselor}</strong></div>
                          <div>موضوع: <strong className="text-slate-800">{item.topic}</strong></div>
                        </div>
                        {item.recommendation && (
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                            <strong>توصیه:</strong> {item.recommendation}
                          </p>
                        )}
                        <button
                          onClick={() => openReportModal(item)}
                          className="w-full py-2 bg-white hover:bg-blue-50 text-[#173f6b] border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          {item.status === 'new' ? 'ثبت گزارش جلسه' : 'مشاهده / اصلاح گزارش'}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* سوابق و ریز تراکنش‌های پرداخت الکترونیک شاپرک در جدول دسکتاپ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center">
                    <CreditCard className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">ریز تراکنش‌های پرداخت الکترونیک شاپرک</h3>
                    <p className="text-xs text-slate-400 mt-0.5">صورتحساب تراکنش‌های مالی، شناسه رهگیری و رسیدهای پرداخت</p>
                  </div>
                </div>
              </div>

              {currentSubmissions.filter((s) => s.paymentAmount && s.paymentAmount > 0).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs sm:text-sm">
                  هیچ تراکنش پرداختی برای این پرونده ثبت نشده است.
                </div>
              ) : (
                <>
                  {/* جدول ویژه دسکتاپ */}
                  <div className="hidden md:block overflow-x-auto p-6">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-black text-slate-500">
                          <th className="py-3 px-4 rounded-r-xl">ردیف</th>
                          <th className="py-3 px-4">شرح خدمت / پرداخت</th>
                          <th className="py-3 px-4">شناسه پرداخت شاپرک</th>
                          <th className="py-3 px-4">تاریخ و زمان</th>
                          <th className="py-3 px-4">مبلغ تراکنش</th>
                          <th className="py-3 px-4 text-center rounded-l-xl">وضعیت درگاه</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {currentSubmissions
                          .filter((s) => s.paymentAmount && s.paymentAmount > 0)
                          .map((s, idx) => (
                            <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-4 px-4 font-mono font-bold text-slate-400">{toPersianDigits(idx + 1)}</td>
                              <td className="py-4 px-4 font-bold text-slate-900">پرداخت الکترونیک ثبت نام یا رزرو مشاوره</td>
                              <td className="py-4 px-4 font-mono text-xs text-slate-600">{s.paymentRefId || 'تأییدیه درگاه بانکی'}</td>
                              <td className="py-4 px-4 font-mono text-xs text-slate-600">{formatPersianDateTime(s.paymentDate || s.createdAt)}</td>
                              <td className="py-4 px-4 font-mono font-black text-emerald-700 text-sm">{formatCurrency(s.paymentAmount || 0, 'IRT')}</td>
                              <td className="py-4 px-4 text-center">
                                <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  پرداخت موفق شاپرک
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* نمای موبایل */}
                  <div className="divide-y divide-slate-100 text-xs md:hidden">
                    {currentSubmissions
                      .filter((s) => s.paymentAmount && s.paymentAmount > 0)
                      .map((s) => (
                        <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-900 block">
                              پرداخت الکترونیک مشاوره
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              شناسه: {s.paymentRefId || 'تأییدیه درگاه'}
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
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* مودال ثبت نوبت جدید */}
      {isNewAppointmentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsNewAppointmentModalOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">ثبت نوبت مشاوره جدید</h3>
              <button
                onClick={() => setIsNewAppointmentModalOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">تاریخ و ساعت نوبت:</label>
                <input
                  type="text"
                  placeholder="مثال: دوشنبه ۱۴۰۳/۰۸/۱۴ ساعت ۱۶:۰۰"
                  value={newAppointmentData.date}
                  onChange={(e) => setNewAppointmentData({ ...newAppointmentData, date: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">موضوع مشاوره:</label>
                <select
                  value={newAppointmentData.topic}
                  onChange={(e) => setNewAppointmentData({ ...newAppointmentData, topic: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none"
                >
                  <option value="خانواده و ازدواج">خانواده و ازدواج</option>
                  <option value="کودک و نوجوان">کودک و نوجوان</option>
                  <option value="تحصیلی و انتخاب رشته">تحصیلی و انتخاب رشته</option>
                  <option value="بالینی و فردی">بالینی و فردی</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">استاد مشاور:</label>
                <input
                  type="text"
                  placeholder="نام مشاور (مثال: جناب آقای برهانی)"
                  value={newAppointmentData.counselor}
                  onChange={(e) => setNewAppointmentData({ ...newAppointmentData, counselor: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewAppointmentModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#173f6b] text-white font-bold hover:bg-[#123357]"
                >
                  ثبت نوبت در پرونده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ثبت گزارش جلسه مشاوره */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setEditing(null);
          }}
        >
          <section className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white shadow-2xl md:rounded-[28px]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 p-5 backdrop-blur">
              <div>
                <div className="text-base font-black text-slate-900">ثبت گزارش جلسه مشاوره</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {toPersianDigits(editing.date)} · {editing.counselor && !editing.counselor.includes('علوی') ? editing.counselor : 'جناب آقای برهانی'}
                </div>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="grid size-9 place-items-center rounded-full bg-slate-100 text-lg text-slate-500 hover:bg-slate-200 transition cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-5">
              {/* وضعیت نوبت */}
              <div
                className={`mb-4 flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-bold ${
                  editing.status === 'new'
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
              >
                <span>
                  {editing.status === 'new'
                    ? '📌 این نوبت هنوز بررسی نشده است (با ثبت، وضعیت به انجام‌شده تغییر می‌کند).'
                    : '✓ گزارش این جلسه قبلاً ثبت شده است و می‌توانید آن را تکمیل یا اصلاح کنید.'}
                </span>
              </div>

              {/* بخش هایلایت ویژه: نسخه و توصیه‌های تجویزی مشاور */}
              <div className="mb-5 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-orange-50/30 p-4.5 shadow-sm ring-4 ring-amber-500/5">
                <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
                      <Sparkles className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-amber-950">نسخه و توصیه‌های تجویزی مشاور</h3>
                      <p className="text-[11px] text-amber-800/80">راهکارها، تمرین‌ها و پروتکل تجویزی جلسه</p>
                    </div>
                  </div>
                </div>

                {/* منوی کشویی / کرکره‌ای انتخاب سرفصل بالینی */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span>سرفصل بالینی توصیه:</span>
                    </span>
                    {selectedClinicalCategory && (
                      <button
                        type="button"
                        onClick={() => setSelectedClinicalCategory('')}
                        className="text-[11px] text-amber-800 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition"
                        title="حذف سرفصل انتخابی"
                      >
                        حذف انتخاب سرفصل ×
                      </button>
                    )}
                  </div>

                  {/* دکمه ماشه‌ای باز و بسته کردن منوی کشویی / کرکره‌ای */}
                  <button
                    type="button"
                    onClick={() => setIsClinicalCategoryOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isClinicalCategoryOpen
                        ? 'bg-white border-amber-400 ring-2 ring-amber-200 shadow-sm'
                        : selectedClinicalCategory
                        ? 'bg-amber-100/90 border-amber-300 text-amber-950 hover:bg-amber-100 shadow-xs'
                        : 'bg-white border-amber-200/90 text-slate-600 hover:bg-white hover:border-amber-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                      {selectedClinicalCategory ? (
                        <span className="font-black text-amber-950 truncate">
                          سرفصل انتخاب‌شده: <span className="text-[#173f6b] font-black">{selectedClinicalCategory}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium truncate">
                          جهت انتخاب سرفصل بالینی کلیک کنید...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-amber-800 mr-2">
                      <span className="text-[11px] font-bold hidden sm:inline">
                        {isClinicalCategoryOpen ? 'بستن منو' : 'باز کردن گزینه‌ها'}
                      </span>
                      <ChevronDown
                        className={`size-4 transition-transform duration-300 ${
                          isClinicalCategoryOpen ? 'rotate-180 text-amber-950' : 'text-amber-700'
                        }`}
                      />
                    </div>
                  </button>

                  {/* پنل کشویی / کرکره‌ای بازشونده گزینه‌ها */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isClinicalCategoryOpen
                        ? 'max-h-96 mt-2 opacity-100'
                        : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="rounded-xl border border-amber-200 bg-white/95 p-3 shadow-md backdrop-blur-xs">
                      <div className="text-[11px] font-bold text-amber-900/80 mb-2 px-1 flex items-center justify-between">
                        <span>یکی از سرفصل‌های بالینی زیر را انتخاب فرمایید:</span>
                        <span className="text-[10px] text-amber-700">کلیک جهت انتخاب و بستن منو</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          'تقویت رابطه زوجین',
                          'تاب‌آوری',
                          'نشخوار فکری',
                          'وسواس فکری',
                          'کنترل هیجان',
                          'مهارت‌های حل مسئله',
                          'اضطراب و استرس',
                          'سایر موارد',
                        ].map((cat) => {
                          const isSel = selectedClinicalCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setSelectedClinicalCategory(isSel ? '' : cat);
                                setIsClinicalCategoryOpen(false);
                              }}
                              className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-between gap-1 border ${
                                isSel
                                  ? 'bg-[#173f6b] text-white border-[#173f6b] shadow-sm ring-2 ring-blue-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900'
                              }`}
                            >
                              <span className="truncate">{cat}</span>
                              {isSel && <Check className="size-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* کادر متنی نسخه و توصیه‌های تجویزی */}
                <div className="mt-3.5">
                  <textarea
                    value={reportForm.recommendation}
                    onChange={(e) => setReportForm((old) => ({ ...old, recommendation: e.target.value }))}
                    placeholder="راهکارها، تمرین‌ها و پروتکل تجویزی برای مراجع (ذیل سرفصل انتخابی)..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-amber-300/80 bg-white p-3.5 text-sm leading-7 outline-none transition placeholder:text-slate-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 text-slate-800 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-5">
                {/* بخش ۱: موارد بررسی‌شده */}
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700">
                    <span className="grid size-6 place-items-center rounded-full bg-blue-50 text-[10px] text-blue-700 font-bold font-mono">۱</span>
                    موارد بررسی‌شده در جلسه
                  </span>
                  <textarea
                    value={reportForm.reviewed}
                    onChange={(e) => setReportForm((old) => ({ ...old, reviewed: e.target.value }))}
                    placeholder="مباحث، شرح‌حال و سرفصل‌های گفت‌وگو شده در جلسه..."
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                {/* بخش ۲: معضلات و چالش‌ها */}
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700">
                    <span className="grid size-6 place-items-center rounded-full bg-blue-50 text-[10px] text-blue-700 font-bold font-mono">۲</span>
                    معضلات و چالش‌های مراجع
                  </span>
                  <textarea
                    value={reportForm.challenges}
                    onChange={(e) => setReportForm((old) => ({ ...old, challenges: e.target.value }))}
                    placeholder="مشکلات رفتاری، خانوادگی، روحی یا تحصیلی تشخیص داده‌شده..."
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                {/* بخش ۳: آخرین وضعیت بالینی مراجع (۴ دکمه استاندارد) */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="flex items-center gap-2 text-xs font-black text-slate-700">
                    <span className="grid size-6 place-items-center rounded-full bg-blue-50 text-[10px] text-blue-700 font-bold font-mono">۳</span>
                    تعیین آخرین وضعیت پرونده مراجع بر اساس این جلسه:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'regressing', label: 'عقب گرد', color: 'rose' },
                      { id: 'needs_followup', label: 'نیازمند پیگیری', color: 'amber' },
                      { id: 'optimal', label: 'وضعیت مطلوب', color: 'emerald' },
                      { id: 'growing', label: 'در حال رشد', color: 'blue' },
                    ].map((st) => {
                      const isSel = selectedAppointmentStatus === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSelectedAppointmentStatus(st.id as any)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border text-center ${
                            isSel
                              ? st.color === 'rose'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-200'
                                : st.color === 'amber'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-200'
                                : st.color === 'emerald'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                                : 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 p-4 text-xs">
                <div>
                  <span className="text-slate-400">مشاور ثبت‌کننده</span>
                  <div className="mt-1 font-bold text-slate-800">{editing.counselor && !editing.counselor.includes('علوی') ? editing.counselor : 'جناب آقای برهانی'}</div>
                </div>
                <div>
                  <span className="text-slate-400">تاریخ جلسه</span>
                  <div className="mt-1 font-bold text-slate-800 font-mono">
                    {toPersianDigits(editing.date.split('،')[0])}
                  </div>
                </div>
              </div>

              {savedReport && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                  <Check className="size-4" />
                  گزارش جلسه و وضعیت بالینی پرونده با موفقیت ذخیره گردید.
                </div>
              )}

              <button
                onClick={submitReport}
                disabled={
                  !reportForm.reviewed.trim() ||
                  !reportForm.challenges.trim() ||
                  !reportForm.recommendation.trim()
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#173f6b] px-5 py-4 text-sm font-black text-white transition hover:bg-[#0f3155] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <Check className="size-4" />
                ثبت گزارش جلسه و تعیین وضعیت مراجع
              </button>
            </div>
          </section>
        </div>
      )}
      </div>
    
      {/* مودال ویرایش مشخصات مراجع توسط مشاور */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in" dir="rtl">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">ویرایش پرونده و شرح‌حال مراجع</h3>
                  <p className="text-[11px] text-slate-400">به‌روزرسانی سوابق بیماری، اطلاعات هویتی و تغییرات دوره‌ای مراجع</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نام:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نام خانوادگی:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_family}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_family: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تلفن همراه:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_mobile}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_mobile: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تاریخ تولد (شمسی):</label>
                  <input
                    type="text"
                    placeholder="روز / ماه / سال"
                    value={editProfileForm.f_birth_date}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_birth_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">وضعیت تأهل:</label>
                  <select
                    value={editProfileForm.f_marital_status}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_marital_status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="مجرد">مجرد</option>
                    <option value="متاهل">متاهل</option>
                    <option value="مطلقه">مطلقه</option>
                    <option value="همسر فوت شده">همسر فوت شده</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نقش در خانواده:</label>
                  <select
                    value={editProfileForm.f_role_in_family}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_role_in_family: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="پدر">پدر</option>
                    <option value="مادر">مادر</option>
                    <option value="دختر">دختر</option>
                    <option value="پسر">پسر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تعداد اعضای خانواده:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_family_members}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_family_members: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">استان و شهرستان:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_province_city}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_province_city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* بخش سلامت و بیماری‌ها */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="text-xs font-black text-rose-700">سوابق سلامت و بیماری‌ها (شرح‌حال پزشک/مشاور):</div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سابقه بیماری جسمی:</label>
                  <textarea
                    rows={2}
                    placeholder="در صورت عدم بیماری بنویسید «ندارم»..."
                    value={editProfileForm.f_physical_illness}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_physical_illness: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سابقه بیماری روحی/روانی:</label>
                  <textarea
                    rows={2}
                    placeholder="در صورت عدم بیماری بنویسید «ندارم»..."
                    value={editProfileForm.f_mental_illness}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_mental_illness: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">داروهای مصرفی:</label>
                  <textarea
                    rows={2}
                    placeholder="در صورت عدم مصرف بنویسید «ندارم»..."
                    value={editProfileForm.f_medications}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_medications: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* مدرسه معارفی */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نام مدرسه معارفی:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_school_name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_school_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">ناظم مدرسه:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_school_supervisor}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_school_supervisor: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">مربی تربیتی:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_mentor_name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_mentor_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveProfileEdit}
                className="px-5 py-2.5 rounded-xl bg-[#173f6b] hover:bg-[#123357] text-white text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ذخیره تغییرات در پرونده</span>
              </button>
            </div>
          </div>
        </div>
      )}

</div>
  );
};
