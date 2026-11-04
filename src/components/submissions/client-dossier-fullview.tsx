'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Form, FormSubmission, SubmissionStatus, FormField } from '@/types/form';
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
  Check,
  Search,
  Plus,
} from 'lucide-react';
import { EvaluationReportView } from '../analytics/evaluation-report-view';
import { ClientStatisticalAnalysisTab } from './client-statistical-analysis-tab';
import { getFourColorByIndex, getSemanticColorByPercentage } from '@/lib/chart-colors';
import {
  formatPersianDateTime,
  formatPersianDateOnly,
  formatCurrency,
  toPersianDigits,
  toEnglishDigits,
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

export type Appointment = {
  id: number | string;
  date: string;
  topic: string;
  counselor: string;
  status: 'new' | 'done';
  reviewed?: string;
  challenges?: string;
  recommendation?: string;
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
    str.includes('ارجاع به کارگاه مهارت‌های زندگی')
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
      const app: Appointment = {
        id: sub.id || `app-${idx + 1}`,
        date: String(bookingTime || formatPersianDateTime(sub.createdAt)),
        topic: String(
          data.f_counseling_subject ||
          data.f_topic ||
          data.f_consultation_type ||
          topicFromSlot ||
          'مشاوره تخصصی'
        ),
        counselor: String(counselorName || 'مشاور تعیین‌شده مرکز'),
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

export const ClientDossierFullview: React.FC<ClientDossierFullviewProps> = ({
  clientCase,
  onClose,
  onStatusChange,
}) => {
  const { forms, updateSubmissionStatus, addSubmissionComment } = useForm();
  const { currentUser } = useAdminAuth();

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
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);

  // استیت وضعیت فعلی پرونده
  const [currentStatus, setCurrentStatus] = useState<SubmissionStatus>(clientCase.overallStatus);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // استخراج یکپارچه داده‌های هویتی مراجع از میان تمام فرم‌های پر شده در دیتابیس
  const combinedData = useMemo(() => {
    const data: Record<string, any> = {};
    clientCase.submissions.forEach((sub) => {
      Object.assign(data, sub.data);
    });
    return data;
  }, [clientCase.submissions]);

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

    clientCase.submissions.forEach((sub) => {
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
  }, [clientCase.submissions, forms]);

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
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.error('Failed cleanup of legacy appointment cache', e);
      }
    }
  }, []);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const fromSubs = extractRealAppointmentsFromSubmissions(clientCase.submissions);

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
              return cleanSaved;
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse saved appointments', e);
      }
    }

    return fromSubs;
  });

  // مودال ثبت/ویرایش گزارش جلسه مشاوره
  const [editing, setEditing] = useState<Appointment | null>(null);
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

  // سن مراجع (محاسبه هوشمند از سال تولد یا تاریخ تولد شمسی)
  const clientAge = useMemo(() => {
    if (combinedData.f_age || combinedData.age) {
      const rawAge = combinedData.f_age || combinedData.age;
      const numAge = parseInt(toEnglishDigits(String(rawAge)));
      if (!isNaN(numAge) && numAge > 0 && numAge < 120) {
        return `${toPersianDigits(numAge)} سال`;
      }
    }

    let bYear: number | null = null;

    if (combinedData.birth_year) {
      const parsed = parseInt(toEnglishDigits(String(combinedData.birth_year)));
      if (!isNaN(parsed) && parsed > 1300 && parsed < 1450) {
        bYear = parsed;
      }
    }

    if (!bYear && combinedData.f_birth_date) {
      const rawDate = toEnglishDigits(String(combinedData.f_birth_date)).trim();
      const parts = rawDate.split(/[\/\-\.]/);
      if (parts.length >= 1) {
        const parsed = parseInt(parts[0]);
        if (!isNaN(parsed) && parsed > 1300 && parsed < 1450) {
          bYear = parsed;
        }
      }
    }

    if (!bYear) {
      for (const sub of clientCase.submissions) {
        if (sub.data?.birth_year) {
          const parsed = parseInt(toEnglishDigits(String(sub.data.birth_year)));
          if (!isNaN(parsed) && parsed > 1300 && parsed < 1450) {
            bYear = parsed;
            break;
          }
        }
        if (sub.data?.f_birth_date) {
          const rawDate = toEnglishDigits(String(sub.data.f_birth_date)).trim();
          const parts = rawDate.split(/[\/\-\.]/);
          const parsed = parseInt(parts[0]);
          if (!isNaN(parsed) && parsed > 1300 && parsed < 1450) {
            bYear = parsed;
            break;
          }
        }
      }
    }

    if (bYear) {
      const currentJalaliYear = 1403;
      const calculatedAge = Math.max(1, currentJalaliYear - bYear);
      return `${toPersianDigits(calculatedAge)} سال (متولد ${toPersianDigits(bYear)})`;
    }

    return 'ثبت‌نشده';
  }, [combinedData, clientCase.submissions]);

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
    if (appointments.length === 0) {
      return {
        firstAppointmentDate: 'فاقد نوبت ثبت‌شده',
        lastAppointmentDate: 'فاقد نوبت ثبت‌شده',
      };
    }

    if (appointments.length === 1) {
      const singleDate = toPersianDigits(appointments[0].date);
      return {
        firstAppointmentDate: singleDate,
        lastAppointmentDate: singleDate,
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
            const y = parseInt(digits.find((n) => n.length === 4) || '1403');
            const d = parseInt(digits.find((n) => n.length <= 2) || '1');
            return y * 100000000 + (i + 1) * 1000000 + d * 10000;
          }
        }
      }
      return 0;
    };

    const sorted = [...appointments].sort((a, b) => {
      const wa = parseWeight(a.date);
      const wb = parseWeight(b.date);
      if (wa !== 0 && wb !== 0) return wa - wb;
      return 0;
    });

    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];

    return {
      firstAppointmentDate: toPersianDigits(earliest.date),
      lastAppointmentDate: toPersianDigits(latest.date),
    };
  }, [appointments]);

  // موضوعات اصلی مراجعه
  const mainConsultationTopics = useMemo(() => {
    const topicsSet = new Set<string>();

    appointments.forEach((app) => {
      if (app.topic && app.topic.trim()) {
        topicsSet.add(app.topic.trim());
      }
    });

    clientCase.submissions.forEach((sub) => {
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
  }, [appointments, clientCase.submissions]);

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

    clientCase.submissions.forEach((sub) => {
      const d = sub.data || {};
      const cName = d.f_booking_counselor || d.f_counselor || d.f_counselor_name || d.counselorName;
      if (cName && typeof cName === 'string' && cName.trim()) {
        cSet.add(cName.trim());
      }
    });

    return Array.from(cSet);
  }, [appointments, clientCase.submissions]);

  const openReportModal = (appointment: Appointment) => {
    setEditing(appointment);
    setReportForm({
      reviewed: appointment.reviewed ?? '',
      challenges: appointment.challenges ?? '',
      recommendation: appointment.recommendation ?? '',
    });
    setSavedReport(false);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointmentData.date.trim()) {
      alert('لطفاً تاریخ و ساعت نوبت را وارد فرمایید.');
      return;
    }

    const newApp: Appointment = {
      id: `app-custom-${Date.now()}`,
      date: newAppointmentData.date.trim(),
      topic: newAppointmentData.topic,
      counselor: newAppointmentData.counselor.trim() || 'مشاور مرکز بالحق',
      status: 'new',
    };

    setAppointments((prev) => [newApp, ...prev]);
    setIsNewAppointmentModalOpen(false);
    setNewAppointmentData({ date: '', topic: 'خانواده و ازدواج', counselor: '' });
  };

  const submitReport = () => {
    if (!editing || !reportForm.reviewed.trim() || !reportForm.challenges.trim() || !reportForm.recommendation.trim()) return;

    setAppointments((current) =>
      current.map((item) =>
        item.id === editing.id
          ? {
              ...item,
              ...reportForm,
              status: 'done',
            }
          : item
      )
    );

    // ثبت لاگ پیگیری ذیل همین گزارش جلسه به صورت خودکار
    const targetSubId = clientCase.submissions[0]?.id;
    if (targetSubId) {
      addSubmissionComment(
        targetSubId,
        editing.counselor || 'مشاور مرکز بالحق',
        'مشاور ارشد پرونده',
        `🤝 ثبت گزارش جلسه مشاوره (${editing.topic} - ${editing.date.split('،')[0]}): ${reportForm.recommendation.trim()}`
      );
    }

    setSavedReport(true);
    window.setTimeout(() => {
      setEditing(null);
    }, 900);
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
  };

  // دریافت فرم و ارسالی انتخاب شده جهت نمایش گزارش نموداری
  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return clientCase.submissions[0] || null;
    return clientCase.submissions.find((s) => s.id === selectedSubmissionId) || clientCase.submissions[0] || null;
  }, [clientCase.submissions, selectedSubmissionId]);

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
    return clientCase.submissions.find((s) => s.evaluationResult || s.formId === 'form-safaan-assessment');
  }, [clientCase.submissions]);

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
      clientCase.submissions[clientCase.submissions.length - 1]?.createdAt || clientCase.latestDate;
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
  }, [clientCase.submissions, clientCase.latestDate]);

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

  // نرخ واقعی تکمیل اطلاعات پرونده (محاسبه از کل فیلدهای ارسالی)
  const profileCompletionRate = useMemo(() => {
    let totalFields = 0;
    let filledFields = 0;

    clientCase.submissions.forEach((sub) => {
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
      addSubmissionComment(targetSubId, adminName, adminRole, contentWithPrefix);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f5f7fa] text-slate-800" dir="rtl">
      {/* سربرگ ناوبری سراسری برند بالحق */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur shadow-2xs">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-6 px-4 sm:px-6 py-3.5">
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
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 py-6 space-y-5">
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
              onClick={() => window.print()}
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


        {/* نوار زبانه‌های ناوبری ۶ گانه */}
        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs">
          {[
            ['overview', 'تحلیل در یک نگاه'],
            ['analytics', 'تحلیل‌های آماری'],
            ['profile', 'مشخصات ثبت‌نام'],
            ['forms', 'فرم‌ها و آزمون‌ها'],
            ['followups', 'پیگیری‌ها'],
            ['finances', 'مالی و نوبت‌ها'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setCurrentView('dossier');
                setActiveTab(key as any);
              }}
              className={`shrink-0 rounded-xl px-5 py-3 text-xs font-bold transition cursor-pointer ${
                (currentView === 'dossier' && activeTab === key) ||
                (currentView === 'formReport' && key === 'forms')
                  ? 'bg-[#173f6b] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
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

              {/* ۱۱. آخرین توصیه مشاور */}
              <div className="mt-3.5 rounded-2xl bg-violet-50/60 border border-violet-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-violet-900 text-xs font-black">
                    <Sparkles className="size-4 text-violet-600 shrink-0" />
                    <span>آخرین توصیه مشاور:</span>
                  </div>
                  {latestRecommendation && (
                    <div className="flex items-center gap-2 text-[11px] text-violet-600">
                      <span className="font-bold">{latestRecommendation.counselor}</span>
                      <span>•</span>
                      <span className="font-mono">{latestRecommendation.date.split('،')[0]}</span>
                    </div>
                  )}
                </div>
                {latestRecommendation?.recommendation ? (
                  <div className="text-xs sm:text-sm leading-7 text-slate-800 font-medium bg-white/90 rounded-xl p-3.5 border border-violet-100 shadow-2xs">
                    {latestRecommendation.recommendation}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1">
                    هنوز توصیه‌ای از سوی مشاور برای این مراجع ثبت نشده است. (با ثبت اولین گزارش جلسه بالینی، در این بخش منعکس خواهد شد)
                  </p>
                )}
              </div>
            </article>

            {/* گرید سه‌گانه بالای صفحه: توصیه‌ها، نوبت‌ها، مدرسه معارفی */}
            <div className="grid gap-4 xl:grid-cols-3">
              {/* کارت ۱: آخرین توصیه‌های مشاور */}
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
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
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
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
                      <button
                        onClick={() => setIsNewAppointmentModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#173f6b] text-white rounded-xl text-xs font-bold hover:bg-[#123357] transition cursor-pointer"
                      >
                        <Plus className="size-3.5" />
                        <span>ثبت نوبت مشاوره جدید</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                  {appointments.length > 0 ? (
                    <>
                      <span>روی هر نوبت جهت ثبت گزارش کلیک کنید</span>
                      <button
                        onClick={() => setIsNewAppointmentModalOpen(true)}
                        className="text-[#173f6b] font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="size-3" />
                        <span>افزودن نوبت</span>
                      </button>
                    </>
                  ) : (
                    <span>سامانه نوبت‌دهی مشاوره بالحق</span>
                  )}
                </div>
              </article>

              {/* کارت ۳: نام مدرسه معارفی */}
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                      <GraduationCap className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">نام مدرسه معارفی</h3>
                      <p className="mt-1 text-[11px] text-slate-400">اطلاعات ارتباطی مدرسه مراجع</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-emerald-50/60 p-4">
                    <div className="text-sm font-black text-emerald-900">
                      {combinedData.f_school_name || 'مدرسه معارفی ثبت نشده است'}
                    </div>
                    <div className="mt-1 text-[11px] text-emerald-700">
                      {combinedData.f_school_grade
                        ? combinedData.f_school_grade
                        : combinedData.f_school_name
                        ? `شهر/استان مراجع: ${clientCase.provinceCity && clientCase.provinceCity !== 'ثبت‌نشده' ? clientCase.provinceCity : (combinedData.f_province_city || combinedData.province || 'ثبت‌نشده')}`
                        : 'اطلاعاتی در فرم ثبت‌نام ثبت نشده است'}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 p-3">
                      <div className="text-[10px] text-slate-400">ناظم مدرسه</div>
                      <div className="mt-1.5 text-xs font-bold text-slate-800">
                        {combinedData.f_school_supervisor || 'ثبت‌نشده توسط مراجع'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 p-3">
                      <div className="text-[10px] text-slate-400">مربی تربیتی</div>
                      <div className="mt-1.5 text-xs font-bold text-slate-800">
                        {combinedData.f_mentor_name || 'ثبت‌نشده توسط مراجع'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-400">
                  {combinedData.f_school_name ? 'معرف و رابط معارفی مدرسه به مرکز' : 'فاقد اطلاعات مدرسه معارفی'}
                </div>
              </article>
            </div>

            {/* گرید میانی: نتایج واقعی آزمون‌ها و آمار پرونده */}
            <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
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
                        <div className="mt-3 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${safaColor.bgBar} transition-all duration-700 shadow-2xs`}
                            style={{
                              width: `${Math.min(100, Math.max(Number(overallScore) || 0, 0))}%`,
                              backgroundColor: safaColor.hex,
                            }}
                          />
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
                    <div className="mt-3 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width:
                            smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication
                              ? '60%'
                              : '100%',
                          backgroundColor:
                            smartAnalysis.hasPhysicalIllness || smartAnalysis.hasMentalIllness || smartAnalysis.hasMedication
                              ? '#f59e0b'
                              : '#059669',
                        }}
                      />
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
                    {(() => {
                      const profColor = getSemanticColorByPercentage(profileCompletionRate);
                      return (
                        <div className="mt-3 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${profColor.bgBar} transition-all duration-700 shadow-2xs`}
                            style={{
                              width: `${Math.min(100, Math.max(Number(profileCompletionRate) || 0, 0))}%`,
                              backgroundColor: profColor.hex,
                            }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
          />
        )}

        {/* ۲. تب مشخصات ثبت‌نام مراجع (Profile Tab) */}
        {currentView === 'dossier' && activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in">
            {/* اطلاعات هویتی و سجلی */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200/90 flex items-center gap-2">
                <User className="w-4 h-4 text-[#173f6b]" />
                <h3 className="text-sm font-extrabold text-slate-900">مشخصات هویتی و فردی مراجع</h3>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">نام و نام خانوادگی:</span>
                  <span className="font-bold text-slate-900 text-sm">{displayFullName}</span>
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
                  <span className="font-bold text-slate-900 text-sm">{roleInFamily}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">تعداد اعضای خانواده:</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    {combinedData.f_family_members ? toPersianDigits(combinedData.f_family_members) : 'ثبت‌نشده'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">وضعیت تأهل:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {combinedData.f_marital_status || 'ثبت‌نشده'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">استان و شهرستان:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {clientCase.provinceCity && clientCase.provinceCity !== 'ثبت‌نشده'
                      ? clientCase.provinceCity
                      : combinedData.f_province_city || combinedData.province || 'ثبت‌نشده'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">عضویت در سایت عبادالله:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {combinedData.f_ebadollah_member || 'ثبت‌نشده'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">کد یکتای پرونده:</span>
                  <span className="font-bold text-[#173f6b] text-sm font-mono">{clientCase.caseCode}</span>
                </div>
              </div>
            </div>

            {/* سوابق سلامت و پزشکی */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200/90 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-extrabold text-slate-900">سوابق سلامت و شرح‌حال پزشکی مراجع</h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold">سابقه بیماری جسمی:</span>
                  <p className="font-bold text-slate-900 pt-1">
                    {combinedData.f_physical_illness || 'ندارد / ثبت‌نشده'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold">سابقه بیماری روحی و روانشناختی:</span>
                  <p className="font-bold text-slate-900 pt-1">
                    {combinedData.f_mental_illness || 'ندارد / ثبت‌نشده'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold">داروهای مصرفی:</span>
                  <p className="font-bold text-slate-900 pt-1">
                    {combinedData.f_medications || 'ندارد / ثبت‌نشده'}
                  </p>
                </div>
              </div>
            </div>

            {/* اطلاعات مدرسه معارفی */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200/90 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#173f6b]" />
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
                    {combinedData.f_school_supervisor || 'ثبت‌نشده توسط مراجع'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">مربی تربیتی / مشاور:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {combinedData.f_mentor_name || 'ثبت‌نشده توسط مراجع'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ۳. تب فرم‌ها و آزمون‌ها (Forms Tab) - تفکیک ۳ قسمتی زیر هم: ۱. پرسشنامه‌ها ۲. نوبت‌های مشاوره ۳. کادر ثبت‌نام */}
        {currentView === 'dossier' && activeTab === 'forms' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  فرم‌ها و پرسشنامه‌های تکمیل‌شده توسط مراجع
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تفکیک ۳ قسمتی پرونده: پرسشنامه‌ها، نوبت‌های مشاوره و کادر ثبت‌نام
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-[#173f6b] rounded-full font-mono self-start sm:self-auto border border-blue-200/60">
                مجموع {toPersianDigits(clientCase.submissions.length)} فرم در پرونده
              </span>
            </div>

            {/* سه ستون موازی: ۱. ستون پرسشنامه‌ها ۲. ستون نوبت‌های مشاوره ۳. کادر ثبت‌نام */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* ستون اول (سمت راست در RTL): ستون پرسشنامه‌ها */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b-2 border-indigo-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200/80 shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-indigo-950">
                        ستون پرسشنامه‌ها
                      </h4>
                      <span className="text-[10px] text-slate-400 block">
                        آزمون صفا و پرسشنامه‌های بالینی
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {toPersianDigits(questionnaireSubs.length)}
                  </span>
                </div>

                {/* فرم‌های پر شده در این ستون از بالا به پایین یکی یکی چیده می‌شوند */}
                <div className="flex flex-col space-y-3.5">
                  {questionnaireSubs.length === 0 ? (
                    <div className="p-4 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      پرسشنامه‌ای ثبت نشده است
                    </div>
                  ) : (
                    questionnaireSubs.map((sub) => {
                      const formObj = forms.find((f) => f.id === sub.formId);
                      const formTitle = formObj ? formObj.title : sub.formId;
                      const st = statusConfigs[sub.status] || statusConfigs.new;

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400 shadow-2xs hover:shadow-sm transition-all p-4 flex flex-col justify-between space-y-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-700 block mb-0.5">
                                پرسشنامه بالینی
                              </span>
                              <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                                {formTitle}
                              </h5>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${st.bg} ${st.color} ${st.border}`}>
                              {st.label}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl space-y-1.5 text-[11px] border border-slate-100 text-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">کد پیگیری:</span>
                              <span className="font-mono font-bold text-slate-800">{sub.trackingCode}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">تاریخ ثبت:</span>
                              <span className="font-mono text-slate-800">{formatPersianDateTime(sub.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">پرداخت:</span>
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
                            className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-indigo-200 group-hover:scale-110 transition-transform" />
                            <span>مشاهده گزارش و تحلیل</span>
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ستون دوم (وسط در RTL): ستون نوبت‌های مشاوره */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b-2 border-sky-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold border border-sky-200/80 shrink-0">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-sky-950">
                        ستون نوبت‌های مشاوره
                      </h4>
                      <span className="text-[10px] text-slate-400 block">
                        جلسات و رزرو نوبت تلفنی
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                    {toPersianDigits(bookingSubs.length)}
                  </span>
                </div>

                {/* فرم‌های پر شده در این ستون از بالا به پایین یکی یکی چیده می‌شوند */}
                <div className="flex flex-col space-y-3.5">
                  {bookingSubs.length === 0 ? (
                    <div className="p-4 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      نوبت مشاوره‌ای ثبت نشده است
                    </div>
                  ) : (
                    bookingSubs.map((sub) => {
                      const formObj = forms.find((f) => f.id === sub.formId);
                      const formTitle = formObj ? formObj.title : sub.formId;
                      const st = statusConfigs[sub.status] || statusConfigs.new;

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400 shadow-2xs hover:shadow-sm transition-all p-4 flex flex-col justify-between space-y-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-sky-700 block mb-0.5">
                                سامانه نوبت‌دهی
                              </span>
                              <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                                {formTitle}
                              </h5>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${st.bg} ${st.color} ${st.border}`}>
                              {st.label}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl space-y-1.5 text-[11px] border border-slate-100 text-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">کد پیگیری:</span>
                              <span className="font-mono font-bold text-slate-800">{sub.trackingCode}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">تاریخ ثبت:</span>
                              <span className="font-mono text-slate-800">{formatPersianDateTime(sub.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">پرداخت:</span>
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
                            className="w-full py-2 bg-[#173f6b] hover:bg-[#123357] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-blue-200 group-hover:scale-110 transition-transform" />
                            <span>مشاهده گزارش و تحلیل</span>
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ستون سوم (سمت چپ در RTL): کادر ثبت‌نام */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200/80 shrink-0">
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-950">
                        کادر ثبت‌نام
                      </h4>
                      <span className="text-[10px] text-slate-400 block">
                        پذیرش و مشخصات فردی مراجع
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {toPersianDigits(registrationSubs.length)}
                  </span>
                </div>

                {/* فرم‌های پر شده در این ستون از بالا به پایین یکی یکی چیده می‌شوند */}
                <div className="flex flex-col space-y-3.5">
                  {registrationSubs.length === 0 ? (
                    <div className="p-4 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      فرم ثبت‌نام اولیه‌ای یافت نشد
                    </div>
                  ) : (
                    registrationSubs.map((sub) => {
                      const formObj = forms.find((f) => f.id === sub.formId);
                      const formTitle = formObj ? formObj.title : sub.formId;
                      const st = statusConfigs[sub.status] || statusConfigs.new;

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 shadow-2xs hover:shadow-sm transition-all p-4 flex flex-col justify-between space-y-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">
                                ثبت‌نام و تشکیل پرونده
                              </span>
                              <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                                {formTitle}
                              </h5>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${st.bg} ${st.color} ${st.border}`}>
                              {st.label}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl space-y-1.5 text-[11px] border border-slate-100 text-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">کد پیگیری:</span>
                              <span className="font-mono font-bold text-slate-800">{sub.trackingCode}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">تاریخ ثبت:</span>
                              <span className="font-mono text-slate-800">{formatPersianDateTime(sub.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">پرداخت:</span>
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
                            className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-emerald-200 group-hover:scale-110 transition-transform" />
                            <span>مشاهده گزارش و تحلیل</span>
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* در صورت وجود سایر فرم‌ها (کاملاً عمودی) */}
            {otherSubs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-black text-slate-800">
                    سایر فرم‌های پرونده
                  </h4>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                    {toPersianDigits(otherSubs.length)} فرم
                  </span>
                </div>
                <div className="flex flex-col space-y-3.5">
                  {otherSubs.map((sub) => {
                    const formObj = forms.find((f) => f.id === sub.formId);
                    const formTitle = formObj ? formObj.title : sub.formId;
                    const st = statusConfigs[sub.status] || statusConfigs.new;

                    return (
                      <div
                        key={sub.id}
                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-400 shadow-2xs hover:shadow-sm transition-all p-5 flex flex-col space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base border border-slate-200 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 leading-snug">
                                {formTitle}
                              </h4>
                            </div>
                          </div>

                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border self-start sm:self-auto shrink-0 ${st.bg} ${st.color} ${st.border}`}>
                            {st.label}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border border-slate-100">
                          <div className="flex items-center justify-between sm:justify-start sm:gap-2 text-slate-500">
                            <span>کد پیگیری فرم:</span>
                            <span className="font-mono font-bold text-slate-800">{sub.trackingCode}</span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-start sm:gap-2 text-slate-500">
                            <span>تاریخ و ساعت ثبت:</span>
                            <span className="font-mono text-slate-800">{formatPersianDateTime(sub.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              setSelectedSubmissionId(sub.id);
                              setCurrentView('formReport');
                            }}
                            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 group"
                          >
                            <BarChart3 className="w-4 h-4 text-slate-300 group-hover:scale-110 transition-transform" />
                            <span>مشاهده گزارش نموداری و مفصل این فرم</span>
                            <ChevronRight className="w-4 h-4 rotate-180" />
                          </button>
                        </div>
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
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
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
                <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#173f6b] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 font-mono">
                      فرم مرحله {toPersianDigits(clientCase.submissions.findIndex((s) => s.id === selectedSubmission.id) + 1 || 1)}
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
            {clientCase.submissions.length > 1 && (
              <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
                <span className="text-xs font-bold text-slate-400 mr-2 shrink-0">
                  انتخاب سریع فرم:
                </span>
                {clientCase.submissions.map((sub, sIdx) => {
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
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center">
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
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs lg:col-span-2 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-2">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[#173f6b]" />
                            <span>تحلیل ابعاد کیفی، اعتبارسنجی و تطابق مراجع</span>
                          </span>
                          <span className="text-[11px] text-slate-400">محاسبه هوشمند بر پایه پاسخ‌های فرم</span>
                        </div>

                        <div className="space-y-4">
                          {formAnalytics.dimensions.map((dim, idx) => {
                            const dimColor = getSemanticColorByPercentage(dim.score);
                            return (
                              <div key={idx} className="space-y-1.5 group">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${dimColor.dotBg} shrink-0 ring-2 ${dimColor.ringColor}`} />
                                    <span className="font-bold text-slate-800">{dim.name}</span>
                                  </div>
                                  <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded border ${dimColor.badgeBg} ${dimColor.textColor} ${dimColor.badgeBorder}`}>
                                    %{toPersianDigits(dim.score)}
                                  </span>
                                </div>
                                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${dimColor.bgBar} rounded-full transition-all duration-500`}
                                    style={{
                                      width: `${Math.min(100, Math.max(Number(dim.score) || 0, 0))}%`,
                                      backgroundColor: dimColor.hex,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
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
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {field.id}
                                  </span>
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
                        {extraEntries.map(([k, v]) => (
                          <div
                            key={k}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between"
                          >
                            <span className="text-xs text-slate-500 font-mono mb-1">{k}:</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 break-words">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
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

              {selectedSubmission.comments && selectedSubmission.comments.length > 0 && (
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

        {/* ۴. تب پیگیری‌ها (Followups Tab) */}
        {currentView === 'dossier' && activeTab === 'followups' && (
          <div className="space-y-6 animate-in fade-in">
            {/* افزودن لاگ پیگیری */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#173f6b]" />
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
                        ? 'bg-[#173f6b] text-white shadow-xs'
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
                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:outline-none transition-all"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleAddFollowup}
                  disabled={isSubmittingFollowup || !newFollowupText.trim()}
                  className="px-6 py-2.5 bg-[#173f6b] hover:bg-[#123357] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ثبت در پرونده مراجع</span>
                </button>
              </div>
            </div>

            {/* تاریخچه پیگیری‌ها */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                تاریخچه کامل پیگیری‌ها و یادداشت‌های مدیر:
              </h3>

              <div className="space-y-4">
                {allFollowupComments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    هیچ پیگیری یا تماسی برای این مراجع ثبت نشده است.
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
                          <span className="text-[10px] bg-blue-50 text-[#173f6b] px-2 py-0.5 rounded-full font-bold">
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

        {/* ۵. تب مالی و نوبت‌ها (Finances Tab) با داده‌های واقعی */}
        {currentView === 'dossier' && activeTab === 'finances' && (
          <div className="space-y-6 animate-in fade-in">
            {/* خلاصه‌های مالی */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <span className="text-xs text-slate-400 font-bold">مجموع مبالغ واریز شده:</span>
                <span className="text-2xl font-black text-emerald-700 block font-mono">
                  {clientCase.totalPaidAmount > 0 ? formatCurrency(clientCase.totalPaidAmount, 'IRT') : 'بدون هزینه'}
                </span>
                <span className="text-[11px] text-emerald-600 block">
                  {clientCase.totalPaidAmount > 0 ? 'تراکنش موفق شاپرک' : 'پرونده بدون هزینه / رایگان'}
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <span className="text-xs text-slate-400 font-bold">تعداد نوبت‌های ثبت‌شده:</span>
                <span className="text-2xl font-black text-[#173f6b] block font-mono">
                  {toPersianDigits(appointments.length)} نوبت
                </span>
                <span className="text-[11px] text-blue-600 block">
                  {appointments.length > 0 ? 'ثبت شده در سامانه نوبت‌دهی' : 'فاقد نوبت ثبت‌شده'}
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <span className="text-xs text-slate-400 font-bold">استاد مشاور پرونده:</span>
                <span className="text-sm font-black text-slate-900 block mt-1">
                  {latestRecommendation?.counselor || (appointments[0]?.counselor ? appointments[0].counselor : 'مشاور تعیین‌نشده')}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  موضوع: {appointments[0]?.topic || 'مشاوره و ارزیابی جامع'}
                </span>
              </div>
            </div>

            {/* لیست جلسات مشاوره با امکان ثبت و مشاهده گزارش */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">لیست نوبت‌ها و سوابق مشاوره مراجع</h3>
                  <p className="text-xs text-slate-400 mt-0.5">برای مشاهده یا ثبت گزارش بالینی هر جلسه، روی آن کلیک کنید.</p>
                </div>
                <button
                  onClick={() => setIsNewAppointmentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#173f6b] text-white rounded-xl text-xs font-bold hover:bg-[#123357] transition cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>ثبت نوبت جدید</span>
                </button>
              </div>

              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Calendar className="size-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">هنوز نوبت مشاوره‌ای برای این مراجع ثبت نشده است.</p>
                  </div>
                ) : (
                  appointments.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{toPersianDigits(item.date)}</span>
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
                        <div className="mt-1 text-xs text-slate-500">
                          موضوع: <strong className="text-slate-700">{item.topic}</strong> | مشاور:{' '}
                          <strong className="text-slate-700">{item.counselor}</strong>
                        </div>
                        {item.recommendation && (
                          <p className="mt-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                            <strong>توصیه ثبت‌شده:</strong> {item.recommendation}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => openReportModal(item)}
                        className="px-4 py-2 bg-white hover:bg-blue-50 text-[#173f6b] border border-blue-200 rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
                      >
                        {item.status === 'new' ? 'ثبت گزارش جلسه' : 'مشاهده / اصلاح گزارش'}
                      </button>
                    </div>
                  ))
                )}
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
                    هیچ تراکنش پرداختی برای این پرونده ثبت نشده است.
                  </div>
                ) : (
                  clientCase.submissions
                    .filter((s) => s.paymentAmount && s.paymentAmount > 0)
                    .map((s) => (
                      <div key={s.id} className="p-5 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 block">
                            پرداخت الکترونیک ثبت نام یا رزرو مشاوره
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            شناسه پرداخت شاپرک: {s.paymentRefId || 'تأییدیه درگاه'}
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
                  placeholder="نام مشاور (مثال: دکتر علوی)"
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
                  {toPersianDigits(editing.date)} · {editing.counselor}
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
              <div
                className={`mb-5 rounded-2xl p-4 text-xs ${
                  editing.status === 'new' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {editing.status === 'new'
                  ? 'این نوبت هنوز بررسی نشده است. با ثبت گزارش، وضعیت آن به «انجام‌شده» تغییر می‌کند.'
                  : 'گزارش این جلسه قبلاً ثبت شده است و می‌توانید آن را تکمیل یا اصلاح کنید.'}
              </div>

              <div className="space-y-5">
                {[
                  ['reviewed', 'موارد بررسی‌شده', 'مباحث، شرح‌حال و سرفصل‌های گفت‌وگو شده در جلسه...'],
                  ['challenges', 'معضلات و چالش‌های مراجع', 'مشکلات رفتاری، خانوادگی یا تحصیلی تشخیص داده‌شده...'],
                  ['recommendation', 'نسخه و توصیه‌های تجویزی مشاور', 'راهکارها، تمرین‌ها و پروتکل پیشنهادی برای ادامه مسیر...'],
                ].map(([key, label, placeholder], index) => (
                  <label key={key} className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700">
                      <span className="grid size-6 place-items-center rounded-full bg-blue-50 text-[10px] text-blue-700 font-bold font-mono">
                        {toPersianDigits(index + 1)}
                      </span>
                      {label}
                    </span>
                    <textarea
                      value={reportForm[key as keyof typeof reportForm]}
                      onChange={(event) =>
                        setReportForm((old) => ({ ...old, [key]: event.target.value }))
                      }
                      placeholder={placeholder}
                      rows={index === 2 ? 4 : 3}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 p-4 text-xs">
                <div>
                  <span className="text-slate-400">مشاور ثبت‌کننده</span>
                  <div className="mt-1 font-bold text-slate-800">{editing.counselor}</div>
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
                  گزارش ثبت شد و آخرین توصیه‌ها به‌روزرسانی شد.
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
                ثبت گزارش ذیل همین نوبت
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
